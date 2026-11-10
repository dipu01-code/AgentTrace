import asyncio
import json
import urllib.request
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.v1.endpoints.auth import require_auth
from app.core.config import settings
from app.crud.workflow import find_stuck_runs, mark_runs_notified
from app.db.database import DatabaseUnavailable, get_database

router = APIRouter()


class PushTokenIn(BaseModel):
    token: str = Field(..., pattern=r"^Expo(nent)?PushToken\[.+\]$")


@router.post("/notifications/register", summary="Register an Expo push token for stuck-run alerts")
async def register_push_token(body: PushTokenIn, user=Depends(require_auth)):
    await get_database().push_tokens.update_one(
        {"token": body.token},
        {"$set": {"token": body.token, "user_id": str(user["_id"]), "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"registered": True}


@router.delete("/notifications/register", summary="Stop sending pushes to this token")
async def unregister_push_token(body: PushTokenIn, user=Depends(require_auth)):
    await get_database().push_tokens.delete_one({"token": body.token, "user_id": str(user["_id"])})
    return {"registered": False}


def _send_expo_push(messages: List[dict]) -> None:
    req = urllib.request.Request(
        settings.EXPO_PUSH_URL,
        data=json.dumps(messages).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    urllib.request.urlopen(req, timeout=10).read()


async def notify_stuck_runs_once() -> int:
    """Push one alert per newly-stuck run to every registered device. Returns runs alerted."""
    runs = await find_stuck_runs(settings.STUCK_AFTER_MINUTES, only_unnotified=True)
    if not runs:
        return 0
    tokens = [doc["token"] async for doc in get_database().push_tokens.find({}, {"token": 1})]
    # shortcut: every registered device gets every alert; scope tokens to run owners once runs have owners.
    if len(runs) == 1:
        run = runs[0]
        alert = {
            "title": "Workflow looping" if run.status == "looping" else "Workflow stuck",
            "body": f"{run.name}: no progress for {settings.STUCK_AFTER_MINUTES}+ min"
            if run.status == "running" else f"{run.name} is repeating itself",
            "data": {"runId": run.id},
        }
    else:  # one summary instead of a burst
        alert = {
            "title": f"{len(runs)} workflows need attention",
            "body": ", ".join(r.name for r in runs[:3]),
            "data": {},
        }
    # channelId matches the high-importance channel the Android app creates (ignored on iOS).
    messages = [{"to": token, "channelId": "stuck-runs", "priority": "high", **alert} for token in tokens]
    for start in range(0, len(messages), 100):  # Expo accepts up to 100 per request
        await asyncio.to_thread(_send_expo_push, messages[start:start + 100])
    await mark_runs_notified([r.id for r in runs])
    return len(runs)


async def stuck_run_watcher():
    while True:
        await asyncio.sleep(settings.STUCK_CHECK_INTERVAL_SECONDS)
        try:
            await notify_stuck_runs_once()
        except DatabaseUnavailable:
            pass
        except Exception as exc:  # keep the watcher alive; push failures retry next tick
            print(f"[agenttrace] stuck-run push failed: {exc}")
