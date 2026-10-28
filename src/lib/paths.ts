// Pure helpers that are safe to import from client components.
export type Role = "user" | "dietitian" | "admin";
// Where each role lands after signing in. "/dashboard" routes ordinary users to the tracker.
export const homeFor = (role: Role): string => (role === "admin" ? "/admin" : role === "dietitian" ? "/dietitian" : "/dashboard");
