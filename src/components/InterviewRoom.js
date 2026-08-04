// src/components/InterviewRoom.js
import React, { useState, useEffect } from 'react';
import InterviewTimer from './InterviewTimer';
import InterviewEvaluation from './InterviewEvaluation';
import { generateMCQInterview } from '../services/aiService';
import { Mic, CheckCircle2, Sparkles } from 'lucide-react';

// MOCK interview — AI-generated practice questions based on the REAL gig
// the student is preparing for (title/company/skills already stored on the
// application row, regardless of whether that gig came from live search,
// Supabase, or the hardcoded fallback). This is NOT the employer's actual
// interview and must never be presented as such. Scoring is deterministic —
// no reliance on AI judging free text, which is more reliable for a live demo.
const InterviewRoom = ({ application, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [questionSource, setQuestionSource] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // { correct: boolean }
  const [timeUp, setTimeUp] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

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

  const selectOption = (optionIndex) => {
    if (interviewDone) return;
    setSelectedOption(optionIndex);
  };

  const buildEvaluation = (finalAnswers) => {
    const correctCount = finalAnswers.filter(a => a.correct).length;
    const total = finalAnswers.length || 1;
    const score = Math.round((correctCount / total) * 100);

    // Readiness-style feedback — this is prep guidance, never a hire/reject
    // decision. The employer never sees this; it's for the student only.
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
    const isCorrect = selectedOption === questions[currentIndex]?.correctIndex;
    const newAnswers = [...answers, { correct: isCorrect }];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 >= questions.length) {
      finishInterview(newAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const finishInterview = (finalAnswers) => {
    setInterviewDone(true);
    setEvaluation(buildEvaluation(finalAnswers));
  };

  const handleTimeUp = () => {
    if (interviewDone) return;
    setTimeUp(true);
    // Score whatever was answered so far; unanswered questions count as incorrect.
    const remaining = questions.length - answers.length;
    const paddedAnswers = [...answers, ...Array(Math.max(remaining, 0)).fill({ correct: false })];
    finishInterview(paddedAnswers);
  };

  if (interviewDone && evaluation) {
    return (
      <InterviewEvaluation
        application={application}
        evaluation={evaluation}
        onComplete={onComplete}
      />
    );
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

  const currentQuestion = questions[currentIndex];

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
          <InterviewTimer duration={15} onTimeUp={handleTimeUp} />
        </div>

        {/* Explicit disclaimer so this is never mistaken for the real employer interview */}
        <div className="bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-2.5 mb-5">
          <p className="text-xs text-amber-800 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 flex-shrink-0" />
            This is an AI-generated mock interview for practice only — not {application?.company}'s actual interview.
          </p>
        </div>

        <p className="text-slate-500 text-sm mb-3">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">{currentQuestion?.question}</h3>
          <div className="space-y-3">
            {currentQuestion?.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectOption(i)}
                disabled={timeUp}
                className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 ${
                  selectedOption === i
                    ? 'bg-purple-50 border-purple-400 text-purple-800'
                    : 'bg-white border-slate-200 hover:border-purple-200 text-slate-700'
                } disabled:opacity-50`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedOption === i ? 'border-purple-500' : 'border-slate-300'
                }`}>
                  {selectedOption === i && <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={selectedOption === null || timeUp}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {currentIndex + 1 >= questions.length ? 'Finish Mock Interview' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;