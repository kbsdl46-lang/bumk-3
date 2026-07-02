from __future__ import annotations

from datetime import date, timedelta
import os

from app.services.news_service import collect_policy_news


_scheduler = None


def start_news_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    if os.environ.get("DISABLE_NEWS_SCHEDULER") == "1":
        return

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
    except ImportError:
        return

    scheduler = BackgroundScheduler(timezone="Asia/Seoul")
    scheduler.add_job(
        _collect_yesterday,
        CronTrigger(hour=9, minute=0),
        id="collect_policy_news_yesterday",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    _scheduler = scheduler


def stop_news_scheduler() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None


def _collect_yesterday() -> None:
    collect_policy_news(date.today() - timedelta(days=1))
