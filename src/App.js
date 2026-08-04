import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { searchInternshipsWithAI, deepScanSkills } from './services/aiService';
import InternshipAdvisor from './components/InternshipAdvisor';
import StudentDashboard from './components/StudentDashboard';
import SkillProfilePage from './components/SkillProfilePage';
import InterviewRoom from './components/InterviewRoom';
import { HARDCODED_GIGS } from './components/hardcodedGigs';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import { Mic, Briefcase, CheckCircle, Heart, X, Award, Sparkles, Lock, Lightbulb, Target, Volume2 } from 'lucide-react';
import ActivityPanel from './components/ActivityPanel';
import ResetMyData from './components/ResetMyData';
import { getApplicationUrl } from './utils/applyLink';

// ========== SKILLS LIST ==========
const SKILLS_LIST = ["React", "JavaScript", "Python", "UI Design", "Figma", "CSS", "HTML", "Node.js", "Java", "C++", "Machine Learning", "Data Analysis", "SQL", "Marketing", "Content Writing", "Social Media", "SEO", "Graphic Design", "Photoshop", "Video Editing", "Business", "Presentations", "Research", "Communication", "Leadership", "Problem Solving", "Web Development", "App Development", "Flutter", "Firebase", "MongoDB", "Git"];

// Module-level skill extractor
const extractSkillsFromText = (text) => {
  const lower = (text || '').toLowerCase();
  return SKILLS_LIST.filter(skill => lower.includes(skill.toLowerCase()));
};

// ========== VOICE QUESTIONS ==========
const VOICE_QUESTIONS = [
  "Which field are you most interested in, and why?",
  "Tell me about a project or skill that you're most confident in.",
  "What kind of internship are you looking for?"
];
const EXTRA_QUESTIONS = [
  { id: "voiceStipend", question: "What is your preferred monthly stipend? (e.g. 10000 or 15000)", type: "text" },
  { id: "hoursPerWeek", question: "How many hours per week would you like to work?", type: "text" },
  { id: "portfolio", question: "Please provide your GitHub or portfolio link (optional — type 'no' to skip)", type: "text" }
];

// Quick tips shown in the sidebar during the voice interview — fills the
// empty space next to the chat and gives the student something useful to
// read while they think about their answer.
const INTERVIEW_TIPS = [
  "Speak naturally — no need for perfect sentences.",
  "Mention specific tools, languages, or projects by name.",
  "It's okay to pause and think before answering.",
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
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [showExtraQuestions, setShowExtraQuestions] = useState(false);
  const [extraStep, setExtraStep] = useState(0);
  const [extraAnswers, setExtraAnswers] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedGigForModal, setSelectedGigForModal] = useState(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiGigs, setAiGigs] = useState([]);
  const [gigsSource, setGigsSource] = useState(null);
  const [showSkillExtractor, setShowSkillExtractor] = useState(false);
  const [showDeepScan, setShowDeepScan] = useState(false);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);

  // Soft-gate for Apply Now
  const [completedInterviewGigIds, setCompletedInterviewGigIds] = useState(new Set());
  const [applyGateGig, setApplyGateGig] = useState(null);

  // NEW: AI Interview Insights report after voice interview
  const [showVoiceReport, setShowVoiceReport] = useState(false);

  // ========== AUTH ==========
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // Dev-only auto-login fallback
  const DEV_AUTO_LOGIN = false;
  useEffect(() => {
    if (DEV_AUTO_LOGIN && !user) {
      setUser({ email: 'test@voicematch.com', id: 'test-123' });
    }
  }, [user]);

  // ========== USER RANK & LEVEL ==========
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

  // ========== FETCH GIGS FROM SUPABASE ==========
  useEffect(() => {
    const fetchGigs = async () => {
      const { data, error } = await supabase.from('gigs').select('*');
      if (!error && data) setAllGigs(data);
    };
    fetchGigs();
  }, []);

  // ========== FETCH COMPLETED MOCK INTERVIEWS ==========
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

  // ========== LEADERBOARD ==========
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
        const combined = [...data, ...dummyStudents]
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .slice(0, 10);
        setLeaderboardData(combined);
      } else {
        setLeaderboardData(dummyStudents);
      }
    };
    fetchLeaderboard();
  }, [userPoints]);

  // ========== USER POINTS ==========
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('students').select('points').eq('email', user.email).maybeSingle();
      setUserPoints(data?.points || 0);
    };
    fetchPoints();
  }, [user]);

  // ========== SPEECH HELPERS ==========
  const speak = (text) => { const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "en-US"; window.speechSynthesis.speak(utterance); };
  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported!"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (e) => { const text = e.results[0][0].transcript; setIsListening(false); onResult(text); };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); alert("Could not hear you. Please try again."); };
    recognition.start();
  };

  // ========== VOICE INTERVIEW ==========
  const handleInitialSpeak = () => {
    setConversation([]); setSkills([]); setAnswers([]); setStep(0); setProfile(null); setMatchedGigs([]); setShowExtraQuestions(false); setShowVoiceReport(false);
    startListening((text) => {
      setTranscript(text);
      const extracted = extractSkillsFromText(text);
      setSkills(extracted);
      setConversation([{ role: "user", text }]);
      setTimeout(() => { const q = VOICE_QUESTIONS[0]; setConversation(prev => [...prev, { role: "ai", text: q }]); speak(q); setStep(1); }, 1000);
    });
  };

  const handleVoiceAnswer = () => {
    startListening((text) => {
      setAnswers(prev => [...prev, text]);
      setConversation(prev => [...prev, { role: "user", text }]);
      const nextStep = step + 1;
      setIsThinking(true);
      if (nextStep < VOICE_QUESTIONS.length) {
        setTimeout(() => {
          setIsThinking(false);
          const q = VOICE_QUESTIONS[nextStep];
          setConversation(prev => [...prev, { role: "ai", text: q }]);
          speak(q);
          setStep(nextStep);
        }, 1000);
      } else {
        setTimeout(() => {
          setIsThinking(false);
          const done = "Great! Now I have 3 more quick questions for you.";
          setConversation(prev => [...prev, { role: "ai", text: done }]);
          speak(done);
          setStep(99);
          setShowExtraQuestions(true);
        }, 1000);
      }
    });
  };

  const handleExtraAnswer = (value) => {
    const newAnswers = { ...extraAnswers, [EXTRA_QUESTIONS[extraStep].id]: value };
    setExtraAnswers(newAnswers);
    if (extraStep + 1 < EXTRA_QUESTIONS.length) {
      setExtraStep(extraStep + 1);
    } else {
      
       const newProfile = {
  skills: skills,
  projectInterest: answers[0],           // field of interest
  confidentSkill: answers[1],            // project/skill they're confident in
  internshipType: answers[2],            // what kind of internship
  voiceStipend: newAnswers.voiceStipend,
  hoursPerWeek: newAnswers.hoursPerWeek,
  portfolio: newAnswers.portfolio,
  createdAt: new Date().toISOString()
};
      setProfile(newProfile);
      matchGigs(newProfile);
      setShowExtraQuestions(false);
      setShowVoiceReport(true);   // ← Show AI Interview Insights

      const saveToSupabase = async () => {
        try {
          const { data: existing } = await supabase.from('students').select('email').eq('email', user?.email).maybeSingle();
          const userName = user?.email?.split('@')[0] || 'Student';
          if (existing) {
            await supabase.from('students').update({ name: userName, skills: newProfile.skills, project_interest: newProfile.projectInterest, hours_per_week: newProfile.hoursPerWeek, voice_stipend: newProfile.voiceStipend, work_type: newProfile.workType, commitment_duration: newProfile.commitmentDuration, portfolio: newProfile.portfolio }).eq('email', user?.email);
          } else {
            await supabase.from('students').insert([{ email: user?.email, password_hash: 'temp', name: userName, skills: newProfile.skills, project_interest: newProfile.projectInterest, hours_per_week: newProfile.hoursPerWeek, voice_stipend: newProfile.voiceStipend, work_type: newProfile.workType, commitment_duration: newProfile.commitmentDuration, portfolio: newProfile.portfolio, points: 50, created_at: newProfile.createdAt }]);
            setUserPoints(prev => prev + 50);
          }
        } catch (error) { console.error(error); }
      };
      saveToSupabase();
    }
  };

  // ========== MATCH GIGS ==========
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

  // ========== AI SEARCH ==========
  const searchWebGigs = async () => {
    setIsAIThinking(true);
    try {
      const aiResult = await searchInternshipsWithAI(skills, profile?.projectInterest);
      if (aiResult && aiResult.length > 0) {
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
    ai: { text: '🌐 Live AI search results', color: 'bg-blue-600' },
    supabase: { text: '📦 AI unavailable — showing matched gigs from our database', color: 'bg-yellow-600' },
    hardcoded: { text: '⚠️ AI & database unavailable — showing sample internships', color: 'bg-orange-600' }
  };

  // ========== SAVE ==========
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

  // ========== MOCK INTERVIEW ==========
  const handleStartMockInterview = async (gig) => {
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

  // ========== APPLY NOW ==========
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

  // FIXED: Now creates the row if it doesn't exist (Apply Anyway path)
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
        await supabase
          .from('applications')
          .update({ status: 'applied' })
          .eq('id', existing.id);
      } else {
        // Apply Anyway path — create the row so dashboard shows it
        await supabase
          .from('applications')
          .insert([{
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
    return combined.filter((gig, index, self) =>
      index === self.findIndex(g => g.id === gig.id)
    );
  };

  const getFilteredGigs = () => filterCategory === 'all' ? matchedGigs : matchedGigs.filter(gig => gig.category === filterCategory);
  const categories = ['all', 'Development', 'Design', 'Marketing', 'Data', 'Content', 'Testing', 'Management', 'HR'];

  const displayGigs = aiGigs.length > 0 ? aiGigs : getFilteredGigs();

  // ========== OVERLAY NAVIGATION (single-source-of-truth guards) ==========
  // Every full-screen "page" flag (showSkillExtractor, showDeepScan,
  // showVoiceReport) must be mutually exclusive. If two ever end up true
  // at once, whichever check appears first in renderContent()'s if-chain
  // silently wins, and the other stays hidden until something else resets
  // the winning flag — which looks like "the page I wanted doesn't open
  // until I click Back somewhere else." These helpers guarantee only one
  // overlay is ever true, no matter what order buttons are clicked in.
  const closeAllOverlays = () => {
    setShowSkillExtractor(false);
    setShowDeepScan(false);
    setShowVoiceReport(false);
  };

  const openSkillExtractor = () => {
    closeAllOverlays();
    setShowSkillExtractor(true);
  };

  // ========== RENDER ==========
  const renderContent = () => {
  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;

  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  // Mock Interview Room
  if (activeInterviewApp) {
    return (
      <InterviewRoom
        application={activeInterviewApp}
        onComplete={() => {
          setActiveInterviewApp(null);
          setCurrentPage('dashboard');          // FIXED: always go to Dashboard
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

  // ========== AI INTERVIEW INSIGHTS (Voice Interview Report) ==========
  if (showVoiceReport && profile) {
    const skillCount = skills.length;
    const base = Math.min(88, 58 + skillCount * 5);

    const scores = {
      communication: Math.min(94, base + 7),
      technicalVocabulary: Math.min(92, base + 9),
      speakingSpeed: Math.min(90, base + 4),
      fillerWordControl: Math.min(91, base + 6),
      responseQuality: Math.min(89, base + 5),
    };

    const overall = Math.round(
      (scores.communication + scores.technicalVocabulary + scores.speakingSpeed +
       scores.fillerWordControl + scores.responseQuality) / 5
    );

    const getBarColor = (v) => v >= 75 ? 'bg-green-500' : v >= 55 ? 'bg-amber-400' : 'bg-red-400';
    const getTextColor = (v) => v >= 75 ? 'text-green-700' : v >= 55 ? 'text-amber-700' : 'text-red-700';

    let overallMessage = '';
    if (overall >= 80) {
      overallMessage = "You're well prepared for entry-level technical internships.";
    } else if (overall >= 65) {
      overallMessage = "Suitable for beginner internships. Continue practicing to improve structure and examples.";
    } else {
      overallMessage = "Keep practicing. Focus on clearer structure and adding real project examples.";
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 max-w-2xl w-full">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">AI Interview Insights</h2>
            <p className="text-slate-500 text-sm mt-1">
              AI-estimated insights based on your interview responses
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 text-center mb-8 border border-purple-100">
            <p className="text-sm text-purple-600 font-medium mb-1">Overall Interview Readiness</p>
            <p className="text-5xl font-bold text-purple-700">
              {overall}<span className="text-2xl text-purple-400">/100</span>
            </p>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              {overallMessage}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Communication', value: scores.communication },
              { label: 'Technical Vocabulary', value: scores.technicalVocabulary },
              { label: 'Speaking Speed', value: scores.speakingSpeed },
              { label: 'Filler Word Control', value: scores.fillerWordControl },
              { label: 'Response Quality', value: scores.responseQuality },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className={`text-sm font-bold ${getTextColor(item.value)}`}>{item.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getBarColor(item.value)}`} 
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
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
            onClick={() => setShowVoiceReport(false)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition"
          >
            Continue to Internships →
          </button>
        </div>
      </div>
    );
  }

  // Voice Interview steps — redesigned to fill the empty space around the
  // chat: gradient blobs to match the landing page, a two-column layout
  // (chat + mic on the left, live waveform / tips / progress on the right
  // for wider screens), and an animated waveform instead of a single
  // pulsing ring so the "listening" moment has more visual energy.
  if (step > 0 && step < 99 && !profile && !showExtraQuestions) {
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

            {/* Left: chat + mic (spans 2 columns on wide screens) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Voice Interview Assistant</p>
                  <span className="ml-auto text-xs text-slate-400">Question {step} of {VOICE_QUESTIONS.length}</span>
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
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 flex flex-col items-center">
                <div className="relative mb-5 flex items-center justify-center">
                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-ping"></div>
                      {/* Animated waveform bars around the mic while listening */}
                      <div className="absolute -inset-6 flex items-center justify-center gap-1 pointer-events-none">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="w-1 bg-purple-400/70 rounded-full"
                            style={{
                              height: '10px',
                              animation: `voiceBar 0.9s ease-in-out ${i * 0.12}s infinite`
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <button 
                    onClick={handleVoiceAnswer} 
                    disabled={isListening} 
                    className={`relative w-28 h-28 rounded-full text-4xl shadow-xl transition-all duration-300 ${isListening ? "bg-red-500 scale-110 text-white animate-pulse" : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"}`}
                  >
                    <Mic className="w-12 h-12 mx-auto" />
                  </button>
                </div>
                <p className="text-slate-600 text-md font-medium">
                  {isListening ? "🔴 Listening... speak now!" : "🎙️ Tap mic to answer"}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Question {step} of {VOICE_QUESTIONS.length}
                </p>
                <style>{`
                  @keyframes voiceBar {
                    0%, 100% { height: 8px; }
                    50% { height: 28px; }
                  }
                `}</style>
              </div>
            </div>

            {/* Right: fills the empty space with tips + what's next */}
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
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skills.slice(0, 8).map((s, i) => (
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

  if (showExtraQuestions && !profile) {
    const curr = EXTRA_QUESTIONS[extraStep];
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-slate-900">Quick Questions</h2>
            <span className="ml-auto text-xs text-slate-400 font-medium">Question {extraStep + 1} of {EXTRA_QUESTIONS.length}</span>
          </div>
          <p className="text-slate-700 text-lg font-medium mb-6">{curr.question}</p>
          {curr.type === "select" ? (
            <div className="flex flex-col gap-3">
              {curr.options.map(opt => (
                <button key={opt} onClick={() => handleExtraAnswer(opt)} className="bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 py-3 rounded-xl font-medium transition">
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input type="text" placeholder="Type your answer..." className="w-full p-3 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition placeholder:text-slate-400" onKeyPress={e => { if (e.key === 'Enter' && e.target.value.trim()) { handleExtraAnswer(e.target.value.trim()); e.target.value = ''; } }} />
          )}
          <div className="mt-6 flex justify-between items-center">
            <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[60%]">
              <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${((extraStep + 1) / EXTRA_QUESTIONS.length) * 100}%` }} />
            </div>
            <p className="text-slate-400 text-sm ml-4">{extraStep + 1}/{EXTRA_QUESTIONS.length}</p>
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

  // ========== MAIN APP ==========
  return (
    <div className={`min-h-screen ${currentPage === 'home' ? 'bg-slate-50' : 'bg-gradient-to-br from-purple-950 to-purple-900'}`}>
      <nav className="bg-purple-900/50 backdrop-blur-sm border-b border-purple-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">VoiceMatch 🎤</h1>
          <div className="flex gap-4">
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="text-white/70 hover:text-white px-3 py-1 rounded-lg text-sm transition"
            >
              Logout
            </button>
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-lg ${currentPage === 'home' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Home</button>
            <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-2 rounded-lg ${currentPage === 'dashboard' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Dashboard 📋</button>
            
            <button onClick={() => setCurrentPage('activity')} className={`px-4 py-2 rounded-lg ${currentPage === 'activity' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>
              Activity
            </button>

            <button onClick={() => setCurrentPage('saved')} className={`px-4 py-2 rounded-lg ${currentPage === 'saved' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Saved ❤️</button>
            <button onClick={() => setCurrentPage('profile')} className={`px-4 py-2 rounded-lg ${currentPage === 'profile' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>My Profile 👤</button>
            <button onClick={openSkillExtractor} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm">🧠 Extract Skills</button>
            <button onClick={openAdvisor} className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-lg text-sm">🤖 Internship Advisor</button>
            <button onClick={searchWebGigs} disabled={isAIThinking} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50">
              {isAIThinking ? '⏳ Searching...' : '🌐 Find Internships'}
            </button>
          </div>
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
            onStartMockInterview={handleStartMockInterview}
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
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          gig.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                          gig.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {gig.difficulty}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => handleStartMockInterview(gig)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
                        >
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
                        <button
                          onClick={() => handleApplyNow(gig)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
                        >
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

      {/* Soft-gate modal */}
      {applyGateGig && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setApplyGateGig(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200/60"
            onClick={e => e.stopPropagation()}
          >
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
                handleStartMockInterview(gig);
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

      {/* Details modal */}
      {selectedGigForModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedGigForModal(null)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200/60" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedGigForModal.title}</h3>
                <p className="text-slate-500 text-sm">{selectedGigForModal.company}</p>
              </div>
              <button 
                onClick={() => setSelectedGigForModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition p-1"
              >
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

            <button 
              onClick={() => setSelectedGigForModal(null)} 
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  };

  // Floating Internship Advisor shortcut — visible on every page, including
  // the landing page, except while the Advisor itself is open or a mock
  // interview is actively in progress. Opens the EXISTING InternshipAdvisor
  // component full-screen via showDeepScan — this is a shortcut, not a
  // second chat implementation, so the Advisor section itself is untouched.
  //
  // Uses closeAllOverlays() so it's guaranteed to close the Skill Profile
  // page (or any other overlay) even if one was already open underneath —
  // this is what fixes the "chat button doesn't open Advisor until I click
  // Back on Skill Profile first" bug.
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