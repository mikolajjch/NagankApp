from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Endpoint niezabezpieczony – sprawdzenie stanu API."""
    return {"status": "ok", "service": "nagank-backend"}
