// src/components/HomePage.js
import React from 'react';
import {
  Mic,
  Brain,
  Target,
  Award,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle,
  Sparkles,
  User,
  Clock,
  ExternalLink,
  Trophy,
  Heart,
  MapPin,
  DollarSign,
  Briefcase
} from 'lucide-react';

const FONT_DISPLAY = "font-['Space_Grotesk',sans-serif]";
const FONT_BODY = "font-['Inter',sans-serif]";
const FONT_MONO = "font-['JetBrains_Mono',monospace]";

const Waveform = ({ bars = 28, className = '', barClassName = 'bg-white/70' }) => {
  const heights = Array.from({ length: bars }, (_, i) => {
    const wave = Math.sin(i * 0.7) * 0.5 + Math.cos(i * 0.35) * 0.5;
    return 22 + Math.abs(wave) * 60;
  });
  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${barClassName} vm-bar`}
          style={{
            height: `${h}%`,
            animationDelay: `${(i % 9) * 0.09}s`
          }}
        />
      ))}
    </div>
  );
};

const WaveDivider = () => (
  <div className="flex items-center gap-3 my-10" aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
    <Waveform bars={14} className="h-3" barClassName="bg-purple-400" />
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-purple-300 to-transparent" />
  </div>
);

const ProgressRing = ({ percentage, size = 84, stroke = 8 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e9d5ff" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function HomePage({
  user,
  profile,
  skills,
  userPoints = 0,
  userRank,
  userLevel = 'Beginner',
  savedGigs = [],
  appliedGigs = [],
  displayGigs = [],
  gigsSource,
  gigsSourceBanner,
  completedInterviewGigIds = new Set(),
  isAIThinking,
  onStartInterview,
  onStartMockInterview,
  onApplyNow,
  onViewSkills,
  onFindInternships,
  onViewLeaderboard,
  onViewProfile,
  onOpenAdvisor,
  toggleSave,
  setSelectedGigForModal
}) {
  const pointsToNextLevel = 150 - (userPoints % 150) || 150;
  const progressPercentage = Math.min(((userPoints % 150) / 150) * 100, 100);
  const studentName = user?.email?.split('@')[0] || 'Student';
  const displayName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

  const achievements = [
    { icon: Mic, label: 'Voice Interview', unlocked: !!profile, color: 'purple' },
    { icon: Brain, label: `${skills?.length || 0} Skills Found`, unlocked: (skills?.length || 0) > 0, color: 'blue' },
    { icon: Heart, label: `${savedGigs?.length || 0} Saved`, unlocked: (savedGigs?.length || 0) > 0, color: 'pink' },
    { icon: Sparkles, label: `${completedInterviewGigIds?.size || 0} Mock Interviews`, unlocked: completedInterviewGigIds?.size > 0, color: 'amber' },
    { icon: Trophy, label: `${appliedGigs?.length || 0} Applied`, unlocked: (appliedGigs?.length || 0) > 0, color: 'green' },
  ];

  const achievementColors = {
    purple: { bg: 'bg-purple-100/80', text: 'text-purple-800', ring: 'ring-purple-300' },
    blue: { bg: 'bg-blue-100/80', text: 'text-blue-800', ring: 'ring-blue-300' },
    pink: { bg: 'bg-pink-100/80', text: 'text-pink-800', ring: 'ring-pink-300' },
    amber: { bg: 'bg-amber-100/80', text: 'text-amber-800', ring: 'ring-amber-300' },
    green: { bg: 'bg-emerald-100/80', text: 'text-emerald-800', ring: 'ring-emerald-300' },
  };

  const gigLookup = new Map((displayGigs || []).map(g => [g.id, g]));
  const recentActivity = [
    ...(completedInterviewGigIds ? Array.from(completedInterviewGigIds) : []).map(id => ({
      type: 'interview', gigId: id, label: gigLookup.get(id)?.title || 'Mock Interview'
    })),
    ...(appliedGigs || []).map(id => ({
      type: 'applied', gigId: id, label: gigLookup.get(id)?.title || 'Internship'
    })),
    ...(savedGigs || []).map(id => ({
      type: 'saved', gigId: id, label: gigLookup.get(id)?.title || 'Internship'
    })),
  ].filter(a => a.label).slice(-5).reverse();

  const activityIcon = {
    interview: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100', text: 'Completed a mock interview for' },
    applied: { icon: ExternalLink, color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'Applied to' },
    saved: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100', text: 'Saved' },
  };

  const cardClass = `bg-white/90 backdrop-blur-xl rounded-3xl border border-purple-200/80 shadow-2xl shadow-purple-950/[0.05] p-8 ${FONT_BODY} transition-all duration-300 hover:border-purple-300`;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#faf5ff] to-[#ede9fe] ${FONT_BODY} relative overflow-x-hidden pb-16`}>
      <style>{`
        @keyframes vm-pulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.55; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .vm-bar {
          animation: vm-pulse 1.6s ease-in-out infinite;
          transform-origin: bottom;
        }
        @keyframes vm-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vm-rise { animation: vm-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      {/* AMBIENT BACKGROUND GLOW ORBS */}
      <div className="absolute top-40 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-10 w-[500px] h-[500px] bg-indigo-400/15 rounded-full blur-[150px] pointer-events-none" />

      {/* FULL-WIDTH EDGE-TO-EDGE HERO BANNER */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6] text-white shadow-2xl border-b border-purple-400/30">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Waveform bars={96} className="h-full items-center px-6" barClassName="bg-white" />
        </div>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-8 md:px-12 pt-14 pb-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="vm-rise">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 mb-4 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className={`${FONT_MONO} text-[11px] tracking-[0.2em] uppercase text-purple-100 font-semibold`}>
                  Voice-Native AI Pipeline Active
                </span>
              </div>
              <h1 className={`${FONT_DISPLAY} text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm`}>
                Welcome back, {displayName}
              </h1>
              <div className="flex items-center gap-3 mt-4">
                <Waveform bars={12} className="h-4" barClassName="bg-purple-200" />
                <p className={`${FONT_MONO} text-xs md:text-sm text-purple-100 tracking-wide font-medium`}>
                  <span className="text-white font-bold">{userPoints}</span> pts
                  <span className="text-purple-300 mx-2">•</span>
                  RANK <span className="text-white font-bold">#{userRank || '—'}</span>
                  <span className="text-purple-300 mx-2">•</span>
                  {userLevel.toString().toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onStartInterview}
              className="bg-white text-purple-950 hover:bg-purple-50 px-8 py-4 rounded-2xl text-sm font-extrabold transition-all transform hover:-translate-y-1 shadow-2xl shadow-purple-950/40 flex items-center gap-3 border border-purple-200 group"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600" />
              </span>
              <Mic className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" /> Start Voice Interview
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 relative z-10">

        {/* AI Loading State */}
        {isAIThinking && (
          <div className={`${cardClass} p-12 mb-10 text-center vm-rise`}>
            <Waveform bars={24} className="h-10 mx-auto mb-5 justify-center" barClassName="bg-purple-600" />
            <h3 className={`${FONT_DISPLAY} text-xl font-bold text-slate-900 mb-2`}>AI is analyzing your voice profile & scraping live internships...</h3>
            <p className="text-sm text-slate-500">Matching your exact skill chips to real-time opportunities from the web</p>
          </div>
        )}

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Total Points', value: userPoints, icon: Award, color: 'from-amber-400 to-amber-600' },
            { label: 'Global Rank', value: `#${userRank || '—'}`, icon: TrendingUp, color: 'from-purple-600 to-indigo-600' },
            { label: 'Saved Gigs', value: savedGigs?.length || 0, icon: Star, color: 'from-pink-500 to-rose-600' },
            { label: 'Applications', value: appliedGigs?.length || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/80 shadow-xl shadow-purple-950/[0.04] overflow-hidden group hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.color}`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${FONT_MONO} text-[11px] text-slate-500 font-bold uppercase tracking-wider`}>{stat.label}</p>
                  <p className={`${FONT_DISPLAY} text-3xl font-extrabold text-slate-900 mt-2`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg shadow-purple-950/10 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RANK & PROGRESS CARD */}
        {userRank && (
          <div className={`${cardClass} mb-10`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center">
                  <ProgressRing percentage={progressPercentage} size={96} stroke={9} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`${FONT_MONO} text-lg font-bold text-purple-800`}>#{userRank}</span>
                  </div>
                </div>
                <div>
                  <h3 className={`${FONT_DISPLAY} text-xl font-bold text-slate-900`}>Ranking & Milestone Progress</h3>
                  <p className="text-sm text-slate-600 mt-1">{userLevel} Level • {userPoints} Accumulated Points</p>
                  <p className={`${FONT_MONO} text-xs text-purple-700 mt-2 font-semibold tracking-wide bg-purple-100/70 px-3.5 py-1.5 rounded-full inline-block border border-purple-200`}>
                    ⚡ {pointsToNextLevel} pts needed to level up
                  </p>
                </div>
              </div>
              <button
                onClick={onViewLeaderboard}
                className="text-sm font-bold text-purple-800 hover:text-purple-950 flex items-center gap-2 bg-purple-100/80 hover:bg-purple-200 px-6 py-3 rounded-2xl transition border border-purple-300/60 shadow-sm"
              >
                View Full Activity <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <WaveDivider />

        {/* ACHIEVEMENTS RAIL */}
        <div className={`${cardClass} mb-10`}>
          <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 mb-5 flex items-center gap-2.5`}>
            <Trophy className="w-5 h-5 text-amber-500" /> Platform Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a, i) => {
              const colors = achievementColors[a.color];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    a.unlocked
                      ? `${colors.bg} ${colors.text} border border-transparent ring-2 ${colors.ring} shadow-md shadow-purple-950/[0.03]`
                      : 'bg-slate-100/70 text-slate-400 border border-slate-200 opacity-60'
                  }`}
                >
                  <a.icon className="w-4 h-4" />
                  {a.label}
                  {a.unlocked && <CheckCircle className="w-4 h-4 opacity-80" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT ACTIVITY TIMELINE */}
        {recentActivity.length > 0 && (
          <div className={`${cardClass} mb-10`}>
            <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5`}>
              <Clock className="w-5 h-5 text-purple-600" /> Recent Activity Stream
            </h3>
            <div className="relative flex flex-col gap-5 pl-2">
              <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-purple-200" />
              {recentActivity.map((a, i) => {
                const meta = activityIcon[a.type];
                return (
                  <div key={i} className="relative flex items-center gap-4 group">
                    <div className={`relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ring-4 ring-white ${meta.bg} shadow-md`}>
                      <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 bg-purple-50/80 px-4 py-3 rounded-2xl flex-1 border border-purple-200/60 shadow-sm">
                      {meta.text} <span className="font-extrabold text-purple-950">{a.label}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QUICK NAVIGATION GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: 'Voice Interview', icon: Mic, color: 'purple', onClick: onStartInterview },
            { label: 'Skill Profile', icon: Brain, color: 'blue', onClick: onViewSkills },
            { label: 'Gigs', icon: Target, color: 'emerald', onClick: onFindInternships },
            { label: 'User Profile', icon: User, color: 'indigo', onClick: onViewProfile },
            { label: 'AI Advisor', icon: MessageSquare, color: 'amber', onClick: onOpenAdvisor },
            { label: 'Activity Logs', icon: Award, color: 'rose', onClick: onViewLeaderboard },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="bg-white/90 backdrop-blur-xl hover:bg-white border border-purple-200/80 hover:border-purple-400 rounded-3xl p-6 text-center transition-all duration-300 group shadow-xl shadow-purple-950/[0.04] hover:shadow-2xl hover:-translate-y-1.5"
            >
              <div className={`w-12 h-12 bg-${action.color}-100/80 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-${action.color}-200 transition-all duration-300 shadow-md`}>
                <action.icon className={`w-6 h-6 text-${action.color}-700`} />
              </div>
              <span className={`text-xs font-bold text-slate-900 ${FONT_DISPLAY}`}>{action.label}</span>
            </button>
          ))}
        </div>

        {/* SKILLS CHIPS PREVIEW */}
        {skills && skills.length > 0 && (
          <div className={`${cardClass} mb-10`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 flex items-center gap-2.5`}>
                <Brain className="w-5 h-5 text-purple-700" /> Extracted Skill Spectrum
              </h3>
              <button onClick={onViewSkills} className="text-sm font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1.5 bg-purple-100/80 px-4 py-2 rounded-xl border border-purple-200 shadow-sm">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {skills.slice(0, 12).map((skill, index) => (
                <span key={index} className="bg-gradient-to-r from-purple-100/80 to-indigo-100/80 text-purple-900 px-4.5 py-2.5 rounded-2xl text-sm font-bold border border-purple-300/70 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shadow-sm" /> {skill}
                </span>
              ))}
              {skills.length > 12 && (
                <span className="text-xs font-bold text-purple-700 bg-purple-100/70 px-4 py-2.5 rounded-2xl border border-purple-200 flex items-center">
                  +{skills.length - 12} more skills
                </span>
              )}
            </div>
          </div>
        )}

        {/* LIVE MATCHED INTERNSHIPS GRID */}
        {profile && displayGigs && displayGigs.length > 0 && !isAIThinking && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`${FONT_DISPLAY} text-2xl font-bold text-slate-900 flex items-center gap-2.5`}>
                  <Target className="w-6 h-6 text-purple-700" /> Matched Live Internships
                </h3>
                <p className="text-sm text-slate-600 mt-1">Curated in real-time from web search based on your voice skill profile</p>
              </div>
              {gigsSource && gigsSourceBanner && (
                <div className={`px-4 py-2 rounded-2xl text-white text-xs font-bold shadow-md ${gigsSourceBanner[gigsSource]?.color || 'bg-purple-600'}`}>
                  {gigsSourceBanner[gigsSource]?.text}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGigs.map((gig) => {
                const isSaved = savedGigs?.includes(gig.id);
                const isApplied = appliedGigs?.includes(gig.id);
                const isInterviewCompleted = completedInterviewGigIds?.has(gig.id);

                return (
                  <div
                    key={gig.id}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl border border-purple-200/80 shadow-xl shadow-purple-950/[0.04] p-7 flex flex-col justify-between hover:border-purple-400 hover:shadow-2xl transition-all duration-300 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <span className={`${FONT_MONO} text-[10px] bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider`}>
                            {gig.level || 'Internship'}
                          </span>
                          <h4 className={`${FONT_DISPLAY} text-lg font-bold text-slate-900 mt-2.5 group-hover:text-purple-700 transition-colors`}>
                            {gig.title}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-purple-600" /> {gig.company || 'Tech Partner'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSave(gig.id)}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-sm ${
                            isSaved ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400 hover:text-pink-600 hover:bg-pink-50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-5 leading-relaxed">
                        {gig.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-6 font-medium">
                        {gig.location && (
                          <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-xl">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {gig.location}
                          </span>
                        )}
                        {gig.stipend && (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl font-bold">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {gig.stipend}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-purple-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (setSelectedGigForModal) setSelectedGigForModal(gig);
                          if (onStartMockInterview) onStartMockInterview(gig);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                          isInterviewCompleted
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isInterviewCompleted ? 'Mocked ✓' : 'Mock Interview'}
                      </button>

                      <button
                        onClick={() => onApplyNow(gig)}
                        className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                          isApplied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-950/10'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {isApplied ? 'Applied ✓' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}