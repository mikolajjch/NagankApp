"""
OAuth 2.0 / JWT validation via Auth0.

How PKCE (Proof Key for Code Exchange) works:
1. The frontend generates a random code_verifier and its SHA-256 hash (code_challenge).
2. The frontend sends code_challenge to Auth0's /authorize endpoint.
3. Auth0 returns an authorization code to the frontend.
4. The frontend exchanges code + code_verifier for a token (POST /oauth/token).
5. Auth0 verifies that SHA-256(code_verifier) == code_challenge from step 2.
6. If it matches, it returns an access_token (JWT).
7. The frontend attaches the JWT to every request as a Bearer token.
8. The backend (this file) verifies the JWT signature using Auth0's public key (JWKS).
"""

import os
from functools import lru_cache

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
ALGORITHMS = ["RS256"]

# Namespace for the custom roles claim (must be a URL – Auth0 requirement)
ROLES_CLAIM = "https://naganka-app.com/roles"

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetch Auth0's public keys (cached for the lifetime of the process)."""
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def _decode_token(token: str) -> dict:
    """Decode and verify a JWT."""
    try:
        jwks = _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = next(
            (
                key
                for key in jwks["keys"]
                if key["kid"] == unverified_header["kid"]
            ),
            None,
        )
        if rsa_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found (kid mismatch).",
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Dependency – any authenticated user
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Returns the JWT payload for any authenticated user."""
    return _decode_token(credentials.credentials)


# ---------------------------------------------------------------------------
# Dependency – admin only
# ---------------------------------------------------------------------------

def require_admin(
    payload: dict = Depends(get_current_user),
) -> dict:
    """Requires the 'admin' role in the JWT custom claim."""
    roles: list[str] = payload.get(ROLES_CLAIM, [])
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions – admin role required.",
        )
    return payload


def display_name(payload: dict) -> str:
    """Best-effort human-readable name for a JWT payload (name, then email, then sub)."""
    return payload.get("name") or payload.get("email") or payload["sub"]
