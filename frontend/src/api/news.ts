export type NewsArticle = {
  id: number;
  title: string;
  subtitle: string;
  publisher: string;
  published_at: string;
  url: string;
  summary: string;
  content: string;
  keyword: string;
  source: string;
  collected_for_date: string;
  collected_at: string;
  created_at: string;
};

export type NewsCollectionRun = {
  id: number;
  target_date: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  inserted_count: number;
  skipped_count: number;
  error_message: string | null;
};

export type CollectNewsResult = {
  run_id: number;
  target_date: string;
  status: string;
  inserted_count: number;
  skipped_count: number;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(body.detail ?? "Request failed.");
  }

  return response.json();
}

export async function fetchNewsArticles(date: string): Promise<NewsArticle[]> {
  const search = new URLSearchParams();
  if (date) {
    search.set("date", date);
  }
  const data = await readJson<{ items: NewsArticle[] }>(await fetch(`/api/news/articles?${search}`));
  return data.items;
}

export async function collectNews(date: string): Promise<CollectNewsResult> {
  return readJson<CollectNewsResult>(
    await fetch("/api/news/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    }),
  );
}

export async function fetchNewsRuns(): Promise<NewsCollectionRun[]> {
  const data = await readJson<{ items: NewsCollectionRun[] }>(await fetch("/api/news/runs?limit=5"));
  return data.items;
}
