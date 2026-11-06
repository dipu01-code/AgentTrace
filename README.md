# AgentTrace

Mobile observability debugger for multi-agent AI workflows. Trace, debug, and replay non-deterministic agent runs on your phone.

## What it does

Multi-agent AI workflows are non-deterministic, stateful, and prone to infinite loops — making them hard to debug with traditional tools. AgentTrace gives you a mobile app to:

- **See your agent graph** — workflow events as color-coded nodes and edges
- **Spot infinite loops** — loop detector with chain visualization
- **Inspect state changes** — before/after diffs for every event
- **Replay traces** — scrubbable timeline slider with playback controls

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo SDK 58 |
| Language | TypeScript |
| Navigation | React Navigation |
| State | Zustand |
| Animations | Reanimated + Gesture Handler |
| Graph | React Native SVG |
| Backend | FastAPI (Python) |
| Database | MongoDB |

## Quick start

### 1. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`.

### 2. Start the app

```bash
npm install
npx expo start
```

Press `i` (iOS), `a` (Android), or scan the QR code with the Expo Go app on your phone.

> Make sure MongoDB is running locally at `mongodb://localhost:27017` (or update `MONGODB_URL` in `backend/.env`).

## How to use

1. **Create a run** — tap the `+` button on the Timeline screen
2. **Ingest events** — send agent events to `POST /api/v1/runs/{run_id}/events`
3. **View the graph** — tap any run to see its agent interaction graph
4. **Check for loops** — open the Loop Detector screen
5. **Replay** — use the Replay scrubber to step through events chronologically

Example event payload:

```json
{
  "agent_id": "agent-1",
  "agent_name": "Planner",
  "type": "tool_call",
  "timestamp": 1730500000,
  "latency_ms": 245,
  "payload": { "tool": "web_search", "query": "..." },
  "parent_id": "event-abc"
}
```

## Development status

This is a 24-phase build. Completed:

| # | Phase | Status |
|---|-------|--------|
| 1 | Expo + TypeScript scaffolding | ✅ |
| 2 | React Navigation | ✅ |
| 3 | Zustand state store | ✅ |
| 4 | FastAPI backend | ✅ |
| 5 | MongoDB models | ✅ |
| 6 | Run ingestion endpoints | ✅ |
| 7 | Event validation | ✅ |
| 8 | Timeline list view | ✅ |
| 9 | Workflow graph (SVG) | ✅ |
| 10 | Animation layer (Reanimated) | ✅ |
| 11 | Infinite loop detector | ✅ |
| 12 | State diff viewer | ✅ |
| 13 | Replay scrubber | ✅ |
| 14–24 | Remaining phases | ⏳ |

See [`PHASES.md`](PHASES.md) for the full plan.

## License

[MIT](LICENSE)

**Repository:** https://github.com/dipu01-code/AgentTrace
