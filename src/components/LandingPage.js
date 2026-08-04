// src/components/LandingPage.js
import React, { useEffect } from 'react';
import { 
  Mic, 
  Sparkles, 
  Target, 
  Award, 
  MessageSquare, 
  Briefcase,
  ArrowRight,
  Star,
  Users,
  Building2,
  TrendingUp,
  Play,
  Rocket,
  Zap
} from 'lucide-react';

function LandingPage({ onStart }) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-slate-50/60">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">VoiceMatch</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition">How It Works</a>
            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition">Testimonials</a>
          </div>
          <button 
            onClick={onStart}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 via-transparent to-purple-400/8 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-6 pt-12 pb-16 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200/60 rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI-Powered Internship Prep</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4">
                Your Voice Is
                <span className="block bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  Your Resume
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-6">
                Speak your skills, get matched to real internships, and walk in prepared —
                with AI mock interviews built for exactly the role you're going for.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={onStart}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-2xl font-medium text-base transition shadow-lg shadow-purple-200 flex items-center justify-center gap-3"
                >
                  <Mic className="w-5 h-5" /> Start Voice Interview
                </button>
                <button 
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-slate-200 hover:border-purple-300 text-slate-700 px-8 py-3.5 rounded-2xl font-medium text-base transition flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" /> See How It Works
                </button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mt-8 pt-6 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">500+</span> Students</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">50+</span> Startups</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">95%</span> Match Rate</span>
                </div>
              </div>
            </div>

            {/* Hero Illustration — animated mic with pulse rings + live skill chips */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-50 rounded-3xl p-8 flex items-center justify-center border border-purple-200/30 shadow-xl shadow-purple-100/50">
                  <div className="text-center relative">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-3xl bg-purple-400/30 animate-ping" />
                      <div className="absolute inset-[-10px] rounded-3xl bg-purple-300/20 animate-pulse" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-200">
                        <Mic className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <p className="text-slate-700 font-medium text-lg">"I know React, Python, and Figma"</p>
                    <p className="text-slate-400 text-sm mt-2">AI extracts your skills in real-time</p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 border border-slate-200/60 shadow-sm">React</span>
                      <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 border border-slate-200/60 shadow-sm">Python</span>
                      <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 border border-slate-200/60 shadow-sm">Figma</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HIGHLIGHT: 4 CORE FEATURES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-purple-50/80 to-white hover:from-purple-100/80 rounded-2xl p-6 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md hover:-translate-y-0.5 animate-on-scroll opacity-0 translate-y-8"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-sm shadow-purple-200 group-hover:scale-105 transition-transform">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5 leading-tight">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Land Your First Internship
            </h2>
            <p className="text-lg text-slate-600">
              From voice interview to career advice — all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white hover:bg-purple-50/40 rounded-2xl p-8 border border-slate-200/60 hover:border-purple-200 transition-all hover:shadow-lg hover:shadow-purple-50/50 animate-on-scroll opacity-0 translate-y-8"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How VoiceMatch Works
            </h2>
            <p className="text-lg text-slate-600">
              From speaking to applying — with real prep in between.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative bg-slate-50/60 rounded-2xl p-8 border border-slate-200/60 hover:border-purple-200 transition-all hover:shadow-md animate-on-scroll opacity-0 translate-y-8"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {index + 1}
                </div>
                <div className="mt-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={onStart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-medium transition inline-flex items-center gap-2 shadow-lg shadow-purple-200"
            >
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-gradient-to-r from-purple-50/60 to-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-on-scroll opacity-0 translate-y-8">
              <div className="text-4xl font-bold text-slate-900">500+</div>
              <div className="text-sm text-slate-500 mt-1">Active Students</div>
            </div>
            <div className="animate-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '100ms' }}>
              <div className="text-4xl font-bold text-slate-900">50+</div>
              <div className="text-sm text-slate-500 mt-1">Partner Startups</div>
            </div>
            <div className="animate-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '200ms' }}>
              <div className="text-4xl font-bold text-slate-900">95%</div>
              <div className="text-sm text-slate-500 mt-1">Match Accuracy</div>
            </div>
            <div className="animate-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '300ms' }}>
              <div className="text-4xl font-bold text-slate-900">4.8★</div>
              <div className="text-sm text-slate-500 mt-1">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Students Say
            </h2>
            <p className="text-lg text-slate-600">
              Real stories from students who found their first internship through VoiceMatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 border border-slate-200/60 hover:border-purple-200 transition-all hover:shadow-md animate-on-scroll opacity-0 translate-y-8"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
            <Rocket className="w-12 h-12 text-purple-400 mx-auto mb-4 relative" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative">
              Ready to Find Your Dream Internship?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8 relative">
              Join 500+ students who found their first internship through VoiceMatch.
            </p>
            <button 
              onClick={onStart}
              className="bg-white hover:bg-slate-100 text-slate-900 px-10 py-4 rounded-2xl font-medium text-lg transition inline-flex items-center gap-2 relative"
            >
              <Mic className="w-5 h-5" /> Get Started Now
            </button>
            <p className="text-slate-400 text-sm mt-4 relative">No signup required to try it out.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">VoiceMatch</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 VoiceMatch. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition">Terms</a>
            <a href="#" className="hover:text-slate-900 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== DATA =====

// The 4 highlight cards shown right under the hero. Named for what the app
// actually does (voice-based skill extraction, not resume parsing — there's
// no resume upload/analysis feature) so the landing page doesn't promise
// something the product doesn't do.
const coreFeatures = [
  { icon: Mic, title: "Voice Skill Extraction", description: "Speak naturally — AI pulls out your real skills." },
  { icon: Zap, title: "AI Mock Interviews", description: "Practice role-specific interviews before you apply." },
  { icon: Target, title: "Internship Matching", description: "Live listings matched to your exact skill set." },
  { icon: MessageSquare, title: "Internship Advisor", description: "AI chatbot for career questions and guidance." }
];

const features = [
  { icon: Mic, title: "Voice Interview", description: "Speak naturally — AI asks 3 questions and listens to your skills." },
  { icon: Sparkles, title: "AI Skill Extraction", description: "Your skills are extracted from your speech in real-time." },
  { icon: Target, title: "Smart Matching", description: "Get matched to internships that fit your exact skills." },
  { icon: MessageSquare, title: "Internship Advisor", description: "AI chatbot that answers all your career questions." },
  { icon: Award, title: "Gamification", description: "Earn points, level up, and compete on the leaderboard." },
  { icon: Briefcase, title: "Portfolio & Profile", description: "Showcase your skills, portfolio, and interview history." }
];

const steps = [
  { icon: Mic, title: "Speak", description: "Complete the voice interview — just speak naturally about your skills." },
  { icon: Sparkles, title: "AI Extracts", description: "Your skills are detected and categorized instantly by AI." },
  { icon: Target, title: "Match", description: "Get matched to live internships that fit your exact skills." },
  { icon: Zap, title: "Mock Interview", description: "Practice with an AI-generated interview built for that exact role." },
  { icon: MessageSquare, title: "Apply", description: "Once you're prepped, apply directly on the official listing." },
  { icon: Rocket, title: "Win", description: "Earn points, level up, and climb the leaderboard." }
];

const testimonials = [
  { name: "Priya Sharma", role: "Frontend Intern at TechCorp", quote: "I found my first internship within 3 days of using VoiceMatch. The voice interview was so natural!" },
  { name: "Rahul Patel", role: "Data Analyst at DataMind", quote: "VoiceMatch helped me discover skills I didn't even know I had. The matching was spot on." },
  { name: "Sneha Reddy", role: "UI/UX Intern at DesignHub", quote: "The AI extraction was incredibly accurate. I got matched to exactly what I was looking for." }
];

export default LandingPage;