# 🎤 VoiceMatch
#DEPLOYED LINK https://voice-match-xekh-2pjbrvm4j-aleena23.vercel.app/
   
    **Your Voice is Your Resume.**

VoiceMatch is a voice-first internship matching platform built for freshers. Instead of filling out forms, students speak about their skills, projects, and interests — an AI extracts real, verifiable signals from what they said, matches them to **live internship listings** pulled from the web, and gives them a data-backed report on how they came across, before they ever apply.

Built for the **SerpApi India Hackathon 2026**.

> ⚠️ **Disclosure:** This project predates the hackathon — it was originally built as a personal side project. For the hackathon, the core internship-search feature was rebuilt from the ground up on **SerpApi's Google Jobs engine**, and several new voice-analysis and matching features were added specifically for this submission. See [What Was Built For This Hackathon](#-what-was-built-for-this-hackathon) below for the full breakdown.

---

## 🧠 The Idea

Resumes are a poor filter for freshers — everyone's looks the same, and it says nothing about how someone actually communicates, thinks, or handles a real technical conversation.

VoiceMatch flips that: **the student's own voice becomes their profile.** They talk, an AI listens and asks real follow-up questions based on what they actually said, and the platform matches them to real internships — while giving them an honest, data-backed readiness report before they walk into any real interview.

---

## ✨ Key Features

### 🎙️ Voice-First Interview
- Speaks naturally into the mic — no typing, no forms.
- **Live transcript + live skill detection**: skill chips light up on screen the moment a student says a relevant term (Python ✓, React ✓, etc.), while they're still talking.
- **Continuous listening**: the mic no longer cuts a student off mid-thought. It listens through natural pauses and only finishes when the student taps again or goes quiet for a few seconds — so answers feel like a real conversation, not a rushed quiz.
- **Real-time Coach Bubble**: contextual, in-the-moment feedback ("Nice — Machine Learning detected ✓", "Good start — add one concrete example") based on what's actually being said, not scripted.

### 🤖 Adaptive AI Interview
- The opening question is fixed. Every question after that is **generated live by AI** based on the student's *previous answer* — a real follow-up, not a canned script.
- Example: a student says *"I built a dashboard in React"* → the AI asks *"What was the hardest part of that, and how did you solve it?"*
- Falls back gracefully to a fixed question set if the AI call fails, so the interview never gets stuck.

### 📊 Real, Measured Interview Insights
No fabricated scores. Every number on the report screen is computed from what actually happened during the interview:
- **Speaking Pace** — measured words-per-minute against a natural conversational range.
- **Response Readiness** — how quickly the student started answering after the mic opened.
- **Answer Depth** — real word count per answer.
- **Technical Vocabulary** — actual domain-relevant skills detected in what was said.
- **Interview Timeline** — a visual, per-question breakdown of thinking time vs. speaking time.
- **Highlight Reel** — automatically surfaces the student's strongest answer (by real skill density, length, and pace) with a one-tap replay of their own words, read back via text-to-speech.

### 🌐 Live Internship Search — Powered by SerpApi
- Every search uses **SerpApi's Google Jobs engine** to pull real, current internship listings — real company names, real locations, real application links.
- Honest data handling: if a listing has no stipend info, it says **"Stipend not listed"** — never a guessed number.
- **Confirm Your Domain** screen: after the voice interview, the student confirms (or corrects) the AI's guessed domain before any search runs. This guarantees a failed or garbled voice transcript can never silently send the search to the wrong field — the confirmed domain is always the source of truth.
- **Sample vs. Live, clearly labelled**: preloaded demo listings are marked *"Sample Internships — Preloaded Demo Data,"* while real results are marked *"Live Internships — Powered by SerpApi,"* so there's never confusion about what's real.

> ### ⚡ SerpApi Quota-Aware Caching
> Free-tier SerpApi usage is capped at 250 searches/month — easy to burn through during testing, judging, and repeat demos. VoiceMatch guards against this with a **local result cache**: an identical search (same skills + same confirmed domain) made again within a set time window is served instantly from cache instead of triggering another live SerpApi call. This was a deliberate engineering decision made specifically to keep the integration usable and demo-safe under real API limits, not just to make a search work once.

### 💬 AI Internship Advisor
A persistent chat assistant (floating icon, available on every screen) that knows the student's real interview score, detected skills, and career matches — and gives grounded, non-generic advice instead of one-size-fits-all tips.

### 🧭 Mock Interview & Skill Radar
- **Domain-specific Mock Interviews**: AI-generated, role-specific multiple-choice questions that actually test knowledge in the student's chosen domain (AI/ML, Cloud, Cybersecurity, etc.) — not generic soft-skill filler.
- **Skill Radar**: an AI-scored career match report ranking the student against real role profiles, with a transparent roadmap of what to learn next for each match.

### 🏆 Gamification
Points, levels, a leaderboard, saved gigs, and an achievements rail — all driven by real user activity (interviews completed, gigs applied to, skills detected), no fabricated streaks.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js + Express (proxy server) |
| Database & Auth | Supabase (PostgreSQL + Auth, Row-Level Security enabled) |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Live Internship Search | **SerpApi** (Google Jobs engine) |
| Conversational & Scoring AI | Groq (`openai/gpt-oss-120b`) |

---

## 🏗️ How It Works — The Pipeline

```
Voice Interview (adaptive AI follow-ups)
        │
        ▼
Skill Extraction (real-time, keyword + speech analysis)
        │
        ▼
AI Interview Insights (measured pace, readiness, depth, vocabulary)
        │
        ▼
Confirm Your Domain (student-verified — never silently overridden)
        │
        ▼
Live Internship Search — SerpApi Google Jobs
        │
        ▼
Scored, Matched Internship Cards (real companies, real apply links)
        │
        ▼
Domain-Specific Mock Interview → Apply Now (external, real redirect)
```

The student's **selected domain is always the authoritative signal** for search — voice-extracted skills only refine it. A failed or empty transcript can never accidentally send the search to an unrelated field.

---

## 🔒 Why the Data Is Honest, Not Guessed

A deliberate design principle throughout this project: **never fabricate what isn't real.**
- No stipend? It says so — never a random guessed number.
- No AI response? A clearly-labelled backup (keyword-based) result is shown instead of a fake AI answer.
- Interview scores are computed from real timing and speech data, not placeholder numbers.
- Live results are visually distinct from sample/demo data at every point in the UI.

---

## 🚀 Getting Started

### Prerequisites
- Node.js and npm
- A Supabase project (URL + anon key)
- A Groq API key
- A SerpApi API key

### 1. Clone and install
```bash
git clone https://github.com/Aleenamehreen04/voice-match
cd voice-match
npm install
cd server
npm install
cd ..
```

### 2. Environment variables

**Root `.env`** (used by the React frontend):
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GROQ_API_KEY=your_groq_api_key
```

**`server/.env`** (backend only — never exposed to the browser):
```
SERPAPI_KEY=your_serpapi_key
```

### 3. Run it

Two terminals, both need to stay open:

```bash
# Terminal 1 — backend (SerpApi proxy)
cd server
node index.js

# Terminal 2 — frontend
npm start
```

The app runs at `http://localhost:3000`; the backend proxy runs at `http://localhost:5000`.

---

## 📁 Project Structure (high level)

```
src/
├── App.js                      # Core app logic, voice interview flow, routing
├── services/
│   └── aiService.js            # SerpApi search, Groq AI calls, scoring logic
├── components/
│   ├── InternshipAdvisor.js    # AI chat assistant
│   ├── DomainSelector.js       # Domain picker (Mock Interview)
│   ├── ConfirmDomainScreen.js  # Domain confirmation (after voice interview)
│   ├── InterviewRoom.js        # Mock Interview MCQ flow
│   ├── HomePage.js             # Dashboard, gig cards, live/sample labelling
│   └── domains.js              # Shared domain list
server/
└── index.js                    # Express server, SerpApi proxy route
```

---

## 🏁 What Was Built For This Hackathon

To meet the hackathon's requirement of a genuine, functioning SerpApi integration and to strengthen the project as a whole, the following were built or substantially reworked specifically for this submission:

- Replaced the previous job-search integration entirely with **SerpApi's Google Jobs engine**, including a dedicated backend proxy route.
- Added the **Confirm Your Domain** screen, ensuring search reliability regardless of voice transcription quality.
- Added **local search result caching** to protect API quota.
- Rebuilt the AI Interview Insights report to use **real, measured speech data** instead of static placeholder scores.
- Added **adaptive, AI-generated follow-up interview questions**.
- Added the **live transcript, live skill detection, and real-time Coach Bubble** during the voice interview.
- Added the **Highlight Reel** feature.
- Reworked the mic's speech recognition to support natural pauses (continuous listening + tap-to-finish).
- Added clear **Sample vs. Live** data labelling throughout the UI.
- Migrated several AI-dependent features off an unreliable free-tier provider onto Groq for reliability.

### AI Tools Used in Development
This project's code was developed with the assistance of **Claude (Anthropic)** as a pair-programming and debugging aid throughout the build process. All architectural decisions, feature scope, and final review were done by the developer.

---

## 🔮 Future Scope

- Organization dashboard for posting real internships directly.
- Email notifications (application status, interview reminders).
- Resume builder integrated with detected skills.
- Skill verification / certification layer.
- Production deployment (frontend + backend hosted separately).

---

## 👩‍💻 Author

Built by **Aleena Mehreen** for the SerpApi India Hackathon 2026.
GitHub: [github.com/Aleenamehreen04/voice-match](https://github.com/Aleenamehreen04/voice-match)
