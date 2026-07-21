import { useState } from 'react';
import { supabase } from '../supabaseClient';

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
      onLogin(result.data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 to-purple-900 flex items-center justify-center p-6">
      <div className="bg-purple-900 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          VoiceMatch 🎤
        </h1>
        <h2 className="text-xl text-white mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-purple-800 text-white border border-purple-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-purple-800 text-white border border-purple-600"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-purple-900 py-3 rounded-lg font-bold hover:bg-yellow-300 transition"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>
        
        <p className="text-purple-300 text-center mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-yellow-400 ml-2 hover:underline"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;