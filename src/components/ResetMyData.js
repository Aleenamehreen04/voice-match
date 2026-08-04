// src/components/ResetMyData.js
// Self-contained — drop it anywhere (Profile page or Dashboard is a good
// spot). Wipes the CURRENT user's own applications, saved gigs, and
// resets their points to 0. Useful while testing repeatedly under the
// same dev-auto-login account, so numbers don't keep climbing forever.
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2 } from 'lucide-react';

const ResetMyData = ({ user, onReset }) => {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      const { error: appErr, data: appData } = await supabase
  .from('applications')
  .delete()
  .eq('student_email', user.email)
  .select();
console.log('applications delete:', { appErr, appData });
      await supabase.from('saved_gigs').delete().eq('student_email', user.email);
      await supabase.from('students').update({ points: 0 }).eq('email', user.email);
      
    
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
      setConfirming(false);
      onReset && onReset();
      window.location.reload();
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <span className="text-xs text-red-600">Delete all your applications, saved gigs & points?</span>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded disabled:opacity-50"
        >
          {resetting ? 'Resetting...' : 'Yes, reset'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition"
      title="Reset my test data"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Reset my data
    </button>
  );
};

export default ResetMyData;