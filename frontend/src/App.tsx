import { useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { SchedulePage } from "./pages/SchedulePage";
import { ExcelAutomationPage } from "./pages/ExcelAutomationPage";
import { ComplaintChatbotPage } from "./pages/ComplaintChatbotPage";
import { NewsPage } from "./pages/NewsPage";
import { SettingsPage } from "./pages/SettingsPage";

type PageKey = "dashboard" | "schedules" | "excel" | "complaints" | "news" | "settings";

const pages: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "대시보드" },
  { key: "schedules", label: "일정 관리" },
  { key: "excel", label: "엑셀 자동화" },
  { key: "complaints", label: "민원 챗봇" },
  { key: "news", label: "뉴스 수집" },
  { key: "settings", label: "설정" },
];

function renderPage(activePage: PageKey) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage />;
    case "schedules":
      return <SchedulePage />;
    case "excel":
      return <ExcelAutomationPage />;
    case "complaints":
      return <ComplaintChatbotPage />;
    case "news":
      return <NewsPage />;
    case "settings":
      return <SettingsPage />;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">행</span>
          <div>
            <strong>행정업무 슈퍼앱</strong>
            <span>Public Admin Workspace</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="주요 메뉴">
          {pages.map((page) => (
            <button
              key={page.key}
              className={page.key === activePage ? "active" : ""}
              type="button"
              onClick={() => setActivePage(page.key)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">공공직군 행정업무</p>
            <h1>{pages.find((page) => page.key === activePage)?.label}</h1>
          </div>
          <span className="env-badge">Scaffold</span>
        </header>
        {renderPage(activePage)}
      </main>
    </div>
  );
}
