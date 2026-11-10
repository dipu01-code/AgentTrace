# AgentTrace

Mobile observability debugger for multi-agent AI workflows. Trace, debug, and replay non-deterministic agent runs on your phone.

## What it does

Multi-agent AI workflows are non-deterministic, stateful, and prone to infinite loops, which makes them hard to debug with traditional tools. Your agents post events to the AgentTrace API; the app lets you:

- **See the agent graph**: agents as nodes, hand-offs between them as weighted edges
- **Catch loops**: finds back-to-back repeats of the same agent call (and events your framework flags as `loop_detected`)
- **Inspect state changes**: before/after diffs
- **Replay runs**: scrub through a run's timeline or play it back at 1–10×
- **Check determinism**: compare two runs by order + agent + type + payload (timestamps ignored)
- **Regression tests**: store pass/fail comparisons between a baseline run and a new one
- **Spot bloat**: repeated calls, redundant state writes, excess LLM calls
- **Export / share** a run as a link or JSON
- **Cloud sync**: upload recorded events; the server validates each one and skips duplicates
- **Stuck-run alerts**: notifications when a run is looping or stops producing events
- Light / dark / system theme

## Tech stack

| Layer | Technology |
|-------|------------|
| App | React Native 0.88 + Expo SDK 58, TypeScript |
| Navigation | React Navigation (native stack, deep links `agenttrace://run/<id>`) |
| State | Zustand, persisted with AsyncStorage |
| Animations | Reanimated 4 + Gesture Handler |
| Graph | react-native-svg |
| Notifications | expo-notifications |
| Backend | FastAPI (Python 3.10+), Motor |
| Database | MongoDB |
| Tests | pytest (API), Jest (unit), Detox (iOS E2E) |

## Quick start

Prerequisites: Node 22, Python 3.10+, MongoDB on `localhost:27017`, Xcode (iOS) or Android Studio.

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # optional; defaults work for local dev
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs · Tests: `python -m pytest` (uses a throwaway `agenttrace_test` database).

### 2. App

```bash
npm install
npx expo run:ios      # or: npx expo run:android
```

The app finds the backend on the same machine Metro runs on. To point it elsewhere: `EXPO_PUBLIC_API_URL=https://api.example.com npx expo start`.

Sign up in the app. Everything except event ingestion requires a login.

### 3. Send events from your agents

```bash
RUN=$(curl -s -X POST localhost:8000/api/v1/runs/ -H 'Content-Type: application/json' -d '{"name":"my run"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

curl -X POST localhost:8000/api/v1/runs/$RUN/events -H 'Content-Type: application/json' -d '{
  "agent_id": "agent-1", "agent_name": "Planner", "type": "tool_call",
  "timestamp": '"$(date +%s)"', "latency_ms": 245,
  "payload": { "tool": "web_search", "query": "..." }
}'

# Mark it finished (otherwise it is reported as stuck after 10 idle minutes)
curl -X PATCH localhost:8000/api/v1/runs/$RUN -H 'Content-Type: application/json' -d '{"status":"completed"}'
```

Event `type` is one of `agent_start, agent_end, tool_call, tool_result, llm_call, llm_result, state_change, loop_detected, error`. Use `/events/batch` to post many at once.

## Tests

```bash
cd backend && .venv/bin/python -m pytest     # API + analysis (needs MongoDB)
npm test                                     # unit tests
npm run typecheck
# iOS E2E (needs backend running + `brew tap wix/brew && brew install applesimutils`)
npm run e2e:build && npm run e2e:test
```

## Deploy

**Backend:** `JWT_SECRET=$(openssl rand -base64 48) docker compose up --build` runs the API and MongoDB. With `APP_ENV=production` the API refuses to start without a real `JWT_SECRET`.

**App:** `eas init` once to link an Expo project, set `EXPO_PUBLIC_API_URL` per profile in `eas.json`, then `eas build -p ios --profile preview` (or `production`, then `eas submit`). Remote push alerts need the EAS project ID; without it the app falls back to polling while open.

## Status

All 24 phases are implemented; see [`PHASES.md`](PHASES.md).

## License

[MIT](LICENSE)

**Repository:** https://github.com/dipu01-code/AgentTrace
