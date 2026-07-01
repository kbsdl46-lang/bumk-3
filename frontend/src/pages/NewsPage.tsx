import { PageSection } from "../components/PageSection";

export function NewsPage() {
  return (
    <PageSection
      title="뉴스 기사 수집"
      description="공공 행정 관련 뉴스를 키워드 기반으로 수집하고 조회합니다."
      items={["뉴스 키워드 관리", "수동 수집 실행", "최신 기사 목록 및 필터"]}
    />
  );
}
