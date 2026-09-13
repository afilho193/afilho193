// SQLite (via Prisma) não suporta enums nativos, então os campos correspondentes
// no schema são String. Estes objetos recriam a mesma ergonomia de uso
// (Role.HR, EnrollmentStatus.COMPLETED, z.nativeEnum(...)) no restante do código.
export const Role = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR: "HR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EnrollmentStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const FeedbackType = {
  PRAISE: "PRAISE",
  CONSTRUCTIVE: "CONSTRUCTIVE",
  CHECKIN: "CHECKIN",
} as const;
export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];
