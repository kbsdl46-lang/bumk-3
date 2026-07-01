from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import init_db
from app.routers import complaints, excel, health, news, schedules, team_members


def create_app() -> FastAPI:
    app = FastAPI(title="공공직군 행정업무 슈퍼앱 API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(team_members.router, prefix="/api")
    app.include_router(schedules.router, prefix="/api")
    app.include_router(excel.router, prefix="/api")
    app.include_router(complaints.router, prefix="/api")
    app.include_router(news.router, prefix="/api")

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()

    return app


app = create_app()
