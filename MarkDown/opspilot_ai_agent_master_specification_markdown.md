# OpsPilot — AI-Native Operational Intelligence Platform

## Purpose of This Document

This document exists to help AI coding agents, autonomous development systems, IDE copilots, and engineering assistants fully understand the architecture, engineering philosophy, technical stack, workflows, constraints, and implementation expectations of the OpsPilot platform.

This is not a generic project description.

This document defines:

- what the system is
- why it exists
- how the architecture should behave
- what engineering decisions matter
- what tradeoffs are intentional
- how different subsystems communicate
- how AI should be integrated
- what NOT to build
- how the project should scale
- how implementation should be structured

The goal is to ensure AI agents generate code aligned with the intended architecture instead of producing shallow CRUD boilerplate.

---

# 1. High-Level Product Definition

## What is OpsPilot?

OpsPilot is an AI-powered operational intelligence and workflow coordination platform.

The system transforms fragmented operational communication into structured, queryable, actionable organizational intelligence.

OpsPilot is designed for:

- student organizations
- startup teams
- operational departments
- event management teams
- hackathon teams
- NGOs
- internal coordination groups
- small execution-heavy teams

The platform combines:

- operational coordination
- AI-assisted workflow extraction
- semantic memory systems
- RAG pipelines
- vector retrieval
- async backend infrastructure
- analytics dashboards
- organizational intelligence

OpsPilot should feel like:

> an AI operations coordinator with persistent organizational memory.

NOT:

- a Trello clone
- a Notion clone
- a generic AI chatbot
- a basic task manager
- a tutorial CRUD application

---

# 2. Core Problem Statement

## Real-World Operational Problem

Most operational teams function in chaos.

Information is scattered across:

- WhatsApp chats
- Discord channels
- PDFs
- Google Docs
- meeting notes
- screenshots
- emails
- spreadsheets
- voice calls
- recordings
- fragmented discussions

This creates several systemic operational failures.

---

## Problem A — No Central Operational State

Teams lose track of:

- active tasks
- ownership
- deadlines
- responsibilities
- finalized decisions
- execution status

Nobody has a reliable source of truth.

---

## Problem B — Organizational Memory Loss

Critical information disappears inside:

- long message chains
- meeting notes
- transcripts
- PDFs
- voice discussions

Teams repeatedly ask the same questions.

Institutional knowledge becomes inaccessible.

---

## Problem C — Manual Coordination Overhead

Leads waste time:

- assigning tasks manually
- following up repeatedly
- updating spreadsheets
- summarizing meetings
- tracking progress
- chasing accountability

This creates execution drag.

---

## Problem D — Poor Accountability

People miss deadlines because:

- ownership is unclear
- visibility is weak
- tracking systems are fragmented
- updates are not centralized

---

## Problem E — Information Retrieval Failure

Operational querying is broken.

Teams cannot naturally ask:

- What is pending?
- What happened yesterday?
- Which tasks are overdue?
- Who owns sponsorship?
- Which team is blocked?
- What decisions were finalized last week?

because operational information is unstructured.

---

# 3. Product Vision

## Philosophy

Traditional productivity software forces humans to manually structure information.

OpsPilot reverses this.

The AI extracts structure automatically.

The platform should:

- understand operational context
- detect actionable information
- build organizational memory
- generate execution visibility
- reduce coordination overhead

OpsPilot is fundamentally:

> an AI-native operational intelligence layer.

---

# 4. Engineering Philosophy

## Critical Principle

This project must demonstrate engineering maturity.

The architecture matters more than flashy UI.

AI agents working on this codebase must prioritize:

- scalable architecture
- modularity
- async execution
- resilience
- observability
- production realism
- infrastructure correctness
- systems thinking

This project should NOT feel like:

- a portfolio tutorial
- a YouTube clone project
- a simple CRUD dashboard
- an LLM wrapper

The codebase should resemble:

- production backend systems
- internal operational tooling
- AI-enabled infrastructure software
- startup-grade architecture

---

# 5. System Architecture Overview

## Core Topology

The architecture follows an asynchronous event-driven distributed systems model.

Heavy AI tasks must NEVER block API request threads.

The architecture is intentionally separated into:

- frontend client layer
- API gateway
- relational database
- async queue broker
- worker processing layer
- vector retrieval engine
- AI orchestration layer

---

## High-Level Architecture Flow

```text
Frontend Client (React)
        ↓
FastAPI Gateway Layer
        ↓
PostgreSQL + Redis
        ↓
Background Worker Layer
        ↓
AI Processing Pipeline
        ↓
Vector Search / Retrieval Layer
```

---

# 6. Core Architecture Components

## Frontend Layer

### Tech Stack

- React.js
- Tailwind CSS
- TanStack Query
- Recharts / Chart.js

### Responsibilities

The frontend is responsible for:

- rendering dashboards
- workspace navigation
- task visualization
- analytics rendering
- optimistic UI updates
- API communication
- polling async job states
- streaming operational updates

### Frontend Philosophy

The frontend should:

- feel operational
- prioritize clarity over aesthetics
- emphasize execution visibility
- support high information density
- avoid clutter

This is NOT a marketing-heavy SaaS UI.

It is an operational control system.

---

## Backend Gateway Layer

### Tech Stack

- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy

### Responsibilities

The backend gateway is responsible for:

- authentication
- authorization
- REST APIs
- request validation
- state mutation
- routing
- websocket events
- orchestration
- async job dispatching

### Important Constraint

The FastAPI server must remain lightweight.

It should NEVER:

- run long LLM calls synchronously
- process embeddings inline
- perform heavy chunking operations inside request threads

Heavy work must be delegated to workers.

---

## Redis Broker Layer

### Purpose

Redis acts as:

- async message broker
- queueing system
- transient task dispatcher
- lightweight caching layer

### Responsibilities

Redis holds:

- job payloads
- async task metadata
- temporary coordination state

Redis should remain stateless and disposable.

No critical permanent business data belongs in Redis.

---

## Worker Processing Layer

### Tech Stack

- Celery
- Python worker pools

### Responsibilities

Workers execute:

- LLM inference calls
- embedding generation
- document parsing
- PDF extraction
- semantic chunking
- operational summarization
- RAG retrieval orchestration
- analytics generation

### Scaling Principle

Workers scale horizontally.

The worker pool must operate independently from the API gateway.

This separation is critical for resilience.

---

## Database Layer

### Primary Database

- PostgreSQL

### Vector Extension

- pgvector

### Philosophy

The relational database and semantic memory system intentionally coexist in the same cluster.

This simplifies:

- consistency
- operational complexity
- deployment
- transactional coordination

The database acts as:

- transactional source of truth
- semantic retrieval memory store
- operational state manager

---

# 7. AI System Philosophy

## AI Is Not the Product

AI exists to augment operations.

The platform should NEVER feel like:

"chat with your data"

Instead:

AI should:

- reduce operational friction
- automate structure extraction
- improve visibility
- improve retrieval
- summarize organizational state
- enhance execution workflows

---

## AI Design Constraints

The system must avoid:

- hallucination-heavy workflows
- unrestricted model output
- freeform AI speculation

AI should always operate on:

- grounded operational context
- retrieved semantic data
- structured system state
- relational metadata

The system should behave deterministically whenever possible.

---

# 8. Core AI Features

## AI Meeting Intelligence

Users upload:

- transcripts
- meeting notes
- PDFs
- recordings

The AI extracts:

- tasks
- deadlines
- owners
- blockers
- summaries
- decisions

### Example

Input:

Rahul will finalize sponsorship list by Friday. Priya will contact vendors.

Expected extraction:

```json
{
  "tasks": [
    {
      "title": "Finalize sponsorship list",
      "owner": "Rahul",
      "deadline": "Friday"
    },
    {
      "title": "Contact vendors",
      "owner": "Priya"
    }
  ]
}
```

---

## Natural Language Operational Querying

Users should be able to ask:

- Show overdue tasks
- What happened yesterday?
- Summarize sponsorship work
- Which team is overloaded?
- What tasks are blocked?

The system should:

1. generate embeddings
2. retrieve semantic context
3. combine relational state
4. ground the LLM prompt
5. generate contextual operational answers

---

## AI Operational Summaries

The system should generate:

- daily summaries
- weekly reports
- pending action summaries
- execution bottleneck reports
- operational intelligence reports

---

# 9. RAG System Architecture

## Retrieval Philosophy

The RAG pipeline is critical.

LLMs should NOT act as knowledge sources.

They should act as:

> reasoning layers over retrieved organizational context.

---

## RAG Execution Flow

```text
User Query
    ↓
Embedding Generation
    ↓
Similarity Search
    ↓
Top-K Context Retrieval
    ↓
Prompt Construction
    ↓
LLM Response Generation
```

---

## Retrieval Rules

The retrieval system should:

- prioritize recent operational context
- include metadata-aware ranking
- support semantic similarity search
- support chunk-level indexing
- support approximate nearest neighbor search

The AI should never answer outside retrieved context.

---

# 10. Document Intelligence Pipeline

## Processing Pipeline

```text
Document Upload
      ↓
Text Extraction
      ↓
Chunking
      ↓
Embedding Generation
      ↓
Vector Storage
      ↓
Metadata Indexing
```

---

## Chunking Strategy

Recommended:

- 500 token chunks
- 100 token overlap

Purpose:

- preserve semantic continuity
- improve retrieval accuracy
- reduce context fragmentation

---

## Supported File Types

- PDF
- DOCX
- Markdown
- plain text
- transcripts

Future support:

- recordings
- audio
- meeting video transcription

---

# 11. Database Design

## Core Tables

### Users

Fields:

- id
- name
- email
- hashed_password
- role
- created_at

---

### Teams

Fields:

- id
- name
- description
- created_at

---

### Tasks

Fields:

- id
- title
- description
- priority
- status
- deadline
- owner_id
- team_id
- created_at
- updated_at

---

### Documents

Fields:

- id
- file_name
- uploaded_by
- embedding_status
- created_at

---

### DocumentChunks

Fields:

- id
- document_id
- content
- embedding
- created_at

---

### Meetings

Fields:

- id
- title
- transcript
- summary
- created_at

---

# 12. Authentication & Security

## Authentication Requirements

Use:

- JWT authentication
- refresh tokens
- password hashing
- RBAC

---

## API Security

Requirements:

- rate limiting
- protected routes
- request validation
- schema validation
- payload sanitization

---

## AI Security

The AI pipeline must include:

- prompt sanitization
- restricted retrieval scope
- retrieval filtering
- context boundary enforcement

The system should reduce prompt injection risk.

---

## File Upload Security

Requirements:

- file type validation
- upload restrictions
- malware scanning
- size limits

---

# 13. Frontend Pages

## Landing Page

Contains:

- product overview
- architecture positioning
- authentication
- feature explanation

---

## Dashboard

Contains:

- pending tasks
- AI insights
- analytics
- workload visibility
- overdue tracking

---

## Team Workspace

Contains:

- team tasks
- shared files
- operational discussions
- coordination state

---

## AI Assistant Interface

Chat-style operational querying interface.

Purpose:

- operational retrieval
- organizational memory access
- contextual workflow support

---

## Reports Interface

Contains:

- summaries
- analytics
- execution reports
- operational intelligence reports

---

# 14. Scalability Principles

## Horizontal Scaling

The architecture should support:

- multiple API replicas
- distributed worker pools
- independent scaling layers

---

## Async Processing

Heavy tasks must always run asynchronously.

Examples:

- embeddings
- document parsing
- summarization
- retrieval indexing
- AI extraction

---

## Database Optimization

Requirements:

- indexing
- query optimization
- pagination
- caching
- efficient joins

---

## Vector Search Optimization

Requirements:

- HNSW indexing
- ANN search
- chunk-level retrieval
- cosine similarity optimization

---

# 15. Deployment Architecture

## Infrastructure Stack

Recommended:

- Docker
- Docker Compose
- Nginx
- Railway / Render / AWS / DigitalOcean

---

## Infrastructure Philosophy

The infrastructure should:

- isolate services cleanly
- support container orchestration
- allow future migration to Kubernetes
- separate worker scaling from API scaling

---

## Deployment Topology

```text
Internet
   ↓
Nginx Reverse Proxy
   ↓
Frontend Client
   ↓
FastAPI Gateway
   ↓
PostgreSQL + Redis
   ↓
Worker Layer
   ↓
AI Services
```

---

# 16. Recommended Repository Structure

## Frontend

```text
frontend/
 ├── src/
 │   ├── components/
 │   ├── pages/
 │   ├── hooks/
 │   ├── services/
 │   ├── layouts/
 │   ├── store/
 │   └── utils/
```

---

## Backend

```text
backend/
 ├── app/
 │   ├── api/
 │   ├── services/
 │   ├── models/
 │   ├── schemas/
 │   ├── workers/
 │   ├── ai/
 │   ├── core/
 │   └── utils/
```

---

# 17. Development Roadmap

## Phase 1 — Operational MVP

Build:

- authentication
- teams
- task management
- dashboards
- PostgreSQL integration

Goal:

working operational platform.

---

## Phase 2 — AI Integration

Add:

- document uploads
- task extraction
- AI summaries
- semantic retrieval
- vector search

Goal:

AI operational assistant.

---

## Phase 3 — Infrastructure Hardening

Add:

- Docker
- Redis
- Celery
- monitoring
- deployment pipelines

Goal:

production-grade architecture.

---

## Phase 4 — Operational Intelligence

Add:

- predictive analytics
- notifications
- bottleneck detection
- recommendations
- workload intelligence

Goal:

startup-quality operational intelligence system.

---

# 18. Future Expansion Possibilities

## Integrations

Potential integrations:

- Slack
- Discord
- WhatsApp
- Google Meet
- Microsoft Teams

---

## Voice Intelligence

Potential additions:

- speech-to-text
- meeting transcription
- AI summarization

---

## Predictive Operational Intelligence

Potential capabilities:

- missed deadline prediction
- overloaded team detection
- execution bottleneck forecasting
- operational slowdown detection

---

# 19. Interview Positioning

## What This Project Demonstrates

### Backend Engineering

- async architecture
- distributed processing
- queues
- APIs
- worker systems

---

### AI Engineering

- RAG pipelines
- embeddings
- semantic retrieval
- LLM orchestration

---

### Infrastructure Engineering

- Docker
- deployment
- orchestration
- scalable services

---

### System Design

- modular architecture
- operational scalability
- event-driven systems
- distributed workflows

---

# 20. Final Positioning

OpsPilot should be described as:

> An AI-powered operational intelligence and workflow coordination platform designed to transform fragmented organizational communication into structured actionable workflows using FastAPI, React, PostgreSQL, Docker, vector retrieval systems, and LLM-powered operational intelligence.

This positioning is intentionally stronger than:

- task manager
- productivity app
- AI chatbot
- project management tool

because it emphasizes:

- systems engineering
- infrastructure
- architecture
- operational intelligence
- AI orchestration
- backend maturity

---

# 21. Critical Rules for AI Agents Working on This Project

## Rule 1

Do NOT generate shallow CRUD architecture.

---

## Rule 2

Always prioritize modularity and scalability.

---

## Rule 3

Async processing is mandatory for AI-heavy tasks.

---

## Rule 4

AI must operate on grounded operational context.

---

## Rule 5

The system should behave deterministically whenever possible.

---

## Rule 6

Prefer maintainable architecture over rapid hacks.

---

## Rule 7

The project should resemble production operational infrastructure.

---

## Rule 8

Avoid overengineering early, but maintain clean separation of concerns.

---

## Rule 9

All major architectural decisions should support future scaling.

---

## Rule 10

This project exists to demonstrate engineering maturity, not just coding ability.

