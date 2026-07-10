/**
 * Hook returning the logged-in user in a format compatible with the existing code.
 * Roles are read from the JWT custom claim (added by the Auth0 Action).
 */

import type { User } from "../types/User";
import { useAuth } from "./AuthContext";

// Namespace must match the Auth0 Action (backend auth.py uses the same one)
const ROLES_CLAIM = "https://nagank-app.com/roles";

export function useCurrentUser(): User | null {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const roles = (user[ROLES_CLAIM] as string[] | undefined) ?? [];

  return {
    id: user.sub ?? "",
    username: user.name ?? user.email ?? user.sub ?? "user",
    role: roles.includes("admin") ? "admin" : "user",
    reputation: 0,
  };
}
