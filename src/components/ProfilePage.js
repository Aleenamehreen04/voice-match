// src/components/ProfilePage.js
import React from 'react';
import ResetMyData from './ResetMyData';
import { 
  User, 
  Award, 
  Briefcase, 
  Star, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Mail,
  Calendar,
  GitBranch
} from 'lucide-react';

function ProfilePage({ profile, skills, user, userPoints, userRank, userLevel, onRetakeInterview }) {
  const strength = profile ? calculateProfileStrength(profile, skills) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (strength / 100) * circumference;

  function calculateProfileStrength(profile, skills) {
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
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-slate-500 text-sm font-medium mt-0.5">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={onRetakeInterview}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Retake Interview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Strength */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center">
              <div className="relative w-36 h-36 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r={radius} 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="8" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round" 
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{strength}%</span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-4">Profile Strength</h3>
              <p className="text-xs text-slate-400 mt-1">Complete your profile to unlock optimal matches</p>
            </div>

            {/* Stats Cards */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="flex items-center justify-between py-3 px-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Points</span>
                <span className="text-lg font-bold text-slate-900">{userPoints}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Rank</span>
                <span className="text-lg font-bold text-slate-900">#{userRank || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-2">
                <span className="text-sm font-medium text-slate-500">Level</span>
                <span className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-0.5 rounded-full text-xs font-semibold">{userLevel || 'Beginner'}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <ResetMyData user={user} />
            </div>
          </div>
          
          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Skills */}
            {profile && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>🎯</span> Detected Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="bg-purple-50/80 text-purple-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-purple-100 shadow-2xs">
                      {s}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-slate-400 text-sm italic">Complete the voice interview to automatically detect and map your skills.</p>
                  )}
                </div>
              </div>
            )}

            {/* Profile Info */}
            {profile && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <span>📋</span> Profile Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Interest</p>
                    <p className="text-slate-900 font-semibold">{profile.projectInterest || 'Not specified'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hours/Week</p>
                    <p className="text-slate-900 font-semibold">{profile.hoursPerWeek || 'Not specified'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Expected Stipend</p>
                    <p className="text-slate-900 font-semibold text-purple-600">{profile.voiceStipend || 'Not specified'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Preference</p>
                    <p className="text-slate-900 font-semibold">{profile.workType || 'Not specified'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Duration Preference</p>
                    <p className="text-slate-900 font-semibold">{profile.commitmentDuration || 'Not specified'}</p>
                  </div>
                  {profile.portfolio && profile.portfolio !== "no" && (
                    <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-purple-50/40 border border-purple-100">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Portfolio Link</p>
                      <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1.5 transition-colors">
                        {profile.portfolio} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;