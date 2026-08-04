// src/components/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Star,
  ArrowRight,
  Sparkles,
  Mic
} from 'lucide-react';

function StudentDashboard({ user, onStartInterview }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0
  });

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user?.email) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('student_email', user.email)
      .order('applied_at', { ascending: false });
    
    if (!error && data) {
      setApplications(data);
      const pending = data.filter(a => a.status === 'pending').length;
      const accepted = data.filter(a => a.status === 'accepted').length;
      const rejected = data.filter(a => a.status === 'rejected').length;
      const completed = data.filter(a => a.interview_completed === true).length;
      setStats({
        total: data.length,
        pending,
        accepted,
        rejected,
        completed
      });
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200/60">
        <div className="animate-pulse text-slate-400">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Your Applications</h3>
          <span className="text-sm text-slate-500">{applications.length} total</span>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-700 mb-2">No applications yet</h4>
            <p className="text-slate-400 text-sm mb-4">
              Start applying to internships to see them here.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
            >
              Find Internships <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/60">
            {applications.map((app) => {
              const status = app.status || 'pending';
              return (
                <div key={app.id} className="px-6 py-4 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-semibold text-slate-900">
                          {app.gig_title || 'Internship'}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(status)}`}>
                          {getStatusIcon(status)}
                          {getStatusText(status)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mt-1">
                        {app.company || 'Company'} • {app.stipend || 'Stipend not specified'}
                      </p>
                      {app.gig_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.gig_skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {app.gig_skills.length > 4 && (
                            <span className="text-slate-400 text-xs">+{app.gig_skills.length - 4} more</span>
                          )}
                        </div>
                      )}
                      <p className="text-slate-400 text-xs mt-2">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      {/* ✅ This is the fixed part */}
                      {(status === 'accepted' || status === 'pending') && !app.interview_completed && (
                        <button
                          onClick={() => onStartInterview?.(app)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                          <Mic className="w-4 h-4" /> Start Interview
                        </button>
                      )}
                      {status === 'accepted' && app.interview_completed && (
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Interview Done
                        </span>
                      )}
                      {status === 'pending' && app.interview_completed && (
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Interview Done
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="bg-red-50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Not Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      {applications.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-700">💡 Pro Tip</h4>
              <p className="text-purple-600 text-sm mt-1">
                {stats.pending > 0 
                  ? `You have ${stats.pending} pending applications. Keep applying to increase your chances! 🚀`
                  : stats.accepted > 0 
                  ? `🎉 You have ${stats.accepted} accepted applications! Start your interviews!`
                  : "Keep applying to internships — your next opportunity is waiting!"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;