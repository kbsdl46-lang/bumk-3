export type TeamMember = {
  id: number;
  name: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
};

export type TeamMemberPayload = {
  name: string;
  role: string;
  department: string;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "요청 처리 중 오류가 발생했습니다." }));
    throw new Error(body.detail ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return response.json();
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const data = await readJson<{ items: TeamMember[] }>(await fetch("/api/team-members"));
  return data.items;
}

export async function createTeamMember(payload: TeamMemberPayload): Promise<TeamMember> {
  return readJson<TeamMember>(
    await fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateTeamMember(id: number, payload: TeamMemberPayload): Promise<TeamMember> {
  return readJson<TeamMember>(
    await fetch(`/api/team-members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteTeamMember(id: number): Promise<void> {
  const response = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "팀원 삭제 중 오류가 발생했습니다." }));
    throw new Error(body.detail ?? "팀원 삭제 중 오류가 발생했습니다.");
  }
}
