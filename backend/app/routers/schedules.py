from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services import schedule_service

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("")
def list_schedules(
    from_date: Annotated[str | None, Query(alias="from")] = None,
    to_date: Annotated[str | None, Query(alias="to")] = None,
    member_id: int | None = None,
    type: str | None = None,
) -> dict[str, list[dict[str, object]]]:
    return {
        "items": schedule_service.list_schedules(
            from_date=from_date,
            to_date=to_date,
            member_id=member_id,
            schedule_type=type,
        )
    }


class SchedulePayload(BaseModel):
    member_id: int
    title: str
    type: str = Field(..., description="휴가, 근무, 출장, 교육, 기타")
    starts_at: str
    ends_at: str
    memo: str = ""


@router.post("", status_code=status.HTTP_201_CREATED)
def create_schedule(payload: SchedulePayload) -> dict[str, object]:
    try:
        return schedule_service.create_schedule(
            member_id=payload.member_id,
            title=payload.title,
            schedule_type=payload.type,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            memo=payload.memo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, payload: SchedulePayload) -> dict[str, object]:
    try:
        return schedule_service.update_schedule(
            schedule_id=schedule_id,
            member_id=payload.member_id,
            title=payload.title,
            schedule_type=payload.type,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            memo=payload.memo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int) -> None:
    try:
        schedule_service.delete_schedule(schedule_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
