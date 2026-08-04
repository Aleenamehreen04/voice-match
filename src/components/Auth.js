import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mic } from 'lucide-react';

function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    if (result.error) {
      alert(result.error.message);
    } else {
      onLogin && onLogin(result.data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Mic className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">VoiceMatch</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition placeholder:text-slate-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition placeholder:text-slate-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <p className="text-slate-500 text-center text-sm mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-purple-600 font-medium ml-2 hover:underline"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;