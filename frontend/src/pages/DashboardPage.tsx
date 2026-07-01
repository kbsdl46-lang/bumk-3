import { HealthCheckPanel } from "../components/HealthCheckPanel";

const summaries = [
  { label: "오늘 일정", value: "0건", detail: "일정 API 연결 예정" },
  { label: "엑셀 작업", value: "0건", detail: "업로드 처리 대기" },
  { label: "민원 응대", value: "0건", detail: "매뉴얼 업로드 예정" },
  { label: "수집 뉴스", value: "0건", detail: "수집 배치 연결 예정" },
];

export function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="summary-grid">
        {summaries.map((summary) => (
          <article className="summary-card" key={summary.label}>
            <span>{summary.label}</span>
            <strong>{summary.value}</strong>
            <p>{summary.detail}</p>
          </article>
        ))}
      </section>
      <HealthCheckPanel />
    </div>
  );
}
