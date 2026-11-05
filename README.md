# AgentTrace

Multi-agent AI workflow debugger and observability tool for React Native + Expo mobile apps. Trace, debug, and replay non-deterministic agent workflows with loop detection, state diffs, replay scrubbing, and determinism checking.

## What it solves

Multi-agent AI workflows are non-deterministic, stateful, and prone to costly infinite loops and code bloat, making debugging, reproducibility, and regression testing nearly impossible with traditional developer tools. AgentTrace gives you a mobile observability layer to:

- Visualize agent interaction graphs
- Detect infinite loops in real time
- Diff state changes across events
- Replay workflow traces with a scrubbable timeline
- Compare runs for determinism/regression testing
- Export and share debug sessions

---

## Tech Stack

### Frontend (Mobile)
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.88.1 |
| App shell | Expo | SDK 58 |
| Language | TypeScript | ~6.0.3 |
| React | React | 19.3.0 |
| Navigation | React Navigation (native-stack) | ^7.0.0 |
| State management | Zustand | ^4.5.0 |
| Animations | Reanimated + Gesture Handler | ^4.0.0 / ~3.3.0 |
| Graph rendering | React Native SVG | ^15.0.0 |
| Icons | lucide-react-native | ^1.0.0 |

### Backend (API)
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | ^0.115.0 |
| Language | Python | 3.14 |
| Database | MongoDB (Motor async driver) | pymongo 4.19 / motor 3.7.1 |
| Config | Pydantic Settings | ^2.3.0 |
| ASGI server | Uvicorn | ^0.30.0 |
| API validation | Pydantic v2 | ^2.7.0 |

### Dev / CI
- EAS Build (Expo Application Services)
- Detox (E2E testing)
- Jest (unit tests)
- ESLint / Prettier

---

## Project Structure

```
AgentTrace/
├── App.tsx                      # Entry point (gesture-handler init + navigator)
├── app.json                     # Expo config (SDK 58, Reanimated plugin)
├── babel.config.js              # Babel (Reanimated plugin)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config (bundler resolution)
├── PHASES.md                    # 24-phase build tracker
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + MongoDB lifespan
│   │   ├── core/config.py       # Pydantic settings
│   │   ├── db/database.py       # Motor MongoDB connection
│   │   ├── models/schemas.py    # Pydantic models (runs, events, diffs)
│   │   ├── crud/workflow.py     # CRUD operations
│   │   ├── schemas/event_validation.py  # Event schema validation
│   │   └── api/v1/
│   │       ├── api.py           # Router assembly
│   │       └── endpoints/
│   │           ├── runs.py      # /api/v1/runs CRUD + events
│   │           └── validation.py# /api/v1/validate endpoints
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment config
└── src/
    ├── services/api.ts          # Frontend API client
    ├── hooks/usePulse.ts        # Reanimated pulse hook
    ├── components/
    │   ├── AnimatedRunCard.tsx  # Animated run list item
    │   └── AnimatedEventCard.tsx# Expandable event card
    ├── screens/
    │   ├── TimelineScreen.tsx   # Workflow run list
    │   ├── TimelineList.tsx     # Animated run cards (FlatList)
    │   ├── RunDetailScreen.tsx  # Run detail view
    │   ├── EventDetailScreen.tsx# Event detail view
    │   ├── GraphViewScreen.tsx  # SVG workflow graph
    │   ├── ReplayViewScreen.tsx # Replay scrubber
    │   └── LoopDetectorScreen.tsx# Infinite loop detector
    ├── navigation/
    │   ├── AppNavigator.tsx     # Stack navigator
    │   └── types.ts             # Navigation param types
    ├── store/useWorkflowStore.ts# Zustand state store
    └── types/index.ts           # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- **Node.js** 22.13+ (required by Expo SDK 58)
- **Python** 3.10+
- **MongoDB** running locally at `mongodb://localhost:27017` (or update `MONGODB_URL` in `backend/.env`)
- **Expo Go** app on your phone (iOS App Store / Google Play), or iOS Simulator / Android Emulator

### 1. Clone the repository

```bash
git clone https://github.com/dipu01-code/AgentTrace.git
cd AgentTrace
```

### 2. Start the backend (FastAPI + MongoDB)

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`:
- `GET /health` — health check
- `POST /api/v1/runs/` — create a workflow run
- `GET /api/v1/runs/{run_id}` — get a run by ID
- `POST /api/v1/runs/{run_id}/events` — ingest an agent event
- `GET /api/v1/runs/{run_id}/events` — list events for a run
- `POST /api/v1/runs/{run_id}/events/batch` — bulk ingest events
- `POST /api/v1/validate/` — validate an event schema
- `POST /api/v1/validate/batch` — validate multiple events
- `POST /api/v1/validate/runs/{run_id}/events/validated` — validate + persist
- `GET /docs` — interactive Swagger UI

### 3. Start the frontend (Expo)

```bash
cd /Users/dipu/AgentTrace   # (repo root)

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Or scan the QR code with the Expo Go app on your physical device

The frontend connects to `http://localhost:8000` (iOS simulator) or `http://10.0.2.2:8000` (Android emulator).

---

## How to Use

### 1. Create a workflow run
On the Timeline screen, tap the `+` FAB button. A new run is created via `POST /api/v1/runs/` and appears in the list.

### 2. View the timeline
The Timeline screen lists all workflow runs with:
- Run name and status (running / completed / failed / looping)
- Total event count
- Loop count (red badge if loops detected)
- Animated entrance (fade + slide, staggered by index)

### 3. View the workflow graph
Tap any run to open the Graph view. It renders agent events as colored nodes connected by dashed edges, color-coded by event type:
- `agent_start` / `agent_end` — blue / green
- `tool_call` / `tool_result` — purple / cyan
- `llm_call` / `llm_result` — orange / red
- `state_change` — teal
- `loop_detected` / `error` — red

### 4. Detect infinite loops
The Loop Detector screen filters events for `loop_detected` type and shows:
- Loop count stat card
- List of loop events with agent, type, timestamp, and payload preview
- Loop chain visualization (ordered chain of agents in the loop)

### 5. Ingest agent events
Send agent events to the backend from your multi-agent workflow:

```json
POST /api/v1/runs/{run_id}/events
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

Use `POST /api/v1/validate/` to validate an event schema before persisting.

### 6. Replay a run
The Replay view (Phase 13) provides a scrubbable timeline slider and playback controls to step through events chronologically.

---

## Environment Variables

Create `backend/.env`:

```env
APP_NAME=AgentTrace
APP_ENV=development
DEBUG=true
API_V1_STR=/api/v1
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=agenttrace
CORS_ORIGINS=["*"]
```

---

## Build & Deploy

### EAS Build (Expo)

```bash
npx eas-cli@latest build --platform all
```

### EAS Submit

```bash
npx eas-cli@latest submit --platform all
```

---

## Development Phases

The project is built in 24 phases. Current status (see `PHASES.md` for details):

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Expo + TypeScript scaffolding | ✅ Complete |
| 2 | React Navigation setup | ✅ Complete |
| 3 | Zustand state store | ✅ Complete |
| 4 | FastAPI backend skeleton | ✅ Complete |
| 5 | MongoDB database models | ✅ Complete |
| 6 | Workflow run ingestion endpoint | ✅ Complete |
| 7 | Agent event schema & validation | ✅ Complete |
| 8 | Timeline list view | ✅ Complete |
| 9 | Workflow graph visualization (SVG) | ✅ Complete |
| 10 | Animation UI layer (Reanimated + Gesture Handler) | ✅ Complete |
| 11 | Infinite loop detector UI | ✅ Complete |
| 12 | State diff viewer | ⏳ Pending |
| 13 | Replay scrubber / timeline slider | ⏳ Pending |
| 14 | Determinism checker | ⏳ Pending |
| 15 | Regression test runner UI | ⏳ Pending |
| 16 | Code bloat analyzer | ⏳ Pending |
| 17 | Export / share debug sessions | ⏳ Pending |
| 18 | Auth (login/signup) | ⏳ Pending |
| 19 | Cloud sync | ⏳ Pending |
| 20 | Push notifications | ⏳ Pending |
| 21 | Dark mode + theming | ⏳ Pending |
| 22 | Performance optimization | ⏳ Pending |
| 23 | E2E tests (Detox) | ⏳ Pending |
| 24 | EAS build & deployment | ⏳ Pending |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: description"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT

---

**Repository:** https://github.com/dipu01-code/AgentTrace
