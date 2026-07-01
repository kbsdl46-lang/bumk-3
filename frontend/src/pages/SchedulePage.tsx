import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  SCHEDULE_TYPES,
  type Schedule,
  type SchedulePayload,
  type ScheduleType,
  updateSchedule,
} from "../api/schedules";
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  type TeamMember,
  type TeamMemberPayload,
  updateTeamMember,
} from "../api/teamMembers";

type ViewMode = "week" | "month";

type MemberForm = TeamMemberPayload & { id?: number };

type ScheduleForm = {
  id?: number;
  member_id: string;
  title: string;
  type: ScheduleType;
  starts_at: string;
  ends_at: string;
  memo: string;
};

const emptyMemberForm: MemberForm = { name: "", role: "", department: "" };

const now = new Date();
const currentHour = String(now.getHours()).padStart(2, "0");
const nextHour = String(Math.min(now.getHours() + 1, 23)).padStart(2, "0");

function toDateInput(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toDateTimeInput(date: Date, time = "09:00"): string {
  return `${toDateInput(date)}T${time}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(value));
}

function formatTimeRange(schedule: Schedule): string {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(schedule.starts_at))} - ${formatter.format(new Date(schedule.ends_at))}`;
}

function getMonthCells(monthCursor: Date): Date[] {
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const firstCell = startOfWeek(monthStart);
  const cells: Date[] = [];
  let cursor = firstCell;

  while (cells.length < 42 || cursor <= monthEnd) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return cells.slice(0, 42);
}

function scheduleToForm(schedule: Schedule): ScheduleForm {
  return {
    id: schedule.id,
    member_id: String(schedule.member_id),
    title: schedule.title,
    type: schedule.type,
    starts_at: schedule.starts_at.slice(0, 16),
    ends_at: schedule.ends_at.slice(0, 16),
    memo: schedule.memo,
  };
}

export function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(new Date());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    member_id: "",
    title: "",
    type: "근무",
    starts_at: toDateTimeInput(now, `${currentHour}:00`),
    ends_at: toDateTimeInput(now, `${nextHour}:00`),
    memo: "",
  });
  const [memberFilter, setMemberFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const range = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(cursorDate);
      return { from: toDateInput(start), to: toDateInput(addDays(start, 6)) };
    }

    return {
      from: toDateInput(startOfMonth(cursorDate)),
      to: toDateInput(endOfMonth(cursorDate)),
    };
  }, [cursorDate, viewMode]);

  const loadMembers = async () => {
    const data = await fetchTeamMembers();
    setMembers(data);
  };

  const loadSchedules = async () => {
    const data = await fetchSchedules({
      from: range.from,
      to: range.to,
      memberId: memberFilter ? Number(memberFilter) : undefined,
      type: typeFilter || undefined,
    });
    setSchedules(data);
  };

  useEffect(() => {
    setIsLoading(true);
    setMessage("");
    Promise.all([loadMembers(), loadSchedules()])
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [range.from, range.to, memberFilter, typeFilter]);

  const resetScheduleForm = () => {
    const baseDate = viewMode === "month" ? cursorDate : new Date();
    setScheduleForm({
      member_id: members[0] ? String(members[0].id) : "",
      title: "",
      type: "근무",
      starts_at: toDateTimeInput(baseDate, "09:00"),
      ends_at: toDateTimeInput(baseDate, "18:00"),
      memo: "",
    });
  };

  const handleMemberSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (memberForm.id) {
        await updateTeamMember(memberForm.id, memberForm);
        setMessage("팀원 정보를 수정했습니다.");
      } else {
        await createTeamMember(memberForm);
        setMessage("팀원을 등록했습니다.");
      }
      setMemberForm(emptyMemberForm);
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "팀원 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!window.confirm(`${member.name} 팀원을 삭제할까요? 기존 일정 기록은 유지됩니다.`)) {
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      await deleteTeamMember(member.id);
      setMessage("팀원을 삭제했습니다.");
      if (memberFilter === String(member.id)) {
        setMemberFilter("");
      }
      await Promise.all([loadMembers(), loadSchedules()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "팀원 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const toSchedulePayload = (): SchedulePayload => ({
    member_id: Number(scheduleForm.member_id),
    title: scheduleForm.title,
    type: scheduleForm.type,
    starts_at: scheduleForm.starts_at,
    ends_at: scheduleForm.ends_at,
    memo: scheduleForm.memo,
  });

  const handleScheduleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (scheduleForm.id) {
        await updateSchedule(scheduleForm.id, toSchedulePayload());
        setMessage("일정을 수정했습니다.");
      } else {
        await createSchedule(toSchedulePayload());
        setMessage("일정을 등록했습니다.");
      }
      resetScheduleForm();
      await loadSchedules();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "일정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (!window.confirm(`${schedule.title} 일정을 삭제할까요?`)) {
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      await deleteSchedule(schedule.id);
      setMessage("일정을 삭제했습니다.");
      await loadSchedules();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "일정 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveRange = (amount: number) => {
    setCursorDate((current) => {
      if (viewMode === "week") {
        return addDays(current, amount * 7);
      }

      return new Date(current.getFullYear(), current.getMonth() + amount, 1);
    });
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [cursorDate]);

  const monthCells = useMemo(() => getMonthCells(cursorDate), [cursorDate]);

  return (
    <div className="schedule-workspace">
      <section className="schedule-toolbar panel">
        <div>
          <h2>팀원 일정 관리</h2>
          <p className="muted">팀원을 등록하고 휴가, 근무, 출장 일정을 주간/월간으로 확인합니다.</p>
        </div>
        <div className="toolbar-actions">
          <div className="segmented-control" aria-label="일정 보기 방식">
            <button className={viewMode === "week" ? "active" : ""} type="button" onClick={() => setViewMode("week")}>
              주간 표
            </button>
            <button className={viewMode === "month" ? "active" : ""} type="button" onClick={() => setViewMode("month")}>
              월간 캘린더
            </button>
          </div>
          <button type="button" className="ghost-button" onClick={() => moveRange(-1)}>
            이전
          </button>
          <strong className="range-label">
            {range.from} - {range.to}
          </strong>
          <button type="button" className="ghost-button" onClick={() => moveRange(1)}>
            다음
          </button>
        </div>
      </section>

      {message && <p className="inline-message">{message}</p>}

      <div className="schedule-layout">
        <aside className="panel schedule-side">
          <h2>팀원 관리</h2>
          <form className="stacked-form" onSubmit={handleMemberSubmit}>
            <label>
              이름
              <input
                value={memberForm.name}
                onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })}
                placeholder="홍길동"
              />
            </label>
            <label>
              직무
              <input
                value={memberForm.role}
                onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}
                placeholder="민원 담당"
              />
            </label>
            <label>
              부서
              <input
                value={memberForm.department}
                onChange={(event) => setMemberForm({ ...memberForm, department: event.target.value })}
                placeholder="행정지원팀"
              />
            </label>
            <div className="form-actions">
              <button type="submit" disabled={isLoading}>
                {memberForm.id ? "수정" : "등록"}
              </button>
              {memberForm.id && (
                <button type="button" className="secondary-button" onClick={() => setMemberForm(emptyMemberForm)}>
                  취소
                </button>
              )}
            </div>
          </form>

          <div className="member-list">
            {members.length === 0 ? (
              <p className="muted">등록된 팀원이 없습니다.</p>
            ) : (
              members.map((member) => (
                <article key={member.id} className="member-row">
                  <div>
                    <strong>{member.name}</strong>
                    <span>
                      {[member.department, member.role].filter(Boolean).join(" / ") || "상세 정보 없음"}
                    </span>
                  </div>
                  <div>
                    <button type="button" onClick={() => setMemberForm(member)}>
                      수정
                    </button>
                    <button type="button" className="danger-button" onClick={() => handleDeleteMember(member)}>
                      삭제
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>

        <main className="schedule-main">
          <section className="panel schedule-form-panel">
            <div className="section-heading compact">
              <div>
                <h2>{scheduleForm.id ? "일정 수정" : "일정 등록"}</h2>
                <p>팀원과 일정 유형을 선택해 공유 일정을 저장합니다.</p>
              </div>
            </div>
            <form className="schedule-form" onSubmit={handleScheduleSubmit}>
              <label>
                제목
                <input
                  value={scheduleForm.title}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })}
                  placeholder="오전 민원 근무"
                />
              </label>
              <label>
                팀원
                <select
                  value={scheduleForm.member_id}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, member_id: event.target.value })}
                  disabled={members.length === 0}
                >
                  <option value="">{members.length === 0 ? "팀원을 먼저 등록하세요" : "팀원 선택"}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                유형
                <select
                  value={scheduleForm.type}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, type: event.target.value as ScheduleType })
                  }
                >
                  {SCHEDULE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                시작
                <input
                  type="datetime-local"
                  value={scheduleForm.starts_at}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, starts_at: event.target.value })}
                />
              </label>
              <label>
                종료
                <input
                  type="datetime-local"
                  value={scheduleForm.ends_at}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, ends_at: event.target.value })}
                />
              </label>
              <label className="wide-field">
                메모
                <textarea
                  value={scheduleForm.memo}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, memo: event.target.value })}
                  placeholder="공유할 참고 사항"
                />
              </label>
              <div className="form-actions wide-field">
                <button type="submit" disabled={isLoading || members.length === 0}>
                  {scheduleForm.id ? "일정 수정" : "일정 등록"}
                </button>
                {scheduleForm.id && (
                  <button type="button" className="secondary-button" onClick={resetScheduleForm}>
                    신규 입력
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel filter-panel">
            <label>
              팀원 필터
              <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
                <option value="">전체 팀원</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              유형 필터
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">전체 유형</option>
                {SCHEDULE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            {isLoading && <span className="muted">불러오는 중...</span>}
          </section>

          {viewMode === "week" ? (
            <section className="panel">
              <h2>주간 일정표</h2>
              <div className="table-wrap">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>시간</th>
                      <th>팀원</th>
                      <th>유형</th>
                      <th>제목</th>
                      <th>메모</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr>
                        <td colSpan={7}>조회된 일정이 없습니다.</td>
                      </tr>
                    ) : (
                      schedules.map((schedule) => (
                        <tr key={schedule.id}>
                          <td>{formatDateLabel(schedule.starts_at)}</td>
                          <td>{formatTimeRange(schedule)}</td>
                          <td>{schedule.member_name}</td>
                          <td>
                            <span className="type-badge">{schedule.type}</span>
                          </td>
                          <td>{schedule.title}</td>
                          <td>{schedule.memo || "-"}</td>
                          <td>
                            <div className="row-actions">
                              <button type="button" onClick={() => setScheduleForm(scheduleToForm(schedule))}>
                                수정
                              </button>
                              <button type="button" className="danger-button" onClick={() => handleDeleteSchedule(schedule)}>
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="panel">
              <h2>월간 캘린더</h2>
              <div className="calendar-grid">
                {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                  <div className="calendar-head" key={day}>
                    {day}
                  </div>
                ))}
                {monthCells.map((day) => {
                  const dayKey = toDateInput(day);
                  const daySchedules = schedules.filter((schedule) => schedule.starts_at.slice(0, 10) === dayKey);
                  const isMuted = day.getMonth() !== cursorDate.getMonth();

                  return (
                    <div className={`calendar-cell ${isMuted ? "muted-cell" : ""}`} key={dayKey}>
                      <strong>{day.getDate()}</strong>
                      <div className="calendar-events">
                        {daySchedules.map((schedule) => (
                          <button key={schedule.id} type="button" onClick={() => setScheduleForm(scheduleToForm(schedule))}>
                            <span>{schedule.type}</span>
                            {schedule.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
