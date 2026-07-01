from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.services import team_member_service

router = APIRouter(prefix="/team-members", tags=["team-members"])


class TeamMemberPayload(BaseModel):
    name: str
    role: str = ""
    department: str = ""


@router.get("")
def list_team_members(
    include_inactive: Annotated[bool, Query(alias="include_inactive")] = False,
) -> dict[str, list[dict[str, object]]]:
    return {"items": team_member_service.list_team_members(include_inactive)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_team_member(payload: TeamMemberPayload) -> dict[str, object]:
    try:
        return team_member_service.create_team_member(
            name=payload.name,
            role=payload.role,
            department=payload.department,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put("/{member_id}")
def update_team_member(member_id: int, payload: TeamMemberPayload) -> dict[str, object]:
    try:
        return team_member_service.update_team_member(
            member_id=member_id,
            name=payload.name,
            role=payload.role,
            department=payload.department,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(member_id: int) -> None:
    try:
        team_member_service.deactivate_team_member(member_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
