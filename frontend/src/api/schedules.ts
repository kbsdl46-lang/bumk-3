export const SCHEDULE_TYPES = ["휴가", "근무", "출장", "교육", "기타"] as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export type Schedule = {
  id: number;
  member_id: number;
  member_name: string;
  member_role: string;
  member_department: string;
  title: string;
  type: ScheduleType;
  starts_at: string;
  ends_at: string;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type SchedulePayload = {
  member_id: number;
  title: string;
  type: ScheduleType;
  starts_at: string;
  ends_at: string;
  memo: string;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "요청 처리 중 오류가 발생했습니다." }));
    throw new Error(body.detail ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return response.json();
}

export async function fetchSchedules(params: {
  from: string;
  to: string;
  memberId?: number;
  type?: string;
}): Promise<Schedule[]> {
  const search = new URLSearchParams({ from: params.from, to: params.to });

  if (params.memberId) {
    search.set("member_id", String(params.memberId));
  }
  if (params.type) {
    search.set("type", params.type);
  }

  const data = await readJson<{ items: Schedule[] }>(await fetch(`/api/schedules?${search}`));
  return data.items;
}

export async function createSchedule(payload: SchedulePayload): Promise<Schedule> {
  return readJson<Schedule>(
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateSchedule(id: number, payload: SchedulePayload): Promise<Schedule> {
  return readJson<Schedule>(
    await fetch(`/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteSchedule(id: number): Promise<void> {
  const response = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "일정 삭제 중 오류가 발생했습니다." }));
    throw new Error(body.detail ?? "일정 삭제 중 오류가 발생했습니다.");
  }
}
