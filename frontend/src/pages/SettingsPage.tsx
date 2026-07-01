import { PageSection } from "../components/PageSection";

export function SettingsPage() {
  return (
    <PageSection
      title="설정"
      description="팀원, 뉴스 키워드, 민원 매뉴얼 등 운영 데이터를 관리합니다."
      items={["팀원 관리", "뉴스 키워드 관리", "민원 매뉴얼 관리"]}
    />
  );
}
