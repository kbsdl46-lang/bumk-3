import { PageSection } from "../components/PageSection";

export function SchedulePage() {
  return (
    <PageSection
      title="팀원 스케쥴 관리"
      description="휴가, 근무, 출장 등 팀 일정을 공유하는 캘린더 영역입니다."
      items={["월간/주간/일간 캘린더 뷰", "일정 등록/수정/삭제", "팀원 및 일정 유형 필터"]}
    />
  );
}
