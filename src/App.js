import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';

// ========== LANDING PAGE ==========
function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-yellow-400 mb-4">VoiceMatch 🎤</h1>
        <p className="text-purple-200 text-xl mb-6">Find your first internship — just by speaking</p>
        <div className="bg-purple-800/50 rounded-xl p-6 mb-8">
          <p className="text-white mb-2 font-semibold">✨ How it works:</p>
          <ul className="text-purple-200 space-y-2">
            <li>1️⃣ Tell us your skills by voice</li>
            <li>2️⃣ Voice assistant asks 3 questions</li>
            <li>3️⃣ Answer 3 more questions</li>
            <li>4️⃣ Get matched to gigs</li>
          </ul>
        </div>
        <button onClick={onStart} className="bg-yellow-400 text-purple-900 px-8 py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition">Get Started →</button>
      </div>
    </div>
  );
}

// ========== SKILLS LIST ==========
const SKILLS_LIST = ["React", "JavaScript", "Python", "UI Design", "Figma", "CSS", "HTML", "Node.js", "Java", "C++", "Machine Learning", "Data Analysis", "SQL", "Marketing", "Content Writing", "Social Media", "SEO", "Graphic Design", "Photoshop", "Video Editing", "Business", "Presentations", "Research", "Communication", "Leadership", "Problem Solving", "Web Development", "App Development", "Flutter", "Firebase", "MongoDB", "Git"];

// ========== CAREER RECOMMENDATIONS ==========
const getSkillSuggestions = (skills, projectInterest) => {
  const suggestions = [];
  if (skills.includes("React")) suggestions.push("💡 Build a portfolio project with React + Tailwind CSS!");
  if (skills.includes("JavaScript")) suggestions.push("💡 Learn TypeScript – it's used by 80% of startups!");
  if (skills.includes("Python")) suggestions.push("💡 Take Google's 'Python Crash Course' on Coursera – free!");
  if (skills.includes("Figma")) suggestions.push("💡 Create a UI kit and share it on Behance!");
  if (skills.includes("SQL")) suggestions.push("💡 Practice SQL on LeetCode – interviews love it!");
  if (skills.length === 0) suggestions.push("💡 Start with freeCodeCamp's Responsive Web Design course!");
  if (projectInterest) {
    const interest = projectInterest.toLowerCase();
    if (interest.includes('web')) suggestions.push("🌐 Build a personal website – it's your digital resume!");
    if (interest.includes('mobile')) suggestions.push("📱 Try React Native – one codebase for iOS and Android!");
    if (interest.includes('data')) suggestions.push("📊 Complete Kaggle's 'Intro to Data Science' – free certificate!");
    if (interest.includes('design')) suggestions.push("🎨 Take Google's 'UX Design Certificate' on Coursera!");
  }
  if (suggestions.length === 0) suggestions.push("💡 Complete a project in your area of interest!");
  return suggestions.slice(0, 4);
};

// ========== VOICE & CHAT QUESTIONS ==========
const VOICE_QUESTIONS = [
  "What kind of projects excite you the most?",
  "How many hours per week can you commit?",
  "What is your expected monthly stipend? For example, say 10,000 or 15,000 rupees."
];
const EXTRA_QUESTIONS = [
  { id: "workType", question: "Work preference? (Remote / Hybrid / In-office)", type: "select", options: ["Remote", "Hybrid", "In-office"] },
  { id: "commitment", question: "Preferred internship duration? (e.g., 2, 3, 6 months)", type: "text" },
  { id: "portfolio", question: "Got a GitHub or portfolio link? (Paste link or type 'no' - this helps you get hired!)", type: "text" }
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

// ========== PROFILE PAGE ==========
const ProfilePage = ({ profile, skills, user, userPoints, onRetakeInterview }) => {
  const calculateProfileStrength = () => {
    if (!profile) return 0;
    let weight = 0;
    if (skills.length > 0) weight += 20;
    if (profile.projectInterest) weight += 20;
    if (profile.hoursPerWeek) weight += 15;
    if (profile.voiceStipend) weight += 15;
    if (profile.workType) weight += 10;
    if (profile.commitmentDuration) weight += 10;
    if (profile.portfolio && profile.portfolio !== "no") weight += 10;
    return weight;
  };
  const strength = calculateProfileStrength();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (strength / 100) * circumference;

  return (
    <div className="bg-purple-800/50 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-yellow-400">My Profile</h2>
        <button onClick={onRetakeInterview} className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition">🎤 Retake Interview</button>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#4B5563" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#FBBF24" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-white">{strength}%</span></div>
          </div>
          <div><h3 className="text-white font-semibold">Profile Strength</h3><p className="text-purple-300 text-sm">Complete your profile to get better matches</p></div>
        </div>
        <div><h3 className="text-purple-300 text-sm uppercase">Email</h3><p className="text-white">{user?.email}</p></div>
        <div><h3 className="text-purple-300 text-sm uppercase">🏆 My Points</h3><p className="text-yellow-400 text-3xl font-bold">{userPoints}</p><p className="text-purple-400 text-xs">✨ You earn +10 points for applying and +5 for saving!</p></div>
        {profile ? (
          <>
            <div><h3 className="text-purple-300 text-sm uppercase">🎯 Detected Skills</h3><div className="flex flex-wrap gap-2 mt-1">{skills.map(s => <span key={s} className="bg-purple-700 px-3 py-1 rounded-full text-white text-sm">{s}</span>)}</div></div>
            <div><h3 className="text-purple-300 text-sm uppercase">📌 Project Interest</h3><p className="text-white">{profile.projectInterest}</p></div>
            <div className="bg-purple-900/50 rounded-lg p-4"><h3 className="text-yellow-400 text-sm uppercase mb-2">🚀 Career Recommendations</h3><div className="space-y-2">{getSkillSuggestions(skills, profile.projectInterest).map((tip, i) => <p key={i} className="text-purple-200 text-sm">{tip}</p>)}</div></div>
            <div><h3 className="text-purple-300 text-sm uppercase">⏰ Hours/Week</h3><p className="text-white">{profile.hoursPerWeek}</p></div>
            <div><h3 className="text-purple-300 text-sm uppercase">💰 Expected Stipend</h3><p className="text-white">{profile.voiceStipend}</p></div>
            <div><h3 className="text-purple-300 text-sm uppercase">💼 Work Preference</h3><p className="text-white">{profile.workType}</p></div>
            <div><h3 className="text-purple-300 text-sm uppercase">📅 Duration Preference</h3><p className="text-white">{profile.commitmentDuration}</p></div>
            {profile.portfolio && profile.portfolio !== "no" ? (
              <div><h3 className="text-purple-300 text-sm uppercase">🔗 Portfolio/GitHub</h3><a href={profile.portfolio} target="_blank" rel="noreferrer" className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">🚀 View My Portfolio</a></div>
            ) : (
              <div className="bg-purple-900/50 rounded-lg p-4 border border-purple-700"><h3 className="text-yellow-400 text-sm uppercase">📢 No GitHub Yet?</h3><p className="text-purple-200 text-sm">Create a free GitHub account at <a href="https://github.com" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">github.com</a> and showcase your projects!</p></div>
            )}
          </>
        ) : <p className="text-purple-400">Complete the voice interview to see your profile!</p>}
      </div>
    </div>
  );
};

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [skills, setSkills] = useState([]);
  const [profile, setProfile] = useState(null);
  const [matchedGigs, setMatchedGigs] = useState([]);
  const [savedGigs, setSavedGigs] = useState([]);
  const [appliedGigs, setAppliedGigs] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [showLanding, setShowLanding] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedGigForModal, setSelectedGigForModal] = useState(null);
  const [allGigs, setAllGigs] = useState([]);
  const [user, setUser] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [showExtraQuestions, setShowExtraQuestions] = useState(false);
  const [extraStep, setExtraStep] = useState(0);
  const [extraAnswers, setExtraAnswers] = useState({});

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // Leaderboard
  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('students').select('name, skills, points').order('points', { ascending: false }).limit(10);
    if (data) setLeaderboardData(data);
  };
  useEffect(() => { fetchLeaderboard(); }, [userPoints, profile]);

  // User points
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('students').select('points').eq('email', user.email).maybeSingle();
      setUserPoints(data?.points || 0);
    };
    fetchPoints();
  }, [user, profile]);

  // Fetch gigs
  useEffect(() => {
    axios.get('http://localhost:5000/api/gigs').then(res => setAllGigs(res.data)).catch(err => console.error(err));
  }, []);

  // Local storage
  useEffect(() => {
    const saved = localStorage.getItem('voiceMatch_savedGigs');
    if (saved) setSavedGigs(JSON.parse(saved));
    const applied = localStorage.getItem('voiceMatch_appliedGigs');
    if (applied) setAppliedGigs(JSON.parse(applied));
  }, []);
  useEffect(() => { localStorage.setItem('voiceMatch_savedGigs', JSON.stringify(savedGigs)); }, [savedGigs]);
  useEffect(() => { localStorage.setItem('voiceMatch_appliedGigs', JSON.stringify(appliedGigs)); }, [appliedGigs]);

  // Speech helpers
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
  const extractSkillsFromText = (text) => { const lower = text.toLowerCase(); return SKILLS_LIST.filter(skill => lower.includes(skill.toLowerCase())); };

  // Voice interview
  const handleInitialSpeak = () => {
    setConversation([]); setSkills([]); setAnswers([]); setStep(0); setProfile(null); setMatchedGigs([]); setShowExtraQuestions(false);
    startListening((text) => {
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
        skills, projectInterest: answers[0], hoursPerWeek: answers[1], voiceStipend: answers[2],
        workType: newAnswers.workType, commitmentDuration: newAnswers.commitment, portfolio: newAnswers.portfolio,
        createdAt: new Date().toISOString()
      };
      setProfile(newProfile);
      matchGigs(newProfile);
      setShowExtraQuestions(false);
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
          fetchLeaderboard();
        } catch (error) { console.error(error); }
      };
      saveToSupabase();
    }
  };

  // MATCH GIGS WITH GREEN BADGE - FIXED
  const matchGigs = (userProfile) => {
    const preferredCategory = getCategoryFromInterest(userProfile.projectInterest);
    
    const scored = allGigs.map(gig => {
      let skillMatchCount = userProfile.skills.filter(skill => 
        gig.skills.some(gs => gs.toLowerCase().includes(skill.toLowerCase()))
      ).length;
      let skillScore = Math.min(skillMatchCount * 20, 60);
      let difficultyScore = gig.difficulty === "Beginner" ? 20 : gig.difficulty === "Intermediate" ? 10 : 0;
      
      // GREEN BADGE FIX
      let showIdealBadge = false;
      if (preferredCategory && gig.category === preferredCategory) {
        showIdealBadge = true;
      }
      
      let categoryMatch = true;
      if (preferredCategory && gig.category !== preferredCategory) { 
        categoryMatch = false; 
        skillScore -= 15; 
      }
      
      let durationMatch = true;
      if (userProfile.commitmentDuration) {
        let userMonths = parseInt(userProfile.commitmentDuration.match(/\d+/)?.[0] || 0);
        let gigMonths = parseInt(gig.duration.match(/\d+/)?.[0] || 0);
        if (userMonths > 0 && gigMonths > 0 && userMonths < gigMonths) { 
          durationMatch = false; 
          difficultyScore -= 10; 
        }
      }
      
      let salaryMatch = true;
      if (userProfile.voiceStipend) {
        let userSalary = parseInt(userProfile.voiceStipend.match(/\d+/)?.[0] || 0);
        let gigSalary = parseInt(gig.stipend.replace(/[^0-9]/g, ''));
        if (userSalary > 0 && gigSalary > 0 && userSalary > gigSalary) { 
          salaryMatch = false; 
          skillScore -= 10; 
        }
      }
      
      let hoursMatch = true;
      if (userProfile.hoursPerWeek) {
        let userHours = parseInt(userProfile.hoursPerWeek.match(/\d+/)?.[0] || 0);
        if (userHours > 0 && userHours < 15) { 
          hoursMatch = false; 
          skillScore -= 10; 
        }
      }
      
      let totalScore = Math.max(skillScore + difficultyScore, 0);
      totalScore = Math.min(totalScore, 100);
      
      return { 
        ...gig, 
        matchScore: totalScore, 
        skillMatchCount, 
        categoryMatch, 
        durationMatch, 
        salaryMatch, 
        hoursMatch,
        showIdealBadge
      };
    });
    
    let filtered = scored.filter(g => g.matchScore > 0 && g.categoryMatch && g.durationMatch && g.salaryMatch && g.hoursMatch);
    setMatchedGigs(filtered.sort((a, b) => b.matchScore - a.matchScore));
    if (filtered.length === 0) alert("No gigs match your skills and preferences.");
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

  const handleApply = async (gig) => {
    if (appliedGigs.includes(gig.id)) return;
    setAppliedGigs([...appliedGigs, gig.id]);
    try {
      await supabase.from('applications').insert([{ student_email: user?.email, gig_id: gig.id, applied_at: new Date() }]);
      const { data: student } = await supabase.from('students').select('points').eq('email', user?.email).maybeSingle();
      await supabase.from('students').update({ points: (student?.points || 0) + 10 }).eq('email', user?.email);
      setUserPoints(prev => prev + 10);
      fetchLeaderboard();
    } catch (err) { console.error(err); setAppliedGigs(appliedGigs); }
  };

  const getSavedGigsData = () => allGigs.filter(gig => savedGigs.includes(gig.id));
  const getFilteredGigs = () => filterCategory === 'all' ? matchedGigs : matchedGigs.filter(gig => gig.category === filterCategory);
  const categories = ['all', 'Development', 'Design', 'Marketing', 'Data', 'Content', 'Testing', 'Management', 'HR'];

  // RENDER
  if (!user) return <Auth onLogin={setUser} />;
  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;

  if (step > 0 && step < 99 && !profile && !showExtraQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900 flex flex-col items-center p-6">
        <div className="text-center mt-8 mb-4"><h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Voice is Your Resume 🎤</h2><p className="text-purple-300 text-md">Speak naturally – I listen and match you</p></div>
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-purple-900/50 border border-purple-700 rounded-2xl p-6 mb-6 shadow-sm">
            <p className="text-yellow-400 text-xs uppercase tracking-wide mb-4">Voice Interview Assistant</p>
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-xs text-sm ${msg.role === "user" ? "bg-yellow-400 text-purple-900 font-medium" : "bg-purple-800 text-white"}`}>
                    {msg.role === "ai" && <span className="text-yellow-400 font-bold mr-1">🤖 Assistant:</span>}{msg.text}
                  </div>
                </div>
              ))}
              {isThinking && <div className="flex justify-start"><div className="bg-purple-800 text-white px-4 py-2 rounded-2xl">Assistant is thinking<span className="animate-pulse">...</span></div></div>}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative mb-4">{isListening && <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 animate-ping"></div>}<button onClick={handleVoiceAnswer} disabled={isListening} className={`w-28 h-28 rounded-full text-4xl shadow-xl transition-all duration-300 ${isListening ? "bg-red-500 scale-110 text-white" : "bg-yellow-400 hover:bg-yellow-300 hover:scale-105 text-purple-900"}`}>🎤</button></div>
            <p className="text-purple-300 text-md font-medium">{isListening ? "🔴 Listening... speak now!" : "🎙️ Tap mic to answer"}</p>
            <p className="text-purple-400 text-sm mt-2">Question {step} of {VOICE_QUESTIONS.length}</p>
          </div>
        </div>
      </div>
    );
  }

  if (showExtraQuestions && !profile) {
    const curr = EXTRA_QUESTIONS[extraStep];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900 flex items-center justify-center p-6">
        <div className="bg-purple-900 rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Quick Questions</h2>
          <p className="text-white text-lg mb-6">{curr.question}</p>
          {curr.type === "select" ? (
            <div className="flex flex-col gap-3">{curr.options.map(opt => <button key={opt} onClick={() => handleExtraAnswer(opt)} className="bg-purple-800 hover:bg-purple-700 text-white py-3 rounded-lg">{opt}</button>)}</div>
          ) : (
            <input type="text" placeholder="Type your answer..." className="w-full p-3 rounded-lg bg-purple-800 text-white border border-purple-600 mb-4" onKeyPress={e => { if (e.key === 'Enter' && e.target.value.trim()) { handleExtraAnswer(e.target.value.trim()); e.target.value = ''; } }} />
          )}
          <p className="text-purple-300 text-sm mt-4 text-center">Question {extraStep + 1} of {EXTRA_QUESTIONS.length}</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900">
        <nav className="bg-purple-900/50 backdrop-blur-sm border-b border-purple-700 p-4"><div className="container mx-auto flex justify-between items-center"><h1 className="text-2xl font-bold text-yellow-400">VoiceMatch 🎤</h1><div className="flex gap-4"><button onClick={() => setCurrentPage('home')} className="text-white hover:bg-purple-800 px-4 py-2 rounded-lg">Home</button><button onClick={() => setCurrentPage('leaderboard')} className="text-white hover:bg-purple-800 px-4 py-2 rounded-lg">Leaderboard</button><button onClick={() => setCurrentPage('saved')} className="text-white hover:bg-purple-800 px-4 py-2 rounded-lg">Saved ❤️</button><button onClick={() => setCurrentPage('profile')} className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-lg">My Profile 👤</button></div></div></nav>
        <div className="container mx-auto p-6"><ProfilePage profile={profile} skills={skills} user={user} userPoints={userPoints} onRetakeInterview={() => { setProfile(null); setShowLanding(false); setStep(0); handleInitialSpeak(); }} /></div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900">
      <nav className="bg-purple-900/50 backdrop-blur-sm border-b border-purple-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">VoiceMatch 🎤</h1>
          <div className="flex gap-4">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-lg ${currentPage === 'home' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Home</button>
            <button onClick={() => setCurrentPage('leaderboard')} className={`px-4 py-2 rounded-lg ${currentPage === 'leaderboard' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Leaderboard</button>
            <button onClick={() => setCurrentPage('saved')} className={`px-4 py-2 rounded-lg ${currentPage === 'saved' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>Saved ❤️</button>
            <button onClick={() => setCurrentPage('profile')} className={`px-4 py-2 rounded-lg ${currentPage === 'profile' ? 'bg-yellow-400 text-purple-900' : 'text-white hover:bg-purple-800'}`}>My Profile 👤</button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto p-6">
        {currentPage === 'home' && (
          <>
            {!profile && step === 0 && (
              <div className="flex flex-col items-center mb-8">
                <div className="text-center mb-6"><h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Voice is Your Resume 🎤</h2><p className="text-purple-300 text-md">Speak for 60 seconds. I'll find your skills and match you to gigs.</p></div>
                <button onClick={handleInitialSpeak} disabled={isListening} className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition transform hover:scale-105 shadow-lg">🎤 Start Voice Interview</button>
              </div>
            )}
            {profile && (
              <>
                <div className="bg-purple-800/50 rounded-xl p-6 mb-8">
                  <h2 className="text-xl font-bold text-yellow-400 mb-2">Your Profile</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">Skills: {skills.join(', ')}</span>
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">Projects: {profile.projectInterest}</span>
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">{profile.hoursPerWeek} hrs/week</span>
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">Expected: {profile.voiceStipend}</span>
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">Work: {profile.workType}</span>
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-white">Duration: {profile.commitmentDuration}</span>
                    {profile.portfolio && profile.portfolio !== "no" && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="bg-purple-700 px-3 py-1 rounded-full text-white hover:bg-yellow-400 hover:text-purple-900">🔗 Portfolio</a>}
                  </div>
                </div>
                <div className="bg-purple-800/50 rounded-xl p-4 mb-6">
                  <h3 className="text-yellow-400 text-sm uppercase mb-2">🚀 Career Recommendations</h3>
                  <div className="space-y-2">{getSkillSuggestions(skills, profile.projectInterest).map((tip, i) => <p key={i} className="text-purple-200 text-sm">{tip}</p>)}</div>
                </div>
              </>
            )}
            {profile && (<div className="flex flex-wrap gap-2 mb-6">{categories.map(cat => <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-full capitalize ${filterCategory === cat ? 'bg-yellow-400 text-purple-900' : 'bg-purple-800 text-white hover:bg-purple-700'}`}>{cat}</button>)}</div>)}
            {profile && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredGigs().map(gig => (
                  <div key={gig.id} className="bg-purple-800/50 rounded-xl p-6 border border-purple-700 hover:border-yellow-400 transition">
                    <div className="flex justify-between items-start mb-3"><h3 className="text-xl font-bold text-white">{gig.title}</h3><button onClick={() => toggleSave(gig.id)} className="text-2xl">{savedGigs.includes(gig.id) ? '❤️' : '🤍'}</button></div>
                    <p className="text-purple-300">{gig.company}</p><p className="text-yellow-400 font-semibold mt-2">{gig.stipend}</p><p className="text-purple-300 text-sm">{gig.duration}</p>
                    <div className="flex gap-2 mt-3"><span className="bg-purple-700 px-2 py-1 rounded text-xs text-white">{gig.difficulty}</span><span className="bg-purple-700 px-2 py-1 rounded text-xs text-white">{gig.category}</span></div>
                    {gig.showIdealBadge && (<div className="mt-2"><span className="inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">🎯 Ideal for your interest</span></div>)}
                    <div className="mt-3 w-full bg-purple-700 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${gig.matchScore}%` }}></div></div>
                    <p className="text-right text-yellow-400 text-sm mt-1">{gig.matchScore}% Match</p>
                    <div className="flex gap-2 mt-3">{appliedGigs.includes(gig.id) ? <div className="flex-1 bg-green-600 text-white py-2 rounded-lg text-center font-semibold">✓ Applied</div> : <button onClick={() => handleApply(gig)} className="flex-1 bg-yellow-400 text-purple-900 py-2 rounded-lg font-semibold hover:bg-yellow-300">Apply Now</button>}<button onClick={() => setSelectedGigForModal(gig)} className="bg-purple-700 text-white px-3 py-2 rounded-lg hover:bg-purple-600">📋 Details</button></div>
                    {appliedGigs.includes(gig.id) && <p className="text-green-400 text-xs text-center mt-2">{gig.company} will connect with you soon! 📧</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {currentPage === 'leaderboard' && (
          <div className="bg-purple-800/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">🏆 Student Leadership Board</h2>
            <p className="text-purple-300 text-sm mb-4">Earn points by applying (+10) and saving (+5) gigs!</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-purple-600"><th className="text-left py-3 text-purple-200">Rank</th><th className="text-left py-3 text-purple-200">Student</th><th className="text-left py-3 text-purple-200">Skills</th><th className="text-left py-3 text-purple-200">Points</th><th className="text-left py-3 text-purple-200">Level</th></tr></thead>
                <tbody>{leaderboardData.length > 0 ? leaderboardData.map((s, idx) => { const level = s.points >= 200 ? 'Expert' : s.points >= 100 ? 'Advanced' : s.points >= 50 ? 'Intermediate' : 'Beginner'; const levelColor = level === 'Expert' ? 'bg-yellow-600' : level === 'Advanced' ? 'bg-purple-600' : level === 'Intermediate' ? 'bg-blue-600' : 'bg-green-600'; return (<tr key={idx} className="border-b border-purple-700/50"><td className="py-3 text-white font-bold">#{idx+1}</td><td className="py-3 text-white">{s.name || 'Student'}</td><td className="py-3 text-purple-300">{s.skills?.length || 0} skills</td><td className="py-3 text-yellow-400 font-semibold">{s.points || 0}</td><td className="py-3"><span className={`px-2 py-1 rounded text-xs ${levelColor} text-white`}>{level}</span></td></tr>); }) : <tr><td colSpan="5" className="text-center py-8 text-purple-400">Complete the voice interview and apply to gigs to see yourself here!</td></tr>}</tbody>
              </table>
            </div>
          </div>
        )}
        {currentPage === 'saved' && (
          <div><h2 className="text-2xl font-bold text-yellow-400 mb-6">❤️ Saved Gigs</h2>
            {getSavedGigsData().length === 0 ? <div className="text-center py-16"><p className="text-gray-400">No saved gigs yet. Click the heart on any gig to save it!</p></div> :
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{getSavedGigsData().map(gig => (<div key={gig.id} className="bg-purple-800/50 rounded-xl p-6 border border-yellow-400"><h3 className="text-xl font-bold text-white">{gig.title}</h3><p className="text-purple-300">{gig.company}</p><p className="text-yellow-400 font-semibold mt-2">{gig.stipend}</p><div className="flex gap-2 mt-3">{appliedGigs.includes(gig.id) ? <div className="flex-1 bg-green-600 text-white py-2 rounded-lg text-center">✓ Applied</div> : <button onClick={() => handleApply(gig)} className="flex-1 bg-yellow-400 text-purple-900 py-2 rounded-lg font-semibold">Apply Now</button>}<button onClick={() => setSelectedGigForModal(gig)} className="bg-purple-700 text-white px-3 py-2 rounded-lg">📋 Details</button></div>{appliedGigs.includes(gig.id) && <p className="text-green-400 text-xs text-center mt-2">{gig.company} will connect with you soon! 📧</p>}</div>))}</div>}
          </div>
        )}
      </div>
      {selectedGigForModal && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedGigForModal(null)}><div className="bg-purple-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}><h3 className="text-2xl font-bold text-yellow-400 mb-2">{selectedGigForModal.title}</h3><p className="text-purple-300 mb-4">{selectedGigForModal.company}</p><div className="space-y-3 text-white"><p><span className="text-yellow-400">💰 Stipend:</span> {selectedGigForModal.stipend}</p><p><span className="text-yellow-400">📅 Duration:</span> {selectedGigForModal.duration}</p><p><span className="text-yellow-400">📂 Category:</span> {selectedGigForModal.category}</p><p><span className="text-yellow-400">⚙️ Difficulty:</span> {selectedGigForModal.difficulty}</p><p><span className="text-yellow-400">🛠️ Required skills:</span> {selectedGigForModal.skills.join(', ')}</p><p><span className="text-yellow-400">📝 Description:</span> {selectedGigForModal.description}</p>{profile && <><p><span className="text-yellow-400">🧠 Your skills:</span> {skills.join(', ') || 'None detected'}</p><p><span className="text-yellow-400">🎯 Skill match:</span> {selectedGigForModal.skillMatchCount} of {selectedGigForModal.skills.length}</p></>}</div><button onClick={() => setSelectedGigForModal(null)} className="mt-6 w-full bg-yellow-400 text-purple-900 py-2 rounded-lg font-semibold">Close</button></div></div>)}
    </div>
  );
}

export default App;