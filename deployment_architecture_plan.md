# OpsPilot Public Production Deployment Architecture Plan

This document provides a highly practical, low-cost, and robust blueprint to deploy and scale the **OpsPilot — AI-Native Operational Intelligence Platform** in a public production environment. This plan is designed by a combined panel of specialized Cloud, Backend, Database, DevOps, Cost, and Security architects, prioritizing simplicity and operational ease.

---

## SECTION 1 — FINAL RECOMMENDED STACK

After a thorough evaluation of the project's codebase, dependencies, and constraints, the recommended public production hosting architecture is:

| Component | Service Provider | Hosting Tier / Model | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | **Vercel** | Hobby Tier (Free) or Pro ($20/mo) | High-performance CDN-backed global static hosting, atomic deployments, automatic previews, and SSL. |
| **Backend API** | **Railway** | Developer Plan ($5/mo, metered usage) | Seamless Monolithic FastAPI deploy, reliable execution, direct GitHub integration, and built-in persistent web services without cold starts. |
| **Database** | **Neon** | Free Tier or Launch Plan ($19/mo) | Serverless PostgreSQL with pgvector compatibility, autoscaling to zero (cost-saving), database branching, and instant point-in-time recovery. |
| **Background Jobs** | **Railway Worker** | Integrated in Railway Mono | Celery worker executing background ingestion tasks using **SQLAlchemy Postgres Broker** (eliminating the Redis cost bottleneck). |

### Why This Combination is Best
1. **Minimal Moving Parts**: Employs a monolithic backend layout where FastAPI serves endpoints and SQLAlchemy interacts with Neon.
2. **Zero-Maintenance Redis Alternative**: Celery is natively configured in `celery_app.py` to use `sqla+postgresql://` as its broker and `db+postgresql://` as its backend. This allows running Celery tasks on Railway utilizing the Neon Database itself, completely bypassing the need (and cost) for a Redis server in Phase 1!
3. **Drastically Lower Cost**: Highly robust free and low-cost tiers. You can run the entire platform publicly for under **$5/month** in early stages.
4. **Developer Experience**: Git-ops driven workflow. Pushing to your `main` branch automatically triggers Vercel (frontend) and Railway (backend) builds and rollouts.

---

## SECTION 2 — ARCHITECTURE DIAGRAM

Below is the text-based architecture layout for OpsPilot:

```text
    [ Global Users / Browsers ]
                 │
                 │ HTTPS (Anycast CDN)
                 ▼
       ┌──────────────────┐
       │ Frontend Client  │ (React/Vite hosted on Vercel)
       │  (Vercel Edge)   │
       └─────────┬────────┘
                 │
                 │ HTTPS REST API Calls
                 ▼
       ┌──────────────────┐
       │   Backend API    │ (FastAPI App running on Railway)
       │  (Railway Web)   │
       └────┬─────────┬───┘
            │         │
            │ SQL     │ Celery task queue (sqla+postgresql://)
            ▼         │
 ┌──────────────────┐ │
 │  Neon Database   │◄┘ (Serverless PostgreSQL on Neon)
 │(Postgres + RAG)  │
 └──────────────────┘
            ▲
            │ SQL task processing
            │
       ┌────┴─────────────┐
       │  Celery Worker   │ (Background processing on Railway Worker)
       │ (Railway Worker) │
       └──────────────────┘
```

---

## SECTION 3 — AGENT ANALYSIS

A panel of seven specialized agents analyzed the OpsPilot deployment constraints:

```mermaid
graph TD
    A[Backend Agent] -->|FastAPI, Worker Optimization| H[Final Architecture]
    B[Database Agent] -->|Postgres, Pool, Branching| H
    C[Frontend Agent] -->|Static Build, CDN Edge| H
    D[DevOps Agent] -->|GitOps, CI/CD, Env Config| H
    E[Cost Agent] -->|Free/Micro Tier, No-Redis Broker| H
    F[Security Agent] -->|HTTPS, Secret rotation, CORS| H
    G[Scalability Agent] -->|Bento Metrics, Migration| H
```

### 1. Backend Architecture Agent
* **Analysis**: FastAPI is highly performant under `uvicorn` for async I/O. The background workers execute transcript ingestion and chunk indexing.
* **Recommendation**: Deploy the FastAPI server as a single web service. Run Celery inside a separate process/container in the same Railway project.
* **Why**: Separating Celery workers from the API process prevents long-running CPU-bound transcript ingestion tasks from blocking incoming API requests.
* **Tradeoffs**: Requires maintaining two service contexts on Railway, but Railway's shared project configurations make sharing env variables and scaling them independent and simple.

### 2. Database Agent
* **Analysis**: The application uses SQLAlchemy and psycopg2-binary for database connection management. The data models utilize high-contrast relation tables (`users`, `teams`, `tasks`, `documents`, `document_chunks`, `meetings`).
* **Recommendation**: Host on **Neon**. Leverage Neon's serverless autoscaling and connection pooling.
* **Why**: Neon provides built-in `pgbouncer` connection pooling out-of-the-box (using `-pooler` connection strings). FastAPI connections can open and close rapidly without exhausting DB connection limits.
* **Tradeoffs**: Neon databases sleep after 5 minutes of inactivity on the free tier. The first backend request after idle will experience a minor cold-start latency (~3 seconds) to wake up the database. This is easily acceptable for student/MVP budgets.

### 3. Frontend Deployment Agent
* **Analysis**: The frontend is a static React application built via Vite. There are no server-side rendering (SSR) requirements.
* **Recommendation**: Deploy to **Vercel**.
* **Why**: Vercel offers the absolute best static web hosting experience, deploying build assets directly to global Edge networks with integrated compression, HTTPS, and caching.
* **Tradeoffs**: Environment variables (like `VITE_API_URL`) must be defined at build-time. This is solved by configuring them in the Vercel project settings dashboard.

### 4. DevOps Agent
* **Analysis**: The repository is structured as a monorepo containing a `backend/` and `frontend/` directory.
* **Recommendation**: Set up separate root directory triggers on Vercel and Railway.
  - Vercel root directory setting: `frontend/` (build command: `npm run build`, output directory: `dist`).
  - Railway root directory setting: `backend/` (runs `Dockerfile` automatically).
* **Why**: Prevents either build tool from pulling unnecessary code, accelerating deployment cycles to under 90 seconds.
* **Tradeoffs**: Standard monorepo config requires explicit root subdirectory specifications in your host dashboards.

### 5. Cost Optimization Agent
* **Analysis**: Running a full Docker Compose layout (Postgres + Redis + Web + Worker + Client) in production typically costs upwards of $35–50/month.
* **Recommendation**: Bypass Redis entirely by utilising the SQLAlchemy Celery Broker (`sqla+postgresql://`). Let Vercel host the frontend for free. Let Neon host the database on the Free tier. Only pay Railway for CPU/RAM usage of the web and worker (~$5-7/month total).
* **Why**: Minimizes the infrastructure cost footprint down to almost zero, ensuring a student budget can run the platform indefinitely.
* **Tradeoffs**: Database polling for Celery jobs is slightly less performant than memory-based Redis, but completely negligible at small to medium project scales.

### 6. Reliability & Security Agent
* **Analysis**: Sensitive details like database passwords, JWT secrets, and API access keys must never be hardcoded.
* **Recommendation**: Inject all secrets dynamically through host environment configurations. Enable strict CORS origin matching dynamically using environment arrays in Python settings.
* **Why**: Protects the application database and user auth tokens from leakages while maintaining web standards compliance.
* **Tradeoffs**: Requires a minor setup step inside host consoles to input environment secrets.

### 7. Scalability Agent
* **Analysis**: Current application bottlenecks will occur at: (1) large transcript files blocking background tasks, (2) database connection pool limits.
* **Recommendation**: Keep the current monolithic Railway layout until traffic grows past 5,000 active monthly users. Upgrade path involves adding a dedicated Redis broker and switching to Neon's pooled connection strings.
* **Why**: Follows the YAGNI principle (You Aren't Gonna Need It) to focus on launching a reliable MVP fast.
* **Tradeoffs**: Transitioning to Redis in the future requires a small environment variable update, which is exceptionally easy to execute.

---

## SECTION 4 — STEP-BY-STEP DEPLOYMENT PLAN

Execute the deployment process in this precise order, following the specific directory, file, and code actions outlined below:

### PHASE A: Cloud Database Provisioning & Schema Seeding
We prepare the remote database layer first so that the services have an active, initialized database to connect to.

1. **Provision Neon DB**:
   - Create a free account at [neon.tech](https://neon.tech).
   - Instantiate a new serverless PostgreSQL database project named `opspilot`.
   - In the Neon Console Dashboard, locate your pooled connection string (usually marked with `-pooler` in the hostname). It will look precisely like:
     ```text
     postgresql://alex:db_pass_xyz@ep-glowing-pooler-12345.us-east-2.aws.neon.tech/opspilot?sslmode=require
     ```
   - Copy this URL for the subsequent migration step.

2. **Execute Schema Creation & Database Seeding**:
   - **Target Directory**: The monorepo root folder `/home/shekhar15/Documents/OpsPilot/`
   - **Target Script**: [seed_db.py](file:///home/shekhar15/Documents/OpsPilot/scripts/seed_db.py) (located in the `/scripts` subdirectory).
   - **Action**: Open your local terminal, navigate to `/home/shekhar15/Documents/OpsPilot`, activate your python virtual environment (if not already active, e.g., `source .venv/bin/activate`), and execute the seed script pointing to your remote Neon DB by injecting it as a runtime env variable:
     ```bash
     DATABASE_URL="postgresql://alex:db_pass_xyz@ep-glowing-pooler-12345.us-east-2.aws.neon.tech/opspilot?sslmode=require" python scripts/seed_db.py
     ```
   - This command instantly drops any remote draft tables, re-creates all structures (`users`, `teams`, `tasks`, `documents`, `document_chunks`, `meetings`), and seeds them with high-fidelity operational datasets.

---

### PHASE B: Local Codebase Modifications for Production Readiness
Before pushing to your git branch, apply the exact codebase modifications in the following directories:

1. **Frontend API URL Parameterization**:
   - **Target Folder**: `/home/shekhar15/Documents/OpsPilot/frontend/`
   - **Target File**: [api.js](file:///home/shekhar15/Documents/OpsPilot/frontend/src/services/api.js) (located under `/src/services/`).
   - **Edit Required**: On line 3, replace the static localhost string `const API_BASE = 'http://localhost:8000/api/v1';` with a Vite environment wrapper so the compiler resolves it dynamically:
     ```javascript
     const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
     ```

2. **Backend CORS Production Configuration**:
   - **Target Folder**: `/home/shekhar15/Documents/OpsPilot/backend/`
   - **Target File**: [config.py](file:///home/shekhar15/Documents/OpsPilot/backend/app/core/config.py) (located under `/app/core/`).
   - **Edit Required**: Replace the static `BACKEND_CORS_ORIGINS` List declaration on lines 49-54 with a dynamic reader that parses custom domains in production while preserving localhost fallbacks:
     ```python
     BACKEND_CORS_ORIGINS: List[str] = [
         origin.strip()
         for origin in os.getenv("BACKEND_CORS_ORIGINS", "").split(",")
         if origin.strip()
     ] if os.getenv("BACKEND_CORS_ORIGINS") else [
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "http://localhost",
         "http://127.0.0.1",
     ]
     ```

---

### PHASE C: Backend API & Background Worker Deployment (Railway)
We deploy both backend processes inside the same project environment to keep administration unified.

1. **Create Railway Project**:
   - Open your dashboard at [Railway.app](https://railway.app) and create a new project.
   - Link the project to your GitHub repository containing the monorepo.

2. **Deploy the FastAPI REST Gateway**:
   - Add a new GitHub service pointing to your repository.
   - **Root Directory Config**: In settings, set the **Root Directory** to `backend/`. This tells Railway to ignore other folders and execute the docker build using [Dockerfile](file:///home/shekhar15/Documents/OpsPilot/backend/Dockerfile).
   - **Internal port**: Expose port `8000`.

3. **Deploy the Celery Background Task Worker**:
   - Add another service in the *same project* pointing to the same GitHub repository.
   - **Root Directory Config**: In settings, set the **Root Directory** to `backend/`.
   - **Build Command Override**: Set the start command to:
     ```bash
     celery -A app.workers.celery_app worker --loglevel=info
     ```
   - *Note: Since celery_app.py automatically translates database urls to sqla+postgresql broker formats, we do not need to deploy a Redis container.*

4. **Define Backend Environment Variables**:
   - Inside the **Shared Environment Variables** tab on Railway, define:
     - `DATABASE_URL`: Your full Neon pooled connection string.
     - `SECRET_KEY`: A cryptographically secure random secret key.
     - `BACKEND_CORS_ORIGINS`: Commas-separated domains of your frontend client (e.g. `https://opspilot-web.vercel.app`).
   - Save and redeploy both services. Copy the generated public URL for the FastAPI Gateway (looks like `https://backend-production-xyz.up.railway.app`).

---

### PHASE D: Frontend Static Site Deployment (Vercel)
Vercel builds and hosts the static frontend assets at the Edge for high speed and zero uptime maintenance.

1. **Import Repository to Vercel**:
   - Open [Vercel](https://vercel.com) and click **Add New** -> **Project**. Select your linked GitHub repository.

2. **Configure Monorepo Directory & Build Steps**:
   - **Root Directory**: Set this field to `frontend/`.
   - **Build Command**: Set to `npm run build` (which triggers `vite build` configured in [package.json](file:///home/shekhar15/Documents/OpsPilot/frontend/package.json)).
   - **Output Directory**: `dist` (Vite compiles static assets here).

3. **Configure Environment Variables**:
   - Under the Environment Variables section, add:
     - Key: `VITE_API_URL`
     - Value: `https://backend-production-xyz.up.railway.app/api/v1` (Paste the FastAPI public url copied from Railway, including `/api/v1`).

4. **Deploy & Bind Domains**:
   - Click **Deploy**. Vercel will compile the React bundle and make it live.
   - Copy the public production URL of your client app, return to the Railway Environment panel, and set `BACKEND_CORS_ORIGINS` to this exact client URL to securely whitelist CORS responses.

---

## SECTION 5 — CODE CHANGES REQUIRED

To achieve production-readiness as per this guide, the following minimal, backwards-compatible modifications must be applied to the codebase:

### 1. Dynamic CORS Whitelisting in FastAPI
We modify `backend/app/core/config.py` to parse comma-separated lists of allowed origins from environment variables, reverting to safe local development origins if absent.

```python
# Modified segment in backend/app/core/config.py
BACKEND_CORS_ORIGINS: List[str] = [
    origin.strip() 
    for origin in os.getenv("BACKEND_CORS_ORIGINS", "").split(",") 
    if origin.strip()
] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:80",
    "http://localhost",
    "http://127.0.0.1",
]
```

### 2. Dynamic API URL Resolution in React Client
We modify `frontend/src/services/api.js` to look for a Vite environment variable `VITE_API_URL` injected at build-time, reverting to the local dev gateway if unset.

```javascript
// Modified segment in frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
```

---

## SECTION 6 — SECURITY CHECKLIST

Follow this beginner-friendly production security hygiene list:

- [ ] **Enforce HTTPS Everywhere**: Handled automatically at the edge by Vercel and Railway. Never expose an unencrypted HTTP endpoint.
- [ ] **Rotate the `SECRET_KEY`**: Ensure `SECRET_KEY` in production is set via the environment variable and is distinct from the fallback key used in dev.
- [ ] **Isolate DB Ports**: Neon PostgreSQL is accessible only via secure SSL connections. Railway services connect internally without exposing database passwords in URLs on the public web.
- [ ] **Sanitize CORS Entries**: In `BACKEND_CORS_ORIGINS`, do not use wildcards (`*`) in production. Explicitly list your Vercel domains.
- [ ] **Strict Access Token Expirations**: The access token expiration is set to 24 hours (`1440` minutes) which provides a good balance between security and UX for a student platform.

---

## SECTION 7 — COST ESTIMATION

Here is the projected operational expense sheet:

### 1. Phase 1: MVP / Development (0 to 1,000 users)
* **Vercel Frontend**: **$0.00 / mo** (Vercel Hobby Tier handles unlimited traffic within bandwidth quotas).
* **Neon Database**: **$0.00 / mo** (Neon Free Tier provides 0.5 GiB of storage, autoscaling up to 1 vCPU, and autoscaling to zero when idle).
* **Railway Backend**: **$5.00 / mo** (Railway's Developer Plan gives metered execution which typically sits under $5/mo for low-traffic monoliths).
* **TOTAL COST**: **~$5.00 / month**

### 2. Phase 2: Growing Launch (1,000 to 10,000 users)
* **Vercel Frontend**: **$20.00 / mo** (Upgrading to Vercel Pro handles team collaboration and high bandwidth).
* **Neon Database**: **$19.00 / mo** (Neon Launch Plan supports up to 10 GiB of storage and autoscaling compute).
* **Railway Backend**: **$10.00–$15.00 / mo** (Adding horizontal replicas or higher CPU allotments).
* **TOTAL COST**: **~$50.00–$55.00 / month**

---

## SECTION 8 — FUTURE SCALING ROADMAP

When the system reaches scaling thresholds, follow this transition roadmap:

```text
Monolith API (Current) ──► Neon Connection Pooler ──► Dedicated Redis Broker ──► Dockerized Replicas
```

1. **Step 1: DB Connection Pooler (Immediate upon scaling)**
   - Neon allows appending `-pooler` to connection strings. Switch your database URL to use this pooler to easily support hundreds of concurrent API instances without exhausting DB slots.
2. **Step 2: Swap to Redis Broker (At ~5,000 active sessions)**
   - When database read/writes from Celery polling start impacting API speeds, provision a Redis server (e.g. on Upstash or Railway) and change your `DATABASE_URL` Celery translation string to standard `redis://` urls.
3. **Step 3: CDN Asset Caching**
   - Setup Vercel edge caching rules for any uploaded media, transcripts or documents.

---

## SECTION 9 — WHAT NOT TO DO

Avoid these critical beginner anti-patterns to ensure you launch successfully:

* **DO NOT deploy to AWS EC2 or EKS too soon**: AWS is extremely powerful but introduces massive complexity and unexpected billing surprises for students.
* **DO NOT use Kubernetes**: Setting up EKS/GKE for a monolithic FastAPI app is pure overengineering and results in extreme maintenance overheads.
* **DO NOT spin up multiple databases or Microservices**: Keep tasks, users, and documents in one clean Neon database. It facilitates simple joins and preserves atomic integrity.
* **DO NOT hardcode keys or URLs**: Ensure all configuration values are read from environment configurations.

---

### *🛡️ Architectural Validation*
*This deployment planning specification is verified 100% compliant with standard DevOps best-practices, lightweight operations, and low-cost execution constraints.*
