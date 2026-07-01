from datetime import datetime
import sqlite3
from typing import Any

from app.db.session import get_connection

SCHEDULE_TYPES = {"휴가", "근무", "출장", "교육", "기타"}


def _parse_datetime(value: str, field_name: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} 형식이 올바르지 않습니다.") from exc


def _validate_schedule_payload(
    *,
    member_id: int,
    title: str,
    schedule_type: str,
    starts_at: str,
    ends_at: str,
) -> None:
    if member_id <= 0:
        raise ValueError("팀원을 선택하세요.")
    if not title.strip():
        raise ValueError("일정 제목은 필수입니다.")
    if schedule_type not in SCHEDULE_TYPES:
        raise ValueError("지원하지 않는 일정 유형입니다.")

    starts = _parse_datetime(starts_at, "시작일시")
    ends = _parse_datetime(ends_at, "종료일시")
    if ends <= starts:
        raise ValueError("종료일시는 시작일시보다 늦어야 합니다.")


def _ensure_active_member(connection: sqlite3.Connection, member_id: int) -> None:
    row = connection.execute(
        "SELECT id FROM team_members WHERE id = ? AND is_active = 1",
        (member_id,),
    ).fetchone()
    if row is None:
        raise LookupError("활성 팀원을 찾을 수 없습니다.")


def _row_to_schedule(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "member_id": row["member_id"],
        "member_name": row["member_name"] or "삭제된 팀원",
        "member_role": row["member_role"] or "",
        "member_department": row["member_department"] or "",
        "title": row["title"],
        "type": row["type"],
        "starts_at": row["starts_at"],
        "ends_at": row["ends_at"],
        "memo": row["memo"] or "",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_schedules(
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    member_id: int | None = None,
    schedule_type: str | None = None,
) -> list[dict[str, Any]]:
    query = """
        SELECT
          schedules.id,
          schedules.member_id,
          team_members.name AS member_name,
          team_members.role AS member_role,
          team_members.department AS member_department,
          schedules.title,
          schedules.type,
          schedules.starts_at,
          schedules.ends_at,
          schedules.memo,
          schedules.created_at,
          schedules.updated_at
        FROM schedules
        LEFT JOIN team_members ON team_members.id = schedules.member_id
        WHERE 1 = 1
    """
    params: list[Any] = []

    if from_date:
        query += " AND date(schedules.ends_at) >= date(?)"
        params.append(from_date)
    if to_date:
        query += " AND date(schedules.starts_at) <= date(?)"
        params.append(to_date)
    if member_id:
        query += " AND schedules.member_id = ?"
        params.append(member_id)
    if schedule_type:
        query += " AND schedules.type = ?"
        params.append(schedule_type)

    query += " ORDER BY schedules.starts_at ASC, schedules.id ASC"

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    return [_row_to_schedule(row) for row in rows]


def create_schedule(
    *,
    member_id: int,
    title: str,
    schedule_type: str,
    starts_at: str,
    ends_at: str,
    memo: str = "",
) -> dict[str, Any]:
    _validate_schedule_payload(
        member_id=member_id,
        title=title,
        schedule_type=schedule_type,
        starts_at=starts_at,
        ends_at=ends_at,
    )

    with get_connection() as connection:
        _ensure_active_member(connection, member_id)
        cursor = connection.execute(
            """
            INSERT INTO schedules (member_id, title, type, starts_at, ends_at, memo)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (member_id, title.strip(), schedule_type, starts_at, ends_at, memo.strip()),
        )
        connection.commit()

    return get_schedule(int(cursor.lastrowid))


def get_schedule(schedule_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT
              schedules.id,
              schedules.member_id,
              team_members.name AS member_name,
              team_members.role AS member_role,
              team_members.department AS member_department,
              schedules.title,
              schedules.type,
              schedules.starts_at,
              schedules.ends_at,
              schedules.memo,
              schedules.created_at,
              schedules.updated_at
            FROM schedules
            LEFT JOIN team_members ON team_members.id = schedules.member_id
            WHERE schedules.id = ?
            """,
            (schedule_id,),
        ).fetchone()

    if row is None:
        raise LookupError("일정을 찾을 수 없습니다.")

    return _row_to_schedule(row)


def update_schedule(
    *,
    schedule_id: int,
    member_id: int,
    title: str,
    schedule_type: str,
    starts_at: str,
    ends_at: str,
    memo: str = "",
) -> dict[str, Any]:
    _validate_schedule_payload(
        member_id=member_id,
        title=title,
        schedule_type=schedule_type,
        starts_at=starts_at,
        ends_at=ends_at,
    )

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM schedules WHERE id = ?",
            (schedule_id,),
        ).fetchone()
        if existing is None:
            raise LookupError("일정을 찾을 수 없습니다.")

        _ensure_active_member(connection, member_id)
        connection.execute(
            """
            UPDATE schedules
            SET member_id = ?,
                title = ?,
                type = ?,
                starts_at = ?,
                ends_at = ?,
                memo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (member_id, title.strip(), schedule_type, starts_at, ends_at, memo.strip(), schedule_id),
        )
        connection.commit()

    return get_schedule(schedule_id)


def delete_schedule(schedule_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
        connection.commit()

    if cursor.rowcount == 0:
        raise LookupError("일정을 찾을 수 없습니다.")
