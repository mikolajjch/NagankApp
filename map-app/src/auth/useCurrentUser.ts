/**
 * Hook zwracający zalogowanego użytkownika w formacie zgodnym z istniejącym kodem.
 * Role są odczytywane z custom claim JWT (dodawany przez Auth0 Action).
 */

import type { User } from "../types/User";
import { useAuth } from "./AuthContext";

// Namespace musi się zgadzać z Auth0 Action (backend auth.py używa tego samego)
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
