"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ_ITEMS = exports.PRIZE_TIERS = exports.SCHEDULE_ITEMS = exports.SCORING_RUBRIC = exports.CHALLENGE_TRACKS = exports.HACKATHON_CONFIG = void 0;
__exportStar(require("./types"), exports);
exports.HACKATHON_CONFIG = {
    name: 'AI Voice Agent Hackathon',
    tagline: 'Build the Future of Voice AI',
    edition: '2026',
    date: 'August 15–17, 2026',
    venue: 'The Aitel HQ, Chennai, India',
    lumaUrl: 'https://lu.ma/ai-voice-hackathon-2026',
    maxTeamSize: 4,
    maxTeams: 50,
    prizePool: '₹5,00,000',
};
exports.CHALLENGE_TRACKS = [
    {
        id: 'VOICE_AI_AGENT',
        name: 'Voice AI Agent',
        description: 'Build intelligent voice agents that understand context, intent, and emotion to deliver human-like conversations.',
        icon: 'Mic',
        color: '#4F46E5',
    },
    {
        id: 'MULTIMODAL_AI',
        name: 'Multimodal AI',
        description: 'Combine voice, vision, and text to create AI systems that perceive and interact with the world in multiple dimensions.',
        icon: 'Layers',
        color: '#06B6D4',
    },
    {
        id: 'REAL_WORLD_DEPLOYMENT',
        name: 'Real-World Deployment',
        description: 'Deploy production-grade voice AI solutions that solve actual business problems with measurable impact.',
        icon: 'Globe',
        color: '#8B5CF6',
    },
];
exports.SCORING_RUBRIC = {
    latency: { max: 10, label: 'Latency & Speed', description: 'Response time and real-time conversational capability on the phone call' },
    conversationalQuality: { max: 10, label: 'Conversational Flow', description: 'Natural turn-taking, handling interruptions and context' },
    languageAccuracy: { max: 10, label: 'Tamil Language Accuracy', description: 'Fluency, grammar, and pronunciation in Tamil/regional languages' },
    aiUsage: { max: 10, label: 'Voice Realism & Persona', description: 'Quality of TTS, emotion, and character consistency' },
    technicalQuality: { max: 10, label: 'Technical Implementation', description: 'Code quality, architecture, and telephony integration' },
};
exports.SCHEDULE_ITEMS = [
    { date: 'Sep 05', time: '09:00 AM', title: 'Opening Ceremony', description: 'Welcome address, keynotes from industry leaders' },
    { date: 'Sep 05', time: '11:00 AM', title: 'Hacking Begins', description: 'Teams start building their voice agents' },
    { date: 'Sep 05', time: '01:00 PM', title: 'Lunch + Mentor Sessions', description: 'Network and get guidance from mentors' },
    { date: 'Sep 06', time: '10:00 AM', title: 'Mid-Point Check-in', description: 'Progress review, API troubleshooting' },
    { date: 'Sep 06', time: '05:00 PM', title: 'Submission Deadline', description: 'Final code and voice agent demo submission' },
    { date: 'Sep 07', time: '10:00 AM', title: 'Round 1 — Demos', description: 'Team presentations to judges' },
    { date: 'Sep 07', time: '02:00 PM', title: 'Round 2 — Finals', description: 'Top 20 teams present to all judges' },
    { date: 'Sep 07', time: '05:00 PM', title: 'Awards Ceremony', description: 'Winner announcement and prize distribution' },
];
exports.PRIZE_TIERS = [
    { rank: 1, label: '1st Place', prize: '₹50,000', perks: ['Internship Offers', 'Cloud Credits $5K', 'Trophy', 'Certificates'] },
    { rank: 2, label: '2nd Place', prize: '₹30,000', perks: ['Cloud Credits $2K', 'Trophy', 'Certificates'] },
    { rank: 3, label: '3rd Place', prize: '₹20,000', perks: ['Mentorship Keys', 'Certificates'] },
];
exports.FAQ_ITEMS = [
    {
        question: 'Who can participate?',
        answer: 'Any student currently enrolled in an undergraduate or postgraduate program. Teams of 2–4 members from the same or different colleges are welcome.',
    },
    {
        question: 'Is it free to participate?',
        answer: 'Yes, participation is completely free. Register on Luma to secure your spot.',
    },
    {
        question: 'What technologies can we use?',
        answer: 'Any technology stack is allowed. You are encouraged to use AI APIs (OpenAI, ElevenLabs, Vapi, Google AI, etc.) and voice technologies.',
    },
    {
        question: 'Can we use existing code or open-source projects?',
        answer: 'You must build your project from scratch during the hackathon. Open-source libraries and APIs are allowed. Previously built projects are not.',
    },
    {
        question: 'How will projects be judged?',
        answer: 'Projects are evaluated on Innovation, Technical Quality, AI Usage, Business Value, and Presentation. See the scoring rubric for details.',
    },
    {
        question: 'When will we know if we are approved?',
        answer: 'Applications are reviewed on a rolling basis. You will receive an email within 48 hours of submission.',
    },
    {
        question: 'Is accommodation provided?',
        answer: 'The hackathon is a 48-hour in-person event. Accommodation details will be shared with approved teams.',
    },
    {
        question: 'What should we bring?',
        answer: 'Your laptop, charger, and any hardware you need. Power strips and Wi-Fi will be provided.',
    },
];
//# sourceMappingURL=index.js.map