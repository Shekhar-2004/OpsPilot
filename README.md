# OpsPilot — AI-Native Operational Intelligence & RAG Platform

> ### 🌐 Live Production Access: [**ops-pilot-five.vercel.app**](https://ops-pilot-five.vercel.app)

OpsPilot is a premium, production-ready operational intelligence and workflow coordination platform. It transforms fragmented team conversations and unstructured meeting transcripts into structured, grounded database execution tracks using **Retrieval-Augmented Generation (RAG)**.

Designed with an aesthetic of **Tactile Minimalism** and **Ornamental Restraint**, it replaces chaotic data dashboards with a calm, journal-like editorial workspace.

---

## 🚀 Engineering Achievements & Advanced Capabilities

For **Recruiters & Engineers** reviewing this codebase, the following systems highlight robust production-grade design:

### 1. 🧠 Live Gemini-Powered RAG Engine
*   **Semantic Vector Search**: Integrates Cosine Similarity retrieval across `pgvector` models to extract grounded chunks of organizational memory.
*   **Dual-Layer Context Synthesis**: Intersects unstructured document vector chunks with structured relational database tasks (SQL joins) to create a high-fidelity context model.
*   **Live Gemini API Integration**: Features direct HTTP streaming queries to the `gemini-1.5-flash` Google API, synthesizing rich, markdown-formatted coordinator intelligence reports.
*   **Graceful Simulated Fallback**: Implements a high-fidelity local RAG simulation engine that seamlessly serves requests if the `GEMINI_API_KEY` is not present, ensuring high system availability and zero-crash reliability.

### 2. 🔒 Public-Domain Security & Rate Limiting Hardening
*   **In-Memory Sliding Window Rate Limiter**: Features a custom in-memory token/sliding-window throttling engine managing short-term (**10 queries/minute**) and long-term (**100 queries/day**) budgets.
*   **Dynamic Garbage Collection**: Automatically prunes idle users/IP keys from the internal memory registry once their sliding window clears, ensuring near-zero RAM usage and immunity to memory exhaustion.
*   **Query Length Constraints**: Strict **1000-character** length limit on all AI requests to block malicious token-flooding and prompt injection attacks before reaching the model layer.
*   **High-Performance File Size Caps**: Restricts transcript uploads to **5 MB**. The backend queries file size directly via fast stream `seek()` and `tell()` offsets **before** reading or allocating buffer bytes in RAM, instantly rejecting oversized files with `413 Request Entity Too Large`.

### 3. 🛡️ Airtight Relational Tenant & Workspace Privacy
*   **Database-Enforced Boundaries**: Upgraded from loose string uploader name matches to a strict relational database layout by introducing `team_id` foreign key columns on the `Document` model. Each document belongs strictly to one team workspace.
*   **Airtight AI RAG Filters**: In `AIService.query_semantic_chunks()`, vector similarity searches run SQL joins that query document chunks strictly matching `Document.team_id.in_(allowed_team_ids)`. Any two users belonging to separate teams are completely isolated.
*   **Secure API Gating**: Locked down `/upload`, `/text`, `/docs`, and `/delete` endpoints to verify active team membership, returning `403 Forbidden` for unauthorized uploads or modifications.

### 4. 🔐 Secure Alphanumeric Team Join Codes
*   **High-Entropy Tokens**: Generates unique, cryptographically random 6-character invite codes (e.g. `SPONS1`, `EVENT2`) on team creation.
*   **Dynamic Visibility Propagation**: Implements a `POST /api/v1/teams/join` endpoint which maps new team memberships dynamically, instantly unlocking access to all shared tasks and document memories.

### 5. 🌐 Dynamic Production CORS Routing
*   Prevents standard public-cloud preflight CORS errors (like `400 Disallowed CORS origin`) by incorporating an advanced **`allow_origin_regex`** model:
    ```python
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.railway\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+"
    ```
    This securely maps all local development ports, Railway microservices, and Vercel frontends dynamically while blocking outside hostile domains.

### 6. 🎨 Premium Double-Theme Aesthetics
*   **Gilded Ivory Editorial (Warm Light Mode)**:
    *   *Typography*: High-contrast pairing of elegant serifs (**Libre Caslon Text**) for display layouts balanced against high-density monospaced code fonts (**Geist**) for metrics.
    *   *Palette*: Bisque canvas (`#fbf9f5`), Warm Espresso text (`#170f0a`), Metallic Gold rules (`#735c00`), and Sage sync indicators.
*   **Espresso Chocolate (Dark Mode)**:
    *   Specifically engineered to combat developer eye fatigue by substituting pure blacks with deep, warm organic chocolates (`#140d09` to `#3d3029`) and Bisque typography.

---

## 🔬 Resolved Security Bugs & Architecture Gaps

For developers reviewing problem-solving capabilities, here are two major engineering gaps resolved in this codebase:

### 1. 🛡️ The "Shared Coordinator" Data Leak Bug
*   **The Bug**: Originally, documents were isolated solely by matching the uploader's name. If a coordinator (e.g. "Rahul") was a member of multiple teams, any document uploaded by Rahul became globally visible in RAG queries to members of *all* his teams, creating a massive data leak.
*   **The Fix**: Redesigned the schema to bind `Document` directly to `team_id` via a foreign key. We updated the upload APIs to validate membership and scoped semantic queries using `Document.team_id.in_(allowed_team_ids)`, ensuring complete workspace isolation.

### 2. ⚡ Celery Background Task Gating Conflict
*   **The Bug**: Enforcing active user credentials in `AIService.answer_query()` broke Celery asynchronous background workers (which analyze meeting transcripts and extract tasks without an active HTTP session).
*   **The Fix**: Refactored the AI service to dynamically detect execution context. It enforces strict user-session gating on HTTP API requests while seamlessly allowing system-level queries from background Celery workers.

---

## 🛠️ Architecture & Tech Stack

OpsPilot is engineered as a secure, high-density modular monorepo:

*   **Frontend Client**: React 19, Vite, PostCSS, Tailwind CSS v4, Lucide-React, Recharts.
*   **Gateway API**: FastAPI, SQLAlchemy 2.0 ORM, Python-Jose (JWT Cryptography), PassLib (Bcrypt password hashing), Celery, Uvicorn.
*   **Database**: PostgreSQL pre-bundled with the `pgvector` extension for semantic vector similarity searches.

---

## 💻 Getting Started (Development Setup)

Ensure you have **Python 3.10+**, **Node.js 18+**, and **Docker** installed.

### 1. Backend Server Setup
Navigate to the backend directory, initialize a python virtual environment, and spin up the gateway:
```bash
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server locally
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
The interactive FastAPI Swagger docs will be visible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend Client Setup
Navigate to the frontend folder, install npm modules, and run the hot-reload dev client:
```bash
cd frontend

# Install package modules
npm install

# Start Vite client dev server
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) inside your web browser to access the live dashboard.

### 3. Docker Compose Orchestration (Production Stack)
Alternatively, you can run the entire production stack (PostgreSQL with pgvector, Redis, Gateway API, Celery worker, and Frontend nginx client proxy) in a single command from the monorepo root:
```bash
docker-compose up --build
```

---

## 📋 Deployed Infrastructure Checklist

The production environment maps directly to lightweight, high-performance monorepo hosting tiers:
- **Frontend Client**: Deployed on **Vercel** (Edge CDN hosting).
- **Backend Gateway**: Deployed on **Railway** (Monolithic FastAPI container).
- **Database Layer**: Deployed on **Neon** (Serverless cloud PostgreSQL with pgvector).
- **Background Jobs**: Deployed on **Railway Worker** (Using Celery with SQLAlchemy Postgres Broker to save Redis hosting costs).
