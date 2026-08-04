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
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={onRetakeInterview}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
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
          <div className="lg:col-span-1 space-y-4">
            
            {/* Profile Strength */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#7C3AED" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{strength}%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-700 mt-4">Profile Strength</h3>
              <p className="text-xs text-slate-400">Complete your profile to get better matches</p>
            </div>

            {/* Stats Cards */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                <span className="text-sm text-slate-600">Points</span>
                <span className="text-lg font-bold text-slate-900">{userPoints}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                <span className="text-sm text-slate-600">Rank</span>
                <span className="text-lg font-bold text-slate-900">#{userRank || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Level</span>
                <span className="text-lg font-bold text-purple-600">{userLevel || 'Beginner'}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
              <ResetMyData user={user} />
            </div>
          </div>
          

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Skills */}
            {profile && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">🎯 Detected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-100">
                      {s}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-slate-400 text-sm">Complete the voice interview to detect your skills.</p>
                  )}
                </div>
              </div>
            )}

            {/* Profile Info */}
            {profile && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Project Interest</p>
                      <p className="text-slate-900 font-medium">{profile.projectInterest || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Hours/Week</p>
                      <p className="text-slate-900 font-medium">{profile.hoursPerWeek || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Expected Stipend</p>
                      <p className="text-slate-900 font-medium">{profile.voiceStipend || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Work Preference</p>
                      <p className="text-slate-900 font-medium">{profile.workType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Duration Preference</p>
                      <p className="text-slate-900 font-medium">{profile.commitmentDuration || 'Not specified'}</p>
                    </div>
                    {profile.portfolio && profile.portfolio !== "no" && (
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Portfolio</p>
                        <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                          {profile.portfolio} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;