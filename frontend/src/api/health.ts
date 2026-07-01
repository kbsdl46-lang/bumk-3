export type HealthResponse = {
  status: string;
  app: string;
  api: string;
  database: {
    status: string;
    sqlite_version: string;
    path: string;
  };
};

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}
