# NagankApp – OAuth 2.0 (Auth0 + PKCE)

**Author:** Mikołaj Chrzan

An application for managing hunting drive (naganka) areas, secured with the OAuth 2.0 standard using Auth0 as the authorization server and the PKCE mechanism.

---

## Architecture

```
map-app/          ← frontend (React + Vite + Auth0 SDK)
backend/          ← backend (FastAPI + SQLAlchemy + SQLite)
```

Authorization server: **Auth0** (SaaS, not Keycloak)

---

## How PKCE (Proof Key for Code Exchange) works

PKCE is an OAuth 2.0 extension designed for applications that cannot safely store secrets (e.g. SPAs, mobile apps).

**Flow:**

1. The frontend generates a random `code_verifier` string and computes its SHA-256 hash → `code_challenge`.
2. The frontend opens Auth0's `/authorize` endpoint with the `code_challenge` parameter.
3. The user logs in on the Auth0 page.
4. Auth0 returns a one-time `authorization_code` (via redirect_uri).
5. The frontend sends the `code` + `code_verifier` to `/oauth/token`.
6. Auth0 verifies: `SHA-256(code_verifier) == code_challenge`. If it matches, it returns an `access_token` (JWT).
7. The frontend attaches the JWT to every request as `Authorization: Bearer <token>`.
8. The backend verifies the JWT signature using Auth0's public key (JWKS endpoint).

**Why this is secure:** Even if someone intercepts the `authorization_code`, they cannot exchange it for a token without the `code_verifier`, which never leaves the frontend.

---

## Auth0 configuration (step by step)

### 1. Create an account at [auth0.com](https://auth0.com) (free)

### 2. Create an SPA application

- Applications → Create Application → **Single Page Application**
- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`
- Save the `Domain` and `Client ID`

### 3. Create an API

- Applications → APIs → Create API
- Name: `NagankApp API`
- Identifier (Audience): `https://nagank-api`
- Signing Algorithm: RS256

### 4. Add roles to the JWT (Auth0 Action)

Actions → Flows → Login → Add Action → **Build from scratch**

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://nagank-app.com/roles';
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim(namespace, roles);
  api.accessToken.setCustomClaim(namespace, roles);
};
```

Deploy it and add it to the Login flow.

### 5. Create roles and assign them to a user

- User Management → Roles → Create Role: `admin`
- User Management → Users → select a user → Roles → assign `admin`

---

## Running the backend

```bash
cd backend

# Copy and fill in the configuration
cp .env.example .env
# Edit .env: set AUTH0_DOMAIN and AUTH0_AUDIENCE

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

## Running the frontend

```bash
cd map-app

# Copy and fill in the configuration
cp .env.example .env
# Edit .env: set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE

# Install dependencies (including @auth0/auth0-react)
npm install

# Run the dev server
npm run dev
# Frontend available at http://localhost:5173
```

---

## API endpoints

| Method | Path | Secured | Required role |
|--------|---------|---------------|---------------|
| GET | `/health` | ❌ NO | – |
| GET | `/api/actions` | ✅ JWT | any user |
| POST | `/api/actions` | ✅ JWT | any user |
| PUT | `/api/actions/{id}` | ✅ JWT | owner |
| DELETE | `/api/actions/{id}` | ✅ JWT | **admin** |
| GET | `/api/groups` | ✅ JWT | any user |
| POST | `/api/groups` | ✅ JWT | any user |

---

## Database

SQLite (`backend/nagank.db`) – created automatically on first run.

Tables: `action_areas`, `action_points`, `groups`.
