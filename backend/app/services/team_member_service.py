import sqlite3
from typing import Any

from app.db.session import get_connection


def _row_to_member(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "role": row["role"] or "",
        "department": row["department"] or "",
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
    }


def list_team_members(include_inactive: bool = False) -> list[dict[str, Any]]:
    query = """
        SELECT id, name, role, department, is_active, created_at
        FROM team_members
    """
    params: list[Any] = []

    if not include_inactive:
        query += " WHERE is_active = ?"
        params.append(1)

    query += " ORDER BY is_active DESC, name ASC"

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    return [_row_to_member(row) for row in rows]


def create_team_member(name: str, role: str = "", department: str = "") -> dict[str, Any]:
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("팀원 이름은 필수입니다.")

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO team_members (name, role, department, is_active)
            VALUES (?, ?, ?, 1)
            """,
            (normalized_name, role.strip(), department.strip()),
        )
        connection.commit()
        row = connection.execute(
            """
            SELECT id, name, role, department, is_active, created_at
            FROM team_members
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return _row_to_member(row)


def update_team_member(member_id: int, name: str, role: str = "", department: str = "") -> dict[str, Any]:
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("팀원 이름은 필수입니다.")

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM team_members WHERE id = ? AND is_active = 1",
            (member_id,),
        ).fetchone()
        if existing is None:
            raise LookupError("활성 팀원을 찾을 수 없습니다.")

        connection.execute(
            """
            UPDATE team_members
            SET name = ?, role = ?, department = ?
            WHERE id = ?
            """,
            (normalized_name, role.strip(), department.strip(), member_id),
        )
        connection.commit()
        row = connection.execute(
            """
            SELECT id, name, role, department, is_active, created_at
            FROM team_members
            WHERE id = ?
            """,
            (member_id,),
        ).fetchone()

    return _row_to_member(row)


def deactivate_team_member(member_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE team_members SET is_active = 0 WHERE id = ? AND is_active = 1",
            (member_id,),
        )
        connection.commit()

    if cursor.rowcount == 0:
        raise LookupError("활성 팀원을 찾을 수 없습니다.")
