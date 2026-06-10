/**
 * AuthContext – wrapper na Auth0 React SDK.
 *
 * Auth0 automatycznie używa PKCE (Proof Key for Code Exchange) dla
 * aplikacji typu Single Page Application – nie trzeba nic konfigurować ręcznie.
 *
 * Jak działa PKCE w skrócie:
 *  1. SDK generuje losowy code_verifier i jego SHA-256 hash (code_challenge).
 *  2. Otwiera /authorize na Auth0 z code_challenge.
 *  3. Auth0 zwraca jednorazowy authorization code.
 *  4. SDK wymienia code + code_verifier na JWT (access_token).
 *  5. Nikt nie może ukraść code bez code_verifier – ochrona przed atakami CSRF.
 */

import React, { createContext, useContext } from "react";
import {
  useAuth0,
  Auth0Provider,
  type Auth0ContextInterface,
} from "@auth0/auth0-react";

export type AuthContextValue = Auth0ContextInterface;

const AuthContext = createContext<AuthContextValue | null>(null);

// Zmienne środowiskowe Vite (plik .env w katalogu map-app)
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email",
      }}
    >
      <AuthContextBridge>{children}</AuthContextBridge>
    </Auth0Provider>
  );
};

const AuthContextBridge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth0 = useAuth0();
  return (
    <AuthContext.Provider value={auth0}>{children}</AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
