// MOCK interview — AI-generated practice questions based on the REAL gig
// the student is preparing for (title/company/skills already stored on the
// application row, regardless of whether that gig came from live search,
// Supabase, or the hardcoded fallback). This is NOT the employer's actual
// interview and must never be presented as such. Scoring is deterministic —
// no reliance on AI judging free text, which is more reliable for a live demo.
import React, { useState, useEffect, useRef } from 'react';
import InterviewTimer from './InterviewTimer';
import InterviewEvaluation from './InterviewEvaluation';
import { generateMCQInterview } from '../services/aiService';
import { Mic, MicOff, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';

const DIFFICULTY_STYLES = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-red-50 text-red-700 border-red-200'
};

const InterviewRoom = ({ application, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [questionSource, setQuestionSource] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeUp, setTimeUp] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const [revealing, setRevealing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);

  const gig = {
    title: application?.gig_title,
    company: application?.company,
    skills: application?.gig_skills || []
  };

  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      const result = await generateMCQInterview(gig);
      setQuestions(result.questions);
      setQuestionSource(result.source);
      setLoadingQuestions(false);
    };
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kill any speech/mic activity the instant voice mode goes off — no residual audio.
  useEffect(() => {
    if (!voiceMode) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
        recognitionRef.current = null;
      }
      setListening(false);
      setLiveTranscript('');
    }
  }, [voiceMode]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (voiceMode && currentQuestion && !loadingQuestions && !interviewDone) {
      speakQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, voiceMode, loadingQuestions]);

  const speakQuestion = () => {
    if (!voiceMode || !('speechSynthesis' in window) || !currentQuestion) return;
    window.speechSynthesis.cancel();
    const optionLabels = ['A', 'B', 'C', 'D'];
    const text = `${currentQuestion.question}. ${currentQuestion.options
      .map((opt, i) => `Option ${optionLabels[i]}: ${opt}`)
      .join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  };

  const matchAnswerFromSpeech = (transcript) => {
    const map = { a: 0, b: 1, c: 2, d: 3, first: 0, second: 1, third: 2, fourth: 3, one: 0, two: 1, three: 2, four: 3 };
    for (const [word, idx] of Object.entries(map)) {
      if (transcript.includes(word)) return idx;
    }
    const idxByText = currentQuestion?.options.findIndex(opt =>
      transcript.includes(opt.toLowerCase().slice(0, 12))
    );
    return idxByText >= 0 ? idxByText : null;
  };

  // Component-level — this is the fix. It was nested inside listenForAnswer before,
  // which put it out of scope for the button that calls it.
  const toggleVoiceMode = () => {
    setVoiceMode(prev => {
      const next = !prev;
      if (!next) {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (_) {}
          recognitionRef.current = null;
        }
        setListening(false);
        setLiveTranscript('');
      }
      return next;
    });
  };

  const listenForAnswer = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice answering isn't supported in this browser — try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setListening(true);
    setLiveTranscript('');
    recognition.start();

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += chunk;
        else interim += chunk;
      }
      setLiveTranscript(final || interim);
      if (final) {
        const matched = matchAnswerFromSpeech(final.toLowerCase());
        if (matched !== null) setSelectedOption(matched);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  const selectOption = (optionIndex) => {
    if (interviewDone || revealing) return;
    setSelectedOption(optionIndex);
  };

  const buildEvaluation = (finalAnswers) => {
    const correctCount = finalAnswers.filter(a => a.correct).length;
    const total = finalAnswers.length || 1;
    const score = Math.round((correctCount / total) * 100);

    let strengths, weaknesses, readiness;
    if (score >= 80) {
      strengths = ['Strong grasp of role-specific concepts', 'Answered most questions correctly'];
      weaknesses = ['Review a few edge-case topics to sharpen further'];
      readiness = 'Strong readiness';
    } else if (score >= 50) {
      strengths = ['Solid foundational knowledge for this role'];
      weaknesses = ['Some gaps in role-specific concepts — worth reviewing before applying'];
      readiness = 'Good progress';
    } else {
      strengths = ['Completed the full practice interview'];
      weaknesses = ['This role needs more preparation — review the core required skills'];
      readiness = 'Needs more practice';
    }
    return { strengths, weaknesses, score, readiness };
  };

  const goNext = () => {
    if (revealing || selectedOption === null) return;
    setRevealing(true);
    setTimeout(() => {
      const isCorrect = selectedOption === currentQuestion?.correctIndex;
      const newAnswers = [...answers, { correct: isCorrect }];
      setAnswers(newAnswers);
      setSelectedOption(null);
      setLiveTranscript('');
      setRevealing(false);

      if (currentIndex + 1 >= questions.length) {
        finishInterview(newAnswers);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 700);
  };

  const finishInterview = (finalAnswers) => {
    setInterviewDone(true);
    setEvaluation(buildEvaluation(finalAnswers));
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleTimeUp = () => {
    if (interviewDone) return;
    setTimeUp(true);
    const remaining = questions.length - answers.length;
    const paddedAnswers = [...answers, ...Array(Math.max(remaining, 0)).fill({ correct: false })];
    finishInterview(paddedAnswers);
  };

  if (interviewDone && evaluation) {
    return <InterviewEvaluation application={application} evaluation={evaluation} onComplete={onComplete} />;
  }

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Preparing your mock interview questions...</p>
        </div>
      </div>
    );
  }

  const correctSoFar = answers.filter(a => a.correct).length;
  const difficultyKey = (currentQuestion?.difficulty || '').toLowerCase();
  const difficultyStyle = DIFFICULTY_STYLES[difficultyKey] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200/60 rounded-full px-3 py-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">
                Mock Interview — AI-generated {questionSource === 'backup' && '· practice mode'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{application?.gig_title}</h2>
            <p className="text-slate-500 text-sm">{application?.company}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <InterviewTimer duration={15} onTimeUp={handleTimeUp} />
            {answers.length > 0 && (
              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                {correctSoFar}/{answers.length} correct so far
              </span>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-2.5 mb-5">
          <p className="text-xs text-amber-800 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 flex-shrink-0" />
            This is an AI-generated mock interview for practice only — not {application?.company}'s actual interview.
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-500 text-sm">Question {currentIndex + 1} of {questions.length}</p>
          <div className="flex items-center gap-2">
            {currentQuestion?.difficulty && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${difficultyStyle}`}>
                {currentQuestion.difficulty}
              </span>
            )}
            <button
              onClick={toggleVoiceMode}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 transition ${
                voiceMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Volume2 className="w-3 h-3" /> Voice mode {voiceMode ? 'on' : 'off'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-5">
            <h3 className="text-lg font-semibold text-slate-900">{currentQuestion?.question}</h3>
            {voiceMode && (
              <button
                onClick={speakQuestion}
                title="Read question again"
                className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 flex items-center justify-center"
              >
                <Volume2 className="w-4 h-4 text-purple-600" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion?.options.map((opt, i) => {
              let stateClass = 'bg-white border-slate-200 hover:border-purple-200 text-slate-700';
              if (revealing) {
                if (i === currentQuestion.correctIndex) stateClass = 'bg-green-50 border-green-400 text-green-800';
                else if (i === selectedOption) stateClass = 'bg-red-50 border-red-400 text-red-800';
              } else if (selectedOption === i) {
                stateClass = 'bg-purple-50 border-purple-400 text-purple-800';
              }

              return (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  disabled={timeUp || revealing}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 ${stateClass} disabled:opacity-70`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    selectedOption === i ? 'border-current' : 'border-slate-300'
                  }`}>
                    {selectedOption === i && !revealing && <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                    {revealing && i === currentQuestion.correctIndex && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {voiceMode && (
            <>
              <button
                onClick={listenForAnswer}
                disabled={revealing || timeUp}
                className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition ${
                  listening ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-purple-300'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? 'Listening...' : 'Answer by voice'}
              </button>

              {/* Live transcript — the moment judges actually see "voice-native" happen */}
              {(listening || liveTranscript) && (
                <div className="mt-3 bg-slate-900 rounded-xl px-4 py-3 min-h-[44px] flex items-center">
                  <p className="text-sm text-slate-100 font-mono">
                    {liveTranscript || <span className="text-slate-500">Listening…</span>}
                    {listening && <span className="inline-block w-1.5 h-4 bg-purple-400 ml-1 align-middle animate-pulse" />}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={goNext}
          disabled={selectedOption === null || timeUp || revealing}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {revealing ? 'Checking...' : currentIndex + 1 >= questions.length ? 'Finish Mock Interview' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;