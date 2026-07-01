from fastapi import APIRouter

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/manuals")
def list_manuals() -> dict[str, list[object]]:
    return {"items": []}
