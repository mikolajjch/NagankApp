"""
OAuth 2.0 / JWT validation via Auth0.

Jak dziala PKCE (Proof Key for Code Exchange):
1. Frontend generuje losowy code_verifier i jego skrot SHA-256 (code_challenge).
2. Frontend wysyla /authorize z code_challenge do Auth0.
3. Auth0 zwraca authorization code do frontendu.
4. Frontend wymienia code + code_verifier na token (POST /oauth/token).
5. Auth0 weryfikuje ze SHA-256(code_verifier) == code_challenge z kroku 2.
6. Jesli sie zgadza, zwraca access_token (JWT).
7. Frontend dolacza JWT do kazdego requestu jako Bearer token.
8. Backend (ten plik) weryfikuje podpis JWT uzywajac publicznego klucza Auth0 (JWKS).
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

# Namespace dla custom claim z rolami (musi byc URL – wymog Auth0)
ROLES_CLAIM = "https://nagank-app.com/roles"

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Pobierz publiczne klucze Auth0 (cache na czas zycia procesu)."""
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def _decode_token(token: str) -> dict:
    """Zdekoduj i zweryfikuj JWT."""
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
                detail="Nie znaleziono klucza publicznego (kid mismatch).",
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
            detail=f"Nieprawidlowy token: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Dependency – dowolny zalogowany uzytkownik
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Zwraca payload JWT dla kazdego uwierzytelnionego uzytkownika."""
    return _decode_token(credentials.credentials)


# ---------------------------------------------------------------------------
# Dependency – tylko admin
# ---------------------------------------------------------------------------

def require_admin(
    payload: dict = Depends(get_current_user),
) -> dict:
    """Wymaga roli 'admin' w custom claim JWT."""
    roles: list[str] = payload.get(ROLES_CLAIM, [])
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnien – wymagana rola admin.",
        )
    return payload
