const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow React app to call this server
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'VoiceMatch API is running!' });
});

// GET all gigs (hardcoded for now - will connect to Supabase later)
app.get('/api/gigs', (req, res) => {
  const gigs = [
    { id: 1, title: "Frontend Intern", company: "TechCorp", stipend: "₹15,000/month", duration: "3 months", category: "Development", difficulty: "Beginner", skills: ["React", "JavaScript", "CSS"], description: "Build responsive UIs using React." },
    { id: 2, title: "UI/UX Designer", company: "DesignHub", stipend: "₹12,000/month", duration: "2 months", category: "Design", difficulty: "Beginner", skills: ["Figma", "UI Design"], description: "Create user flows and wireframes." },
    { id: 3, title: "Content Writer", company: "WriteAway", stipend: "₹8,000/month", duration: "3 months", category: "Content", difficulty: "Beginner", skills: ["Content Writing", "SEO"], description: "Write blog posts and social media content." },
    { id: 4, title: "Data Analyst", company: "DataMind", stipend: "₹18,000/month", duration: "4 months", category: "Data", difficulty: "Intermediate", skills: ["Python", "SQL", "Data Analysis"], description: "Analyze data and create dashboards." },
    { id: 5, title: "Backend Developer", company: "ServerStack", stipend: "₹20,000/month", duration: "3 months", category: "Development", difficulty: "Intermediate", skills: ["Node.js", "MongoDB"], description: "Build REST APIs with Node.js." },
    { id: 6, title: "Digital Marketing", company: "MarketPro", stipend: "₹10,000/month", duration: "2 months", category: "Marketing", difficulty: "Beginner", skills: ["Social Media", "SEO", "Marketing"], description: "Manage social media and SEO campaigns." },
    { id: 7, title: "React Native Dev", company: "AppWorks", stipend: "₹22,000/month", duration: "3 months", category: "Development", difficulty: "Intermediate", skills: ["React", "JavaScript", "App Development"], description: "Build cross‑platform mobile apps." },
    { id: 8, title: "Graphic Designer", company: "PixelPerfect", stipend: "₹12,000/month", duration: "2 months", category: "Design", difficulty: "Beginner", skills: ["Graphic Design", "Photoshop"], description: "Create logos and marketing materials." },
    { id: 9, title: "SEO Specialist", company: "RankHigh", stipend: "₹9,000/month", duration: "3 months", category: "Marketing", difficulty: "Beginner", skills: ["SEO", "Marketing"], description: "Improve website ranking on Google." },
    { id: 10, title: "Python Developer", company: "CodePython", stipend: "₹19,000/month", duration: "3 months", category: "Development", difficulty: "Intermediate", skills: ["Python", "Machine Learning"], description: "Build web apps with Django." },
    { id: 11, title: "QA Tester", company: "TestLab", stipend: "₹11,000/month", duration: "2 months", category: "Testing", difficulty: "Beginner", skills: ["Testing", "Communication"], description: "Manual and automated testing." },
    { id: 12, title: "DevOps Intern", company: "CloudOps", stipend: "₹21,000/month", duration: "4 months", category: "Development", difficulty: "Advanced", skills: ["Node.js", "MongoDB"], description: "Manage cloud infrastructure." },
    { id: 13, title: "Product Manager", company: "ProductHub", stipend: "₹16,000/month", duration: "3 months", category: "Management", difficulty: "Intermediate", skills: ["Business", "Presentations", "Leadership"], description: "Coordinate product development." },
    { id: 14, title: "HR Intern", company: "PeopleFirst", stipend: "₹8,000/month", duration: "2 months", category: "HR", difficulty: "Beginner", skills: ["Communication", "Leadership"], description: "Assist in hiring and onboarding." },
    { id: 15, title: "Blockchain Dev", company: "ChainBuild", stipend: "₹25,000/month", duration: "4 months", category: "Development", difficulty: "Advanced", skills: ["Blockchain", "Web Development"], description: "Build smart contracts and DApps." }
  ];
  
  res.json(gigs); 
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test API at: http://localhost:${PORT}/api/gigs`);
})