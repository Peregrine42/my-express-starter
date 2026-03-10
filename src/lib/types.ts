import "express-session";

declare module "express-session" {
  interface SessionData {
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    rememberMe: boolean;
  }
}
