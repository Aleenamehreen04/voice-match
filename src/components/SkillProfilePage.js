// src/components/SkillProfilePage.js
//
// DESIGN NOTE: this page's job is "show me my shape as a candidate," so the
// signature idea here is category identity — every skill category gets its
// own icon + accent color that carries through the picker, the chips, and
// the radar legend, so the page reads as a coherent map rather than a form.
// Logic (state, handlers, radarData memo, API calls) is untouched.
//
// Same one-time font setup as HomePage.js — Space Grotesk / Inter / JetBrains
// Mono via Google Fonts link in public/index.html. Falls back gracefully
// to system sans if skipped.

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Brain,
  CheckCircle,
  Target,
  BookOpen,
  Mic,
  X,
  FileText,
  Download,
  RefreshCw,
  Code2,
  Smartphone,
  Database,
  ShieldCheck,
  Palette,
  Gamepad2,
  Link2,
  Cloud,
  Megaphone,
  Users2,
  Terminal,
  Sparkles,
  Award
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { extractSkillsHybrid, generateCareerMatchReport } from '../services/aiService';

const SKILL_BANK = {
  'Web Development': ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS', 'REST APIs', 'GraphQL', 'Vue.js', 'Angular', 'Express.js', 'Webpack'],
  'Mobile Development': ['Flutter', 'React Native', 'iOS Development', 'Android Development', 'Swift', 'Kotlin', 'App Development', 'Firebase'],
  'Data & AI': ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Data Visualization', 'Statistics', 'R', 'Excel'],
  'Cybersecurity': ['Penetration Testing', 'Ethical Hacking', 'Network Security', 'Cryptography', 'OAuth', 'JWT', 'IAM', 'SIEM', 'Wireshark', 'Metasploit', 'OWASP'],
  'Design': ['UI Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Wireframing', 'User Research', 'Prototyping', 'Design Systems', 'Graphic Design'],
  'Game & 3D': ['Unity', 'Unreal Engine', 'Game Development', 'C++', 'C#', '3D Modeling', 'Blender'],
  'Blockchain': ['Blockchain', 'Smart Contracts', 'Solidity', 'Web3', 'Ethereum', 'Solana'],
  'Cloud & DevOps': ['Git', 'Docker', 'Firebase', 'MongoDB', 'AWS', 'CI/CD', 'Linux'],
  'Marketing & Content': ['Marketing', 'Social Media', 'SEO', 'Content Writing', 'Video Editing', 'Copywriting', 'Email Marketing', 'Analytics'],
  'Business & Soft Skills': ['Business', 'Presentations', 'Research', 'Communication', 'Leadership', 'Problem Solving', 'Project Management', 'Negotiation', 'Time Management'],
  'Programming Languages': ['Java', 'C++', 'C', 'Go', 'Rust', 'PHP', 'Ruby']
};

// Category identity: one icon + one accent per category, reused everywhere
// that category shows up (tabs, chips, radar legend).
const CATEGORY_META = {
  'Web Development': { icon: Code2, accent: '#7c3aed', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', grad: 'from-purple-500 to-purple-600' },
  'Mobile Development': { icon: Smartphone, accent: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', grad: 'from-blue-500 to-blue-600' },
  'Data & AI': { icon: Database, accent: '#0891b2', bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200', grad: 'from-cyan-500 to-cyan-600' },
  'Cybersecurity': { icon: ShieldCheck, accent: '#dc2626', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', grad: 'from-red-500 to-red-600' },
  'Design': { icon: Palette, accent: '#db2777', bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200', grad: 'from-pink-500 to-pink-600' },
  'Game & 3D': { icon: Gamepad2, accent: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', grad: 'from-amber-500 to-amber-600' },
  'Blockchain': { icon: Link2, accent: '#4f46e5', bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', grad: 'from-indigo-500 to-indigo-600' },
  'Cloud & DevOps': { icon: Cloud, accent: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', grad: 'from-teal-500 to-teal-600' },
  'Marketing & Content': { icon: Megaphone, accent: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', grad: 'from-orange-500 to-orange-600' },
  'Business & Soft Skills': { icon: Users2, accent: '#65a30d', bg: 'bg-lime-50', text: 'text-lime-700', ring: 'ring-lime-200', grad: 'from-lime-500 to-lime-600' },
  'Programming Languages': { icon: Terminal, accent: '#475569', bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', grad: 'from-slate-500 to-slate-600' },
};

const FONT_DISPLAY = "font-['Space_Grotesk',sans-serif]";
const FONT_MONO = "font-['JetBrains_Mono',monospace]";

const RADAR_BENCHMARK = 5; // "well-rounded" reference point per category

const SkillProfilePage = ({ transcript, detectedSkills, user, onBack, onSkillsConfirmed }) => {
  const [selectedSkills, setSelectedSkills] = useState(new Set(detectedSkills || []));
  const [experienceLevel, setExperienceLevel] = useState('0-1 Years (Junior)');
  const [targetDomain, setTargetDomain] = useState('Web Development');
  const [openCategory, setOpenCategory] = useState('Web Development');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [expandedRole, setExpandedRole] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      const next = new Set(prev);
      next.has(skill) ? next.delete(skill) : next.add(skill);
      return next;
    });
  };

  const runAssessment = async () => {
    const skillsArray = Array.from(selectedSkills);
    setLoading(true);
    setLoadingMessage('Analyzing your skills & matching career paths...');
    setReport(null);
    const result = await generateCareerMatchReport(
      { experienceLevel, targetDomain },
      skillsArray
    );
    setReport(result);
    setLoading(false);
    setLoadingMessage('');
    onSkillsConfirmed && onSkillsConfirmed(skillsArray);
  };

  const retryWithAI = async () => {
    const skillsArray = Array.from(selectedSkills);
    setRetrying(true);
    const result = await generateCareerMatchReport(
      { experienceLevel, targetDomain },
      skillsArray
    );
    setReport(result);
    setRetrying(false);
  };

  const pullFromTranscript = async () => {
    if (!transcript) return;
    setLoading(true);
    setLoadingMessage('Extracting skills from your voice...');
    const hybrid = await extractSkillsHybrid(transcript);
    setSelectedSkills(prev => new Set([...prev, ...hybrid.skills]));
    setLoading(false);
    setLoadingMessage('');
  };

  // Radar data — unchanged logic, only the category label is trimmed for display.
  const radarData = useMemo(() => {
    const counts = Object.keys(SKILL_BANK).map(category => {
      const have = SKILL_BANK[category].filter(s => selectedSkills.has(s)).length;
      return { category, have };
    });

    let relevant = counts.filter(c => c.have > 0);
    if (!relevant.find(c => c.category === targetDomain)) {
      const domainEntry = counts.find(c => c.category === targetDomain);
      if (domainEntry) relevant = [domainEntry, ...relevant];
    }
    relevant = relevant
      .sort((a, b) => b.have - a.have)
      .slice(0, 6);

    return relevant.map(c => ({
      category: c.category.replace(' Development', '').replace(' & Soft Skills', ''),
      You: c.have,
      Benchmark: RADAR_BENCHMARK
    }));
  }, [selectedSkills, targetDomain]);

  const topScore = report?.matches?.[0]?.matchIndex || 0;
  const userName = user?.email?.split('@')[0] || 'Student';
  const skillsArray = Array.from(selectedSkills);
  const activeMeta = CATEGORY_META[openCategory];

  const cardClass = "bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6";

  return (
    <div className="min-h-screen bg-[#faf9fd]">
      <style>{`
        @keyframes sp-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sp-rise { animation: sp-rise 0.4s ease both; }
        @media (prefers-reduced-motion: reduce) { .sp-rise { animation: none; } }
      `}</style>

      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-700 text-white">
        <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <p className={`${FONT_MONO} text-[10px] tracking-[0.2em] uppercase text-purple-200`}>Candidate map</p>
                <h1 className={`${FONT_DISPLAY} text-2xl font-bold tracking-tight`}>Skill Profile</h1>
              </div>
            </div>
            <button onClick={onBack} className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 backdrop-blur">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* AI LOADING */}
        {loading && (
          <div className={`${cardClass} text-center mb-6 sp-rise`}>
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 mb-1`}>{loadingMessage || 'Working...'}</h3>
            <p className="text-sm text-slate-500">This usually takes a few seconds</p>
          </div>
        )}

        {/* BASIC INFO */}
        <div className={`${cardClass} mb-6`}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={`${FONT_MONO} text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em] block mb-2`}>Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
              >
                <option>0-1 Years (Junior)</option>
                <option>1-2 Years</option>
                <option>2-4 Years</option>
              </select>
            </div>
            <div>
              <label className={`${FONT_MONO} text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em] block mb-2`}>Target Domain</label>
              <select
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
              >
                {Object.keys(SKILL_BANK).map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SELECTED SKILLS */}
        <div className={`${cardClass} mb-6`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 flex items-center gap-2`}>
              <CheckCircle className="w-4 h-4 text-green-600" />
              Your Skills <span className={`${FONT_MONO} text-purple-500`}>({selectedSkills.size})</span>
            </h3>
            {transcript && (
              <button
                onClick={pullFromTranscript}
                disabled={loading}
                className="text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full transition disabled:opacity-50 flex items-center gap-1.5 border border-purple-100"
              >
                <Mic className="w-3 h-3" /> Pull from voice
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 min-h-[36px]">
            {selectedSkills.size === 0 && (
              <span className="text-sm text-slate-400">No skills selected yet — pick some below.</span>
            )}
            {Array.from(selectedSkills).map((skill) => {
              const cat = Object.keys(SKILL_BANK).find(c => SKILL_BANK[c].includes(skill));
              const meta = CATEGORY_META[cat] || CATEGORY_META['Programming Languages'];
              return (
                <span
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`${meta.bg} ${meta.text} px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 transition flex items-center gap-1.5 border border-transparent ring-1 ${meta.ring} shadow-sm`}
                >
                  <meta.icon className="w-3.5 h-3.5" />
                  {skill}
                  <X className="w-3.5 h-3.5 opacity-50" />
                </span>
              );
            })}
          </div>
        </div>

        {/* RADAR */}
        {selectedSkills.size > 0 && (
          <div className={`${cardClass} mb-6`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 flex items-center gap-2`}>
                <Target className="w-4 h-4 text-purple-600" />
                Skill Coverage Map
              </h3>
              <span className={`${FONT_MONO} text-[10px] text-slate-400 uppercase tracking-wide`}>You vs. well-rounded</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Benchmark = {RADAR_BENCHMARK} skills per category, based on your Skill Bank selections.
            </p>
            <div className="h-72 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, RADAR_BENCHMARK]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="Benchmark"
                    stroke="#cbd5e1"
                    fill="#cbd5e1"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="You"
                    dataKey="You"
                    stroke="#7c3aed"
                    fill="#a855f7"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SKILL PICKER — category tabs now carry icon + accent identity */}
        <div className={`${cardClass} mb-6`}>
          <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 mb-3 flex items-center gap-2`}>
            <BookOpen className="w-4 h-4 text-purple-600" />
            Skill Bank Library
          </h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.keys(SKILL_BANK).map(cat => {
              const meta = CATEGORY_META[cat];
              const isOpen = openCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setOpenCategory(cat)}
                  className={`text-xs font-medium pl-2.5 pr-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                    isOpen
                      ? `bg-gradient-to-r ${meta.grad} text-white shadow-sm`
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <meta.icon className="w-3.5 h-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>
          <div className={`rounded-2xl p-4 ${activeMeta.bg} border ${activeMeta.ring.replace('ring-', 'border-')}`}>
            <div className="flex flex-wrap gap-2">
              {SKILL_BANK[openCategory].map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition shadow-sm ${
                    selectedSkills.has(skill)
                      ? `bg-gradient-to-r ${activeMeta.grad} text-white border-transparent`
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={runAssessment}
            disabled={loading || selectedSkills.size === 0}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-3.5 rounded-2xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-200"
          >
            <Target className="w-5 h-5" />
            {loading ? 'Running...' : 'Run Career Match'}
          </button>

          <button
            onClick={() => setShowResume(true)}
            disabled={selectedSkills.size === 0}
            className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 py-3.5 rounded-2xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" /> Build Resume
          </button>
        </div>

        {/* RESUME */}
        {showResume && (
          <div className="bg-white rounded-2xl shadow-xl shadow-purple-100 mb-6 overflow-hidden border border-slate-200/60 sp-rise">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" /> Your Resume Preview
              </h3>
              <button onClick={() => setShowResume(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* "paper" card — thin outer frame + inner sheet, reads like an actual document */}
            <div className="p-6 bg-slate-50">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-violet-600 rounded-t-lg" />

                <div className="border-b border-slate-200 pb-4 mb-6">
                  <h2 className={`${FONT_DISPLAY} text-2xl font-bold text-slate-900 capitalize tracking-tight`}>{userName}</h2>
                  <p className="text-sm font-medium text-purple-600 mt-1">{targetDomain} · {experienceLevel}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
                </div>

                <div className="mb-6">
                  <h4 className={`${FONT_MONO} text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2`}>Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Motivated {experienceLevel.toLowerCase()} student passionate about {targetDomain.toLowerCase()}.
                    Skilled in {skillsArray.slice(0, 4).join(', ')}
                    {skillsArray.length > 4 ? ` and ${skillsArray.length - 4} more` : ''}.
                    Eager to contribute and grow through internship opportunities.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className={`${FONT_MONO} text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3`}>Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill) => {
                      const cat = Object.keys(SKILL_BANK).find(c => SKILL_BANK[c].includes(skill));
                      const meta = CATEGORY_META[cat] || CATEGORY_META['Programming Languages'];
                      return (
                        <span key={skill} className={`${meta.bg} ${meta.text} px-3 py-1 rounded-lg text-sm font-medium border border-transparent ring-1 ${meta.ring}`}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-2">
                  <h4 className={`${FONT_MONO} text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2`}>Education</h4>
                  <p className="text-sm font-medium text-slate-800">Bachelor's Degree (Ongoing)</p>
                  <p className="text-sm text-slate-500">Your College / University</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700 mt-4">
                Tip: Press Ctrl+P (or Cmd+P) to print / save as PDF.
              </div>
            </div>

            <div className="px-6 pb-6 bg-slate-50">
              <button
                onClick={() => window.print()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {report && !loading && (
          <div className={`${cardClass} sp-rise`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-200">
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                  <span className={`${FONT_MONO} text-xl font-bold text-purple-700`}>{topScore}%</span>
                </div>
              </div>
              <div>
                <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 flex items-center gap-1.5`}>
                  <Award className="w-4 h-4 text-amber-500" /> Your top match: {report.matches?.[0]?.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
                    report.source === 'ai'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {report.source === 'ai' ? 'AI-scored' : 'Backup scoring'}
                  </span>

                  {report.source !== 'ai' && (
                    <button
                      onClick={retryWithAI}
                      disabled={retrying}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
                      {retrying ? 'Retrying...' : 'Retry with AI'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <h4 className={`${FONT_MONO} text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3`}>Top Career Path Matches</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {report.matches?.map((role, i) => (
                <div key={i} className={`relative bg-slate-50 rounded-xl p-4 border border-slate-200/60 hover:border-purple-200 hover:shadow-sm transition ${i === 0 ? 'ring-2 ring-purple-200' : ''}`}>
                  {i === 0 && (
                    <span className={`${FONT_MONO} absolute -top-2.5 left-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3" /> TOP PICK
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-base font-semibold text-slate-900">{role.title}</h5>
                    <span className={`${FONT_MONO} text-sm font-bold text-purple-600`}>{role.matchIndex}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{role.description}</p>
                  <button
                    onClick={() => setExpandedRole(expandedRole === i ? null : i)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    {expandedRole === i ? 'Hide roadmap' : 'Explore roadmap →'}
                  </button>
                  {expandedRole === i && (
                    <ul className="mt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-200/60 pt-2">
                      {role.roadmap?.map((step, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className={`${FONT_MONO} text-purple-500 font-bold`}>{String(j + 1).padStart(2, '0')}</span> {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillProfilePage;