import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { searchInternshipsWithAI, deepScanSkills, generateFollowUpQuestion } from './services/aiService';
import InternshipAdvisor from './components/InternshipAdvisor';
import StudentDashboard from './components/StudentDashboard';
import SkillProfilePage from './components/SkillProfilePage';
import InterviewRoom from './components/InterviewRoom';
import DomainSelector from './components/DomainSelector';
import ConfirmDomainScreen from './components/ConfirmDomainScreen';
import { HARDCODED_GIGS } from './components/hardcodedGigs';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import { Mic, Briefcase, CheckCircle, Heart, X, Award, Sparkles, Lock, Lightbulb, Target, Volume2 } from 'lucide-react';
import ActivityPanel from './components/ActivityPanel';
import ResetMyData from './components/ResetMyData';
import { getApplicationUrl } from './utils/applyLink';

// ========== SKILLS LIST ==========
const SKILLS_LIST = ["React", "JavaScript", "Python", "UI Design", "Figma", "CSS", "HTML", "Node.js", "Java", "C++", "Machine Learning", "Data Analysis", "SQL", "Marketing", "Content Writing", "Social Media", "SEO", "Graphic Design", "Photoshop", "Video Editing", "Business", "Presentations", "Research", "Communication", "Leadership", "Problem Solving", "Web Development", "App Development", "Flutter", "Firebase", "MongoDB", "Git", "Artificial Intelligence", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Neural Networks", "Data Science", "Keras", "OpenCV", "Scikit-learn", "Generative AI", "LLM", "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "DevOps", "Cloud Computing", "Cybersecurity", "Network Security", "Penetration Testing", "Ethical Hacking", "Cryptography"];

// Module-level skill extractor
const extractSkillsFromText = (text) => {
  const lower = (text || '').toLowerCase();
  return SKILLS_LIST.filter(skill => lower.includes(skill.toLowerCase()));
};

// ========== VOICE QUESTIONS ==========
// Question 1 is fixed. Questions 2 and 3 are AI-generated follow-ups based
// on what the student just said (see generateFollowUpQuestion in
// aiService.js). FALLBACK_FOLLOWUPS is only used if that AI call fails,
// so the interview can never get stuck with no next question.
const OPENER_QUESTION = "Which field are you most interested in, and why?";
const TOTAL_QUESTIONS = 3;
const FALLBACK_FOLLOWUPS = [
  "Tell me about a project or skill that you're most confident in.",
  "What kind of internship are you looking for?"
];

// Quick tips shown in the sidebar during the voice interview — fills the
// empty space next to the chat and gives the student something useful to
// read while they think about their answer.
const INTERVIEW_TIPS = [
  "Speak naturally — no need for perfect sentences.",
  "Mention specific tools, languages, or projects by name.",
  "Take your time — the mic keeps listening until you tap it again.",
  "You can retake this interview anytime from your profile."
];

// ========== CATEGORY MATCHING ==========
const getCategoryFromInterest = (interest) => {
  const lower = interest.toLowerCase();
  if (lower.includes('web') || lower.includes('frontend') || lower.includes('react')) return 'Development';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('figma')) return 'Design';
  if (lower.includes('data') || lower.includes('analytics') || lower.includes('sql')) return 'Data';
  if (lower.includes('marketing') || lower.includes('social media')) return 'Marketing';
  if (lower.includes('content') || lower.includes('write')) return 'Content';
  if (lower.includes('test') || lower.includes('qa')) return 'Testing';
  if (lower.includes('product')) return 'Management';
  if (lower.includes('hr')) return 'HR';
  return null;
};

// SerpApi quota protection: remembers the last result for a given
// skills+domain combo in the browser for 1 hour, so repeating the same
// search (while testing or demoing) doesn't spend another real search.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const getSearchCacheKey = (skillsList, category) => {
  const sortedSkills = [...(skillsList || [])].sort().join(',');
  return `serpapi_cache_${sortedSkills}_${category || 'none'}`;
};

const getCachedSearch = (skillsList, category) => {
  try {
    const raw = localStorage.getItem(getSearchCacheKey(skillsList, category));
    if (!raw) return null;
    const { results, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) return null; // expired
    return results;
  } catch (e) {
    return null;
  }
};

const setCachedSearch = (skillsList, category, results) => {
  try {
    localStorage.setItem(
      getSearchCacheKey(skillsList, category),
      JSON.stringify({ results, savedAt: Date.now() })
    );
  } catch (e) {
    // localStorage can fail if full/blocked — safe to ignore, just skip caching
  }
};

// Guesses a domain from the voice interview answers using simple keyword
// matching. Only a starting suggestion — the student confirms or changes
// it on the ConfirmDomainScreen, so a wrong guess here never reaches the
// live search on its own.
const guessDomainFromAnswers = (userProfile, userSkills) => {
  const text = `${userProfile?.projectInterest || ''} ${userProfile?.confidentSkill || ''} ${userProfile?.internshipType || ''} ${(userSkills || []).join(' ')}`.toLowerCase();

  const rules = [
    { domain: 'AI / Machine Learning', keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural', 'nlp', 'computer vision'] },
    { domain: 'Data Science', keywords: ['data science', 'data analysis', 'data analyst', 'pandas', 'sql'] },
    { domain: 'Web Development', keywords: ['web', 'frontend', 'react', 'html', 'css', 'javascript', 'node'] },
    { domain: 'App Development', keywords: ['app development', 'flutter', 'android', 'ios', 'mobile app'] },
    { domain: 'Cloud Computing', keywords: ['cloud', 'aws', 'azure', 'google cloud', 'devops', 'docker', 'kubernetes'] },
    { domain: 'Cybersecurity', keywords: ['cybersecurity', 'security', 'ethical hacking', 'penetration testing', 'cryptography'] },
    { domain: 'UI/UX Design', keywords: ['design', 'figma', 'ui', 'ux'] },
    { domain: 'Marketing', keywords: ['marketing', 'seo', 'social media', 'content writing'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) return rule.domain;
  }
  return 'Other';
};

function App() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [matchedGigs, setMatchedGigs] = useState([]);
  const [allGigs, setAllGigs] = useState([]);
  const [savedGigs, setSavedGigs] = useState([]);
  const [appliedGigs, setAppliedGigs] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [userLevel, setUserLevel] = useState('Beginner');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerStats, setAnswerStats] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [questions, setQuestions] = useState([OPENER_QUESTION]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedGigForModal, setSelectedGigForModal] = useState(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiGigs, setAiGigs] = useState([]);
  const [gigsSource, setGigsSource] = useState(null);
  const [showSkillExtractor, setShowSkillExtractor] = useState(false);
  const [showDeepScan, setShowDeepScan] = useState(false);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);
  const [pendingInterviewGig, setPendingInterviewGig] = useState(null);
  const [activeInterviewDomain, setActiveInterviewDomain] = useState(null);

  const [completedInterviewGigIds, setCompletedInterviewGigIds] = useState(new Set());
  const [applyGateGig, setApplyGateGig] = useState(null);

  const [showVoiceReport, setShowVoiceReport] = useState(false);
  // Domain confirmed after the voice interview report — becomes the
  // trusted category for the live internship search.
  const [showDomainConfirm, setShowDomainConfirm] = useState(false);
  const [confirmedDomain, setConfirmedDomain] = useState(null);

  const [coachTip, setCoachTip] = useState(null);
  const [celebratedSkills, setCelebratedSkills] = useState(new Set());

  const recognitionRef = useRef(null);

  const liveSkills = Array.from(new Set([...skills, ...extractSkillsFromText(liveText)]));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const DEV_AUTO_LOGIN = false;
  useEffect(() => {
    if (DEV_AUTO_LOGIN && !user) {
      setUser({ email: 'test@voicematch.com', id: 'test-123' });
    }
  }, [user]);

  useEffect(() => {
    const calculateRankAndLevel = async () => {
      if (!user?.email) return;
      const { data } = await supabase
        .from('students')
        .select('email, points')
        .order('points', { ascending: false });
      if (data) {
        const userIndex = data.findIndex(s => s.email === user.email);
        setUserRank(userIndex !== -1 ? userIndex + 1 : null);
        const points = userPoints || 0;
        if (points >= 500) setUserLevel('Master');
        else if (points >= 300) setUserLevel('Expert');
        else if (points >= 150) setUserLevel('Advanced');
        else if (points >= 50) setUserLevel('Intermediate');
        else setUserLevel('Beginner');
      }
    };
    calculateRankAndLevel();
  }, [user, userPoints]);

  useEffect(() => {
    const fetchGigs = async () => {
      const { data, error } = await supabase.from('gigs').select('*');
      if (!error && data) setAllGigs(data);
    };
    fetchGigs();
  }, []);

  const refreshCompletedInterviews = async () => {
    if (!user?.email) return;
    const { data, error } = await supabase
      .from('applications')
      .select('gig_id')
      .eq('student_email', user.email)
      .eq('interview_completed', true);
    if (!error && data) {
      setCompletedInterviewGigIds(new Set(data.map(row => row.gig_id)));
    }
  };

  useEffect(() => {
    refreshCompletedInterviews();
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase.from('students').select('name, skills, points').order('points', { ascending: false }).limit(10);
      const dummyStudents = [
        { name: 'Aarav kumar', skills: ['React', 'JavaScript', 'CSS'], points: 180 },
        { name: 'Priya singh', skills: ['Python', 'SQL', 'Data Analysis'], points: 155 },
        { name: 'Ali khan', skills: ['Figma', 'UI Design', 'Photoshop'], points: 130 },
        { name: 'Neha mehta', skills: ['Node.js', 'MongoDB', 'Git'], points: 110 },
        { name: 'Sarah lee', skills: ['Flutter', 'Firebase', 'Dart'], points: 95 },
        { name: 'Daisy dale', skills: ['Marketing', 'SEO', 'Content Writing'], points: 75 },
        { name: 'Abraham john', skills: ['Java', 'C++', 'Problem Solving'], points: 60 },
      ];
      if (data && data.length > 0) {
        const combined = [...data, ...dummyStudents].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);
        setLeaderboardData(combined);
      } else {
        setLeaderboardData(dummyStudents);
      }
    };
    fetchLeaderboard();
  }, [userPoints]);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('students').select('points').eq('email', user.email).maybeSingle();
      setUserPoints(data?.points || 0);
    };
    fetchPoints();
  }, [user]);

  const speak = (text) => { const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "en-US"; window.speechSynthesis.speak(utterance); };

  const flashCoachTip = (text, tone = 'info', holdMs = 3200) => {
    setCoachTip({ text, tone });
    if (holdMs > 0) {
      setTimeout(() => {
        setCoachTip(prev => (prev && prev.text === text ? null : prev));
      }, holdMs);
    }
  };

  useEffect(() => {
    if (!isListening || !liveText) return;
    const words = liveText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const detectedNow = extractSkillsFromText(liveText);
    const brandNew = detectedNow.filter(s => !celebratedSkills.has(s) && !skills.includes(s));
    if (brandNew.length > 0) {
      const skill = brandNew[0];
      setCelebratedSkills(prev => new Set([...prev, skill]));
      flashCoachTip(`Nice — ${skill} detected ✓`, 'success', 2800);
      return;
    }
    if (wordCount === 6) {
      flashCoachTip('Good start — add one concrete example', 'nudge', 2500);
    } else if (wordCount === 18) {
      flashCoachTip('Great detail — keep going if you have more', 'success', 2200);
    }
  }, [liveText, isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  // Records one answer. Keeps listening THROUGH pauses (continuous mode)
  // instead of stopping the instant you go quiet — that was cutting you
  // off before. Finishes only when either (a) you go quiet for ~3.5s, or
  // (b) you tap the mic again to say "I'm done".
  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported!"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    const startedAt = Date.now();
    let speechStartedAt = null;
    let latestText = '';
    let finished = false;
    let silenceTimer = null;

    setLiveText('');
    setCoachTip({ text: "Listening… tap the mic again when you're done", tone: 'info' });
    setIsListening(true);
    recognitionRef.current = recognition;

    const finishUp = () => {
      if (finished) return;
      finished = true;
      clearTimeout(silenceTimer);
      setIsListening(false);
      recognitionRef.current = null;
      try { recognition.stop(); } catch (e) { /* already stopped */ }

      const begin = speechStartedAt || startedAt;
      const end = Date.now();
      const timing = {
        thinkingSec: (begin - startedAt) / 1000,
        speakingSec: Math.max((end - begin) / 1000, 0.5)
      };

      const text = latestText;
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const wpm = wordCount > 0 ? Math.round(wordCount / (timing.speakingSec / 60)) : 0;

      if (timing.thinkingSec > 5) {
        flashCoachTip('Took a moment to start — try diving in faster next time', 'nudge', 3500);
      } else if (wpm > 175) {
        flashCoachTip('A bit fast — slower = clearer for interviewers', 'nudge', 3500);
      } else if (wpm > 0 && wpm < 90 && wordCount > 5) {
        flashCoachTip('Steady pace — nice and clear', 'success', 3000);
      } else if (wordCount < 8) {
        flashCoachTip('Short answer — next time add a project or tool by name', 'nudge', 3500);
      } else if (extractSkillsFromText(text).length >= 2) {
        flashCoachTip('Strong technical vocabulary — well done', 'success', 3000);
      } else {
        flashCoachTip('Got it — solid answer', 'success', 2200);
      }

      onResult(text, timing);
    };

    recognition.onspeechstart = () => { if (!speechStartedAt) speechStartedAt = Date.now(); };

    recognition.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + ' ';
      latestText = text.trim();
      setLiveText(latestText);
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(finishUp, 3500);
    };

    recognition.onend = () => { if (!finished) finishUp(); };
    recognition.onerror = () => {
      setIsListening(false);
      setLiveText('');
      setCoachTip(null);
      recognitionRef.current = null;
      alert("Could not hear you. Please try again.");
    };
    recognition.start();
  };

  const handleInitialSpeak = () => {
    setConversation([]); setSkills([]); setAnswers([]); setAnswerStats([]); setQuestions([OPENER_QUESTION]); setStep(0); setProfile(null); setMatchedGigs([]); setShowVoiceReport(false);
    setShowDomainConfirm(false); setConfirmedDomain(null);
    setCoachTip(null); setCelebratedSkills(new Set());
    startListening((text, timing) => {
      setTranscript(text);
      const extracted = extractSkillsFromText(text);
      setSkills(extracted);
      setConversation([{ role: "user", text }]);
      setTimeout(() => { setConversation(prev => [...prev, { role: "ai", text: OPENER_QUESTION }]); speak(OPENER_QUESTION); setStep(1); }, 300);
    });
  };

  const handleVoiceAnswer = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    startListening((text, timing) => {
      const mergedSkills = Array.from(new Set([...skills, ...extractSkillsFromText(text)]));
      const allAnswers = [...answers, text];
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const stat = {
        words: wordCount,
        thinkingSec: Math.round(timing.thinkingSec * 10) / 10,
        speakingSec: Math.round(timing.speakingSec * 10) / 10,
        wpm: Math.round(wordCount / (timing.speakingSec / 60)),
        text,
        skillCount: extractSkillsFromText(text).length
      };
      console.log('Answer stats:', stat);
      setAnswerStats([...answerStats, stat]);
      setSkills(mergedSkills);
      setAnswers(allAnswers);
      setConversation(prev => [...prev, { role: "user", text }]);
      const nextStep = step + 1;
      setIsThinking(true);
      if (allAnswers.length < TOTAL_QUESTIONS) {
        generateFollowUpQuestion(text, allAnswers.length + 1).then((aiQuestion) => {
          const q = aiQuestion || FALLBACK_FOLLOWUPS[allAnswers.length - 1];
          setQuestions(prev => [...prev, q]);
          setIsThinking(false);
          setConversation(prev => [...prev, { role: "ai", text: q }]);
          speak(q);
          setStep(nextStep);
        });
      } else {
        setTimeout(() => {
          setIsThinking(false);
          const done = "Great! I've got what I need. Let's see your results.";
          setConversation(prev => [...prev, { role: "ai", text: done }]);
          speak(done);
          finishInterview(allAnswers, mergedSkills);
        }, 300);
      }
    });
  };

  const finishInterview = (finalAnswers, finalSkills) => {
    const newProfile = {
      skills: finalSkills,
      projectInterest: finalAnswers[0],
      confidentSkill: finalAnswers[1],
      internshipType: finalAnswers[2],
      createdAt: new Date().toISOString()
    };
    setProfile(newProfile);
    matchGigs(newProfile);
    setStep(99);
    setShowVoiceReport(true);

    const saveToSupabase = async () => {
      try {
        const { data: existing } = await supabase.from('students').select('email').eq('email', user?.email).maybeSingle();
        const userName = user?.email?.split('@')[0] || 'Student';
        if (existing) {
          await supabase.from('students').update({ name: userName, skills: newProfile.skills, project_interest: newProfile.projectInterest }).eq('email', user?.email);
        } else {
          await supabase.from('students').insert([{ email: user?.email, password_hash: 'temp', name: userName, skills: newProfile.skills, project_interest: newProfile.projectInterest, points: 50, created_at: newProfile.createdAt }]);
          setUserPoints(prev => prev + 50);
        }
      } catch (error) { console.error(error); }
    };
    saveToSupabase();
  };

  const scoreGigsAgainstProfile = (gigsList, userProfile) => {
    const preferredCategory = getCategoryFromInterest(userProfile.projectInterest || '');
    const scored = gigsList.map(gig => {
      let skillMatchCount = (userProfile.skills || []).filter(skill =>
        gig.skills?.some(gs => gs.toLowerCase().includes(skill.toLowerCase()))
      ).length;
      let skillScore = Math.min(skillMatchCount * 20, 60);
      let difficultyScore = gig.difficulty === "Beginner" ? 20 : gig.difficulty === "Intermediate" ? 10 : 0;
      let showIdealBadge = false;
      if (preferredCategory && gig.category === preferredCategory) showIdealBadge = true;
      let categoryMatch = true;
      if (preferredCategory && gig.category !== preferredCategory) { categoryMatch = false; skillScore -= 15; }
      let durationMatch = true;
      if (userProfile.commitmentDuration) {
        let userMonths = parseInt(userProfile.commitmentDuration.match(/\d+/)?.[0] || 0);
        let gigMonths = parseInt((gig.duration || '').match(/\d+/)?.[0] || 0);
        if (userMonths > 0 && gigMonths > 0 && userMonths < gigMonths) { durationMatch = false; difficultyScore -= 10; }
      }
      let salaryMatch = true;
      if (userProfile.voiceStipend) {
        let userSalary = parseInt(userProfile.voiceStipend.match(/\d+/)?.[0] || 0);
        let gigSalary = parseInt((gig.stipend || '').replace(/[^0-9]/g, ''));
        if (userSalary > 0 && gigSalary > 0 && userSalary > gigSalary) { salaryMatch = false; skillScore -= 10; }
      }
      let hoursMatch = true;
      if (userProfile.hoursPerWeek) {
        let userHours = parseInt(userProfile.hoursPerWeek.match(/\d+/)?.[0] || 0);
        if (userHours > 0 && userHours < 15) { hoursMatch = false; skillScore -= 10; }
      }
      let totalScore = Math.max(skillScore + difficultyScore, 0);
      totalScore = Math.min(totalScore, 100);
      return { ...gig, matchScore: totalScore, skillMatchCount, categoryMatch, durationMatch, salaryMatch, hoursMatch, showIdealBadge };
    });
    return scored.filter(g => g.matchScore > 0 && g.categoryMatch && g.durationMatch && g.salaryMatch && g.hoursMatch)
                 .sort((a, b) => b.matchScore - a.matchScore);
  };

  const matchGigs = (userProfile) => {
    const filtered = scoreGigsAgainstProfile(allGigs, userProfile);
    setMatchedGigs(filtered);
    if (filtered.length === 0) {
      console.warn('No Supabase gigs matched skills/preferences; hardcoded fallback will show if user searches.');
    }
  };

  // Live search — uses the CONFIRMED domain from ConfirmDomainScreen as
  // the trusted category. Falls back to the old keyword-based guess only
  // if somehow no domain was confirmed (e.g. searching before that screen
  // ever ran), so this can never throw or leave the query empty.
  const searchWebGigs = async () => {
  setIsAIThinking(true);
  try {
    const category = confirmedDomain || getCategoryFromInterest(profile?.projectInterest || '');

    const cached = getCachedSearch(skills, category);
    if (cached && cached.length > 0) {
      console.log('Using cached SerpApi results — no search spent.');
      setAiGigs(cached);
      setGigsSource('ai');
      setIsAIThinking(false);
      return;
    }

    const aiResult = await searchInternshipsWithAI(skills, category);
    if (aiResult && aiResult.length > 0) {
      setCachedSearch(skills, category, aiResult);
      setAiGigs(aiResult);
      setGigsSource('ai');
      setIsAIThinking(false);
      return;
    }
      const supabaseMatches = scoreGigsAgainstProfile(allGigs, profile || { skills });
      if (supabaseMatches.length > 0) {
        setAiGigs(supabaseMatches);
        setGigsSource('supabase');
        setIsAIThinking(false);
        return;
      }
      const hcScored = HARDCODED_GIGS.map(gig => {
        const matchCount = skills.length > 0
          ? skills.filter(s => gig.skills.some(gs => gs.toLowerCase().includes(s.toLowerCase()))).length
          : 0;
        const matchScore = skills.length > 0
          ? Math.min(15 + matchCount * 25, 95)
          : 50;
        return { ...gig, matchScore, skillMatchCount: matchCount };
      }).sort((a, b) => b.matchScore - a.matchScore);
      const relevant = skills.length > 0 ? hcScored.filter(g => g.skillMatchCount > 0) : hcScored;
      const hcToShow = (relevant.length > 0 ? relevant : hcScored).slice(0, 12);
      setAiGigs(hcToShow);
      setGigsSource('hardcoded');
    } catch (error) {
      console.error('AI Search Error:', error);
      setAiGigs(HARDCODED_GIGS);
      setGigsSource('hardcoded');
    } finally {
      setIsAIThinking(false);
    }
  };

  const gigsSourceBanner = {
    ai: { text: '🌐 Live Internships — Powered by SerpApi', color: 'bg-blue-600' },
    supabase: { text: '📦 Live search unavailable — showing matched sample internships', color: 'bg-yellow-600' },
    hardcoded: { text: '⚠️ Live search unavailable — showing sample internships', color: 'bg-orange-600' }
  };

  const toggleSave = async (gigId) => {
    const isSaved = savedGigs.includes(gigId);
    isSaved ? setSavedGigs(savedGigs.filter(id => id !== gigId)) : setSavedGigs([...savedGigs, gigId]);
    try {
      if (!isSaved) {
        await supabase.from('saved_gigs').insert([{ student_email: user?.email, gig_id: gigId, saved_at: new Date() }]);
        const { data: student } = await supabase.from('students').select('points').eq('email', user?.email).maybeSingle();
        await supabase.from('students').update({ points: (student?.points || 0) + 5 }).eq('email', user?.email);
        setUserPoints(prev => prev + 5);
      } else {
        await supabase.from('saved_gigs').delete().eq('gig_id', gigId).eq('student_email', user?.email);
      }
    } catch (err) { console.error(err); }
  };

  const handleStartMockInterview = async (gig, domain = null) => {
    setActiveInterviewDomain(domain);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('student_email', user?.email)
        .eq('gig_id', gig.id)
        .maybeSingle();
      if (fetchError) console.error('Lookup failed:', fetchError);
      if (existing) {
        setActiveInterviewApp(existing);
        return;
      }
      const { data: inserted, error: insertError } = await supabase
        .from('applications')
        .insert([{
          student_email: user?.email,
          gig_id: gig.id,
          gig_title: gig.title,
          company: gig.company,
          stipend: gig.stipend,
          gig_skills: gig.skills || [],
          gig_url: gig.url || null,
          status: 'pending',
          interview_completed: false,
          applied_at: new Date()
        }])
        .select()
        .single();
      if (insertError || !inserted) {
        console.error('Could not start mock interview:', insertError);
        alert('Could not start the mock interview — please try again.');
        return;
      }
      setActiveInterviewApp(inserted);
    } catch (err) {
      console.error('handleStartMockInterview error:', err);
    }
  };

  const handleApplyNow = (gig) => {
    if (gigsSource === 'hardcoded' && !gig.url) {
      alert('This is a sample listing shown because live search found nothing. Try "Find Internships" again to get real internships you can apply to.');
      return;
    }
    if (completedInterviewGigIds.has(gig.id)) {
      redirectToApplication(gig);
    } else {
      setApplyGateGig(gig);
    }
  };

  const redirectToApplication = async (gig) => {
    const url = getApplicationUrl(gig);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (!appliedGigs.includes(gig.id)) {
      setAppliedGigs(prev => [...prev, gig.id]);
    }
    try {
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('student_email', user?.email)
        .eq('gig_id', gig.id)
        .maybeSingle();
      if (existing) {
        await supabase.from('applications').update({ status: 'applied' }).eq('id', existing.id);
      } else {
        await supabase.from('applications').insert([{
          student_email: user?.email,
          gig_id: gig.id,
          gig_title: gig.title,
          company: gig.company,
          stipend: gig.stipend,
          gig_skills: gig.skills || [],
          gig_url: gig.url || null,
          status: 'applied',
          interview_completed: false,
          applied_at: new Date()
        }]);
      }
      const { data: student } = await supabase.from('students').select('points').eq('email', user?.email).maybeSingle();
      await supabase.from('students').update({ points: (student?.points || 0) + 10 }).eq('email', user?.email);
      setUserPoints(prev => prev + 10);
    } catch (err) {
      console.error(err);
    }
  };

  const getSavedGigsData = () => {
    const fromDatabase = allGigs.filter(gig => savedGigs.includes(gig.id));
    const fromAI = aiGigs.filter(gig => savedGigs.includes(gig.id));
    const combined = [...fromDatabase, ...fromAI];
    return combined.filter((gig, index, self) => index === self.findIndex(g => g.id === gig.id));
  };

  const getFilteredGigs = () => filterCategory === 'all' ? matchedGigs : matchedGigs.filter(gig => gig.category === filterCategory);
  const categories = ['all', 'Development', 'Design', 'Marketing', 'Data', 'Content', 'Testing', 'Management', 'HR'];
  const displayGigs = aiGigs.length > 0 ? aiGigs : getFilteredGigs();

  const closeAllOverlays = () => {
    setShowSkillExtractor(false);
    setShowDeepScan(false);
    setShowVoiceReport(false);
  };

  const openSkillExtractor = () => {
    closeAllOverlays();
    setShowSkillExtractor(true);
  };

  const renderContent = () => {
  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  if (pendingInterviewGig) {
    return (
      <DomainSelector
        onSelect={(domain) => {
          const gig = pendingInterviewGig;
          setPendingInterviewGig(null);
          handleStartMockInterview(gig, domain);
        }}
        onCancel={() => setPendingInterviewGig(null)}
      />
    );
  }

  if (activeInterviewApp) {
    return (
      <InterviewRoom
        application={activeInterviewApp}
        domain={activeInterviewDomain}
        onComplete={() => {
          setActiveInterviewApp(null);
          setActiveInterviewDomain(null);
          setCurrentPage('dashboard');
          refreshCompletedInterviews();
        }}
      />
    );
  }

  if (showSkillExtractor) {
    return (
      <SkillProfilePage
        transcript={transcript}
        detectedSkills={skills}
        user={user}
        onBack={() => setShowSkillExtractor(false)}
        onSkillsConfirmed={(confirmedSkills) => setSkills(confirmedSkills)}
      />
    );
  }

  if (showDeepScan) {
    return <InternshipAdvisor transcript={transcript} skills={skills} profile={profile} onBack={() => setShowDeepScan(false)} />;
  }

  if (showVoiceReport && profile) {
    const skillCount = skills.length;
    const totalWords = answerStats.reduce((sum, a) => sum + a.words, 0);
    const totalSpeakingSec = answerStats.reduce((sum, a) => sum + a.speakingSec, 0);
    const totalThinkingSec = answerStats.reduce((sum, a) => sum + a.thinkingSec, 0);
    const avgWpm = totalSpeakingSec > 0 ? Math.round(totalWords / (totalSpeakingSec / 60)) : 0;
    const avgThinkingSec = answerStats.length > 0 ? totalThinkingSec / answerStats.length : 0;
    const avgWords = answerStats.length > 0 ? totalWords / answerStats.length : 0;

    const paceScore = avgWpm === 0 ? 50 : Math.max(40, 100 - Math.abs(135 - avgWpm) * 0.6);
    const readinessScore = Math.max(40, 100 - avgThinkingSec * 12);
    const depthScore = Math.min(100, 40 + avgWords * 3);
    const vocabScore = Math.min(100, 50 + skillCount * 8);

    const scores = {
      responseReadiness: Math.round(readinessScore),
      speakingPace: Math.round(paceScore),
      answerDepth: Math.round(depthScore),
      technicalVocabulary: Math.round(vocabScore),
    };

    const overall = Math.round(
      (scores.responseReadiness + scores.speakingPace + scores.answerDepth + scores.technicalVocabulary) / 4
    );

    const getBarColor = (v) => v >= 75 ? 'bg-green-500' : v >= 55 ? 'bg-amber-400' : 'bg-red-400';
    const getTextColor = (v) => v >= 75 ? 'text-green-700' : v >= 55 ? 'text-amber-700' : 'text-red-700';

    let overallMessage = '';
    if (overall >= 80) {
      overallMessage = "You're well prepared for entry-level technical internships.";
    } else if (overall >= 65) {
      overallMessage = "Suitable for beginner internships. Continue practicing to improve pace and detail.";
    } else {
      overallMessage = "Keep practicing. Focus on quicker responses and more detailed answers.";
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">AI Interview Insights</h2>
            <p className="text-slate-500 text-sm mt-1">Measured from how you actually spoke during the interview</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 text-center mb-8 border border-purple-100">
            <p className="text-sm text-purple-600 font-medium mb-1">Overall Interview Readiness</p>
            <p className="text-5xl font-bold text-purple-700">
              {overall}<span className="text-2xl text-purple-400">/100</span>
            </p>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">{overallMessage}</p>
          </div>

          {answerStats.length > 0 && (() => {
            const strongest = answerStats.reduce((best, a, i) => {
              const composite = a.skillCount * 25 + Math.min(a.words, 30) + (a.wpm >= 100 && a.wpm <= 160 ? 15 : 0);
              return (!best || composite > best.composite) ? { ...a, index: i, composite } : best;
            }, null);
            const questionText = questions[strongest.index] || `Question ${strongest.index + 1}`;
            return (
              <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <h4 className="text-sm font-semibold text-indigo-700 mb-1">🌟 Your Strongest Moment</h4>
                <p className="text-xs text-slate-500 mb-3">"{questionText}"</p>
                <p className="text-sm text-slate-700 italic mb-3">"{strongest.text}"</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-slate-500">
                    {strongest.speakingSec}s spoken · {strongest.wpm} wpm · {strongest.skillCount} technical term{strongest.skillCount === 1 ? '' : 's'}
                  </p>
                  <button
                    onClick={() => speak(strongest.text)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                  >
                    ▶ Replay
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Response Readiness', value: scores.responseReadiness },
              { label: 'Speaking Pace', value: scores.speakingPace },
              { label: 'Answer Depth', value: scores.answerDepth },
              { label: 'Technical Vocabulary', value: scores.technicalVocabulary },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className={`text-sm font-bold ${getTextColor(item.value)}`}>{item.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">🎙️ Your Interview Timeline</h4>
            <div className="flex flex-col gap-3">
              {answerStats.map((a, i) => {
                const total = a.thinkingSec + a.speakingSec;
                const thinkPct = total > 0 ? (a.thinkingSec / total) * 100 : 0;
                return (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Question {i + 1}</span>
                      <span>{a.thinkingSec}s thinking · {a.speakingSec}s speaking · {a.wpm} wpm</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
                      <div className="h-full bg-amber-300" style={{ width: `${thinkPct}%` }} />
                      <div className="h-full bg-purple-500" style={{ width: `${100 - thinkPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block"></span> Thinking</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Speaking</span>
            </div>
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-2">💪 Strengths</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Clear communication</li>
                <li>• Good technical vocabulary</li>
                <li>• Appropriate speaking pace</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-600 mb-2">🌱 Areas to Improve</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Reduce filler words</li>
                <li>• Give more structured answers</li>
                <li>• Provide more detailed explanations</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-600 mb-2">🚀 Recommended Next Steps</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Continue to internship matching</li>
                <li>• Practice role-specific mock interviews</li>
                <li>• Apply when you feel ready</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => { setShowVoiceReport(false); setShowDomainConfirm(true); }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition"
          >
            Continue to Internships →
          </button>
        </div>
      </div>
    );
  }

  // "Confirm your domain" — shown once, right after the voice report,
  // before any internship search happens. Whatever the student confirms
  // here becomes the trusted category for searchWebGigs, so a bad or
  // empty voice transcript can never send the live search to the wrong field.
  if (showDomainConfirm) {
    const guess = guessDomainFromAnswers(profile, skills);
    return (
      <ConfirmDomainScreen
        guessedDomain={guess}
        onConfirm={(domain) => {
          setConfirmedDomain(domain);
          setShowDomainConfirm(false);
        }}
      />
    );
  }

  if (step > 0 && step < 99 && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-slate-50/60 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200/60 rounded-full px-4 py-1.5 mb-4">
              <Mic className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Voice Interview</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Your Voice is Your Resume</h2>
            <p className="text-slate-500 text-md">Speak naturally — I listen and match you</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Voice Interview Assistant</p>
                  <span className="ml-auto text-xs text-slate-400">Question {step} of {TOTAL_QUESTIONS}</span>
                </div>
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                  {conversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-xs text-sm ${msg.role === "user" ? "bg-purple-600 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                        {msg.role === "ai" && <span className="font-bold text-purple-600 mr-1">AI:</span>}
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-500 px-4 py-2.5 rounded-2xl rounded-bl-none text-sm flex items-center gap-2">
                        <span className="animate-pulse">●</span> AI is thinking...
                      </div>
                    </div>
                  )}
                  {isListening && liveText && (
                    <div className="flex justify-end">
                      <div className="px-4 py-2.5 rounded-2xl max-w-xs text-sm bg-purple-400 text-white rounded-br-none opacity-80">
                        {liveText}…
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 flex flex-col items-center">
                {coachTip && (
                  <div
                    key={coachTip.text}
                    className={`mb-4 max-w-sm w-full px-4 py-3 rounded-2xl text-sm font-medium shadow-md animate-[coachPop_0.35s_ease-out] border ${
                      coachTip.tone === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : coachTip.tone === 'nudge'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">
                        {coachTip.tone === 'success' ? '✨' : coachTip.tone === 'nudge' ? '💡' : '🎙️'}
                      </span>
                      <span>{coachTip.text}</span>
                    </div>
                  </div>
                )}

                <div className="relative mb-5 flex items-center justify-center">
                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-ping"></div>
                      <div className="absolute -inset-6 flex items-center justify-center gap-1 pointer-events-none">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="w-1 bg-purple-400/70 rounded-full"
                            style={{ height: '10px', animation: `voiceBar 0.9s ease-in-out ${i * 0.12}s infinite` }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    onClick={handleVoiceAnswer}
                    className={`relative w-28 h-28 rounded-full text-4xl shadow-xl transition-all duration-300 ${isListening ? "bg-red-500 scale-110 text-white animate-pulse" : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"}`}
                  >
                    <Mic className="w-12 h-12 mx-auto" />
                  </button>
                </div>
                <p className="text-slate-600 text-md font-medium">
                  {isListening ? "🔴 Listening... tap again when you're done" : "🎙️ Tap mic to answer"}
                </p>
                <p className="text-slate-400 text-sm mt-1">Question {step} of {TOTAL_QUESTIONS}</p>
                <style>{`
                  @keyframes voiceBar { 0%, 100% { height: 8px; } 50% { height: 28px; } }
                  @keyframes coachPop { 0% { opacity: 0; transform: translateY(8px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                `}</style>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Quick Tips</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {INTERVIEW_TIPS.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" />
                  <h3 className="text-sm font-bold">What Happens Next</h3>
                </div>
                <ol className="flex flex-col gap-2 text-sm text-purple-50">
                  <li>1. AI extracts your skills</li>
                  <li>2. You're matched to live internships</li>
                  <li>3. Practice a mock interview</li>
                  <li>4. Apply when you're ready</li>
                </ol>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Live Skills Detected</h3>
                </div>
                {liveSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {liveSkills.slice(0, 8).map((s, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">Skills will appear here as you speak.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'profile') {
    return (
      <ProfilePage
        profile={profile}
        skills={skills}
        user={user}
        userPoints={userPoints}
        userRank={userRank}
        userLevel={userLevel}
        onRetakeInterview={() => {
          setProfile(null);
          setShowLanding(false);
          setStep(0);
          handleInitialSpeak();
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${currentPage === 'home' ? 'bg-slate-50' : 'bg-gradient-to-br from-purple-950 to-purple-900'}`}>
      <nav className="sticky top-0 z-50 bg-purple-950/80 backdrop-blur-xl border-b border-purple-500/20 shadow-xl shadow-purple-950/20 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div onClick={() => setCurrentPage('home')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-300 flex items-center justify-center shadow-md shadow-yellow-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🎤</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-200">
                VoiceMatch
              </span>
              <span className="text-[10px] font-semibold text-purple-300/70 tracking-widest uppercase -mt-1">AI Career Hub</span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1 bg-purple-900/40 p-1.5 rounded-2xl border border-purple-700/30 backdrop-blur-md shadow-inner">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${currentPage === 'home' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-purple-950 shadow-md shadow-yellow-400/20' : 'text-purple-200 hover:text-white hover:bg-purple-800/50'}`}>
              <span>🏠</span> Home
            </button>
            <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${currentPage === 'dashboard' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-purple-950 shadow-md shadow-yellow-400/20' : 'text-purple-200 hover:text-white hover:bg-purple-800/50'}`}>
              <span>📋</span> Dashboard
            </button>
            <button onClick={() => setCurrentPage('activity')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${currentPage === 'activity' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-purple-950 shadow-md shadow-yellow-400/20' : 'text-purple-200 hover:text-white hover:bg-purple-800/50'}`}>
              <span>⚡</span> Activity
            </button>
            <button onClick={() => setCurrentPage('saved')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${currentPage === 'saved' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-purple-950 shadow-md shadow-yellow-400/20' : 'text-purple-200 hover:text-white hover:bg-purple-800/50'}`}>
              <span>❤️</span> Saved
            </button>
            <button onClick={() => setCurrentPage('profile')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${currentPage === 'profile' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-purple-950 shadow-md shadow-yellow-400/20' : 'text-purple-200 hover:text-white hover:bg-purple-800/50'}`}>
              <span>👤</span> Profile
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2">
              <button onClick={openSkillExtractor} className="bg-purple-800/60 hover:bg-purple-700/80 text-purple-100 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-600/40 transition-all duration-200 flex items-center gap-1.5 shadow-xs">
                <span>🧠</span> Extract Skills
              </button>
              <button onClick={openAdvisor} className="bg-purple-700/80 hover:bg-purple-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/40 transition-all duration-200 flex items-center gap-1.5 shadow-xs">
                <span>🤖</span> Advisor
              </button>
              <button 
  onClick={searchWebGigs} 
  disabled={isAIThinking} 
  className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 ring-2 ring-blue-300/60 hover:scale-105"
>
  {!isAIThinking && (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
    </span>
  )}
  <span>{isAIThinking ? '⏳' : '🔎'}</span> {isAIThinking ? 'Searching...' : 'Search Live Internships'}
</button>
            </div>
            <div className="h-6 w-[1px] bg-purple-700/50 hidden md:block"></div>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-red-500/20 transition-all duration-200 flex items-center gap-1.5"
              title="Sign Out"
            >
              <span>🚪</span> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex xl:hidden items-center justify-start gap-1.5 overflow-x-auto mt-3 pt-2.5 border-t border-purple-800/50 no-scrollbar">
          <button onClick={() => setCurrentPage('home')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${currentPage === 'home' ? 'bg-yellow-400 text-purple-950' : 'text-purple-200 bg-purple-900/50'}`}>🏠 Home</button>
          <button onClick={() => setCurrentPage('dashboard')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${currentPage === 'dashboard' ? 'bg-yellow-400 text-purple-950' : 'text-purple-200 bg-purple-900/50'}`}>📋 Dashboard</button>
          <button onClick={() => setCurrentPage('activity')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${currentPage === 'activity' ? 'bg-yellow-400 text-purple-950' : 'text-purple-200 bg-purple-900/50'}`}>⚡ Activity</button>
          <button onClick={() => setCurrentPage('saved')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${currentPage === 'saved' ? 'bg-yellow-400 text-purple-950' : 'text-purple-200 bg-purple-900/50'}`}>❤️ Saved</button>
          <button onClick={() => setCurrentPage('profile')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${currentPage === 'profile' ? 'bg-yellow-400 text-purple-950' : 'text-purple-200 bg-purple-900/50'}`}>👤 Profile</button>
          <button onClick={openSkillExtractor} className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-purple-800 text-purple-100">🧠 Skills</button>
          <button onClick={openAdvisor} className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-purple-700 text-white">🤖 Advisor</button>
          <button onClick={searchWebGigs} disabled={isAIThinking} className="px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-blue-300/60">🔎 Search Live</button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {currentPage === 'home' && (
          <HomePage
            user={user}
            profile={profile}
            skills={skills}
            userPoints={userPoints}
            userRank={userRank}
            userLevel={userLevel}
            savedGigs={savedGigs}
            appliedGigs={appliedGigs}
            displayGigs={displayGigs}
            gigsSource={gigsSource}
            gigsSourceBanner={gigsSourceBanner}
            completedInterviewGigIds={completedInterviewGigIds}
            onStartInterview={handleInitialSpeak}
            onStartMockInterview={(gig) => setPendingInterviewGig(gig)}
            onApplyNow={handleApplyNow}
            onViewSkills={openSkillExtractor}
            onFindInternships={searchWebGigs}
            onViewLeaderboard={() => setCurrentPage('activity')}
            onViewProfile={() => setCurrentPage('profile')}
            onOpenAdvisor={openAdvisor}
            toggleSave={toggleSave}
            setSelectedGigForModal={setSelectedGigForModal}
          />
        )}

        {currentPage === 'activity' && (
          <ActivityPanel user={user} />
        )}

        {currentPage === 'dashboard' && (
          <StudentDashboard
            user={user}
            onStartInterview={(application) => setActiveInterviewApp(application)}
          />
        )}

        {currentPage === 'saved' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">❤️ Saved Gigs</h2>
                <p className="text-slate-500 text-sm">Internships you've saved for later</p>
              </div>
            </div>
            {getSavedGigsData().length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/60">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No saved gigs yet</h3>
                <p className="text-slate-400 text-sm">Click the heart on any gig to save it!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSavedGigsData().map(gig => {
                  const isApplied = appliedGigs.includes(gig.id);
                  const isPrepped = completedInterviewGigIds.has(gig.id);
                  const companyInitial = gig.company?.charAt(0) || '?';
                  return (
                    <div key={gig.id} className="bg-white rounded-2xl p-6 border border-yellow-200 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center text-yellow-700 font-bold text-sm">
                            {companyInitial}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{gig.title}</h3>
                            <p className="text-slate-500 text-sm">{gig.company}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleSave(gig.id)} className="text-2xl text-red-500">❤️</button>
                      </div>
                      <p className="text-purple-600 font-semibold text-sm mb-3">{gig.stipend}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{gig.duration}</span>
                        <span className={`text-xs px-2 py-1 rounded-lg ${gig.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : gig.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {gig.difficulty}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <button onClick={() => setPendingInterviewGig(gig)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {isPrepped ? 'Retake Mock Interview' : 'Mock Interview'}
                        </button>
                        <button onClick={() => setSelectedGigForModal(gig)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl text-sm transition">
                          Details
                        </button>
                      </div>
                      {isApplied ? (
                        <div className="w-full bg-green-100 text-green-700 py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Applied
                        </div>
                      ) : (
                        <button onClick={() => handleApplyNow(gig)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5">
                          {isPrepped ? null : <Lock className="w-3.5 h-3.5" />}
                          Apply Now
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {applyGateGig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setApplyGateGig(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200/60" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Do a mock interview first?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Most students who prep here feel more confident going in. Try a quick AI mock interview for{' '}
              <span className="font-medium text-slate-700">{applyGateGig.title}</span> before you apply.
            </p>
            <button
              onClick={() => {
                const gig = applyGateGig;
                setApplyGateGig(null);
                setPendingInterviewGig(gig);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition mb-2"
            >
              Do Mock Interview
            </button>
            <button
              onClick={() => {
                const gig = applyGateGig;
                setApplyGateGig(null);
                redirectToApplication(gig);
              }}
              className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition"
            >
              Apply Anyway
            </button>
          </div>
        </div>
      )}

      {selectedGigForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedGigForModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200/60" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedGigForModal.title}</h3>
                <p className="text-slate-500 text-sm">{selectedGigForModal.company}</p>
              </div>
              <button onClick={() => setSelectedGigForModal(null)} className="text-slate-400 hover:text-slate-600 transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">💰 Stipend</p>
                <p className="text-slate-800 font-medium text-sm">{selectedGigForModal.stipend}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">📅 Duration</p>
                <p className="text-slate-800 font-medium text-sm">{selectedGigForModal.duration}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">📂 Category</p>
                <p className="text-slate-800 font-medium text-sm">{selectedGigForModal.category}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">⚙️ Difficulty</p>
                <p className="text-slate-800 font-medium text-sm">{selectedGigForModal.difficulty}</p>
              </div>
            </div>
            {selectedGigForModal.skills && selectedGigForModal.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">🛠️ Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedGigForModal.skills.map((skill, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedGigForModal.description && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">📝 Description</p>
                <p className="text-slate-600 text-sm">{selectedGigForModal.description}</p>
              </div>
            )}
            {profile && (
              <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 uppercase tracking-wide">🧠 Your Skills Match</p>
                    <p className="text-purple-800 font-medium text-sm">
                      {selectedGigForModal.skillMatchCount || 0} of {selectedGigForModal.skills?.length || 0} skills
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-purple-200/50">
                    <span className="text-2xl font-bold text-purple-700">{selectedGigForModal.matchScore || 75}%</span>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setSelectedGigForModal(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  };

  const openAdvisor = () => {
    setShowLanding(false);
    closeAllOverlays();
    setShowDeepScan(true);
  };

  return (
    <>
      {renderContent()}
      {!showDeepScan && !activeInterviewApp && (
        <button
          onClick={openAdvisor}
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-xl shadow-purple-300/50 flex items-center justify-center text-2xl transition-all hover:scale-105"
          title="Internship Advisor"
        >
          💬
        </button>
      )}
    </>
  );
}

export default App;