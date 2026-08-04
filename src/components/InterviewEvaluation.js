// src/components/InterviewEvaluation.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle, TrendingUp, Award, ArrowLeft, ExternalLink } from 'lucide-react';
import { getApplicationUrl } from '../utils/applyLink';

// Static class strings — Tailwind's build-time scanner can't see
// dynamically constructed class names (e.g. `bg-${color}-50`), so each
// readiness tier gets its own fully-written class set.
const readinessCopy = {
  'Strong readiness': {
    icon: CheckCircle,
    heading: 'You look ready 🎉',
    body: 'Your answers show a strong grasp of what this role needs. You should feel good about applying.',
    wrapClass: 'bg-green-50 border border-green-200',
    iconClass: 'text-green-600',
    headingClass: 'text-green-700'
  },
  'Good progress': {
    icon: TrendingUp,
    heading: 'Good progress — a bit more prep helps',
    body: 'You have a solid foundation. Reviewing the gaps below before you apply will help you go in stronger.',
    wrapClass: 'bg-amber-50 border border-amber-200',
    iconClass: 'text-amber-600',
    headingClass: 'text-amber-700'
  },
  'Needs more practice': {
    icon: TrendingUp,
    heading: 'Keep practicing',
    body: 'This role needs more prep. Review the core skills below — you can retake this mock interview anytime.',
    wrapClass: 'bg-orange-50 border border-orange-200',
    iconClass: 'text-orange-600',
    headingClass: 'text-orange-700'
  }
};

const InterviewEvaluation = ({ application, evaluation, onComplete }) => {
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const readiness = readinessCopy[evaluation?.readiness] || readinessCopy['Good progress'];
  const ReadinessIcon = readiness.icon;
  const applicationUrl = getApplicationUrl(application);

  useEffect(() => {
    saveEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saves the mock interview result as PREP data only — never touches a
  // real hiring status. interview_completed is what unlocks Apply Now on
  // the internship card (soft gate).
  const saveEvaluation = async () => {
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          evaluation: evaluation,
          interview_completed: true
        })
        .eq('id', application.id);

      if (updateError) {
        console.error('Supabase update failed:', updateError);
        setSaveFailed(true);
      }
    } catch (err) {
      console.error('Failed to save evaluation:', err);
      setSaveFailed(true);
    } finally {
      setSaving(false);
      setSaved(true);
    }
  };

  const handleApplyNow = () => {
    window.open(applicationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Mock Interview Results</h3>
          <p className="text-slate-500 text-sm mt-1">
            {application?.gig_title} at {application?.company}
          </p>
          <p className="text-xs text-slate-400 mt-1">AI-generated practice feedback — not an employer decision</p>
        </div>

        {/* Score */}
        <div className="bg-slate-50 rounded-xl p-5 text-center mb-6">
          <p className="text-sm text-slate-500 mb-1">Your Score</p>
          <p className="text-4xl font-bold text-purple-600">{evaluation?.score || 0}%</p>
        </div>

        {/* Readiness (prep feedback, not hire/reject) */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${readiness.wrapClass}`}>
          <ReadinessIcon className={`w-6 h-6 flex-shrink-0 ${readiness.iconClass}`} />
          <div>
            <p className={`font-semibold ${readiness.headingClass}`}>{readiness.heading}</p>
            <p className="text-sm text-slate-500">{readiness.body}</p>
          </div>
        </div>

        {/* Strengths */}
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-green-600 mb-2">💪 Strengths</h4>
          <ul className="space-y-1.5">
            {evaluation?.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✅</span> {s}
              </li>
            )) || <li className="text-sm text-slate-400">—</li>}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-orange-500 mb-2">🌱 Room to Grow</h4>
          <ul className="space-y-1.5">
            {evaluation?.weaknesses?.map((w, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span> {w}
              </li>
            )) || <li className="text-sm text-slate-400">—</li>}
          </ul>
        </div>

        {/* Status message */}
        <div className="text-center text-sm mb-5">
          {saving && <p className="text-slate-500">Saving your result...</p>}
          {saved && (
            <p className={saveFailed ? 'text-red-500' : 'text-slate-400'}>
              {saveFailed
                ? '⚠️ Could not save your result — check your Supabase table setup.'
                : 'Result saved to your profile.'}
            </p>
          )}
        </div>

        {/* Apply Now — clearly separated as the OFFICIAL, external step */}
        <button
          onClick={handleApplyNow}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 mb-3"
        >
          <ExternalLink className="w-4 h-4" />
          Apply Now — Official Application
        </button>

        <button
          onClick={() => onComplete && onComplete()}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default InterviewEvaluation;