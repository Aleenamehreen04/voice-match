// src/components/ActivityPanel.js
// Self-contained — replaces the Leaderboard page. Fetches its own data
// from the applications/students tables that already exist, no new
// schema needed. Shows progress stats, a recent-activity feed, and
// milestone-based achievement badges.
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Briefcase, Mic, CheckCircle, Trophy, Sparkles,
  Award, Star, TrendingUp, Clock
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
    if (app.interview_completed && app.status === 'accepted') return { text: 'was accepted', color: 'text-green-600' };
    if (app.interview_completed && app.status === 'rejected') return { text: 'completed the interview', color: 'text-slate-500' };
    if (app.interview_completed) return { text: 'finished an AI interview', color: 'text-purple-600' };
    return { text: 'applied', color: 'text-slate-500' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200/60">
        <div className="animate-pulse text-slate-400">Loading your activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Progress overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Applications</p>
              <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Interviews Done</p>
              <p className="text-2xl font-bold text-slate-900">{interviewsCompleted}</p>
            </div>
            <Mic className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{accepted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Points</p>
              <p className="text-2xl font-bold text-yellow-600">{points}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" /> Achievements
          </h3>
          <span className="text-sm text-slate-500">{earnedCount} of {achievements.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                a.earned ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.earned ? 'bg-purple-600' : 'bg-slate-300'}`}>
                <a.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" /> Recent Activity
          </h3>
        </div>
        {applications.length === 0 ? (
          <div className="p-10 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No activity yet — apply to your first internship to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 8).map(app => {
              const s = statusLabel(app);
              return (
                <div key={app.id} className="px-6 py-3 flex items-center justify-between">
                  <p className="text-sm text-slate-700">
                    You <span className={`font-medium ${s.color}`}>{s.text}</span> for <strong>{app.gig_title || 'an internship'}</strong>
                    {app.company ? ` at ${app.company}` : ''}
                  </p>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
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