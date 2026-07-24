// Shared types across frontend and backend

// ─── Auth & Users ────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'JUDGE' | 'STUDENT' | 'VISITOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Teams & Applications ────────────────────────────────────────────────────
export type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
export type TeamStatus = 'REGISTERED' | 'COMPETING' | 'DISQUALIFIED' | 'WITHDRAWN';
export type ApplicationType = 'INDIVIDUAL' | 'TEAM';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resumeUrl?: string;
}

export interface Application {
  id: string;
  teamName: string;
  type: ApplicationType;
  college?: string;
  company?: string;
  city?: string;
  projectTitle: string;
  projectDescription: string;
  track: ChallengeTrack;
  members: TeamMember[];
  status: ApplicationStatus;
  lumaEventId?: string;
  lumaRegistrationId?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  applicationId: string;
  application: Application;
  status: TeamStatus;
  judgeAssignments: JudgeAssignment[];
  scores: Score[];
  totalScore?: number;
  rank?: number;
  createdAt: string;
}

// ─── Judges ──────────────────────────────────────────────────────────────────
export interface Judge {
  id: string;
  userId: string;
  user: User;
  bio: string;
  company: string;
  title: string;
  expertise: string[];
  linkedin?: string;
  avatar?: string;
  assignedTeams: JudgeAssignment[];
  isActive: boolean;
}

export interface JudgeAssignment {
  id: string;
  judgeId: string;
  judge: Judge;
  teamId: string;
  team: Team;
  roundId: string;
  isCompleted: boolean;
  assignedAt: string;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
export interface ScoreCriteria {
  innovation: number;        // 0-25
  technicalQuality: number;  // 0-25
  aiUsage: number;           // 0-20
  businessValue: number;     // 0-15
  presentation: number;      // 0-10
  bonus: number;             // 0-5
  comments: string;
}

export interface Score {
  id: string;
  teamId: string;
  judgeId: string;
  judge: Judge;
  roundId: string;
  round: Round;
  criteria: ScoreCriteria;
  totalScore: number;
  isSubmitted: boolean;
  isLocked: boolean;
  submittedAt?: string;
  createdAt: string;
}

export interface Round {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxScore: number;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  college: string;
  track: ChallengeTrack;
  totalScore: number;
  judgeCount: number;
  previousRank?: number;
  scores: {
    roundId: string;
    roundName: string;
    score: number;
  }[];
}

// ─── Hackathon Config ────────────────────────────────────────────────────────
export type ChallengeTrack = 
  | 'VOICE_AI_AGENT'
  | 'MULTIMODAL_AI'
  | 'REAL_WORLD_DEPLOYMENT';

export interface Hackathon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  venue: string;
  lumaEventUrl: string;
  maxTeams: number;
  maxTeamSize: number;
  isPublic: boolean;
  isRegistrationOpen: boolean;
}

// ─── Emails ───────────────────────────────────────────────────────────────────
export type EmailTemplate = 
  | 'REGISTRATION_RECEIVED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'REMINDER'
  | 'WINNER_ANNOUNCEMENT'
  | 'CERTIFICATE';

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  template: EmailTemplate;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt?: string;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────
export type WSEvent = 
  | 'leaderboard:update'
  | 'score:submitted'
  | 'application:status_changed'
  | 'announcement:new';

export interface WSMessage<T = unknown> {
  event: WSEvent;
  data: T;
  timestamp: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  user: User;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
