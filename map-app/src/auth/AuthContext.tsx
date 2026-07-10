/**
 * AuthContext – wrapper around the Auth0 React SDK.
 *
 * Auth0 automatically uses PKCE (Proof Key for Code Exchange) for
 * Single Page Applications – no manual configuration required.
 *
 * How PKCE works in short:
 *  1. The SDK generates a random code_verifier and its SHA-256 hash (code_challenge).
 *  2. It opens Auth0's /authorize with the code_challenge.
 *  3. Auth0 returns a one-time authorization code.
 *  4. The SDK exchanges code + code_verifier for a JWT (access_token).
 *  5. No one can steal the code without the code_verifier – protection against CSRF attacks.
 */

import React, { createContext, useContext } from "react";
import {
  useAuth0,
  Auth0Provider,
  type Auth0ContextInterface,
} from "@auth0/auth0-react";

export type AuthContextValue = Auth0ContextInterface;

const AuthContext = createContext<AuthContextValue | null>(null);

// Vite environment variables (.env file in the map-app directory)
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
