export * from './types';
export declare const HACKATHON_CONFIG: {
    readonly name: "AI Voice Agent Hackathon";
    readonly tagline: "Build the Future of Voice AI";
    readonly edition: "2026";
    readonly date: "August 15–17, 2026";
    readonly venue: "The Aitel HQ, Chennai, India";
    readonly lumaUrl: "https://lu.ma/ai-voice-hackathon-2026";
    readonly maxTeamSize: 4;
    readonly maxTeams: 50;
    readonly prizePool: "₹5,00,000";
};
export declare const CHALLENGE_TRACKS: readonly [{
    readonly id: "VOICE_AI_AGENT";
    readonly name: "Voice AI Agent";
    readonly description: "Build intelligent voice agents that understand context, intent, and emotion to deliver human-like conversations.";
    readonly icon: "Mic";
    readonly color: "#4F46E5";
}, {
    readonly id: "MULTIMODAL_AI";
    readonly name: "Multimodal AI";
    readonly description: "Combine voice, vision, and text to create AI systems that perceive and interact with the world in multiple dimensions.";
    readonly icon: "Layers";
    readonly color: "#06B6D4";
}, {
    readonly id: "REAL_WORLD_DEPLOYMENT";
    readonly name: "Real-World Deployment";
    readonly description: "Deploy production-grade voice AI solutions that solve actual business problems with measurable impact.";
    readonly icon: "Globe";
    readonly color: "#8B5CF6";
}];
export declare const SCORING_RUBRIC: {
    readonly latency: {
        readonly max: 2;
        readonly label: "Latency & Speed";
        readonly description: string;
    };
    readonly conversationalQuality: {
        readonly max: 2;
        readonly label: "Conversational Flow";
        readonly description: string;
    };
    readonly languageAccuracy: {
        readonly max: 2;
        readonly label: "Language Accuracy";
        readonly description: string;
    };
    readonly aiUsage: {
        readonly max: 2;
        readonly label: "Problem-Solving Ability";
        readonly description: string;
    };
    readonly technicalQuality: {
        readonly max: 2;
        readonly label: "Real-World Implementation & Viability";
        readonly description: string;
    };
};
export declare const ROUND_2_SCORING_RUBRIC: {
    readonly languageCommunicationFidelity: { readonly max: 20; readonly label: "Language & Communication Fidelity"; readonly description: string };
    readonly dataGroundedReasoning: { readonly max: 20; readonly label: "Data-Grounded Reasoning"; readonly description: string };
    readonly schemeKnowledgeEligibilityAccuracy: { readonly max: 15; readonly label: "Scheme Knowledge & Eligibility Accuracy"; readonly description: string };
    readonly guardrailsAgainstOverpromising: { readonly max: 20; readonly label: "Guardrails Against Overpromising"; readonly description: string };
    readonly escalationFraudAmbiguityHandling: { readonly max: 15; readonly label: "Escalation & Fraud/Ambiguity Handling"; readonly description: string };
    readonly conversationDesignRecovery: { readonly max: 10; readonly label: "Conversation Design & Recovery"; readonly description: string };
};
export type ScoringRubric = typeof SCORING_RUBRIC | typeof ROUND_2_SCORING_RUBRIC;
export declare function getScoringRubricForRound(round: number): ScoringRubric;
export declare function getRubricMaxScore(round: number): number;
export declare const SCHEDULE_ITEMS: readonly [{
    readonly date: "Sep 05";
    readonly time: "09:00 AM";
    readonly title: "Opening Ceremony";
    readonly description: "Welcome address, keynotes from industry leaders";
}, {
    readonly date: "Sep 05";
    readonly time: "11:00 AM";
    readonly title: "Hacking Begins";
    readonly description: "Teams start building their voice agents";
}, {
    readonly date: "Sep 05";
    readonly time: "01:00 PM";
    readonly title: "Lunch + Mentor Sessions";
    readonly description: "Network and get guidance from mentors";
}, {
    readonly date: "Sep 06";
    readonly time: "10:00 AM";
    readonly title: "Mid-Point Check-in";
    readonly description: "Progress review, API troubleshooting";
}, {
    readonly date: "Sep 06";
    readonly time: "05:00 PM";
    readonly title: "Submission Deadline";
    readonly description: "Final code and voice agent demo submission";
}, {
    readonly date: "Sep 07";
    readonly time: "10:00 AM";
    readonly title: "Round 1 — Demos";
    readonly description: "Team presentations to judges";
}, {
    readonly date: "Sep 07";
    readonly time: "02:00 PM";
    readonly title: "Round 2 — Finals";
    readonly description: "Top 20 teams present to all judges";
}, {
    readonly date: "Sep 07";
    readonly time: "05:00 PM";
    readonly title: "Awards Ceremony";
    readonly description: "Winner announcement and prize distribution";
}];
export declare const PRIZE_TIERS: readonly [{
    readonly rank: 1;
    readonly label: "1st Place";
    readonly prize: "₹50,000";
    readonly perks: readonly ["Internship Offers", "Cloud Credits $5K", "Trophy", "Certificates"];
}, {
    readonly rank: 2;
    readonly label: "2nd Place";
    readonly prize: "₹30,000";
    readonly perks: readonly ["Cloud Credits $2K", "Trophy", "Certificates"];
}, {
    readonly rank: 3;
    readonly label: "3rd Place";
    readonly prize: "₹20,000";
    readonly perks: readonly ["Mentorship Keys", "Certificates"];
}];
export declare const FAQ_ITEMS: readonly [{
    readonly question: "Who can participate?";
    readonly answer: "Any student currently enrolled in an undergraduate or postgraduate program. Teams of 2–4 members from the same or different colleges are welcome.";
}, {
    readonly question: "Is it free to participate?";
    readonly answer: "Yes, participation is completely free. Register on Luma to secure your spot.";
}, {
    readonly question: "What technologies can we use?";
    readonly answer: "Any technology stack is allowed. You are encouraged to use AI APIs (OpenAI, ElevenLabs, Vapi, Google AI, etc.) and voice technologies.";
}, {
    readonly question: "Can we use existing code or open-source projects?";
    readonly answer: "You must build your project from scratch during the hackathon. Open-source libraries and APIs are allowed. Previously built projects are not.";
}, {
    readonly question: "How will projects be judged?";
    readonly answer: "Projects are evaluated on Innovation, Technical Quality, AI Usage, Business Value, and Presentation. See the scoring rubric for details.";
}, {
    readonly question: "When will we know if we are approved?";
    readonly answer: "Applications are reviewed on a rolling basis. You will receive an email within 48 hours of submission.";
}, {
    readonly question: "Is accommodation provided?";
    readonly answer: "The hackathon is a 48-hour in-person event. Accommodation details will be shared with approved teams.";
}, {
    readonly question: "What should we bring?";
    readonly answer: "Your laptop, charger, and any hardware you need. Power strips and Wi-Fi will be provided.";
}];
