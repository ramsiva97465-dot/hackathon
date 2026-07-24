export * from './types';

export const HACKATHON_CONFIG = {
  name: 'AI Voice Agent Hackathon',
  tagline: 'Build the Future of Voice AI',
  edition: '2026',
  date: 'August 15–17, 2026',
  venue: 'The Aitel HQ, Chennai, India',
  lumaUrl: 'https://lu.ma/ai-voice-hackathon-2026',
  maxTeamSize: 4,
  maxTeams: 50,
  prizePool: '₹5,00,000',
} as const;

export const CHALLENGE_TRACKS = [
  {
    id: 'VOICE_AI_AGENT' as const,
    name: 'Voice AI Agent',
    description: 'Build intelligent voice agents that understand context, intent, and emotion to deliver human-like conversations.',
    icon: 'Mic',
    color: '#4F46E5',
  },
  {
    id: 'MULTIMODAL_AI' as const,
    name: 'Multimodal AI',
    description: 'Combine voice, vision, and text to create AI systems that perceive and interact with the world in multiple dimensions.',
    icon: 'Layers',
    color: '#06B6D4',
  },
  {
    id: 'REAL_WORLD_DEPLOYMENT' as const,
    name: 'Real-World Deployment',
    description: 'Deploy production-grade voice AI solutions that solve actual business problems with measurable impact.',
    icon: 'Globe',
    color: '#8B5CF6',
  },
] as const;

export const SCORING_RUBRIC = {
  innovation: { max: 25, label: 'Innovation & Creativity', description: 'Novelty and originality of the solution' },
  technicalQuality: { max: 25, label: 'Technical Quality', description: 'Code quality, architecture, and scalability' },
  aiUsage: { max: 20, label: 'AI Usage', description: 'Effective and responsible use of AI technologies' },
  businessValue: { max: 15, label: 'Business Value', description: 'Real-world applicability and market potential' },
  presentation: { max: 10, label: 'Presentation', description: 'Clarity, confidence, and demo quality' },
  bonus: { max: 5, label: 'Bonus Points', description: 'Exceptional achievement or extra features' },
} as const;

export const SCHEDULE_ITEMS = [
  { date: 'Aug 15', time: '09:00 AM', title: 'Opening Ceremony', description: 'Welcome address, keynotes from industry leaders' },
  { date: 'Aug 15', time: '11:00 AM', title: 'Hacking Begins', description: 'Teams start building their solutions' },
  { date: 'Aug 15', time: '01:00 PM', title: 'Lunch + Mentor Sessions', description: 'Network and get guidance from mentors' },
  { date: 'Aug 16', time: '10:00 AM', title: 'Mid-Point Check-in', description: 'Progress review, office hours' },
  { date: 'Aug 16', time: '05:00 PM', title: 'Submission Deadline', description: 'Final code and demo submission' },
  { date: 'Aug 17', time: '10:00 AM', title: 'Round 1 — Demos', description: 'Team presentations to judges' },
  { date: 'Aug 17', time: '02:00 PM', title: 'Round 2 — Finals', description: 'Top 5 teams present to all judges' },
  { date: 'Aug 17', time: '05:00 PM', title: 'Awards Ceremony', description: 'Winner announcement and prize distribution' },
] as const;

export const PRIZE_TIERS = [
  { rank: 1, label: '1st Place', prize: '₹2,00,000', perks: ['Internship Offers', 'Cloud Credits $10K', 'Trophy', 'Certificates'] },
  { rank: 2, label: '2nd Place', prize: '₹1,00,000', perks: ['Cloud Credits $5K', 'Trophy', 'Certificates'] },
  { rank: 3, label: '3rd Place', prize: '₹50,000', perks: ['Cloud Credits $2K', 'Trophy', 'Certificates'] },
  { rank: null, label: 'Best AI Innovation', prize: '₹75,000', perks: ['Special Recognition', 'Certificates'] },
  { rank: null, label: 'Best Presentation', prize: '₹25,000', perks: ['Certificates'] },
] as const;

export const FAQ_ITEMS = [
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
] as const;
