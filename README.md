# OpsPilot — AI-Native Operational Intelligence Platform

OpsPilot is a premium, high-density operational intelligence and workflow coordination platform. It transforms fragmented team conversations and unstructured meeting transcripts into structured, grounded database execution tracks. 

The application is tailored for executive decision-makers, offering a calm, premium workspace that replaces chaotic dashboards with **Tactile Minimalism** and **Ornamental Restraint**.

---

## 🎨 Premium Double-Theme Aesthetics

OpsPilot features a meticulously crafted dual-theme system that preserves elegant, journal-like editorial typography while ensuring digital wellness:

1.  **Gilded Ivory Editorial (Warm Light Mode)**:
    *   **Typography Juxtaposition**: Large, display headlines typeset in elegant **Libre Caslon Text** serifs balanced against data-heavy body descriptions and technical tracked labels in monolinear **Geist**.
    *   **Palette**: Matte Bisque paper canvas (`#fbf9f5`), elevated Creamy White surfaces (`#ffffff`), organic high-contrast Espresso lettering (`#170f0a`), Metallic Gold rules (`#735c00`), Sage syncing elements (`#b5cdb6`), and Terracotta alarms (`#ba1a1a`).
2.  **Espresso Chocolate (Complementary Dark Mode)**:
    *   Designed strictly for low-light environments, replacing harsh pure blacks with rich, deep Espresso warm dark shades (`#140d09` to `#3d3029`) and high-contrast Bisque typography.

---

## 🚀 Core Capabilities

*   **Modern Bento Box Telemetry**: A fluid masonry dashboard tracking active sprints, dynamic semantic AI data stream pulses, terracotta bottleneck progress gauges, and system logs.
*   **Split AI Assistant Cockpit**:
    *   *Left Panel*: Document memory registry supporting plain text logs ingestion and file parsing trackers.
    *   *Right Panel*: AI chat interface displaying sources metadata, simulated thinking animations, and interactive checklists that sync to Jira.
*   **Alerts & Reports Center**: SVG speedometer dials tracking overall done velocity, workload overload index matrices, and active blocker sheets with interactive **Assign AI Agent** mock async loading spinners.
*   **Kanban Sprints Workspace**: High-density workspace boards, invitation modal dialogs, and task creation panels.
*   **User Customization**: Setting sliders allowing operator names, execution roles, and premium cinematic avatar cards selections.

---

## 🛠️ Architecture & Tech Stack

OpsPilot is engineered as a secure, high-density modular monorepo:

*   **Frontend Client**: React 19, Vite, PostCSS, Tailwind CSS v4, Lucide-React, Recharts.
*   **Gateway API**: FastAPI, SQLAlchemy 2.0 ORM, Python-Jose (JWT Cryptography), PassLib (Bcrypt password hashing), Celery beat, Redis, Uvicorn.
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

## 🔒 Pre-Deployment Hardening Guidelines

Before launching the application to public internet traffic, apply the following hardening steps:

1.  **CORS Configurations**: Restrict origins in `backend/app/main.py` from wildcards `allow_origins=["*"]` to your specific client host (e.g., `["https://opspilot.ai"]`).
2.  **Secret Key Rotation**: Generate a cryptographically high-entropy JWT secret key in the production `.env` using Python's `secrets.token_hex(32)`.
3.  **Transit TLS Encryption**: Configure SSL/TLS certificates (like Let's Encrypt) to serve both frontend and backend strictly over **HTTPS (port 443)**.
4.  **Database URL Protection**: Inject database credentials using private environment keys, secret vaults, or private Kubernetes configmaps.
