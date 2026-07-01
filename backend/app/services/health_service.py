from app.db.session import check_db


def get_health() -> dict[str, object]:
    return {
        "status": "ok",
        "app": "public-admin-superapp",
        "api": "connected",
        "database": check_db(),
    }
