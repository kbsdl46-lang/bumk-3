import sqlite3
from collections.abc import Iterator

from app.core.config import DB_PATH, ensure_runtime_dirs


def get_connection() -> sqlite3.Connection:
    ensure_runtime_dirs()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def connection_scope() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    ensure_runtime_dirs()
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS app_metadata (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS team_members (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              role TEXT,
              department TEXT,
              is_active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS schedules (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              member_id INTEGER,
              title TEXT NOT NULL,
              type TEXT NOT NULL,
              starts_at TEXT NOT NULL,
              ends_at TEXT NOT NULL,
              memo TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS excel_jobs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              job_type TEXT NOT NULL,
              status TEXT NOT NULL,
              source_file TEXT,
              output_file TEXT,
              summary_json TEXT,
              error_message TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaint_manuals (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              filename TEXT NOT NULL,
              stored_path TEXT NOT NULL,
              extracted_text TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_keywords (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              keyword TEXT NOT NULL UNIQUE,
              is_active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_articles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              subtitle TEXT,
              publisher TEXT,
              published_at TEXT,
              url TEXT NOT NULL UNIQUE,
              summary TEXT,
              content TEXT,
              keyword TEXT,
              source TEXT,
              collected_for_date TEXT,
              collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_collection_runs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              target_date TEXT NOT NULL,
              status TEXT NOT NULL,
              started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              finished_at TEXT,
              inserted_count INTEGER NOT NULL DEFAULT 0,
              skipped_count INTEGER NOT NULL DEFAULT 0,
              error_message TEXT
            );
            """
        )
        _ensure_column(connection, "news_articles", "subtitle", "TEXT")
        _ensure_column(connection, "news_articles", "content", "TEXT")
        _ensure_column(connection, "news_articles", "source", "TEXT")
        _ensure_column(connection, "news_articles", "collected_for_date", "TEXT")
        _ensure_column(
            connection,
            "news_articles",
            "collected_at",
            "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        )
        connection.execute(
            """
            INSERT INTO app_metadata (key, value)
            VALUES ('schema_version', '0.1.0')
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = CURRENT_TIMESTAMP
            """
        )
        connection.commit()


def _ensure_column(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = {
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )


def check_db() -> dict[str, str]:
    init_db()
    with get_connection() as connection:
        sqlite_version = connection.execute("SELECT sqlite_version()").fetchone()[0]
        schema_version = connection.execute(
            "SELECT value FROM app_metadata WHERE key = 'schema_version'"
        ).fetchone()[0]

    return {
        "status": "connected",
        "sqlite_version": sqlite_version,
        "schema_version": schema_version,
        "path": str(DB_PATH),
    }
