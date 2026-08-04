// src/components/SkillProfilePage.js
import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
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

  const topScore = report?.matches?.[0]?.matchIndex || 0;
  const userName = user?.email?.split('@')[0] || 'Student';
  const skillsArray = Array.from(selectedSkills);

  const cardClass = "bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6";

  const chipColors = [
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Skill Profile</h1>
            </div>
            <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* AI LOADING */}
        {loading && (
          <div className={`${cardClass} text-center mb-6`}>
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{loadingMessage || 'Working...'}</h3>
            <p className="text-sm text-slate-500">This usually takes a few seconds</p>
            <div className="w-40 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: '65%' }}></div>
            </div>
          </div>
        )}

        {/* BASIC INFO */}
        <div className={`${cardClass} mb-6`}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition"
              >
                <option>0-1 Years (Junior)</option>
                <option>1-2 Years</option>
                <option>2-4 Years</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Target Domain</label>
              <select
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition"
              >
                {Object.keys(SKILL_BANK).map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SELECTED SKILLS */}
        <div className={`${cardClass} mb-6`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Your Skills ({selectedSkills.size})
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
            {Array.from(selectedSkills).map((skill, index) => {
              const color = chipColors[index % chipColors.length];
              return (
                <span
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`${color} px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 transition flex items-center gap-1.5 border shadow-sm`}
                >
                  ✓ {skill}
                  <X className="w-3.5 h-3.5 opacity-50" />
                </span>
              );
            })}
          </div>
        </div>

        {/* SKILL PICKER */}
        <div className={`${cardClass} mb-6`}>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            Skill Bank Library
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(SKILL_BANK).map(cat => (
              <button
                key={cat}
                onClick={() => setOpenCategory(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                  openCategory === cat 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_BANK[openCategory].map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition shadow-sm ${
                  selectedSkills.has(skill)
                    ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={runAssessment}
            disabled={loading || selectedSkills.size === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            {loading ? 'Running...' : 'Run Career Match'}
          </button>

          <button
            onClick={() => setShowResume(true)}
            disabled={selectedSkills.size === 0}
            className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 py-3.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" /> Build Resume
          </button>
        </div>

        {/* RESUME */}
        {showResume && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-6 overflow-hidden">
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" /> Your Resume Preview
              </h3>
              <button onClick={() => setShowResume(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="border-b-2 border-purple-600 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">{userName}</h2>
                <p className="text-sm font-medium text-purple-600 mt-1">{targetDomain} • {experienceLevel}</p>
                <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Summary</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Motivated {experienceLevel.toLowerCase()} student passionate about {targetDomain.toLowerCase()}. 
                  Skilled in {skillsArray.slice(0, 4).join(', ')}
                  {skillsArray.length > 4 ? ` and ${skillsArray.length - 4} more` : ''}. 
                  Eager to contribute and grow through internship opportunities.
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skillsArray.map((skill, index) => {
                    const color = chipColors[index % chipColors.length];
                    return (
                      <span
                        key={skill}
                        className={`${color} px-3 py-1 rounded-lg text-sm font-medium border`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Education</h4>
                <p className="text-sm font-medium text-slate-800">Bachelor's Degree (Ongoing)</p>
                <p className="text-sm text-slate-500">Your College / University</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700">
                Tip: Press Ctrl+P (or Cmd+P) to print / save as PDF.
              </div>
            </div>

            <div className="px-6 pb-6">
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
          <div className={cardClass}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-purple-600">{topScore}%</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your top match: {report.matches?.[0]?.title}</h3>
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

            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Top Career Path Matches</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {report.matches?.map((role, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-base font-semibold text-slate-900">{role.title}</h5>
                    <span className="text-sm font-bold text-purple-600">{role.matchIndex}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{role.description}</p>
                  <button
                    onClick={() => setExpandedRole(expandedRole === i ? null : i)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    {expandedRole === i ? 'Hide roadmap' : 'Explore roadmap →'}
                  </button>
                  {expandedRole === i && (
                    <ul className="mt-2 text-xs text-slate-600 space-y-1 border-t border-slate-200/60 pt-2">
                      {role.roadmap?.map((step, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-purple-500">•</span> {step}
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