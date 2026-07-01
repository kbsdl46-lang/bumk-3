import { PageSection } from "../components/PageSection";

export function ComplaintChatbotPage() {
  return (
    <PageSection
      title="민원 대응 챗봇"
      description="민원 매뉴얼 기반으로 대응 방향과 응대 스크립트 초안을 작성합니다."
      items={["민원 매뉴얼 업로드", "민원 내용 입력", "근거 기반 응대 초안 생성"]}
    />
  );
}
