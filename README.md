# NagankApp – OAuth 2.0 (Auth0 + PKCE)

**Autor:** Mikołaj Chrzan

Aplikacja do zarządzania obszarami naganki myśliwskiej, zabezpieczona standardem OAuth 2.0 z użyciem Auth0 jako authorization server oraz mechanizmem PKCE.

---

## Architektura

```
map-app/          ← frontend (React + Vite + Auth0 SDK)
backend/          ← backend (FastAPI + SQLAlchemy + SQLite)
```

Authorization server: **Auth0** (SaaS, nie Keycloak)

---

## Jak działa PKCE (Proof Key for Code Exchange)

PKCE to rozszerzenie OAuth 2.0 zaprojektowane dla aplikacji, które nie mogą bezpiecznie przechowywać sekretów (np. SPA, aplikacje mobilne).

**Przebieg:**

1. Frontend generuje losowy ciąg `code_verifier` i oblicza jego hash SHA-256 → `code_challenge`.
2. Frontend otwiera `/authorize` na Auth0 z parametrem `code_challenge`.
3. Użytkownik loguje się na stronie Auth0.
4. Auth0 zwraca jednorazowy `authorization_code` (przez redirect_uri).
5. Frontend wysyła `code` + `code_verifier` do `/oauth/token`.
6. Auth0 weryfikuje: `SHA-256(code_verifier) == code_challenge`. Jeśli tak – zwraca `access_token` (JWT).
7. Frontend dołącza JWT do każdego żądania jako `Authorization: Bearer <token>`.
8. Backend weryfikuje podpis JWT używając publicznego klucza Auth0 (JWKS endpoint).

**Dlaczego to bezpieczne:** Nawet jeśli ktoś przechwyci `authorization_code`, nie może go wymienić na token bez `code_verifier`, który nigdy nie opuszcza frontendu.

---

## Konfiguracja Auth0 (krok po kroku)

### 1. Utwórz konto na [auth0.com](https://auth0.com) (bezpłatne)

### 2. Utwórz aplikację SPA

- Applications → Create Application → **Single Page Application**
- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`
- Zapisz `Domain` i `Client ID`

### 3. Utwórz API

- Applications → APIs → Create API
- Name: `NagankApp API`
- Identifier (Audience): `https://nagank-api`
- Signing Algorithm: RS256

### 4. Dodaj role do JWT (Auth0 Action)

Actions → Flows → Login → Add Action → **Build from scratch**

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://nagank-app.com/roles';
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim(namespace, roles);
  api.accessToken.setCustomClaim(namespace, roles);
};
```

Deploy i dodaj do flow Login.

### 5. Utwórz role i przypisz do użytkownika

- User Management → Roles → Create Role: `admin`
- User Management → Users → wybierz użytkownika → Roles → przypisz `admin`

---

## Uruchomienie backendu

```bash
cd backend

# Skopiuj i uzupelnij konfigurację
cp .env.example .env
# Edytuj .env: wpisz AUTH0_DOMAIN i AUTH0_AUDIENCE

# Zainstaluj zależności
pip install -r requirements.txt

# Uruchom serwer
uvicorn main:app --reload
# API dostępne na http://localhost:8000
# Dokumentacja: http://localhost:8000/docs
```

---

## Uruchomienie frontendu

```bash
cd map-app

# Skopiuj i uzupełnij konfigurację
cp .env.example .env
# Edytuj .env: wpisz VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE

# Zainstaluj zależności (w tym @auth0/auth0-react)
npm install

# Uruchom serwer deweloperski
npm run dev
# Frontend dostępny na http://localhost:5173
```

---

## Endpointy API

| Metoda | Ścieżka | Zabezpieczony | Wymagana rola |
|--------|---------|---------------|---------------|
| GET | `/health` | ❌ NIE | – |
| GET | `/api/actions` | ✅ JWT | dowolny user |
| POST | `/api/actions` | ✅ JWT | dowolny user |
| PUT | `/api/actions/{id}` | ✅ JWT | właściciel |
| DELETE | `/api/actions/{id}` | ✅ JWT | **admin** |
| GET | `/api/groups` | ✅ JWT | dowolny user |
| POST | `/api/groups` | ✅ JWT | dowolny user |

---

## Baza danych

SQLite (`backend/nagank.db`) – tworzona automatycznie przy pierwszym uruchomieniu.

Tabele: `action_areas`, `action_points`, `groups`.
