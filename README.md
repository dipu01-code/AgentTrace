# 🕸️ AgentTrace

**Multi-agent AI workflow debugger & observability tool for React Native + Expo.** Trace, debug, and replay non-deterministic agent workflows with loop detection, state diffs, replay scrubbing, and determinism checking.

[![GitHub stars](https://img.shields.io/github/stars/dipu01-code/AgentTrace?style=social)](https://github.com/dipu01-code/AgentTrace/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/dipu01-code/AgentTrace?style=social)](https://github.com/dipu01-code/AgentTrace/network/members)
[![GitHub issues](https://img.shields.io/github/issues/dipu01-code/AgentTrace)](https://github.com/dipu01-code/AgentTrace/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/dipu01-code/AgentTrace)](https://github.com/dipu01-code/AgentTrace/pulls)
[![GitHub license](https://img.shields.io/github/license/dipu01-code/AgentTrace)](LICENSE)
[![React Native 0.88.1](https://img.shields.io/badge/React_Native-0.88.1-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo SDK 58](https://img.shields.io/badge/Expo_SDK-58-000020?logo=expo)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.14](https://img.shields.io/badge/Python-3.14-3776AB?logo=python)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-4EA94B?logo=mongodb)](https://www.mongodb.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📊 Project Snapshot

![AgentTrace GitHub stats](https://github-readme-stats.vercel.app/api?username=dipu01-code&repo=AgentTrace&show_icons=true&title_color=2ecc71&text_color=1f1f1f&bg_color=ffffff&hide_border=true)

![Top languages](https://github-readme-stats.vercel.app/api/top-langs/?username=dipu01-code&repo=AgentTrace&layout=compact&title_color=2ecc71&text_color=1f1f1f&bg_color=ffffff&hide_border=true)

![Contribution graph](https://github-readme-activity-graph.vercel.app/graph?username=dipu01-code&theme=github-dark&hide_border=true)

---

## 🎯 What it solves

Multi-agent AI workflows are non-deterministic, stateful, and prone to costly infinite loops and code bloat, making debugging, reproducibility, and regression testing nearly impossible with traditional developer tools. AgentTrace gives you a mobile observability layer to:

- 🔍 **Visualize agent interaction graphs** — SVG workflow graph, color-coded by event type
- 🔄 **Detect infinite loops in real time** — loop count badge + chain visualization
- 🧮 **Diff state changes across events** — before/after state inspection
- ⏮️ **Replay workflow traces** — scrubbable timeline slider + playback controls
- ⚖️ **Compare runs for determinism / regression testing** — side-by-side run diffs
- 📤 **Export and share debug sessions** — JSON trace export

---

## 🧩 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.88.1 |
| App shell | Expo | SDK 58 |
| Language | TypeScript | ~6.0.3 |
| React | React | 19.3.0 |
| Navigation | React Navigation (native-stack) | ^7.0.0 |
| State | Zustand | ^4.5.0 |
| Animations | Reanimated + Gesture Handler | ^4.0.0 / ~3.3.0 |
| Graph rendering | React Native SVG | ^15.0.0 |
| Icons | lucide-react-native | ^1.0.0 |
| Backend framework | FastAPI | ^0.115.0 |
| Backend language | Python | 3.14 |
| Database | MongoDB (Motor async driver) | pymongo 4.19 / motor 3.7.1 |
| Config | Pydantic Settings | ^2.3.0 |
| ASGI server | Uvicorn | ^0.30.0 |

---

## 📁 Project Structure

<details>
<summary>📂 Click to expand the full file tree</summary>

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

</details>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.13+ (required by Expo SDK 58)
- **Python** 3.10+
- **MongoDB** running locally at `mongodb://localhost:27017` (or update `MONGODB_URL` in `backend/.env`)
- **Expo Go** app on your phone (iOS App Store / Google Play), or iOS Simulator / Android Emulator

### 1️⃣ Clone the repository

```bash
git clone https://github.com/dipu01-code/AgentTrace.git
cd AgentTrace
```

### 2️⃣ Start the backend (FastAPI + MongoDB)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # macOS/Linux   |   .venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`:
- `GET /health` — health check
- `POST /api/v1/runs/` — create a workflow run
- `GET /api/v1/runs/{run_id}` — get a run by ID
- `POST /api/v1/runs/{run_id}/events` — ingest an agent event
- `GET /api/v1/runs/{run_id}/events` — list events for a run
- `POST /api/v1/validate/` — validate an event schema
- `GET /docs` — interactive Swagger UI

### 3️⃣ Start the frontend (Expo)

```bash
cd /Users/dipu/AgentTrace   # repo root
npm install
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Or scan the QR code with the Expo Go app on your physical device

The frontend connects to `http://localhost:8000` (iOS simulator) or `http://10.0.2.2:8000` (Android emulator).

---

## 📖 How to Use

### 1. Create a workflow run
On the Timeline screen, tap the `+` FAB button. A new run is created via `POST /api/v1/runs/` and appears in the list.

### 2. View the timeline
The Timeline screen lists all workflow runs with run name/status, total event count, loop-count badge (red if loops detected), and animated entrance (fade + slide, staggered by index).

### 3. View the workflow graph
Tap any run to open Graph view — agent events rendered as colored nodes connected by dashed edges:
- `agent_start` / `agent_end` — blue / green
- `tool_call` / `tool_result` — purple / cyan
- `llm_call` / `llm_result` — orange / red
- `state_change` — teal
- `loop_detected` / `error` — red

### 4. Detect infinite loops
Loop Detector screen filters `loop_detected` events and shows loop-count stat card, loop-event list, and loop-chain visualization.

### 5. Ingest agent events

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
The Replay view provides a scrubbable timeline slider and playback controls to step through events chronologically.

---

## 🖼️ Screenshots

<details>
<summary>📸 Click to expand screenshots</summary>

| Timeline | Graph view | Replay scrubber | Loop detector |
|----------|-----------|-----------------|---------------|
| ![Timeline](docs/screenshots/timeline.png) | ![Graph](docs/screenshots/graph.png) | ![Replay](docs/screenshots/replay.png) | ![Loops](docs/screenshots/loops.png) |

_Add screenshots under `docs/screenshots/` and update the links above._

</details>

---

## ⚙️ Environment Variables

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

## 🛠️ Build & Deploy

### EAS Build (Expo)

```bash
npx eas-cli@latest build --platform all
```

### EAS Submit

```bash
npx eas-cli@latest submit --platform all
```

---

## 🗓️ Development Phases (24-phase plan)

Current status — check the boxes below as you complete each phase:

- [x] 1 | Expo + TypeScript scaffolding
- [x] 2 | React Navigation setup
- [x] 3 | Zustand state store
- [x] 4 | FastAPI backend skeleton
- [x] 5 | MongoDB database models
- [x] 6 | Workflow run ingestion endpoint
- [x] 7 | Agent event schema & validation
- [x] 8 | Timeline list view
- [x] 9 | Workflow graph visualization (SVG)
- [x] 10 | Animation UI layer (Reanimated + Gesture Handler)
- [x] 11 | Infinite loop detector UI
- [ ] 12 | State diff viewer
- [ ] 13 | Replay scrubber / timeline slider
- [ ] 14 | Determinism checker
- [ ] 15 | Regression test runner UI
- [ ] 16 | Code bloat analyzer
- [ ] 17 | Export / share debug sessions
- [ ] 18 | Auth (login/signup)
- [ ] 19 | Cloud sync
- [ ] 20 | Push notifications
- [ ] 21 | Dark mode + theming
- [ ] 22 | Performance optimization
- [ ] 23 | E2E tests (Detox)
- [ ] 24 | EAS build & deployment

Full details: [`PHASES.md`](PHASES.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: description"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE)

---

## 🙌 Support

If you find AgentTrace useful, please ⭐ star the repo and share it with your team.

**Repository:** https://github.com/dipu01-code/AgentTrace  
**Maintainer:** [dipu01-code](https://github.com/dipu01-code)
