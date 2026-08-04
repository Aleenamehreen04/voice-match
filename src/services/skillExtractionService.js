// src/services/skillExtractionService.js

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Local fallback keyword database
const skillDatabase = {
    'cloud computing': {
        mainSkill: 'Cloud Computing',
        relatedSkills: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Terraform'],
        tools: ['AWS Console', 'Terraform', 'Kubectl', 'Docker Desktop'],
        certifications: ['AWS Certified Solutions Architect', 'Azure Administrator', 'Google Cloud Professional'],
        description: 'Cloud computing delivers computing services over the internet, including servers, storage, databases, networking, software, and analytics.'
    },
    'machine learning': {
        mainSkill: 'Machine Learning',
        relatedSkills: ['Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn'],
        tools: ['Jupyter Notebook', 'TensorFlow', 'PyTorch', 'Google Colab'],
        certifications: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty'],
        description: 'Machine learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.'
    },
    'web development': {
        mainSkill: 'Web Development',
        relatedSkills: ['React', 'Node.js', 'JavaScript', 'HTML/CSS', 'TypeScript', 'Next.js'],
        tools: ['VS Code', 'Git', 'Chrome DevTools', 'npm/yarn'],
        certifications: ['Meta Front-End Developer', 'AWS Certified Developer'],
        description: 'Web development involves building and maintaining websites and web applications.'
    },
    'data science': {
        mainSkill: 'Data Science',
        relatedSkills: ['Python', 'R', 'SQL', 'Statistics', 'Data Visualization', 'Pandas'],
        tools: ['Jupyter Notebook', 'Tableau', 'Power BI', 'Python'],
        certifications: ['IBM Data Science Professional', 'Google Data Analytics'],
        description: 'Data science combines statistics, programming, and domain expertise to extract insights from data.'
    },
    'mobile development': {
        mainSkill: 'Mobile Development',
        relatedSkills: ['React Native', 'Flutter', 'iOS', 'Android', 'Kotlin', 'Swift'],
        tools: ['Android Studio', 'Xcode', 'Flutter SDK', 'React Native CLI'],
        certifications: ['Google Associate Android Developer', 'Apple iOS Developer'],
        description: 'Mobile development focuses on creating applications for mobile devices like smartphones and tablets.'
    },
    'ui design': {
        mainSkill: 'UI/UX Design',
        relatedSkills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping'],
        tools: ['Figma', 'Sketch', 'Adobe Creative Suite', 'InVision'],
        certifications: ['Google UX Design Professional', 'Interaction Design Foundation'],
        description: 'UI/UX design focuses on creating intuitive, engaging digital experiences through user research and interface design.'
    }
};

class SkillExtractionService {
    constructor() {
        this.cache = new Map();
        console.log('🔧 SkillExtractionService initialized');
    }

    /**
     * Extract skills from text input
     * @param {string} text - User's spoken/written text about their skills
     * @returns {Object} Structured skill data
     */
    async extractSkills(text) {
        console.log('🎯 Extracting skills from:', text);
        
        try {
            // Try AI extraction first
            const aiResult = await this.extractWithAI(text);
            console.log('✅ AI extraction successful:', aiResult);
            return aiResult;
        } catch (error) {
            console.warn('⚠️ AI extraction failed, using fallback:', error.message);
            // Fallback to local keyword matching
            return this.extractWithLocalDB(text);
        }
    }

    /**
     * Extract skills using OpenRouter AI with web lookup capability
     * @param {string} text - User's text
     * @returns {Object} Structured skill data
     */
    async extractWithAI(text) {
        if (!OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }

        const prompt = `You are a career skills expert. Analyze the following text about a person's skills and interests.
Extract structured information about their MAIN skill area. Also, look up related information from your knowledge.

Text: "${text}"

Return ONLY a valid JSON object with this exact structure (no other text, no markdown):
{
    "mainSkill": "Main skill name",
    "relatedSkills": ["related skill 1", "related skill 2", "related skill 3", "related skill 4"],
    "tools": ["tool 1", "tool 2", "tool 3"],
    "certifications": ["certification 1", "certification 2"],
    "description": "2-3 sentence description of the skill domain and its industry relevance"
}

IMPORTANT: 
- Return ONLY the JSON object, no markdown, no explanations
- Include 3-5 items in each array
- Certifications should be real, recognized certifications
- Description should mention current industry demand`;

        console.log('📤 Sending prompt to OpenRouter...');

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'VoiceMatch Skill Extraction'
            },
            body: JSON.stringify({
                model: 'google/gemini-flash-1.5',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a precise skill extraction AI. You always return valid JSON without markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ OpenRouter API error:', response.status, errorData);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 OpenRouter response received');

        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content in OpenRouter response');
        }

        // Parse the JSON from the response
        let parsedData;
        try {
            const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleanedContent);
            console.log('✅ Parsed AI response:', parsedData);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response as JSON:', content);
            throw new Error('AI returned invalid JSON');
        }

        // Cache the result
        const cacheKey = text.toLowerCase().trim();
        this.cache.set(cacheKey, parsedData);

        return parsedData;
    }

    /**
     * Fallback: Extract skills using local keyword database
     * @param {string} text - User's text
     * @returns {Object} Structured skill data
     */
    extractWithLocalDB(text) {
        console.log('📚 Using local database for skill extraction...');
        const lowerText = text.toLowerCase().trim();
        
        // Find best matching skill
        let bestMatch = null;
        let bestScore = 0;

        for (const [keyword, skillData] of Object.entries(skillDatabase)) {
            if (lowerText.includes(keyword)) {
                const score = keyword.length; // Longer matches are better
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = skillData;
                }
            }
        }

        if (bestMatch) {
            console.log('✅ Found match in local DB:', bestMatch.mainSkill);
            return bestMatch;
        }

        // Default fallback if no match found
        console.log('⚠️ No match found, returning generic response');
        return {
            mainSkill: 'General Technology',
            relatedSkills: ['Programming', 'Problem Solving', 'Communication', 'Team Collaboration'],
            tools: ['VS Code', 'Git', 'Microsoft Office'],
            certifications: ['CompTIA IT Fundamentals', 'Google IT Support Professional'],
            description: 'Technology skills are in high demand across all industries. Focus on continuous learning and practical experience.'
        };
    }

    /**
     * Get skill suggestions based on partial input
     * @param {string} partialText - Partial user input
     * @returns {Array} Skill suggestions
     */
    getSuggestions(partialText) {
        const lowerText = partialText.toLowerCase().trim();
        const suggestions = [];

        for (const [keyword, data] of Object.entries(skillDatabase)) {
            if (keyword.includes(lowerText) || lowerText.includes(keyword)) {
                suggestions.push({
                    keyword,
                    mainSkill: data.mainSkill,
                    confidence: this.calculateMatchConfidence(lowerText, keyword)
                });
            }
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Calculate confidence score for keyword match
     * @param {string} input - User input
     * @param {string} keyword - Database keyword
     * @returns {number} Confidence score 0-1
     */
    calculateMatchConfidence(input, keyword) {
        if (input === keyword) return 1.0;
        if (keyword.includes(input)) return 0.8;
        if (input.includes(keyword)) return 0.6;
        return 0.4;
    }

    /**
     * Clear the extraction cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Skill extraction cache cleared');
    }
}

// Create singleton instance
const skillExtractionService = new SkillExtractionService();

export default skillExtractionService;