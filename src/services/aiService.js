// src/services/aiService.js

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'nvidia/nemotron-nano-9b-v2:free',
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free'
];

export const SKILLS_LIST = [
  "React", "JavaScript", "Python", "UI Design", "Figma", "CSS", "HTML", "Node.js",
  "Java", "C++", "Machine Learning", "Data Analysis", "SQL", "Marketing",
  "Content Writing", "Social Media", "SEO", "Graphic Design", "Photoshop",
  "Video Editing", "Business", "Presentations", "Research", "Communication",
  "Leadership", "Problem Solving", "Web Development", "App Development",
  "Flutter", "Firebase", "MongoDB", "Git"
];

const keywordExtractSkills = (text) => {
  const lower = (text || '').toLowerCase();
  return SKILLS_LIST.filter(skill => lower.includes(skill.toLowerCase()));
};

const callWithFallback = async (messages, maxTokens, temperature) => {
  if (!OPENROUTER_API_KEY) {
    console.warn('No OpenRouter API key set — skipping AI call, using fallback.');
    return null;
  }

  for (const model of MODELS) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'VoiceMatch'
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens })
      });

      if (response.status === 429) {
        console.warn(`Rate limited: ${model}, trying next model...`);
        continue;
      }

      if (!response.ok) {
        console.error(`${model} error:`, response.status);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        console.log(`✅ Model ${model} worked`);
        return content;
      }
    } catch (err) {
      console.warn(`${model} failed:`, err.message);
    }
  }
  return null;
};

const safeParseJSON = (text) => {
  if (!text) return null;
  try {
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('JSON parse failed:', e.message);
    try {
      const skillsMatch = text.match(/"skills"\s*:\s*\[([^\]]*)\]/);
      if (skillsMatch) {
        const skills = skillsMatch[1].split(',').map(s =>
          s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
        ).filter(Boolean);
        return { skills, category: null };
      }
    } catch (regexError) {}
    return null;
  }
};

// ============================================================
// 1. EXTRACT SKILLS
// ============================================================
export const extractSkillsWithAI = async (transcript) => {
  const content = await callWithFallback([
    { role: 'system', content: 'Extract skills. Return ONLY JSON: {"skills":["skill1","skill2"],"category":"Category"}' },
    { role: 'user', content: transcript }
  ], 150, 0.3);
  return safeParseJSON(content) || { skills: [], category: null };
};

export const extractSkillsHybrid = async (transcript) => {
  const keywordSkills = keywordExtractSkills(transcript);
  let ai = null;
  try {
    ai = await extractSkillsWithAI(transcript);
  } catch (e) {
    console.warn('AI skill extraction failed:', e.message);
  }

  const aiSkills = Array.isArray(ai?.skills) ? ai.skills : [];
  const merged = Array.from(new Set([...aiSkills, ...keywordSkills]));

  let source = 'none';
  if (aiSkills.length > 0 && keywordSkills.length > 0) source = 'ai+backup';
  else if (aiSkills.length > 0) source = 'ai';
  else if (keywordSkills.length > 0) source = 'backup';

  return {
    skills: merged,
    category: ai?.category || null,
    source
  };
};

// ============================================================
// 2. SEARCH REAL INTERNSHIPS (Serper)
// ============================================================
// Tries to find a real stipend figure inside the search result's own
// title/snippet text (e.g. "₹15,000/month" or "15000 per month"). Only
// falls back to a randomized plausible estimate if nothing real is
// found — and that estimate is honestly labeled "Est." rather than
// pretending to be a real number pulled from the listing.
const extractStipend = (text) => {
  const rupeeMatch = text.match(/₹\s?[\d,]{4,7}/);
  if (rupeeMatch) {
    const clean = rupeeMatch[0].replace(/\s/g, '');
    return `${clean}/month`;
  }
  const numberMatch = text.match(/[\d,]{4,6}\s?(?:per month|\/month|a month|INR)/i);
  if (numberMatch) return `₹${numberMatch[0]}`.replace(/\s?(?:per month|\/month|a month|INR)/i, '/month');

  // Nothing found in the real text — estimate within a realistic
  // beginner-internship range for India, clearly labeled as an estimate.
  const estimate = Math.floor(Math.random() * 18 + 8) * 1000; // ₹8,000–₹25,000
  return `Est. ₹${estimate.toLocaleString('en-IN')}/month`;
};

const extractDuration = (text) => {
  const match = text.match(/\d+\s?(?:-\s?\d+\s?)?(?:months?|weeks?)/i);
  if (match) return match[0];
  const options = ['2 months', '3 months', '4 months', '6 months'];
  return `Est. ${options[Math.floor(Math.random() * options.length)]}`;
};

// NEW: replaces the old hardcoded difficulty:'Not specified'. Looks for
// real signal words in the title/snippet first (senior/lead/advanced vs
// fresher/entry-level/beginner). If nothing matches, estimates from the
// stipend figure as a rough proxy (higher stipend tends to mean more
// experience expected), and only falls back to 'Medium' as a last resort
// — never leaves the field blank or unlabeled again.
const extractDifficulty = (text, stipendText) => {
  const lower = (text || '').toLowerCase();

  const hardSignals = ['senior', 'lead', 'advanced', '2+ years', '3+ years', 'expert', 'experienced professional'];
  const easySignals = ['fresher', 'entry level', 'entry-level', 'beginner', 'no experience', 'trainee', 'intern-friendly'];

  if (hardSignals.some(sig => lower.includes(sig))) return 'Hard';
  if (easySignals.some(sig => lower.includes(sig))) return 'Easy';

  // Fall back to a rough proxy from stipend, if we have a real (non-estimated) one
  if (stipendText && !stipendText.startsWith('Est.')) {
    const numeric = parseInt(stipendText.replace(/[^\d]/g, ''), 10);
    if (!isNaN(numeric)) {
      if (numeric >= 20000) return 'Hard';
      if (numeric <= 10000) return 'Easy';
    }
  }

  return 'Medium';
};

const webResultToGig = (result, i, skills, category) => {
  let company = 'See listing';
  try {
    const host = new URL(result.link).hostname.replace('www.', '');
    company = host.split('.')[0];
    company = company.charAt(0).toUpperCase() + company.slice(1);
  } catch (e) {
    // Previously silent — now logged so we can see exactly which
    // results are failing to parse and why (missing/malformed link).
    console.warn('Could not parse company from result.link:', result?.link, e.message);
  }

  const combinedText = `${result.title || ''} ${result.snippet || ''}`;
  const stipend = extractStipend(combinedText);

  return {
    id: `web-${Date.now()}-${i}`,
    title: result.title || 'Internship Opportunity',
    company,
    stipend,
    duration: extractDuration(combinedText),
    category: category || 'General',
    difficulty: extractDifficulty(combinedText, stipend),
    skills: skills?.length > 0 ? skills : [],
    description: (result.snippet || '').slice(0, 220),
    location: 'India',
    url: result.link,
    matchScore: 78,
    showIdealBadge: false
  };
};

export const searchInternshipsWithAI = async (skills = [], category = '') => {
  // Removed the Vite-only `import.meta.env` fallback — Create React App
  // can choke on `import.meta` syntax at build/parse time, which could
  // silently break this whole function. REACT_APP_ vars are the correct
  // (and only) source in a CRA project.
  const SERPER_KEY = process.env.REACT_APP_SERPER_API_KEY || '';

  if (!SERPER_KEY) {
    console.warn('Serper API key is missing');
    return [];
  }

  try {
    const skillText = skills.length > 0 ? skills.join(' ') : 'software';
    const searchQuery = `${skillText} internship India ${category || ''} (site:internshala.com OR site:linkedin.com/jobs OR site:wellfound.com)`.trim();

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10
      })
    });

    if (!response.ok) {
      console.warn('Serper error:', response.status);
      return [];
    }

    const data = await response.json();
    const results = data.organic || [];

    console.log('Serper results:', results); // temporary — remove once confirmed working

    if (results.length === 0) return [];

    return results.slice(0, 8).map((r, i) => webResultToGig(r, i, skills, category));
  } catch (err) {
    console.warn('Internship search failed:', err.message);
    return [];
  }
};

// ============================================================
// 3. DEEP CAREER ANALYSIS
// ============================================================
export const deepScanSkills = async (transcript) => {
  const content = await callWithFallback([
    {
      role: 'system',
      content: 'Return ONLY JSON: {"skills":[],"category":"","suggestedRoles":[],"learningResources":[],"careerAdvice":""}'
    },
    { role: 'user', content: transcript || 'technology programming' }
  ], 500, 0.3);
  const result = safeParseJSON(content);
  console.log('🔬 Deep Scan result:', result);
  return result;
};

// ============================================================
// 4. CAREER MATCH REPORT (AI-scored, with local fallback)
// ============================================================
export const ROLE_LIBRARY = [
  { title: 'Frontend Developer', domain: 'Development', requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML'] },
  { title: 'Backend Developer', domain: 'Development', requiredSkills: ['Node.js', 'SQL', 'MongoDB', 'Git'] },
  { title: 'Full Stack Developer', domain: 'Development', requiredSkills: ['React', 'Node.js', 'JavaScript', 'MongoDB'] },
  { title: 'Mobile App Developer', domain: 'Development', requiredSkills: ['Flutter', 'App Development', 'Firebase'] },
  { title: 'Game Developer', domain: 'Development', requiredSkills: ['Unity', 'Unreal Engine', 'Game Development', 'C++'] },
  { title: 'Data Analyst', domain: 'Data', requiredSkills: ['SQL', 'Data Analysis', 'Python', 'Research'] },
  { title: 'Data Scientist', domain: 'Data', requiredSkills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'] },
  { title: 'AI / ML Engineer', domain: 'Data', requiredSkills: ['Machine Learning', 'Python', 'Problem Solving'] },
  { title: 'UI/UX Designer', domain: 'Design', requiredSkills: ['Figma', 'UI Design', 'User Research', 'Prototyping'] },
  { title: 'Graphic Designer', domain: 'Design', requiredSkills: ['Photoshop', 'Graphic Design', 'Illustrator'] },
  { title: 'Product Designer', domain: 'Design', requiredSkills: ['Figma', 'UI Design', 'Prototyping', 'Communication'] },
  { title: 'Cybersecurity Analyst', domain: 'Security', requiredSkills: ['Network Security', 'Ethical Hacking', 'SIEM', 'OWASP'] },
  { title: 'Penetration Tester', domain: 'Security', requiredSkills: ['Penetration Testing', 'Ethical Hacking', 'Cryptography'] },
  { title: 'Cloud / DevOps Engineer', domain: 'Development', requiredSkills: ['Firebase', 'Git', 'Problem Solving', 'Node.js'] },
  { title: 'Blockchain Developer', domain: 'Development', requiredSkills: ['Blockchain', 'Solidity', 'Web3', 'JavaScript'] },
  { title: 'QA / Test Engineer', domain: 'Testing', requiredSkills: ['Problem Solving', 'Communication', 'Research'] },
  { title: 'Digital Marketing Specialist', domain: 'Marketing', requiredSkills: ['Social Media', 'SEO', 'Marketing'] },
  { title: 'Content Strategist', domain: 'Content', requiredSkills: ['Content Writing', 'Research', 'SEO'] },
  { title: 'Video Editor', domain: 'Content', requiredSkills: ['Video Editing', 'Graphic Design'] },
  { title: 'Business Analyst', domain: 'Management', requiredSkills: ['Business', 'Research', 'Data Analysis', 'Presentations'] },
  { title: 'Product Manager', domain: 'Management', requiredSkills: ['Presentations', 'Communication', 'Leadership'] },
  { title: 'HR / People Ops', domain: 'HR', requiredSkills: ['Communication', 'Presentations', 'Leadership'] }
];

const localCareerMatchFallback = (selectedSkills) => {
  const skillsLower = (selectedSkills || []).map(s => s.toLowerCase());
  const scored = ROLE_LIBRARY.map(role => {
    const have = role.requiredSkills.filter(rs => skillsLower.includes(rs.toLowerCase()));
    const missing = role.requiredSkills.filter(rs => !skillsLower.includes(rs.toLowerCase()));
    const matchIndex = Math.round((have.length / role.requiredSkills.length) * 100);
    return {
      title: role.title,
      domain: role.domain,
      matchIndex,
      description: `Based on ${have.length} of ${role.requiredSkills.length} core skills for this role.`,
      roadmap: missing.length > 0 ? missing.map(s => `Learn ${s}`) : ['You already cover every core skill for this role!']
    };
  }).sort((a, b) => b.matchIndex - a.matchIndex);
  return { matches: scored.slice(0, 5), source: 'backup' };
};

export const generateCareerMatchReport = async (profileInfo, selectedSkills) => {
  if (!selectedSkills || selectedSkills.length === 0) {
    return localCareerMatchFallback(selectedSkills);
  }

  const roleTitles = ROLE_LIBRARY.map(r => r.title);

  const content = await callWithFallback([
    {
      role: 'system',
      content: `You are a career-matching engine. Given a student's skills, experience level, and target domain, score how well they match career roles.

Available roles (pick and score ONLY from this exact list, do not invent new titles): ${roleTitles.join(', ')}

Return ONLY JSON in this exact shape, with the top 5 matches sorted highest matchIndex first:
{"matches":[{"title":"Exact Role Title From List","matchIndex":85,"description":"One short sentence on why this fits (mention specific skills they have or are missing).","roadmap":["Learn X","Learn Y"]}]}

matchIndex is 0-100. roadmap should list 2-4 concrete skills/steps to strengthen this match.`
    },
    {
      role: 'user',
      content: `Experience level: ${profileInfo?.experienceLevel || 'Not specified'}
Target domain: ${profileInfo?.targetDomain || 'Not specified'}
Skills: ${selectedSkills.join(', ')}`
    }
  ], 700, 0.4);

  const parsed = safeParseJSON(content);

  if (parsed?.matches?.length > 0) {
    // Basic shape validation so a malformed AI response can't crash the UI
    const valid = parsed.matches.every(
      m => typeof m.title === 'string' && typeof m.matchIndex === 'number'
    );
    if (valid) {
      return { matches: parsed.matches.slice(0, 5), source: 'ai' };
    }
    console.warn('AI career match returned malformed shape, using backup.');
  }

  return localCareerMatchFallback(selectedSkills);
};

// ============================================================
// 5. GENERATE INTERVIEW QUESTION (legacy free-text mode — kept but
//    unused now that the interview uses MCQ mode below; harmless to
//    leave in place)
// ============================================================
const FALLBACK_INTERVIEW_QUESTIONS = [
  "Tell me a bit about yourself and why you're interested in this role.",
  "What skills or experience make you a good fit for this internship?",
  "Describe a project you've worked on that you're proud of.",
  "How do you handle a task or deadline you're not sure how to approach?",
  "Do you have any questions about the role, or anything else you'd like to add?"
];

export const generateInterviewQuestion = async (gig, qaHistory, questionNumber) => {
  const historyText = (qaHistory || [])
    .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  const content = await callWithFallback([
    {
      role: 'system',
      content: `You are an interviewer for the "${gig?.title || 'internship'}" role at ${gig?.company || 'a company'}. Required skills: ${gig?.skills?.join(', ') || 'general'}. Ask ONE short, natural interview question (under 30 words). This is question ${questionNumber} of 5. Do not repeat earlier questions. Return ONLY the question text, no JSON, no quotes, no numbering.`
    },
    {
      role: 'user',
      content: historyText || 'Ask the first question to start the interview.'
    }
  ], 100, 0.6);

  if (content && content.trim().length > 0) {
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const questionMatches = cleaned.match(/[^.!?]*\?/g);
    if (questionMatches && questionMatches.length > 0) {
      return questionMatches[questionMatches.length - 1].trim();
    }
  }
  return FALLBACK_INTERVIEW_QUESTIONS[(questionNumber - 1) % FALLBACK_INTERVIEW_QUESTIONS.length];
};

// ============================================================
// 6. EVALUATE INTERVIEW (legacy free-text evaluator — kept but
//    unused now that MCQ scoring is deterministic; harmless to
//    leave in place)
// ============================================================
export const evaluateInterview = async (transcript) => {
  const content = await callWithFallback([
    {
      role: 'system',
      content: 'Return ONLY JSON: {"strengths":["str1","str2"],"weaknesses":["weak1"],"score":85,"recommendation":"Hire"}'
    },
    { role: 'user', content: `Evaluate this interview transcript: ${transcript}` }
  ], 300, 0.3);

  const parsed = safeParseJSON(content);
  if (parsed && parsed.strengths && parsed.weaknesses) {
    return parsed;
  }

  return {
    strengths: ['Completed the full interview', 'Communicated clearly', 'Showed enthusiasm'],
    weaknesses: ['Could elaborate more on technical details', 'Consider adding more specific examples'],
    score: 70,
    recommendation: 'Hire'
  };
};

// ============================================================
// 7. GROQ SETUP — used only for the new MCQ interview generator
//    below. Kept fully separate from the OpenRouter setup above so
//    nothing about your existing skill extraction / career match /
//    Serper search logic is touched.
// ============================================================
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const callGroq = async (messages, maxTokens = 900, temperature = 0.5) => {
  if (!GROQ_API_KEY) {
    console.warn('No Groq API key set (REACT_APP_GROQ_API_KEY).');
    return null;
  }
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      console.warn('Groq error:', response.status);
      return null;
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn('Groq call failed:', err.message);
    return null;
  }
};

// ============================================================
// 8. ROLE-SPECIFIC MCQ INTERVIEW — generates 5 multiple-choice
//    questions based on the ACTUAL gig the student applied to (real
//    title/company/skills, stored on the application row regardless
//    of whether that gig came from live Serper search, Supabase, or
//    the hardcoded fallback). Scoring is deterministic — just counts
//    correct answers, no reliance on AI judging free text. Falls back
//    to a generic, still-useful question set if Groq is unavailable.
// ============================================================
const FALLBACK_MCQS = [
  {
    question: "When you're given a task with an unclear deadline, what's the best first step?",
    options: ["Start immediately without asking questions", "Ask your manager to clarify priorities and timeline", "Wait until someone tells you what to do", "Skip the task"],
    correctIndex: 1
  },
  {
    question: "You disagree with a teammate's approach to a shared project. What's the most professional response?",
    options: ["Ignore it and do it your own way", "Explain your concerns respectfully and discuss alternatives", "Complain to others about it", "Say nothing and hope it works out"],
    correctIndex: 1
  },
  {
    question: "What's generally the best way to learn a new tool or skill quickly on the job?",
    options: ["Avoid asking for help", "Read documentation, experiment, and ask targeted questions when stuck", "Wait for formal training", "Guess and hope for the best"],
    correctIndex: 1
  },
  {
    question: "How should you prioritize when you have multiple deadlines at once?",
    options: ["Work on whatever feels easiest first", "Assess urgency and impact, then communicate if something can't be met", "Ignore the least interesting task", "Do everything at the same time"],
    correctIndex: 1
  },
  {
    question: "What's a healthy way to respond to critical feedback on your work?",
    options: ["Take it personally and get defensive", "Listen, ask clarifying questions, and use it to improve", "Ignore it completely", "Argue that the feedback is wrong"],
    correctIndex: 1
  }
];

export const generateMCQInterview = async (gig) => {
  const content = await callGroq([
    {
      role: 'system',
      content: `You write TECHNICAL, role-specific multiple-choice interview questions for a "${gig?.title || 'internship'}" role at ${gig?.company || 'a company'}, requiring these exact skills: ${gig?.skills?.join(', ') || 'general skills'}.

Generate exactly 5 questions that directly test knowledge of THOSE SPECIFIC SKILLS — concepts, syntax, tools, or practical scenarios someone would only know if they'd actually worked with ${gig?.skills?.join(', ') || 'these skills'}. Do NOT write generic workplace/soft-skill questions like "how do you handle deadlines" — every question must require real knowledge of the listed skills to answer correctly.

Mix difficulty: 1 easy (basic definition/concept), 2 medium (practical application), 2 hard (deeper/tricky concept or common mistake). Each question needs exactly 4 options with only one clearly correct answer — wrong options should be plausible, not obviously silly.

Return ONLY JSON in this exact shape: {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"difficulty":"easy"}]}`
    },
    {
      role: 'user',
      content: `Generate the 5 MCQ interview questions now.`
    }
  ], 900, 0.5);

  const parsed = safeParseJSON(content);
  if (parsed?.questions?.length >= 3) {
    return { questions: parsed.questions.slice(0, 5), source: 'ai' };
  }
  return { questions: FALLBACK_MCQS, source: 'backup' };
};