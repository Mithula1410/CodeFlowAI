# CodeFlow AI - AI-Powered Code Workspace

CodeFlow AI is an advanced, production-ready SaaS application providing an AI-driven development environment for Code Generation, Code Review, Bug Scan Diagnostics, and Documentation. It features a dark-themed glassmorphism interface, real-time WS streaming, multi-file code editor workspaces (Monaco-based), and an automated background runner.

---

## 🏗️ Technical Architecture

CodeFlow AI is structured around Clean Architecture principles:

```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Versioned API routes (auth, workspaces, files, AI, WebSocket)
│   │   ├── core/            # Config settings, logging configurations, JWT utilities
│   │   ├── database/        # DB engines, session initializers, table schemas
│   │   ├── models/          # Declarative Base, Users, Workspaces, Reviews, Logs
│   │   ├── schemas/         # Pydantic schemas validating bodies
│   │   ├── services/        # Logic handlers (GitHub integration, Analytics compilers)
│   │   ├── workers/         # Celery tasks scheduler & Local thread fallback runners
│   │   └── ai/              # AI Provider Abstraction (Gemini, OpenAI, Claude, Mock)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI glassmorphic primitives & Toast Banners
│   │   ├── contexts/        # Auth, Workspace, and WebSocket Contexts
│   │   ├── layouts/         # Dashboard layout shell with collapsible navigations
│   │   ├── pages/           # Landing, Auth, Monaco workspace, Chat, Analytics, Admin
│   │   └── index.css        # Global CSS styling & tailwind utilities
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml       # Orchestrates app, workers, postgres and redis
```

---

## ⚙️ How to Run Locally

### Option A: Standard Local Setup (Fast Run)

CodeFlow AI is pre-configured to run out of the box using a local SQLite database and Mock AI completions, allowing evaluation without external API keys.

1. **Start the Backend Server**:
   ```bash
   cd backend
   # Install dependencies
   pip install -r requirements.txt
   # Start FastAPI dev server
   uvicorn app.main:app --reload --port 8000
   ```
   *The SQLite database (`codeflow.db`) and tables will automatically initialize on startup. A default Admin user is created: `admin@codeflow.ai` / `admin123`.*

2. **Start the React Frontend**:
   ```bash
   cd frontend
   # Install node dependencies
   npm install
   # Start Vite dev server
   npm run dev
   ```
   *Open browser to `http://localhost:5173`. Frontend API calls are automatically proxied to port 8000.*

---

### Option B: Docker Container Deployment

To launch the full production-grade stack including the PostgreSQL database, Redis caches, and Celery background workers:

1. **Configure Environment Variables**:
   In the root directory, create a `.env` file or copy variables from `backend/.env.example`.
2. **Build and Start Container Services**:
   ```bash
   docker-compose up --build
   ```
   *Services configured:*
   - **Database**: PostgreSQL on port `5432`
   - **Cache / Broker**: Redis on port `6379`
   - **FastAPI Endpoints**: Running on `http://localhost:8000`
   - **Celery Tasks**: Running worker queues

---

## 📡 API v1 Endpoint Documentation

All HTTP endpoints are prefixed with `/api/v1/`:

| Category | Endpoint | Method | Authentication | Description |
|---|---|---|---|---|
| **Auth** | `/auth/register` | `POST` | None | Register a new user |
| | `/auth/login` | `POST` | None | Login, retrieves JWT access/refresh tokens |
| | `/auth/me` | `GET` | Bearer Token | Retrieves authenticated user profile |
| **Workspaces** | `/workspaces/` | `GET` | Bearer Token | List all workspaces |
| | `/workspaces/` | `POST` | Bearer Token | Create a workspace |
| **Projects** | `/projects/workspace/{id}` | `POST` | Bearer Token | Create project in workspace |
| **Files** | `/files/project/{id}/upload` | `POST` | Bearer Token | Import files or extract repository ZIPs |
| **AI Engine** | `/ai/generate` | `POST` | Bearer Token | Run AI code generation prompts |
| | `/ai/review` | `POST` | Bearer Token | Run static code review & quality scoring |
| **Monitoring** | `/monitoring/health` | `GET` | None | Check DB, Redis connection & CPU usage |
| | `/monitoring/metrics` | `GET` | None | Serve Prometheus metrics logs |

---

## 🔐 Advanced Security Features

- **RBAC (Role-Based Access Control)**: Admin routers (role-editing, user listings, and audit trails) are blocked from standard users.
- **Security Headers**: Standard policies configured (e.g. `X-Frame-Options: DENY`, `nosniff`, and CORS limits).
- **Token-bucket Rate Limiting**: Limit API abuses dynamically (configured in `.env`).
- **Autosave & WebSockets Reconnection**: The Monaco workspace autosaves debounced buffer changes to the database every 3 seconds, and the frontend WebSocket client pings channels periodically, recovering from connectivity drops automatically.
