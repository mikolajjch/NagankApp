from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Unsecured endpoint – checks API status."""
    return {"status": "ok", "service": "nagank-backend"}
