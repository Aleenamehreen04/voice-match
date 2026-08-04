// src/components/HomePage.js
import React from 'react';
import { 
  Mic, 
  Brain, 
  Target, 
  Award, 
  MessageSquare, 
  Briefcase,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle,
  Sparkles,
  User,
  Clock,
  Lock,
  ExternalLink,
  Trophy,
  Heart
} from 'lucide-react';

const ProgressRing = ({ percentage, size = 84, stroke = 8 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
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

function HomePage({ 
  user, 
  profile, 
  skills, 
  userPoints, 
  userRank, 
  userLevel, 
  savedGigs, 
  appliedGigs,
  displayGigs,
  gigsSource,
  gigsSourceBanner,
  completedInterviewGigIds,
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
  const progressPercentage = Math.min((userPoints % 150) / 150 * 100, 100);
  const studentName = user?.email?.split('@')[0] || 'Student';
  const displayName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

  const achievements = [
    { icon: Mic, label: 'Voice Interview', unlocked: !!profile, color: 'purple' },
    { icon: Brain, label: `${skills?.length || 0} Skills Found`, unlocked: (skills?.length || 0) > 0, color: 'blue' },
    { icon: Heart, label: `${savedGigs?.length || 0} Saved`, unlocked: (savedGigs?.length || 0) > 0, color: 'pink' },
    { icon: Sparkles, label: `${completedInterviewGigIds?.size || 0} Mock Interviews`, unlocked: (completedInterviewGigIds?.size || 0) > 0, color: 'amber' },
    { icon: Trophy, label: `${appliedGigs?.length || 0} Applied`, unlocked: (appliedGigs?.length || 0) > 0, color: 'green' },
  ];

  const achievementColors = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
  };

  const gigLookup = new Map((displayGigs || []).map(g => [g.id, g]));
  const recentActivity = [
    ...(completedInterviewGigIds ? Array.from(completedInterviewGigIds) : []).map(id => ({
      type: 'interview', gigId: id, label: gigLookup.get(id)?.title
    })),
    ...(appliedGigs || []).map(id => ({
      type: 'applied', gigId: id, label: gigLookup.get(id)?.title
    })),
    ...(savedGigs || []).map(id => ({
      type: 'saved', gigId: id, label: gigLookup.get(id)?.title
    })),
  ].filter(a => a.label).slice(-5).reverse();

  const activityIcon = {
    interview: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', text: 'Completed a mock interview for' },
    applied: { icon: ExternalLink, color: 'text-emerald-600', bg: 'bg-emerald-50', text: 'Applied to' },
    saved: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', text: 'Saved' },
  };

  const cardClass = "bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6";

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {displayName}!
              </h1>
              <p className="text-purple-100 text-sm mt-1.5">
                <span className="font-semibold text-white">{userPoints}</span> points • Rank #{userRank || '—'} • {userLevel || 'Beginner'} Level
              </p>
            </div>
            <button 
              onClick={onStartInterview}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 border border-white/10"
            >
              <Mic className="w-4 h-4" /> Start Voice Interview
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* AI Loading */}
        {isAIThinking && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-10 mb-8 text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Analyzing your profile...</h3>
            <p className="text-sm text-slate-500">Finding the best internship matches for your skills</p>
            <div className="w-40 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Points', value: userPoints, icon: Award, color: 'yellow' },
            { label: 'Rank', value: `#${userRank || '—'}`, icon: TrendingUp, color: 'purple' },
            { label: 'Saved', value: savedGigs?.length || 0, icon: Star, color: 'pink' },
            { label: 'Applied', value: appliedGigs?.length || 0, icon: CheckCircle, color: 'green' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rank Card */}
        {userRank && (
          <div className={`${cardClass} mb-8`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <ProgressRing percentage={progressPercentage} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-700">#{userRank}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Rank</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{userLevel || 'Beginner'} Level • {userPoints} points</p>
                  <p className="text-xs text-slate-400 mt-1">{pointsToNextLevel} pts to next level</p>
                </div>
              </div>
              <button 
                onClick={onViewLeaderboard}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                View Activity <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className={`${cardClass} mb-8`}>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Achievements
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {achievements.map((a, i) => {
              const colors = achievementColors[a.color];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${
                    a.unlocked
                      ? `${colors.bg} ${colors.text}`
                      : 'bg-slate-50 text-slate-300'
                  }`}
                >
                  <a.icon className="w-4 h-4" />
                  {a.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className={`${cardClass} mb-8`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
            </h3>
            <div className="flex flex-col gap-3">
              {recentActivity.map((a, i) => {
                const meta = activityIcon[a.type];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                      <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <p className="text-sm text-slate-600">
                      {meta.text} <span className="font-medium text-slate-800">{a.label}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Interview', icon: Mic, color: 'purple', onClick: onStartInterview },
            { label: 'Skills', icon: Brain, color: 'blue', onClick: onViewSkills },
            { label: 'Gigs', icon: Target, color: 'green', onClick: onFindInternships },
            { label: 'Profile', icon: User, color: 'indigo', onClick: onViewProfile },
            { label: 'Advisor', icon: MessageSquare, color: 'amber', onClick: onOpenAdvisor },
            { label: 'Activity', icon: Award, color: 'yellow', onClick: onViewLeaderboard },
          ].map((action, i) => (
            <button 
              key={i}
              onClick={action.onClick} 
              className="bg-white hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-2xl p-5 text-center transition group shadow-sm"
            >
              <div className={`w-10 h-10 bg-${action.color}-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-${action.color}-100 transition`}>
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className={`${cardClass} mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Your Skills</h3>
              <button onClick={onViewSkills} className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 10).map((skill, index) => (
                <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-sm font-medium border border-purple-100">
                  ✓ {skill}
                </span>
              ))}
              {skills.length > 10 && (
                <span className="text-xs text-slate-400 px-3 py-1.5">+{skills.length - 10} more</span>
              )}
            </div>
          </div>
        )}

        {/* Gig Cards */}
        {profile && displayGigs && !isAIThinking && (
          <div>
            {gigsSource && gigsSourceBanner && (
              <div className={`mb-4 px-4 py-2 rounded-xl text-white text-sm font-medium inline-block ${gigsSourceBanner[gigsSource]?.color || 'bg-purple-600'}`}>
                {gigsSourceBanner[gigsSource]?.text}
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGigs.length > 0 ? (
                displayGigs.map(gig => {
                  const isSaved = savedGigs?.includes(gig.id);
                  const isApplied = appliedGigs?.includes(gig.id);
                  const isPrepped = completedInterviewGigIds?.has(gig.id);
                  const matchScore = gig.matchScore || 75;
                  const skillMatchCount = gig.skillMatchCount || 0;
                  const companyInitial = gig.company?.charAt(0) || '?';
                  const whyRecommended = skillMatchCount > 0
                    ? `Matches ${skillMatchCount} of your skills`
                    : 'Good match for your profile';

                  return (
                    <div
                      key={gig.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {companyInitial}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 leading-snug">
                              {gig.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">{gig.company}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSave?.(gig.id)}
                          className={`text-xl transition ${isSaved ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                        >
                          {isSaved ? '❤️' : '🤍'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-700">{matchScore}%</span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Match Score</p>
                            <p className="text-sm font-medium text-purple-700">{whyRecommended}</p>
                          </div>
                        </div>
                        {skillMatchCount > 0 && (
                          <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-xl">
                            {skillMatchCount} skills
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{gig.duration}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg ${
                          gig.difficulty === 'Beginner' ? 'bg-green-50 text-green-700' :
                          gig.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {gig.difficulty}
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg">{gig.category}</span>
                      </div>

                      <p className="text-sm font-semibold text-purple-600 mb-3">{gig.stipend}</p>

                      {gig.skills && gig.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {gig.skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                              {skill}
                            </span>
                          ))}
                          {gig.skills.length > 4 && (
                            <span className="text-xs text-slate-400">+{gig.skills.length - 4}</span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => onStartMockInterview?.(gig)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isPrepped ? 'Retake Mock' : 'Mock Interview'}
                        </button>
                        <button
                          onClick={() => setSelectedGigForModal?.(gig)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                          Details
                        </button>
                      </div>

                      {isApplied ? (
                        <div className="w-full bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Applied
                        </div>
                      ) : (
                        <button
                          onClick={() => onApplyNow?.(gig)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
                        >
                          {isPrepped ? <ExternalLink className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          Apply Now
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3">
                  <div className={`${cardClass} text-center py-12`}>
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No internships found</h3>
                    <p className="text-sm text-slate-400">Click "Find Internships" to search with AI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;