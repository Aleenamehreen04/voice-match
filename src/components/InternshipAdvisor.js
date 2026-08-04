// src/components/InternshipAdvisor.js
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Bot, Mic, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateCareerMatchReport } from '../services/aiService';

function InternshipAdvisor({ transcript, skills, profile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const [apiKey] = useState(process.env.REACT_APP_OPENROUTER_API_KEY || '');

  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [careerMatches, setCareerMatches] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadPersonalContext = async () => {
      setContextLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email;

        if (email) {
          const { data: recentApps, error } = await supabase
            .from('applications')
            .select('gig_title, company, evaluation, interview_completed')
            .eq('student_email', email)
            .eq('interview_completed', true)
            .order('id', { ascending: false })
            .limit(1);

          if (!error && recentApps && recentApps.length > 0) {
            setLastEvaluation({
              gigTitle: recentApps[0].gig_title,
              company: recentApps[0].company,
              ...recentApps[0].evaluation
            });
          }
        }
      } catch (err) {
        console.warn('Could not load recent evaluation:', err.message);
      }

      try {
        if (skills && skills.length > 0) {
          const report = await generateCareerMatchReport(profile, skills);
          setCareerMatches(report?.matches?.slice(0, 3) || null);
        }
      } catch (err) {
        console.warn('Could not compute career match:', err.message);
      }

      setContextLoading(false);
    };
    loadPersonalContext();
  }, []);

  useEffect(() => {
    if (contextLoading) return;

    let intro = `Welcome to Internship Advisor.\n\nI'm your AI career counselor.`;

    if (lastEvaluation?.score !== undefined) {
      intro += ` I looked at your last interview for ${lastEvaluation.gigTitle || 'a recent role'} at ${lastEvaluation.company || 'that company'} — you scored ${lastEvaluation.score}%.`;
      if (lastEvaluation.weaknesses?.length > 0) {
        intro += ` One thing worth working on: ${lastEvaluation.weaknesses[0]}`;
      }
    }

    if (careerMatches?.length > 0) {
      const top = careerMatches[0];
      intro += `\n\nBased on your current skills, you're at ${top.matchIndex}% match for ${top.title}.`;
    }

    intro += `\n\nAsk me anything — internships, skills, companies, or how to close the gaps above.`;

    setMessages([{ role: 'ai', content: intro }]);
  }, [contextLoading, lastEvaluation, careerMatches]);

  const getFallbackResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('score') || lower.includes('how did i do') || lower.includes('performance') || lower.includes('interview result')) {
      if (lastEvaluation?.score !== undefined) {
        return `Your Last Interview\n\n${lastEvaluation.gigTitle || 'Role'} at ${lastEvaluation.company || 'Company'} — Score: ${lastEvaluation.score}%\n\nStrengths:\n${(lastEvaluation.strengths || []).map(s => `• ${s}`).join('\n') || '• Not recorded'}\n\nAreas to work on:\n${(lastEvaluation.weaknesses || []).map(w => `• ${w}`).join('\n') || '• Not recorded'}\n\nWant tips on closing any of these gaps specifically?`;
      }
      return `You haven't completed an interview yet, so I don't have a score to show you. Apply to a gig and complete the interview — then I can give you specific feedback here.`;
    }

    if (lower.includes('match') || lower.includes('which role') || lower.includes('best fit') || lower.includes('what role')) {
      if (careerMatches?.length > 0) {
        return `Your Career Match\n\n${careerMatches.map(m => `• ${m.title} — ${m.matchIndex}% match\n  ${m.roadmap?.[0] || ''}`).join('\n\n')}\n\nWant a learning path for any of these?`;
      }
      return `Complete the voice interview first so I can detect your skills — then I can show you exactly which roles you match best and what's missing.`;
    }

    if (lower.includes('internship') || lower.includes('find') || lower.includes('opportunity')) {
      return `Internship Opportunities

Based on your profile, here are some common internship areas:

${skills?.length > 0 ? `Your Skills: ${skills.join(', ')}` : 'Complete the voice interview to detect your skills.'}

Top internship fields for you:
• Software Development Intern
• Web Development Intern
• Data Analyst Intern
• UI/UX Design Intern
• Digital Marketing Intern

How to find more:
1. Complete your profile with the voice interview
2. Click "Find Internships" on the home page
3. Check job portals like Internshala, LinkedIn, and Naukri

Start applying early. Most internships fill up within 2-3 weeks.`;
    }

    if (lower.includes('company') || lower.includes('google') || lower.includes('microsoft') || lower.includes('amazon')) {
      return `Company Insights

Top Tech Companies for Interns:

1. Google — Great culture, high stipends, strong mentorship
2. Microsoft — Excellent work-life balance, global opportunities
3. Amazon — Fast-paced learning, hands-on experience
4. Flipkart — Great for product roles
5. Swiggy/Zomato — Startup culture

Tips:
• Apply 3-4 months before the internship starts
• Build projects to showcase your skills
• Use LinkedIn to connect with recruiters`;
    }

    if (lower.includes('react') || lower.includes('skill') || lower.includes('learn')) {
      return `Skill Advice

React is a great choice. Here's a simple learning path:

1. JavaScript basics (ES6+)
2. React fundamentals (components, props, state)
3. Hooks (useState, useEffect)
4. React Router
5. Build 2-3 projects and host them

Many startups hire React interns. Build projects and put them on GitHub.`;
    }

    if (lower.includes('voicematch') || lower.includes('app') || lower.includes('how does')) {
      return `About VoiceMatch

VoiceMatch is a voice-based internship matching platform for freshers.

Key Features:
• Voice Interview — Speak your skills naturally
• AI Skill Extraction
• Smart Matching
• Points & Leaderboard
• Profile & Portfolio

Just complete the voice interview and start applying.`;
    }

    return `Career Advice

I can help you with:
• Your last interview performance and score
• Which roles you match best right now
• Internship opportunities
• Company information
• Skill development

Try asking:
• "How did I do in my last interview?"
• "Which role am I the best match for?"
• "Find internships for me"`;
  };

  const callAI = async (userMessage) => {
    if (!apiKey) {
      return { content: getFallbackResponse(userMessage), fromFallback: true };
    }

    try {
      const evalContext = lastEvaluation?.score !== undefined
        ? `Their most recent interview was for "${lastEvaluation.gigTitle}" at ${lastEvaluation.company}. Score: ${lastEvaluation.score}%. Strengths: ${(lastEvaluation.strengths || []).join('; ') || 'none recorded'}. Weaknesses: ${(lastEvaluation.weaknesses || []).join('; ') || 'none recorded'}.`
        : 'They have not completed an interview yet.';

      const matchContext = careerMatches?.length > 0
        ? `Their current top role matches: ${careerMatches.map(m => `${m.title} (${m.matchIndex}% match, missing: ${m.roadmap?.join(', ') || 'nothing'})`).join(' | ')}.`
        : 'No career match data available yet — they may not have detected skills.';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VoiceMatch'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-nano-9b-v2:free',
          messages: [
            {
              role: 'system',
              content: `You are Internship Advisor for VoiceMatch, a personal career counselor who already knows this specific student's real data below. ALWAYS reference their actual score, strengths, weaknesses, or match percentages by name when relevant to their question — never give generic advice that could apply to anyone. If they ask something unrelated to their data, answer normally but still stay warm and specific. Keep responses under 300 words.

Student context:
- Skills: ${skills?.join(', ') || 'Not detected yet'}
- Project Interest: ${profile?.projectInterest || 'Not specified'}
- ${evalContext}
- ${matchContext}`
            },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.status === 429 || !response.ok) {
        return { content: getFallbackResponse(userMessage), fromFallback: true };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return { content, fromFallback: false };
      return { content: getFallbackResponse(userMessage), fromFallback: true };
    } catch (error) {
      return { content: getFallbackResponse(userMessage), fromFallback: true };
    }
  };

  const handleSendMessage = async (message) => {
    const userMessage = message || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const { content, fromFallback } = await callAI(userMessage);
      setMessages(prev => [...prev, { role: 'ai', content, fromFallback }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: getFallbackResponse(userMessage),
        fromFallback: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported!');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setIsListening(false);
      handleSendMessage(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      alert('Could not hear you. Please try again.');
    };
    recognition.start();
  };

  const quickPrompts = [
    'How did I do in my last interview?',
    'Which role am I the best match for?',
    'Find internships for me'
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-slate-900">Internship Advisor</h1>
            </div>
            <button
              onClick={onBack}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col flex-1">

        {/* ===== ANALYZING LOADING SCREEN ===== */}
        {contextLoading && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-10 mb-6 text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Analyzing your profile...</h3>
            <p className="text-slate-500 text-sm">Loading your interview history & career matches</p>
            <div className="w-40 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        )}

        {/* Chat Box */}
        {!contextLoading && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex-1 overflow-y-auto mb-6 flex flex-col gap-3 min-h-[420px] max-h-[55vh]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-purple-600 font-semibold text-xs">Advisor</span>
                      {msg.fromFallback && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          backup
                        </span>
                      )}
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 px-4 py-2.5 rounded-2xl rounded-bl-none text-sm flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  Advisor is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick prompts */}
        {!contextLoading && (
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => handleSendMessage(p)}
                disabled={loading}
                className="text-xs bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-3 py-1.5 rounded-full transition disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {!contextLoading && (
          <div className="flex gap-3 items-center">
            <button
              onClick={startVoiceInput}
              disabled={loading || isListening}
              className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
              } disabled:opacity-50`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder={isListening ? 'Listening...' : 'Ask about internships, skills, companies...'}
              className="flex-1 p-3.5 rounded-xl bg-white text-slate-800 border border-slate-200 focus:outline-none focus:border-purple-400 transition disabled:opacity-50"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InternshipAdvisor;