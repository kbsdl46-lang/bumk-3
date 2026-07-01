import { useEffect, useState } from "react";
import { fetchHealth, type HealthResponse } from "../api/health";

type LoadState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export function HealthCheckPanel() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    fetchHealth()
      .then((data) => setState({ status: "success", data }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  if (state.status === "loading") {
    return (
      <section className="panel">
        <h2>FE-BE 연동확인</h2>
        <p className="muted">API 상태를 확인하는 중입니다.</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel">
        <h2>FE-BE 연동확인</h2>
        <p className="status error">연동 실패</p>
        <p className="muted">{state.message}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>FE-BE 연동확인</h2>
      <div className="health-grid">
        <div>
          <span>API</span>
          <strong>{state.data.api}</strong>
        </div>
        <div>
          <span>DB</span>
          <strong>{state.data.database.status}</strong>
        </div>
        <div>
          <span>SQLite</span>
          <strong>{state.data.database.sqlite_version}</strong>
        </div>
      </div>
      <p className="muted">DB 파일: {state.data.database.path}</p>
    </section>
  );
}
