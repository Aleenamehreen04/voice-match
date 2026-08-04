// src/components/ActivityPanel.js
// Self-contained — replaces the Leaderboard page. Fetches its own data
// from the applications/students tables that already exist, no new
// schema needed. Shows progress stats, a recent-activity feed, and
// milestone-based achievement badges.
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Briefcase, Mic, CheckCircle, Trophy, Sparkles,
  Award, Star, TrendingUp, Clock, ArrowUpRight
} from 'lucide-react';

const ActivityPanel = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    if (!user?.email) return;
    setLoading(true);
    const [appsRes, studentRes] = await Promise.all([
      supabase.from('applications').select('*').eq('student_email', user.email).order('applied_at', { ascending: false }),
      supabase.from('students').select('points').eq('email', user.email).maybeSingle()
    ]);
    if (appsRes.data) setApplications(appsRes.data);
    if (studentRes.data) setPoints(studentRes.data.points || 0);
    setLoading(false);
  };

  const totalApplications = applications.length;
  const interviewsCompleted = applications.filter(a => a.interview_completed).length;
  const accepted = applications.filter(a => a.status === 'accepted').length;

  const achievements = [
    { id: 'first-step', label: 'First Steps', desc: 'Applied to your first internship', icon: Briefcase, earned: totalApplications >= 1 },
    { id: 'interview-ready', label: 'Interview Ready', desc: 'Completed your first AI interview', icon: Mic, earned: interviewsCompleted >= 1 },
    { id: 'got-accepted', label: 'Got Accepted!', desc: 'Accepted for an internship', icon: CheckCircle, earned: accepted >= 1 },
    { id: 'persistent', label: 'Persistent', desc: 'Applied to 5+ internships', icon: TrendingUp, earned: totalApplications >= 5 },
    { id: 'rising-star', label: 'Rising Star', desc: 'Earned 100+ points', icon: Star, earned: points >= 100 }
  ];
  const earnedCount = achievements.filter(a => a.earned).length;

  const statusLabel = (app) => {
    if (app.interview_completed && app.status === 'accepted') return { text: 'was accepted', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (app.interview_completed && app.status === 'rejected') return { text: 'completed the interview', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (app.interview_completed) return { text: 'finished an AI interview', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    return { text: 'applied', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
        <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-500 font-medium">Syncing your activity feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Progress overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Applications</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalApplications}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Interviews Done</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{interviewsCompleted}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Accepted</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{accepted}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Points</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{points}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div> 
            Milestone Achievements
          </h3>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
            {earnedCount} of {achievements.length} Unlocked
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                a.earned 
                  ? 'bg-gradient-to-br from-purple-50/60 to-white border-purple-200/80 shadow-xs' 
                  : 'bg-slate-50/50 border-slate-200/60 opacity-60 grayscale-[30%]'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                a.earned ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <a.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{a.label}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            Recent Activity Feed
          </h3>
        </div>
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-medium text-sm">No activity recorded yet</p>
            <p className="text-slate-400 text-xs mt-1">Apply to your first internship to kickstart your journey!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 8).map(app => {
              const s = statusLabel(app);
              return (
                <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>
                      {s.text}
                    </span>
                    <p className="text-sm text-slate-700">
                      for <strong className="text-slate-900 font-semibold">{app.gig_title || 'an internship'}</strong>
                      {app.company ? <span className="text-slate-500"> at {app.company}</span> : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 flex-shrink-0 ml-4">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;