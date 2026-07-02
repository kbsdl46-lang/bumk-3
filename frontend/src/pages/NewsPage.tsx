import { FormEvent, useEffect, useState } from "react";
import {
  collectNews,
  fetchNewsArticles,
  fetchNewsRuns,
  type NewsArticle,
  type NewsCollectionRun,
} from "../api/news";

function toDateInput(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function yesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateInput(date);
}

export function NewsPage() {
  const [selectedDate, setSelectedDate] = useState(yesterday());
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [runs, setRuns] = useState<NewsCollectionRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadNews = async () => {
    const [articleItems, runItems] = await Promise.all([
      fetchNewsArticles(selectedDate),
      fetchNewsRuns(),
    ]);
    setArticles(articleItems);
    setRuns(runItems);
  };

  useEffect(() => {
    setIsLoading(true);
    setMessage("");
    loadNews()
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  const handleCollect = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await collectNews(selectedDate);
      setMessage(
        `Collection completed. Inserted ${result.inserted_count}, skipped ${result.skipped_count}.`,
      );
      await loadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Collection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel news-control-panel">
        <div className="section-heading">
          <div>
            <h2>Policy news collection</h2>
            <p>Collect Korea Policy Briefing articles for a selected publication date.</p>
          </div>
        </div>
        <form className="news-collect-form" onSubmit={handleCollect}>
          <label>
            Collection date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <button type="submit" disabled={isLoading || !selectedDate}>
            {isLoading ? "Collecting..." : "Collect articles"}
          </button>
        </form>
        {message && <p className="inline-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <h2>Collected articles</h2>
            <p>{selectedDate} articles saved in the local database.</p>
          </div>
          <strong className="count-badge">{articles.length}</strong>
        </div>
        <div className="news-list">
          {articles.length === 0 ? (
            <p className="muted">No articles have been collected for this date.</p>
          ) : (
            articles.map((article) => (
              <article className="news-row" key={article.id}>
                <div>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    {article.title}
                  </a>
                  <p>{article.summary || article.subtitle || "No summary available."}</p>
                </div>
                <dl>
                  <div>
                    <dt>Publisher</dt>
                    <dd>{article.publisher || "-"}</dd>
                  </div>
                  <div>
                    <dt>Published</dt>
                    <dd>{article.published_at}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <h2>Recent runs</h2>
            <p>Latest manual or scheduled collection attempts.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Inserted</th>
                <th>Skipped</th>
                <th>Started</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6}>No collection runs yet.</td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id}>
                    <td>{run.target_date}</td>
                    <td>{run.status}</td>
                    <td>{run.inserted_count}</td>
                    <td>{run.skipped_count}</td>
                    <td>{run.started_at}</td>
                    <td>{run.error_message || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
