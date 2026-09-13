export type Role = "EMPLOYEE" | "MANAGER" | "HR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  managerId: string | null;
}

export interface TrackModule {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  resourceUrl: string | null;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  createdAt: string;
  modules: TrackModule[];
  skills: string[];
}

export type EnrollmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface Enrollment {
  id: string;
  userId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  startedAt: string;
  completedAt: string | null;
  track: {
    id: string;
    title: string;
    category: string;
    level: string;
    modules: TrackModule[];
  };
  completedModuleIds: string[];
}

export type FeedbackType = "PRAISE" | "CONSTRUCTIVE" | "CHECKIN";

export interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  actionItems: string | null;
  createdAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  title: string | null;
  totalEnrollments: number;
  completed: number;
  inProgress: number;
  avgProgress: number;
}

export interface TeamDashboard {
  teamSize: number;
  members: TeamMemberSummary[];
  recentFeedback: {
    id: string;
    type: FeedbackType;
    message: string;
    createdAt: string;
    toUser: { id: string; name: string };
  }[];
}

export interface OrgDashboard {
  userCount: number;
  trackCount: number;
  feedbackCount: number;
  totalEnrollments: number;
  completed: number;
  inProgress: number;
  completionRate: number;
  popularTracks: { title: string; enrolled: number; completed: number }[];
  members: TeamMemberSummary[];
}
