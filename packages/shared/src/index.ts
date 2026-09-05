export * from './types.js';

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

/** Round 1 judge rubric — 5 × 2.0 = 10 pts (+ social bonus up to 10 → /20 on boards). */
export const SCORING_RUBRIC = {
  latency: { max: 2, label: 'Latency & Speed', description: 'response time, real-time performance, minimal pauses during calls' },
  conversationalQuality: { max: 2, label: 'Conversational Flow', description: 'natural turn-taking, interruptions, context retention, handling unexpected responses' },
  languageAccuracy: { max: 2, label: 'Language Accuracy', description: 'Tamil/regional fluency, pronunciation, grammar, understanding and response accuracy' },
  aiUsage: { max: 2, label: 'Problem-Solving Ability', description: 'does the agent actually solve the intended problem, reason through edge cases, and take the right action' },
  technicalQuality: { max: 2, label: 'Real-World Implementation & Viability', description: 'is the use case practical, can it run in a real business environment, quality of implementation, integrations, architecture and scalability' },
} as const;

/** Round 2+ judge rubric (main + Special Category) — totals 100 pts per judge sheet. */
export const ROUND_2_SCORING_RUBRIC = {
  languageCommunicationFidelity: {
    max: 20,
    label: 'Language & Communication Fidelity',
    description: 'clarity, Tamil/regional fluency, pronunciation, and how faithfully the agent communicates intent',
  },
  dataGroundedReasoning: {
    max: 20,
    label: 'Data-Grounded Reasoning',
    description: 'answers grounded in provided data/context; correct reasoning without inventing facts',
  },
  schemeKnowledgeEligibilityAccuracy: {
    max: 15,
    label: 'Scheme Knowledge & Eligibility Accuracy',
    description: 'accurate scheme/policy knowledge and correct eligibility determination',
  },
  guardrailsAgainstOverpromising: {
    max: 20,
    label: 'Guardrails Against Overpromising',
    description: 'does not overpromise outcomes, benefits, or approvals beyond what is allowed',
  },
  escalationFraudAmbiguityHandling: {
    max: 15,
    label: 'Escalation & Fraud/Ambiguity Handling',
    description: 'handles fraud signals, ambiguity, and escalates appropriately when unsure',
  },
  conversationDesignRecovery: {
    max: 10,
    label: 'Conversation Design & Recovery',
    description: 'smooth conversation design, repair, and recovery from misunderstandings',
  },
} as const;

export type ScoringRubric = typeof SCORING_RUBRIC | typeof ROUND_2_SCORING_RUBRIC;

export function getScoringRubricForRound(round: number): ScoringRubric {
  return round >= 2 ? ROUND_2_SCORING_RUBRIC : SCORING_RUBRIC;
}

export function getRubricMaxScore(round: number): number {
  return Object.values(getScoringRubricForRound(round)).reduce((sum, item) => sum + item.max, 0);
}

export const SCHEDULE_ITEMS = [
  { date: 'Sep 05', time: '09:00 AM', title: 'Opening Ceremony', description: 'Welcome address, keynotes from industry leaders' },
  { date: 'Sep 05', time: '11:00 AM', title: 'Hacking Begins', description: 'Teams start building their voice agents' },
  { date: 'Sep 05', time: '01:00 PM', title: 'Lunch + Mentor Sessions', description: 'Network and get guidance from mentors' },
  { date: 'Sep 06', time: '10:00 AM', title: 'Mid-Point Check-in', description: 'Progress review, API troubleshooting' },
  { date: 'Sep 06', time: '05:00 PM', title: 'Submission Deadline', description: 'Final code and voice agent demo submission' },
  { date: 'Sep 07', time: '10:00 AM', title: 'Round 1 — Demos', description: 'Team presentations to judges' },
  { date: 'Sep 07', time: '02:00 PM', title: 'Round 2 — Finals', description: 'Top 20 teams present to all judges' },
  { date: 'Sep 07', time: '05:00 PM', title: 'Awards Ceremony', description: 'Winner announcement and prize distribution' },
] as const;

export const PRIZE_TIERS = [
  { rank: 1, label: '1st Place', prize: '₹50,000', perks: ['Internship Offers', 'Cloud Credits $5K', 'Trophy', 'Certificates'] },
  { rank: 2, label: '2nd Place', prize: '₹30,000', perks: ['Cloud Credits $2K', 'Trophy', 'Certificates'] },
  { rank: 3, label: '3rd Place', prize: '₹20,000', perks: ['Mentorship Keys', 'Certificates'] },
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
