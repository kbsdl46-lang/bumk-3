import { PageSection } from "../components/PageSection";

export function ExcelAutomationPage() {
  return (
    <PageSection
      title="엑셀 업무 자동화"
      description="특정 컬럼 기준 분리와 동일 헤더 파일 병합을 처리할 업무 화면입니다."
      items={["엑셀 파일 업로드", "헤더 분석 및 컬럼 선택", "분리/병합 결과 다운로드"]}
    />
  );
}
