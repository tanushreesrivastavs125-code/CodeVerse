# High-Level Design — CodeQuest

---

## 1. Document Overview

### 1.1 Purpose
The purpose of this High-Level Design (HLD) document is to establish the macro-system architecture, subsystem boundaries, inter-tier communication protocols, data persistence topology, and security postures for **CodeQuest**. 

This document serves as the architectural foundation bridging the pedagogical requirements defined in the Product Requirements Document ([`docs/PRD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/PRD.md)) to the granular implementation specifications detailed in the Low-Level Design ([`docs/LLD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/LLD.md)). It provides engineering examiners, technical viva evaluators, software architects, and full-stack developers with a defensible blueprint of how the complete platform operates as a cohesive, reliable, and scalable system.

### 1.2 Scope
This document covers:
- System context, runtime boundaries, and multi-tier decoupled client-server architecture.
- Frontend architecture (React 19 Single Page Application, visual block assembly canvas, client-side Web Worker execution sandbox, cyber HUD).
- Backend application gateway (Node.js + Express 5 modular monolith, middleware pipeline, centralized error handling).
- Polyglot persistence strategy (MongoDB document store for curriculum/AI questions + PostgreSQL relational schema for multi-user social graphs and SQL JOINs).
- AI subsystem integration (isolated backend LLM pipeline, prompt engineering guardrails, structured JSON output validation, fallback handling).
- Deterministic Adaptive Difficulty Engine (Bloom's cognitive staircase owned strictly by the application).
- Defense-in-depth security model (zero server Remote Code Execution, stateless JWT authentication, bcrypt password hashing, anti-cheat query projections, rate limiting).
- Academic and engineering viva defense mapping across all 25 mandatory Project Score competencies.

### 1.3 Intended Audience
- **Technical Viva Evaluators & Assessors:** Auditing architectural reasoning, design trade-offs, technology selection, and runtime execution fundamentals.
- **Full-Stack Software Engineers:** Implementing features, services, and schemas directly from architectural specifications.
- **System Architects & Reviewers:** Verifying scalability, failure resilience, cost controls, and security boundaries.

### 1.4 Architectural Hierarchy: PRD vs. HLD vs. LLD
CodeQuest enforces a disciplined, hierarchical engineering workflow:

$$\mathbf{PRD} \text{ (What \& Why)} \longrightarrow \mathbf{HLD} \text{ (High-Level System Architecture)} \longrightarrow \mathbf{LLD} \text{ (Detailed Implementation Design)}$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PRODUCT REQUIREMENTS DOCUMENT (PRD)                                 │
│ - Explains: WHAT and WHY                                               │
│ - Pedagogical philosophy: PLAY -> BUILD -> UNDERSTAND -> CODE -> MASTER│
│ - Target user personas (beginners, college freshmen, career switchers) │
│ - Core functional requirements and out-of-scope non-goals              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. HIGH-LEVEL DESIGN (HLD) — THIS DOCUMENT                             │
│ - Explains: HIGH-LEVEL SYSTEM ARCHITECTURE                             │
│ - Macro client-server component topology and communication interfaces  │
│ - Polyglot database division (Document vs. Relational workloads)       │
│ - Code execution safety boundary (Web Worker sandbox isolation)        │
│ - Controlled AI subsystem architecture and fallback pipelines          │
│ - High-level system data flows, failure handling, and scalability      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. LOW-LEVEL DESIGN (LLD)                                              │
│ - Explains: EXACTLY HOW THE SYSTEM WILL BE IMPLEMENTED                 │
│ - Concrete React component props, state atoms, and custom hook logic   │
│ - Express route handler signatures and Zod validation schemas          │
│ - Exact Mongoose models, compound indexes, and PostgreSQL DDL scripts  │
│ - Web Worker postMessage communication protocols and watchdog timers   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Current Project Implementation Status
To maintain complete integrity during engineering audits and viva assessments, platform capabilities are classified across precise states:
- **Implemented:** Code or documentation artifact exists directly in the repository and has been verified.
- **Partially Implemented:** Scaffolding, configuration, or documentation stubs exist, but complete operational integration is pending.
- **Planned (MVP):** Formally architected and scheduled for immediate implementation in the upcoming MVP sprint.
- **Future:** Post-MVP architectural enhancements scheduled for subsequent roadmap phases.

| System Subsystem | Architectural Status | Repository Evidence | Technical Notes |
|:---|:---:|:---|:---|
| **Git Workflow & Branching** | `Implemented` | `.git`, branches `main`, `develop`, `docs/*` | Git flow enforcing Conventional Commits and branch isolation. |
| **Product Requirements (PRD)** | `Implemented` | `docs/PRD.md` (v1.0.0) | Complete problem analysis, Bloom's tiers, and non-goals. |
| **High-Level Design (HLD)** | `Implemented` | `docs/HLD.md` (This document) | System architecture, polyglot storage, and AI safety. |
| **Low-Level Design (LLD)** | `Implemented` | `docs/LLD.md` (Companion document) | Microscopic component contracts, schemas, and algorithms. |
| **Frontend UI Shell (React 19)**| `Planned (MVP)` | `frontend/src/App.jsx`, `main.jsx` | SPA architecture with Vite HMR and modern React 19 root mounting. |
| **Cyber HUD & Roadmap View** | `Planned (MVP)` | `frontend/src/components/layout/` | Tactical command bar (Level, XP, Streak) and interactive roadmap. |
| **Visual Block Workspace** | `Planned (MVP)` | `frontend/src/components/workspace/` | Snap-together geometry generating Abstract Syntax Trees (AST). |
| **Sandboxed Code Execution** | `Planned (MVP)` | `frontend/src/workers/codeRunner.worker.js`| Isolated client Web Worker with 1,000ms watchdog timeout guard. |
| **Express REST API Gateway** | `Planned (MVP)` | `backend/src/app.js`, `server.js` | Express 5 application with modular routes, CORS, and JSON parser. |
| **JWT Stateless Authentication** | `Planned (MVP)` | `backend/src/routes/auth.routes.js` | Bcrypt hashing (salt=10), signed 24h JWT tokens, auth middleware. |
| **MongoDB Document Store** | `Planned (MVP)` | `backend/src/models/` | Mongoose schemas for Users, Topics, Questions, and QuizAttempts. |
| **Deterministic Quiz Grader** | `Planned (MVP)` | `backend/src/controllers/quiz.controller.js`| Server-side grading; `.select("-correctAnswer")` anti-cheat projection. |
| **Deterministic XP Economy** | `Planned (MVP)` | `backend/src/services/gamificationService.js`| Formula $100 \times N^{1.5}$; streak tracking based on UTC calendar. |
| **Adaptive Difficulty Engine** | `Planned (Phase 2)`| `backend/src/services/adaptiveEngine.js` | Deterministic Bloom's cognitive staircase calibrated on 3-attempt accuracy. |
| **AI LLM Question Generator** | `Planned (Phase 2)`| `backend/src/services/aiQuestionService.js` | Low-temp (0.2) LLM prompt synthesis with Zod structured output checks. |
| **PostgreSQL Relational Layer** | `Planned (Phase 4)`| `database/migrations/001_relational_schema.sql`| Normalized SQL tables for Guilds and social graphs using SQL JOINs. |
| **Distributed Redis Cache** | `Future` | `backend/src/config/redis.js` | In-memory caching for curriculum hierarchies and rate limits. |

### 1.6 Architectural Assumptions
1. **Source Code Baseline:** The repository currently establishes the architectural baseline through `README.md`, `docs/PRD.md`, `docs/HLD.md`, and `docs/LLD.md`. Source code files represent the planned architecture for the implementation sprint and are accurately classified as `Planned (MVP)`.
2. **Persistence Allocation:** MongoDB serves as the primary document persistence engine for the MVP (handling users, curriculum topics, question banks, and quiz attempts). PostgreSQL relational tables and SQL JOIN queries are formally architected for Phase 4 social systems (Guilds, Guild Quests, relational leaderboards) to demonstrate dual-database competence without premature operational overhead.
3. **Execution Safety Invariant:** Untrusted learner code is executed strictly on the client inside isolated browser Web Workers backed by a 1,000ms watchdog timer. Untrusted code is never executed directly inside the Node.js API process.
4. **Application Authority over AI:** The Large Language Model (LLM) is strictly a pedagogical content generator. It has zero authority over user levels, XP awards, database writes, or curriculum unlocks. The application-level Adaptive Difficulty Engine deterministically calculates constraints before the LLM is invoked.

---

## 2. Product Overview

**CodeQuest** is a professional gamified programming-learning web platform engineered to bridge the cognitive divide between zero programming experience and production-grade software engineering.

```text
Traditional CS Education:
  Syntax & Grammar Memorization ──► Syntax Errors ──► Frustration ──► Disengagement

CodeQuest Paradigm:
  PLAY ──► BUILD ──► UNDERSTAND ──► CODE ──► MASTER
  (Interact)  (Assemble Blocks)  (Mental Model) (Real Syntax)  (Debug & Optimize)
```

### 2.1 The Problem Being Solved
Novices attempting to learn programming using traditional command-line environments or code editors face two distinct cognitive demands simultaneously:
1. **Algorithmic Logic:** Understanding step order, condition evaluation, loop termination, and variable mutation.
2. **Syntactical Rules:** Memorizing commas, colons, semicolons, parentheses, brackets, and whitespace indentation.

A single missing quotation mark produces intimidating, opaque error messages (`SyntaxError: unexpected EOF while parsing`). Beginners spend up to $85\%$ of their initial learning time debugging punctuation rather than building computational reasoning. Existing educational platforms polarize between childish games with cartoon mascots (alienating university students and adult career changers) and competitive coding platforms that assume pre-existing syntax fluency (like LeetCode).

### 2.2 Target Learners
- **Absolute Beginners:** Individuals with zero prior coding background needing an approachable, visual gateway into computational logic.
- **University & Engineering Students:** College freshmen enrolled in introductory computer science (CS1/CS2) needing concrete mental models for technical vivas and lab exams.
- **Visual & Kinetic Learners:** Students who grasp concepts fastest through spatial manipulation and immediate cause-and-effect visualization.
- **Career Switchers:** Adult professionals transitioning into tech who demand a mature, professional developer tool aesthetic.

### 2.3 The Core Learning Journey
Learners advance through seven foundational tiers:
```text
Level 1: Computational Thinking (Instructions, sequencing, spatial actions)
   ↓
Level 2: Visual Coding (Block manipulation, snap geometry, input sockets)
   ↓
Level 3: Control Flow & Logic (Branching, if/else, comparison operators)
   ↓
Level 4: Iteration & State (While-loops, counter loops, mutable variables)
   ↓
Level 5: Data Structures (Arrays, index access, collections, key-value maps)
   ↓
Level 6: Functions & Decomposition (Parameters, return values, modularity)
   ↓
Level 7: Real Code Dual-View (Block-to-text equivalence, syntax editing)
```

### 2.4 Cyber Developer Aesthetic
CodeQuest replaces cartoonish gamification with a sleek **Cyber-Developer SaaS Aesthetic**:
- Near-black deep space canvas base (`#0B0F19`) and dark navy panels (`#111827`).
- Restrained neon accents: Cyan (`#06B6D4`), Electric Blue (`#3B82F6`), Controlled Violet (`#8B5CF6`), and Matrix Emerald (`#10B981`).
- Code-editor-inspired split-views and terminal-inspired diagnostic docks.
- Subtle circuit/grid textures and restrained neon micro-glows.
- Zero cartoon mascots, zero bouncing emojis, zero pastel rainbow palettes, zero hacker/security-tool aesthetic.

---

## 3. Architecture Goals

The architecture of CodeQuest is designed around ten non-negotiable engineering goals:

1. **Maintainability:** Modular separation of concerns across presentation, routing, pure business domains, and persistence.
2. **Simplicity:** Prefer a modular monolith with direct solutions over premature microservices infrastructure.
3. **Absolute Code Execution Safety:** Zero server-side Remote Code Execution (RCE) vulnerability; arbitrary student code is strictly isolated on the client.
4. **Scalability:** Stateless API gateway enabling horizontal auto-scaling behind load balancers with $O(1)$ server compute for code execution.
5. **Extensibility:** Clean plugin points for additional programming languages (Python via WebAssembly) and social mechanics.
6. **Testability:** Decoupled business logic allowing high unit and integration test coverage across grading, difficulty calibration, and token verification.
7. **Learner Experience:** Sub-1.5s initial load, 60 FPS visual block interactions (<16ms frame time), and sub-200ms REST response latencies.
8. **AI Reliability & Graceful Degradation:** Automatic failover to pre-seeded static question banks on external AI timeouts or validation failures.
9. **Explainable Adaptive Learning:** Deterministic Bloom's cognitive staircase based on rolling accuracy rather than opaque black-box AI decisions.
10. **Academic & Viva Defense Traceability:** Every architectural layer directly demonstrates fundamental computer science principles (event loop, closures, relational integrity, stateless auth).

---

## 4. Architecture Principles

1. **Principle 1: Simplicity Before Complexity:** Solve real problems with direct solutions. Do not introduce microservices or distributed message brokers prematurely.
2. **Principle 2: Clear Separation of Responsibilities:** Controllers handle HTTP transport; services handle pure domain rules; models handle data persistence; Web Workers handle code execution.
3. **Principle 3: Validate External Inputs:** Validate all incoming HTTP payloads via Zod schemas before touching business logic.
4. **Principle 4: Never Trust Raw LLM Output:** Treat external AI completions as untrusted input; enforce strict JSON schema validation, type checks, and distractor verification.
5. **Principle 5: Never Expose Secrets:** Private API keys, database connection URIs, and JWT signing secrets reside exclusively in backend environment variables.
6. **Principle 6: Backend Controls AI Access:** The client never connects directly to external AI providers. The backend brokers all AI interactions to enforce rate limits, caching, and prompt guardrails.
7. **Principle 7: Application Controls Curriculum:** The application determines what concepts exist, what difficulty tier to present, and whether the learner advances. The LLM generates content within these constraints.
8. **Principle 8: Isolate Code Execution:** Execute untrusted student code within isolated browser Web Workers with shadowed globals and a hard 1,000ms watchdog timeout guard.
9. **Principle 9: Design for Failures:** Build failover mechanisms into every external dependency (database reconnects, AI seed fallbacks, worker watchdog termination).
10. **Principle 10: Avoid Unnecessary Infrastructure:** Add infrastructure (Redis, PostgreSQL) only when justified by concrete technical requirements.

---

## 5. High-Level System Architecture

The macro-system architecture decouples client interaction, application routing, business services, polyglot persistence, and external AI systems:

```mermaid
flowchart TB
    Learner["🧑‍💻 Learner / Student Browser"]

    subgraph ClientTier["Frontend Presentation Tier (React 19 + Vite)"]
        UI["Cyber HUD & Layout Shell\n(DashboardHUD.jsx)"]
        Roadmap["Curriculum Roadmap View\n(RoadmapCanvas.jsx)"]
        Workspace["Visual Block Workspace\n(AST Serialization Engine)"]
        Preview["Real-Time Dual Code Preview\n(JavaScript Syntax Emitter)"]
        WorkerSandbox["Sandboxed Web Worker\n(Client-Side JS Runtime)"]
    end

    subgraph GatewayTier["Backend Application Gateway (Express 5)"]
        Router["RESTful API Gateway Router\n(/api/auth, /api/topics, /api/quizzes)"]
        SecurityMW["Security Middleware\n(CORS, Helmet, Rate Limiter)"]
        AuthMW["Auth Middleware\n(JWT Bearer Verification)"]
        ValMW["Validation Middleware\n(Zod Payload Schemas)"]
        ErrMW["Centralized Error Middleware\n(Standard JSON Envelopes)"]
    end

    subgraph ServiceTier["Domain Service Layer (Modular Monolith)"]
        AuthService["Auth Service\n(bcryptjs / JWT Sign)"]
        LearningService["Curriculum Service\n(Hierarchy & Unlocking)"]
        GradingService["Grading Service\n(Deterministic Evaluation)"]
        GamificationService["Gamification Service\n(XP Formulas & Streaks)"]
        AdaptiveEngine["Adaptive Difficulty Engine\n(Bloom's Cognitive Staircase)"]
        AIService["AI Question Service\n(Prompt Pipeline & Validation)"]
    end

    subgraph DataTier["Data & Persistence Tier"]
        MongoDB[(MongoDB Document Store\nTopics, Questions, Attempts, AI Docs)]
        Postgres[(PostgreSQL Relational DB\nGuilds, Members, SQL JOINs [Phase 4])]
        FallbackBank[(Pre-Seeded Question Bank\nFail-Safe Seed Repository)]
    end

    subgraph ExternalTier["External Cloud Providers"]
        LLM["Google Gemini 1.5 Flash API\n(Low Temp: 0.2, Structured Output)"]
    end

    Learner --> UI
    UI --> Roadmap
    UI --> Workspace
    Workspace --> Preview
    Workspace --> WorkerSandbox
    UI --> Router

    Router --> SecurityMW --> AuthMW --> ValMW
    ValMW --> AuthService
    ValMW --> LearningService
    ValMW --> GradingService
    ValMW --> GamificationService
    ValMW --> AdaptiveEngine
    ValMW --> AIService

    GradingService --> AdaptiveEngine
    AdaptiveEngine --> AIService
    AIService --> LLM
    AIService -.->|On Failure / Timeout| FallbackBank

    AuthService --> MongoDB
    LearningService --> MongoDB
    GradingService --> MongoDB
    GamificationService --> MongoDB
    AIService --> MongoDB

    ServiceTier -.-> Postgres
    Router -.-> ErrMW
```

---

## 6. Major System Components

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      CODEQUEST COMPONENT TOPOLOGY                      │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Component Name          │ Tier / Runtime       │ Architectural Status  │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ 1. Frontend Application │ Client (Browser)     │ Planned (MVP)         │
│ 2. Backend API Gateway  │ Server (Node.js)     │ Planned (MVP)         │
│ 3. Authentication Mod.  │ Server (Service)     │ Planned (MVP)         │
│ 4. Learning Module      │ Server (Service)     │ Planned (MVP)         │
│ 5. Challenge Module     │ Server (Service)     │ Planned (MVP)         │
│ 6. Progress Module      │ Server (Service)     │ Planned (MVP)         │
│ 7. Gamification Module  │ Server (Service)     │ Planned (MVP)         │
│ 8. AI Question Service  │ Server (Service)     │ Planned (Phase 2)     │
│ 9. Adaptive Engine      │ Server (Service)     │ Planned (Phase 2)     │
│ 10. Visual Block Module │ Client (Component)   │ Planned (MVP)         │
│ 11. Code Runner Sandbox │ Client (Web Worker)  │ Planned (MVP)         │
│ 12. MongoDB Database    │ Persistence (NoSQL)  │ Planned (MVP)         │
│ 13. PostgreSQL Database │ Persistence (SQL)    │ Planned (Phase 4)     │
│ 14. Fallback Seed Bank  │ Server (Repository)  │ Planned (Phase 2)     │
│ 15. External LLM Gateway│ External Cloud       │ Planned (Phase 2)     │
│ 16. Logging & Observers │ Server (Cross-Cut)   │ Planned (MVP)         │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

### Component Details
1. **Frontend Application:** Single Page Application (React 19) providing visual programming, live code preview, roadmap canvas, and cyber HUD.
2. **Backend API Gateway:** Express 5 HTTP ingress point managing security headers, rate limiting, payload validation, and request routing.
3. **Authentication Module:** Manages registration, bcrypt password hashing (10 rounds), credential verification, and signed JWT issuance.
4. **Learning Module:** Delivers curriculum hierarchy, topic listing, level progression, and concept prerequisites.
5. **Challenge & Grading Module:** Delivers challenges with anti-cheat projection (`.select("-correctAnswer")`) and deterministically grades submissions.
6. **Progress Module:** Tracks concept mastery vectors, attempt history, and roadmap unlock thresholds.
7. **Gamification Module:** Calculates deterministic XP, level thresholds ($100 \times N^{1.5}$), and daily practice streaks.
8. **AI Question Service:** Assembles prompts with role framing and syntax whitelists, calls LLM at temperature 0.2, and validates structured JSON.
9. **Adaptive Difficulty Engine:** Computes Bloom's cognitive stages (1 to 5) based on 3-attempt rolling accuracy.
10. **Visual Block Module:** Interactive spatial canvas with magnetic snapping, type sockets, and real-time AST serialization.
11. **Code Runner Sandbox:** Client-side Web Worker executing generated code with console interception and a 1,000ms watchdog timer.
12. **MongoDB Database:** Flexible document storage for curriculum topics, polymorphic questions, attempt logs, and cached AI questions.
13. **PostgreSQL Database:** Relational storage for multi-user Guilds, memberships, and SQL JOIN query leaderboards (Phase 4).
14. **Fallback Seed Question Bank:** Curated static questions guaranteeing 100% platform uptime during external AI outages.
15. **External LLM Gateway:** High-speed cloud generative inference (Google Gemini 1.5 Flash API).
16. **Logging & Observability:** Structured JSON request logging, latency monitoring, and PII redaction.

---

## 7. Frontend Architecture

The frontend is structured as a component-driven Single Page Application (SPA) leveraging React 19 and Vite 8:

```mermaid
flowchart TD
    App["App.jsx (Root Application)"]
    AuthProvider["AuthProvider (JWT Session State)"]
    Router["AppRoutes (React Router v7)"]

    subgraph Layout["Persistent Layout Shell"]
        MainLayout["MainLayout.jsx"]
        HUD["DashboardHUD.jsx (Level, XP Bar, Streak, Avatar)"]
        Outlet["Route <Outlet />"]
    end

    subgraph Pages["Primary Page Targets"]
        Dashboard["Dashboard.jsx (/dashboard)"]
        Challenge["ChallengePage.jsx (/challenge/:id)"]
        Practice["PracticePage.jsx (/practice/:topicId)"]
        Login["LoginPage.jsx (/login)"]
        Register["RegisterPage.jsx (/register)"]
    end

    subgraph WorkspaceFeature["Challenge Workspace Feature Module"]
        Brief["MissionBrief.jsx (Objectives & Hints)"]
        BlocklyCanvas["BlockWorkspace.jsx (Visual Drag-and-Drop)"]
        CodeView["CodePreview.jsx (Live Syntax Panel)"]
        Terminal["TerminalDock.jsx (Execution Logs & Output)"]
    end

    App --> AuthProvider --> Router
    Router --> MainLayout
    MainLayout --> HUD
    MainLayout --> Outlet

    Outlet --> Dashboard
    Outlet --> Challenge
    Outlet --> Practice
    Outlet --> Login
    Outlet --> Register

    Challenge --> Brief
    Challenge --> BlocklyCanvas
    Challenge --> CodeView
    Challenge --> Terminal
```

### High-Level Frontend Subsystems
- **Layout Shell:** Persistent tactical HUD showing level, XP bar, streak counter, and user profile across all authenticated routes.
- **Curriculum Roadmap:** Interactive canvas rendering locked, active, and mastered concept nodes with dependency paths.
- **Challenge Workspace:** Split-view workspace pairing the mission brief, draggable block canvas, synchronized syntax preview, and terminal output dock.
- **State Partitioning:** Local state (`useState`) handles ephemeral canvas interactions; React Context handles authentication; decoupled API client handles remote server state with 3-state loading/success/error lifecycles.

---

## 8. Backend Architecture

The backend is engineered as a **modular monolith** enforcing layered separation between transport protocols, authorization, domain logic, and physical data persistence:

```text
┌────────────────────────────────────────────────────────┐
│ 1. TRANSPORT & GATEWAY LAYER                           │
│ - Express 5 App, Security Headers (Helmet), CORS       │
│ - Rate Limiting, JSON Body Parser, Request Logger      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE & ROUTING LAYER                          │
│ - Modular Route Routers (/api/auth, /api/topics)       │
│ - JWT Bearer Authentication Middleware                 │
│ - Zod Request Payload Validation Middleware            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. CONTROLLER LAYER (Transport Adapters)               │
│ - Extracts req.body, req.params, req.user              │
│ - Invokes domain services; maps outcomes to HTTP codes │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. DOMAIN SERVICE LAYER (Pure Business Logic)          │
│ - Grading formulas, XP rules, Bloom's cognitive stages │
│ - Prompt synthesis, LLM client, Fallback question bank │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. PERSISTENCE & DATA ACCESS LAYER                     │
│ - Mongoose ODM Models (Users, Topics, Questions)       │
│ - Relational SQL Repositories (PostgreSQL Guilds)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. CENTRALIZED ERROR HANDLING MIDDLEWARE               │
│ - Intercepts AppErrors, CastErrors, Duplicate Keys     │
│ - Formats standardized JSON error envelopes            │
└────────────────────────────────────────────────────────┘
```

---

## 9. REST API Architecture

The API adheres to RESTful architectural principles:
- **Statelessness:** Every request carries its authentication token (`Authorization: Bearer <token>`); zero session state is stored in server memory.
- **Resource-Oriented URIs:** Nouns identify resources (`/api/topics`, `/api/quizzes`); HTTP verbs define operations (`GET`, `POST`).
- **Standardized Response Envelope:** Every response conforms to a predictable JSON envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-10-06T12:00:00.000Z"
}
```

### Representative Endpoint Groups

| Endpoint Group | Primary Resource | Methods | Status Codes | Auth Required |
|:---|:---|:---:|:---:|:---:|
| `/api/auth` | User Identity & Sessions | `POST`, `GET` | `200`, `201`, `400`, `401`, `409` | Optional / Bearer |
| `/api/topics` | Curriculum Taxonomy | `GET` | `200`, `404`, `500` | Public |
| `/api/quizzes` | Question Delivery & Submissions | `GET`, `POST` | `200`, `201`, `400`, `401` | Public / Bearer |
| `/api/challenges` | Interactive Visual Tasks | `GET` | `200`, `404` | Bearer |
| `/api/progress` | Learner Mastery Vectors | `GET` | `200`, `401` | Bearer |
| `/api/ai-questions`| Adaptive Practice Synthesis | `POST` | `200`, `429`, `503` | Bearer |

$$\mathbf{CRITICAL\ RULE:}\ \text{Returning 200 OK for error responses is strictly prohibited.}$$

---

## 10. Database Architecture

CodeQuest employs a **polyglot persistence strategy** assigning explicit storage engines to their natural domain strengths:

```text
                               CODEQUEST PERSISTENCE TIER
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
             DOCUMENT STORAGE                           RELATIONAL STORAGE
             (MongoDB / NoSQL)                          (PostgreSQL / SQL)
                      │                                         │
        ├── Polymorphic AI Question Schemas        ├── Strict ACID Transactions
        ├── Nested Options & Answer Arrays         ├── Foreign Key Cascading Integrity
        ├── Semi-Structured Curriculum Data        ├── Complex Relational SQL JOINs
        └── Rapid Schema Evolution                 └── Multi-User Social Graphs (Guilds)
```

### Polyglot Workload Allocation
- **MongoDB (Document Model):** Serves `User`, `Topic`, `Question`, `QuizAttempt`, and `AIQuestion`. Ideal for polymorphic question structures (MCQ, bug hunt, output prediction), nested distractor arrays, and rapid curriculum iteration without database migration bottlenecks.
- **PostgreSQL (Relational Model):** Serves `users`, `guilds`, `guild_members`, and `guild_quests` in Phase 4. Enforces strict Primary Key / Foreign Key constraints, cascading deletes, and multi-table SQL JOIN queries essential for social graphs and collaborative leaderboards.

---

## 11. Learning Architecture

The educational progression is structured into an extensible domain hierarchy and a 7-stage cognitive staircase:

$$\text{Learning Path} \longrightarrow \text{Level} \longrightarrow \text{Concept} \longrightarrow \text{Challenge} \longrightarrow \text{Attempt} \longrightarrow \text{Result} \longrightarrow \text{Progress}$$

```mermaid
flowchart TD
    Path["Learning Path (e.g., 'Web Foundations')"]
    Level["Level (e.g., 'Level 3: Control Flow')"]
    Concept["Concept (e.g., 'Loops & Iteration')"]
    Challenge["Challenge (e.g., 'Collect Gems Loop')"]
    Attempt["Attempt Record (User Solution, Timestamp)"]
    Result["Result (Accuracy, Time, XP Earned)"]
    Progress["Progress Update (Mastery %, Unlock Next)"]

    Path --> Level
    Level --> Concept
    Concept --> Challenge
    Challenge --> Attempt
    Attempt --> Result
    Result --> Progress
    Progress -.->|Unlocks Next Node When Mastery >= 85%| Concept
```

### The Seven Stages of Learner Progression
1. **Stage 1: Recognition:** Identify programming constructs, predict program outputs, and trace step execution without syntax friction.
2. **Stage 2: Construction:** Assemble logic, control flow, and sequencing using unconstrained visual snap blocks.
3. **Stage 3: Application:** Apply foundational constructs to solve concrete computational tasks with defined goals.
4. **Stage 4: Debugging:** Spot flaws, trace infinite loops, and resolve off-by-one errors in pre-existing broken code.
5. **Stage 5: Problem Solving:** Formulate multi-step algorithmic strategies and state transformations from high-level specifications.
6. **Stage 6: Real Code:** Translate visual block programs into typed syntax in target languages (JavaScript / Python).
7. **Stage 7: Advanced Reasoning / Optimization / Projects:** Optimize algorithmic time/space efficiency, respect block count constraints, and engineer multi-component mini-projects.

---

## 12. Challenge Architecture

```mermaid
stateDiagram-v2
    [*] --> Draft : Author creates challenge
    Draft --> Published : Validated & Seeded
    Published --> Locked : Prerequisite incomplete
    Locked --> Active : Prerequisites Mastered (>=85%)
    Active --> InProgress : Learner opens workspace
    InProgress --> Evaluating : Submits code / answers
    Evaluating --> Failed : Test assertions fail (0 XP)
    Failed --> InProgress : Re-attempt challenge
    Evaluating --> Passed : Test assertions pass (+XP)
    Passed --> Mastered : Concept accuracy >= 85%
    Mastered --> [*]
```

### Challenge Typology
- **Multiple Choice / Recognition:** Predict the final state or return value of a code snippet.
- **Visual Block Assembly:** Snap together blocks to navigate an avatar or solve an algorithmic spec.
- **Constrained Optimization:** Solve problems respecting block count limits (e.g., max 4 blocks).
- **Bug Hunt:** Trace a pre-built flawed sequence (e.g. infinite loop, off-by-one) and apply the fix.
- **Syntax Translation:** Bridge visual block logic to equivalent written code in JavaScript or Python.

---

## 13. Blockly / Visual Coding Architecture

Visual programming eliminates syntactic frustration while building algorithmic intuition:

```mermaid
flowchart LR
    Palette["Block Palette (Actions, Logic, Loops, Vars)"]
    Canvas["Blockly / Visual Canvas (Magnetic Snapping)"]
    AST["Abstract Syntax Tree (In-Memory AST)"]
    CodeGen["Target Code Generator (JS / Python Serializer)"]
    Preview["Real-Time Dual-View Syntax Panel"]
    Worker["Sandboxed Web Worker (Client Runner)"]

    Palette -->|Drag & Drop| Canvas
    Canvas -->|Type Socket Validation| AST
    AST -->|Serialize| CodeGen
    CodeGen -->|Synchronize View| Preview
    CodeGen -->|Execute Payload| Worker
```

### Bridge from Visual Blocks to Real Code
1. **Geometric Type Sockets:** Sockets prevent syntactically invalid connections (e.g. boolean condition blocks cannot snap into integer arithmetic slots).
2. **Synchronous AST Code Generation:** Every block modification triggers an AST traversal that emits cleanly formatted JavaScript in the adjacent code panel in real time ($<16\text{ms}$).
3. **Interactive Highlighting:** Hovering over a visual block highlights the corresponding lines of written syntax in the code preview panel.

---

## 14. Code Execution Architecture

Executing untrusted learner code represents the **primary security boundary** of the platform:

$$\mathbf{CRITICAL\ RULE:}\ \text{Untrusted learner code MUST NEVER be executed inside the main backend Node.js process.}$$

```mermaid
flowchart TB
    UI["React Challenge Workspace"]
    Manager["useCodeRunner Hook (Main Thread)"]
    Watchdog["Watchdog Timer (Strict 1,000ms Hard Timeout)"]

    subgraph Sandbox["Isolated Browser Web Worker"]
        WorkerScope["Dedicated Worker Global Scope"]
        ShadowedGlobals["Shadowed Globals (window=null, fetch=null, xhr=null, doc=null)"]
        Interpreter["JavaScript V8 Runtime"]
    end

    Terminal["TerminalDock (Captured Console Logs)"]

    UI -->|Click 'Run Code'| Manager
    Manager -->|postMessage({ code, tests })| Sandbox
    Manager -->|Arm 1,000ms Timeout| Watchdog

    ShadowedGlobals --> Interpreter
    Interpreter -->|postMessage({ status: 'done', logs, result })| Manager
    
    Watchdog -->|Timeout Exceeded (>1,000ms)| ForceKill["worker.terminate()\nReport Infinite Loop Error"]
    ForceKill --> Terminal
    Manager -->|Render Output| Terminal
```

### Execution Security Controls
- **Process Isolation:** Code executes inside a dedicated browser Web Worker thread with zero access to the DOM, `document.cookie`, `localStorage`, or window object.
- **Shadowed Network Globals:** `fetch`, `XMLHttpRequest`, and `WebSocket` are shadowed or nullified within worker scope.
- **Watchdog Timer:** A hard 1,000ms timeout terminates the worker via `worker.terminate()` if execution does not complete, preventing browser UI lockup on infinite loops.

---

## 15. AI / LLM Architecture

```mermaid
flowchart TD
    Progress["Learner Progress\n(Mastery %, Recent Attempts, Mistakes)"] --> DiffEngine["Difficulty Engine\n(Calculates Stage & Boundaries)"]
    DiffEngine --> Obj["Learning Objective\n(Target Bloom's Tier & Concept)"]
    Obj --> PromptBuilder["Prompt Builder\n(System Guardrails & JSON Schema)"]
    PromptBuilder --> LLM["LLM Inference\n(Gemini 1.5 Flash @ T=0.2)"]
    LLM --> RawOutput["Structured Output\n(Raw JSON String)"]
    RawOutput --> Validation{"Schema Validation\n(Zod Validator)"}
    
    Validation -->|Pass| Question["Validated Question"]
    Validation -->|Fail / Timeout| Fallback["Fallback Seed Bank\n(Pre-Seeded Question)"]
    Fallback --> Question
    
    Question --> Client["Sanitized Question to Learner\n(Answers Stripped)"]
    Client --> LearnerAnswer["Learner Answer Submission"]
    LearnerAnswer --> Evaluation["Server-Side Evaluation\n(Deterministic Grader)"]
    Evaluation --> ProgressUpdate["Progress Update\n(XP, Mastery %, Streak)"]
    ProgressUpdate --> NextDiff["Next Difficulty Calibration"]
    NextDiff -.-> Progress
```

### AI Input Factors
The AI adaptive learning subsystem synthesizes practice challenges using ten contextual inputs:
1. **Learner Level:** Overall progression rank and unlocked tier.
2. **Concept:** Specific target topic (e.g. `loops_while`, `conditionals`).
3. **Difficulty Stage:** Current Bloom's cognitive level (Recognition, Assembly, Debugging).
4. **Learning Objective:** The specific pedagogical outcome for the challenge.
5. **Accuracy:** Rolling percentage of correct submissions.
6. **Recent Mistakes:** Categorized error patterns (e.g. off-by-one, infinite loop, syntax inversion).
7. **Attempts Count:** Total attempts made on the current topic.
8. **Hint Usage:** Number of progressive hints requested.
9. **Previous Performance:** Historical velocity and time spent per challenge.
10. **Concept Mastery:** Verified mastery percentage score for the concept.

### Application Authority over AI
$$\mathbf{CRITICAL\ RULE:}\ \text{The Large Language Model MUST NOT control the curriculum or game rules.}$$

The backend application deterministically controls:
- **Learning Path:** Top-level progression domains.
- **Levels:** Sequential order and unlocking gates.
- **Concepts:** Allowed programming primitives.
- **Difficulty Boundaries:** Min/max complexity parameters.
- **Learning Objectives:** Explicit pedagogical targets.
- **Progression Rules:** Rolling accuracy thresholds required to advance.
- **Question Types:** Allowed question formats (multiple choice, bug hunt).
- **Evaluation Rules:** Pass/fail test assertions and XP formulas.

### Protection & Cost Control
1. **Zero Client API Keys:** Private LLM API credentials reside exclusively on the backend server.
2. **Semantic Caching:** Validated generated questions are stored in MongoDB indexed by concept and difficulty, reducing recurring API expenses by up to $70\%$.
3. **Low Temperature ($T = 0.2$):** Constrains generative randomness to produce consistent, schema-conforming questions.
4. **Failover Guarantee:** Unreachable AI APIs or invalid outputs trigger an immediate fallback to verified pre-seeded question banks.

---

## 16. Adaptive Difficulty Architecture

CodeQuest implements a **deterministic Bloom's Cognitive Staircase** owned strictly by the application backend:

```text
[STAGE 1: Recognition]
  Multiple Choice / Output Prediction / Code Tracing
        │
        ▼ (Rolling Accuracy >= 75% on last 3 attempts)
[STAGE 2: Construction]
  Unconstrained Visual Block Assembly
        │
        ▼ (Rolling Accuracy >= 80% on last 3 attempts)
[STAGE 3: Constrained Optimization]
  Assembly with Resource Limits (Max Blocks <= 4)
        │
        ▼ (Rolling Accuracy >= 85% on last 3 attempts)
[STAGE 4: Debugging (Bug Hunt)]
  Spotting off-by-one errors & broken loop invariants
        │
        ▼ (Rolling Accuracy >= 90% on last 3 attempts)
[STAGE 5: Real Code Synthesis]
  Directly writing syntax in target language (JavaScript/Python)
```

### Progression Rules
- **Low Performance (<60% accuracy on last 3 attempts):** Maintain concept; drop to Stage 1 (Recognition) or Stage 2 (Construction); provide progressive hints; reduce problem complexity.
- **Consistent Performance (60%–84% accuracy):** Maintain concept; introduce Stage 3 (Constrained optimization) or targeted remediation for observed error patterns.
- **Mastery Performance ($\ge$85% accuracy over $\ge$3 attempts):** Advance to Stage 4 (Debugging) and Stage 5 (Code synthesis). Once concept mastery reaches $\ge$90%, unlock the subsequent curriculum node.

---

## 17. Authentication and Authorization

CodeQuest implements a **stateless token-based authentication** architecture:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner (Browser)
    participant API as API Gateway (/api/auth)
    participant AuthCtrl as Auth Controller
    participant UserModel as User Model (MongoDB)
    participant JWT as jsonwebtoken

    Note over Learner,JWT: Registration Flow
    Learner->>API: POST /api/auth/register { username, email, password }
    API->>AuthCtrl: Validate payload (registerSchema)
    AuthCtrl->>UserModel: Check if email or username exists
    alt User Already Exists
        UserModel-->>AuthCtrl: Match found
        AuthCtrl-->>Learner: 409 Conflict { message: "Email already registered" }
    else Unique User
        AuthCtrl->>AuthCtrl: bcrypt.hash(password, saltRounds = 10)
        AuthCtrl->>UserModel: User.create({ username, email, password: hash })
        UserModel-->>AuthCtrl: User Document Created
        AuthCtrl->>JWT: sign({ id: user._id, username, role: 'user' }, secret, { expiresIn: '24h' })
        JWT-->>AuthCtrl: Signed Token String
        AuthCtrl-->>Learner: 201 Created { token, user: { id, username, totalXp: 0, level: 1 } }
    end

    Note over Learner,JWT: Authenticated Request Flow
    Learner->>API: POST /api/quizzes/:id/submit (Header: Bearer <token>)
    API->>API: authMiddleware extracts token from header
    API->>JWT: verify(token, secret)
    alt Valid Token
        JWT-->>API: Decoded claims: { id: "6700...", username: "...", role: "user" }
        API->>API: Set req.user = decodedClaims
        API->>API: Proceed to route controller
    else Expired or Tampered Token
        JWT-->>API: JsonWebTokenError / TokenExpiredError
        API-->>Learner: 401 Unauthorized { message: "Invalid or expired token" }
    end
```

---

## 18. Middleware Architecture

Incoming HTTP requests pass through an ordered sequence of cross-cutting middleware before entering route handlers:

```text
HTTP Request
     │
     ▼
[1. CORS Middleware] ──► Rejects unwhitelisted origins
     │
     ▼
[2. Helmet Security Headers] ──► Injects CSP, XSS-Protection, HSTS
     │
     ▼
[3. JSON Body Parser] ──► Parses body with 1MB size limit
     │
     ▼
[4. Request Logger] ──► Logs method, path, request ID, timestamp
     │
     ▼
[5. Rate Limiter] ──► Enforces token bucket window; trips 429 if exceeded
     │
     ▼
[6. Auth Middleware (Optional/Required)] ──► Decodes JWT; populates req.user
     │
     ▼
[7. Zod Validation Middleware] ──► Validates payload schema; trips 400 if invalid
     │
     ▼
[8. Controller Route Handler] ──► Executes domain logic
     │
     ▼
[9. 404 Catch-All Middleware] ──► Intercepts unmatched routes
     │
     ▼
[10. Central Error Middleware] ──► Standardizes exceptions into JSON envelope
```

---

## 19. Security Architecture

| Security Domain | Strategy in CodeQuest | Status | Architectural Defense |
|:---|:---|:---:|:---|
| **Authentication** | Stateless JWT bearer tokens (24h expiry) | `Planned (MVP)` | Eliminates server session state; verified via shared cryptographic secret. |
| **Password Hashing**| `bcryptjs` with 10 salt rounds | `Planned (MVP)` | Protects against rainbow tables and GPU brute-force attacks. |
| **Code Execution** | Isolated browser Web Worker sandbox | `Planned (MVP)` | Zero server RCE; 1,000ms watchdog prevents client freezing. |
| **Anti-Cheat** | `.select("-correctAnswer")` projection | `Planned (MVP)` | Strips answers from HTTP queries; graded exclusively on server. |
| **Input Validation**| Zod payload schemas | `Planned (MVP)` | Rejects malformed requests before touching business logic. |
| **Injection Defense**| Mongoose typed schemas & SQL params | `Planned (MVP)` | Sanitizes NoSQL queries; parameterizes SQL queries (`$1`). |
| **AI Safety** | Low temp (0.2) + Zod schema validation | `Planned (Phase 2)`| Discards malformed completions; serves verified seed questions. |
| **Rate Limiting** | Token bucket sliding windows | `Planned (MVP)` | Throttles auth brute-forcing (10/15m) and AI costs (5/1m). |
| **Secrets Isolation**| Server-only `.env` injected via `dotenv`| `Planned (MVP)` | Zero secrets committed to Git; frontend bundle contains zero keys. |

---

## 20. Error Handling Architecture

Centralized error handling standardizes failure responses across all endpoints:

```json
{
  "success": false,
  "error": {
    "code": "CHALLENGE_NOT_FOUND",
    "message": "Challenge with the specified ID was not found",
    "details": null
  },
  "timestamp": "2026-10-06T12:00:00.000Z"
}
```

### Error Interception Strategy
- Custom `AppError` class establishes operational errors with defined HTTP status codes.
- Mongoose `CastError` (invalid ObjectId) automatically converts to `400 Bad Request`.
- Mongoose duplicate key error (`E11000`) automatically converts to `409 Conflict`.
- Unhandled rejections and database drops return `500 Server Error` with stack traces suppressed in production.

---

## 21. Environment and Secrets

```text
# Server Infrastructure
PORT=5000
NODE_ENV=development | production
CORS_ORIGIN=http://localhost:5173

# Authentication Secrets
JWT_SECRET=super_secret_cryptographic_key_minimum_32_chars
JWT_EXPIRES_IN=24h

# Database Connections
MONGODB_URI=mongodb://localhost:27017/codequest
DATABASE_URL=postgresql://user:password@localhost:5432/codequest

# External AI Provider
AI_PROVIDER=gemini
AI_API_KEY=server_side_private_api_key_placeholder
AI_MODEL_NAME=gemini-1.5-flash
```

### Security Rules
- `.env` files are explicitly excluded via `.gitignore`.
- `.env.example` provides safe placeholder documentation.
- The React frontend bundle contains only public configuration prefixed with `VITE_` (`VITE_API_BASE_URL`).

---

## 22. Logging and Observability

- **Structured JSON Logging:** Pino logger emits formatted JSON streams with `timestamp`, `level`, `reqId`, `method`, `path`, `statusCode`, and `durationMs`.
- **PII Redaction:** Passwords, tokens, API keys, and personal contact info are filtered and redacted from all log streams.
- **Health Check Endpoints:** `/health/live` (verifies process liveness) and `/health/ready` (verifies active MongoDB/Postgres database connections).

---

## 23. Rate Limiting

Rate limiting protects the platform from denial-of-service attacks, credential brute-forcing, and runaway LLM costs:

| Endpoint Group | Window | Max Requests | Violation Response | Rationale |
|:---|:---:|:---:|:---:|:---|
| `/api/auth/*` | 15 min | 10 per IP | `429 Too Many Requests` | Mitigates automated credential stuffing attacks. |
| `/api/quizzes/:id/submit`| 1 min | 30 per User | `429 Too Many Requests` | Prevents automated answer farming and script flooding. |
| `/api/ai-questions/*` | 1 min | 5 per User | `429 Too Many Requests` | Protects external LLM quota and infrastructure costs. |
| General Read Endpoints | 1 min | 120 per IP | `429 Too Many Requests` | Shields database from resource exhaustion. |

---

## 24. Caching

| Data Candidate | Cache Justification | Invalidation Strategy | Implementation Status |
|:---|:---|:---|:---:|
| **Static Curriculum Hierarchy** | Topics and levels are read on every dashboard load but rarely change. High read-to-write ratio. | Event-driven cache eviction on curriculum update; 24h TTL fallback. | `Planned (Phase 3)` |
| **Synthesized AI Questions** | Reusable practice questions for matching difficulty stages eliminate expensive LLM calls. | MongoDB collection indexed by `conceptId` and `difficultyStage`. | `Planned (Phase 2)` |
| **Rate Limit Counters** | Fast atomic increments for API rate-limiting windows. | In-memory sliding window / Redis key TTL (60s). | `Planned (Phase 3)` |
| **Learner XP & Real-Time Progress**| **DO NOT CACHE.** High write frequency, strict consistency; stale cache risks duplicate XP exploits. | Direct database read/write with atomic updates. | `Rejected for Cache` |

---

## 25. External Systems

| External System | Integration Method | Data Exchanged | Failure Mode | Security & Defense |
|:---|:---|:---|:---|:---|
| **Google Gemini API** | Outbound HTTPS SDK | Prompt XML context $\rightarrow$ Structured JSON | Intercepted within 3s $\rightarrow$ Pre-seeded fallback | Private key isolated on server; low temp (0.2). |
| **MongoDB Atlas** | Mongoose TCP Socket | BSON document queries & updates | Auto-reconnect with exponential backoff | SSL/TLS connection; IP access whitelisting. |
| **PostgreSQL (Neon)**| node-postgres TCP Socket| Parameterized SQL queries | Fallback to cached read replicas | SSL connection string; parameterized queries (`$1`). |
| **Cloudflare / Vercel**| HTTPS Edge CDN | Static React assets (HTML, JS, CSS) | Edge CDN failover | DDoS mitigation; strict HTTPS/TLS termination. |

---

## 26. High-Level Data Flows

```mermaid
flowchart TD
    subgraph Flow1["1. Authentication Flow"]
        F1_A["Learner submits credentials"] --> F1_B["Bcrypt verifies hash"] --> F1_C["Signed JWT returned (24h)"]
    end

    subgraph Flow2["2. Challenge Solving Flow"]
        F2_A["Load challenge (Answers stripped)"] --> F2_B["Assemble visual blocks"] --> F2_C["Execute in Web Worker (<1s)"] --> F2_D["Submit solution to server"]
    end

    subgraph Flow3["3. Grading & Gamification Flow"]
        F3_A["Server validates assertions"] --> F3_B["Atomic $inc XP update"] --> F3_C["Level threshold evaluated"] --> F3_D["UTC Streak updated"]
    end

    subgraph Flow4["4. Adaptive Learning Flow"]
        F4_A["3-attempt rolling accuracy computed"] --> F4_B["Bloom's stage adjusted"] --> F4_C["AI synthesizes bounded question"]
    end
```

---

## 27. Deployment Architecture

```mermaid
flowchart TB
    Learner["Learner Browser"]

    subgraph EdgeCDN["Frontend Hosting (Vercel / Cloudflare Pages)"]
        SPA["React 19 SPA Production Bundle\n(Static HTML, CSS, JS, Web Workers)"]
    end

    subgraph CloudPaaS["Backend API Hosting (Render / Fly.io / AWS ECS)"]
        Nginx["Reverse Proxy / SSL Termination"]
        API["Node.js + Express 5 REST API Gateway"]
    end

    subgraph ManagedData["Managed Database Services"]
        Atlas[("MongoDB Atlas Managed Cluster")]
        Neon[("PostgreSQL Managed Instance [Phase 4]")]
    end

    subgraph ExternalAI["External AI Cloud"]
        Gemini["Google Gemini 1.5 Flash API"]
    end

    Learner -->|HTTPS Port 443| SPA
    SPA -->|API Requests /api/*| Nginx
    Nginx --> API
    API --> Atlas
    API -.-> Neon
    API --> Gemini
```

---

## 28. Scalability

1. **Stateless API Clustering:** Express instances store zero in-memory session state. Authentication relies strictly on stateless JWTs, allowing horizontal auto-scaling behind an Nginx or AWS Application Load Balancer.
2. **Read/Write Database Segregation:** High-volume curriculum reads (`GET /api/topics`, `GET /api/quizzes/:id`) can be routed to MongoDB Atlas read replicas, reserving primary instances for attempt writes.
3. **Client-Side Compute Offloading:** Offloading code execution entirely to the learner's browser Web Worker means code execution compute costs scale at $O(1)$ on the server.
4. **Semantic Question Caching:** Storing synthesized questions in MongoDB indexed by `conceptId` and `difficultyStage` prevents repetitive LLM queries for learners at matching levels.

---

## 29. Modular Monolith Decision

CodeQuest is architectured as a **Modular Monolith** rather than microservices:
1. **Engineering Velocity & Simplicity:** A single repository and unified deployment pipeline eliminates distributed network latency, RPC serialization overhead, and distributed transaction complexity (Saga patterns).
2. **Clean Domain Boundaries:** Code is partitioned into distinct domain modules (`AuthModule`, `LearningModule`, `QuizModule`, `AIModule`) communicating via explicit in-memory interfaces.
3. **Future Extraction Ready:** If the AI Question Generation engine or Code Execution runner experiences disproportionate traffic in post-MVP phases, they can be extracted into dedicated microservices without refactoring domain business rules.

---

## 30. Architectural Tradeoffs

| Decision | Alternatives | Chosen Approach | Reason | Tradeoff Accepted |
|:---|:---|:---|:---|:---|
| **Frontend Framework** | Next.js SSR / Vanilla JS | React 19 SPA (Vite) | High-frequency client canvas manipulation & Web Workers benefit minimally from SSR. | Initial bundle load (~1.2s) vs. instant runtime state. |
| **API Architecture** | GraphQL / gRPC | RESTful HTTP Gateway | Standardized HTTP status codes, simple caching, predictable error handling. | Minor over-fetching compared to custom GraphQL queries. |
| **Persistence Model** | Single Store (Postgres only or Mongo only) | Polyglot Hybrid (Mongo + Postgres) | Document model fits polymorphic questions; Relational model fits Guild social graphs. | Managing two database connection configurations. |
| **Code Execution** | Server-Side Docker / RCE | Client-Side Web Workers | Eliminates catastrophic server security liabilities (RCE) and zero compute cost. | Restricted to client JavaScript runtime; compiled languages require WASM or future containers. |
| **Difficulty Engine** | Pure Autonomous LLM | Deterministic Application Logic | Eliminates hallucinated level jumps and cheating; guarantees auditable curriculum progression. | Requires explicit state machine rules rather than open-ended generative adaptation. |
| **AI Integration** | Direct Frontend LLM Calls | Server-Side Proxy | Prevents API key leakage, enforces rate limits, validates JSON schemas, and enables caching. | Adds ~50ms proxy latency compared to direct browser-to-AI calls. |
| **Caching Layer** | Distributed Redis Cluster | In-Memory / MongoDB Caching | Eliminates distributed cache infrastructure overhead during MVP initialization. | In-memory cache is instance-local until Redis is deployed at scale. |
| **Monolith Topology** | Microservices Architecture | Modular Monolith | Faster development, unified deployment, zero distributed network latency. | All modules deploy together in the same container. |

---

## 31. Technology Stack

| Technology | Purpose | Status | Reason |
|:---|:---|:---:|:---|
| **React 19** | Frontend SPA Library | `Planned (MVP)` | Declarative UI, Virtual DOM reconciliation, seamless component composition. |
| **Vite 8** | Frontend Tooling & Bundler | `Planned (MVP)` | Native ES modules, ultra-fast HMR, optimized Rollup production builds. |
| **Vanilla CSS3** | Cyber Design System | `Planned (MVP)` | Precise control over CSS variables, GPU animations, zero CSS bloat. |
| **Web Worker API** | Code Execution Sandbox | `Planned (MVP)` | Native browser threading; zero server security risk; hard watchdog guards. |
| **Node.js 18+** | Backend Runtime | `Planned (MVP)` | Non-blocking asynchronous event loop; handles concurrent I/O efficiently. |
| **Express 5** | REST API Framework | `Planned (MVP)` | Lightweight, un-opinionated routing, robust middleware pipeline. |
| **MongoDB 7 / Mongoose 9**| Primary Document Store | `Planned (MVP)` | Schema-enforced document storage ideal for polymorphic questions & attempts. |
| **PostgreSQL 16** | Relational Social Store | `Planned (Phase 4)`| Strict ACID guarantees, foreign keys, and multi-table SQL JOIN queries. |
| **Zod 3.23** | Schema Validation | `Planned (MVP)` | TypeScript-first static & runtime validation for API bodies and LLM outputs. |
| **jsonwebtoken (JWT)** | Stateless Session Auth | `Planned (MVP)` | Cryptographically signed bearer tokens; zero server session storage. |
| **bcryptjs 3.0** | Password Hashing | `Planned (MVP)` | One-way salted cryptographic hashing (10 rounds). |
| **Google Gemini 1.5 Flash**| External LLM Provider | `Planned (Phase 2)`| Fast inference, cost-effective, native JSON structured output support. |

---

## 32. Project Score Mapping

| Concept # | Mandatory Viva Concept | Architectural Area | Status | Architectural Role & Technical Explanation |
|:---:|:---|:---|:---:|:---|
| **1** | **React Component Composition** | Frontend Architecture | `Planned (MVP)` | Modular UI hierarchy (`MainLayout`, `DashboardHUD`, `RoadmapCanvas`, `BlockWorkspace`, `TerminalDock`). Demonstrates pure presentation primitives and unidirectional data flow. |
| **2** | **State Management (useState)** | Frontend State | `Planned (MVP)` | Local interactive state: block palette collapse, selected quiz choices, terminal log buffer, and modal dialogs. |
| **3** | **Side Effects (useEffect)** | Frontend Lifecycle | `Planned (MVP)` | Synchronizing block AST changes with code generator; managing Web Worker lifecycle; cleanup functions terminating workers and aborting HTTP requests. |
| **4** | **Async Data Fetching** | Frontend API Client | `Planned (MVP)` | Decoupled Axios/Fetch client (`apiClient.js`) with request/response interceptors, automatic JWT injection, and standardized error normalization. |
| **5** | **Client-Side Routing** | Frontend Navigation | `Planned (MVP)` | Declarative client routing using React Router (`/dashboard`, `/challenge/:id`) with `ProtectedRoute` navigation guards redirecting unauthenticated learners. |
| **6** | **Problem Modeling** | Domain Modeling | `Planned (MVP)` | Discrete domain entities: Users, Topics (realms), Questions, QuizAttempts, and Progress mapped into clean Mongoose schemas and PostgreSQL DDL. |
| **7** | **System Design Basics** | Macro Architecture | `Planned (MVP)` | Multi-tier decoupled architecture: Vite React SPA $\rightarrow$ Express REST Gateway $\rightarrow$ MongoDB Document Store $\rightarrow$ Isolated Browser Web Worker. |
| **8** | **RESTful Endpoint Design** | Backend API Gateway | `Planned (MVP)` | Resource-oriented URI conventions (`GET /api/topics`, `POST /api/quizzes/:id/submit`) using standard HTTP verbs and standardized JSON envelopes. |
| **9** | **HTTP Status Codes** | Backend HTTP Transport | `Planned (MVP)` | Precise status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `422 Unprocessable`, `500 Server Error`. |
| **10** | **Server Error Handling** | Backend Core | `Planned (MVP)` | Centralized Express error-handling middleware (`errorHandler.js`) intercepting custom `AppError` exceptions and sanitizing client outputs. |
| **11** | **Express Middleware** | Backend Pipeline | `Planned (MVP)` | Custom pipeline: `cors`, `helmet`, `authMiddleware` (JWT verification), and `validationMiddleware` (Zod schemas). |
| **12** | **Mongo Schema Modeling** | Data Persistence | `Planned (MVP)` | Mongoose schemas with strict types, enums, required validation, timestamps, compound indexes, and relational `ref` links (`Topic`, `User`). |
| **13** | **Mongo CRUD Operations** | Data Access Layer | `Planned (MVP)` | Demonstrates `create()`, `find().select("-correctAnswer")`, `findByIdAndUpdate()` with atomic `$inc`, and `.deleteMany()`. |
| **14** | **PostgreSQL Relational Schema** | Data Layer (Social) | `Planned (Phase 4)`| Normalized SQL tables (`users`, `guilds`, `guild_members`) with Primary Keys, Foreign Keys, `ON DELETE CASCADE`, and check constraints. |
| **15** | **SQL JOINs** | Relational Queries | `Planned (Phase 4)`| Multi-table `INNER JOIN` aggregating guild member contributions; `LEFT JOIN` querying challenges with optional learner attempt status. |
| **16** | **LLM API Integration** | AI Subsystem | `Planned (Phase 2)`| Server-side integration calling Google Gemini / OpenAI API via secure backend client with zero client-side key exposure. |
| **17** | **Prompt Engineering** | AI Subsystem | `Planned (Phase 2)`| System prompts enforcing role framing, Bloom's cognitive tiers, syntactic token whitelists, and kid-friendly lexicons. |
| **18** | **Structured Outputs** | AI Subsystem | `Planned (Phase 2)`| Low-temperature (0.2) inference constrained by strict JSON schema definitions validated via Zod before database storage. |
| **19** | **Git Workflow** | Engineering Discipline | `Implemented` | Multi-branch workflow (`main`, `develop`, `docs/*`), Conventional Commits (`docs: add high and low level designs`), and clean staging. |
| **20** | **Secrets Management** | Security Posture | `Planned (MVP)` | Zero hardcoded credentials in source code; configuration injected through `.env` files and validated via `dotenv`. |
| **21** | **JavaScript Event Loop** | JS Runtime Internals | `Planned (MVP)` | Non-blocking asynchronous I/O delegating database queries and bcrypt hashing to libuv worker threads, unblocking the single main thread. |
| **22** | **Promises vs Callbacks** | JS Control Flow | `Planned (MVP)` | Modern Promise-based architecture consumed via `async/await`, eliminating legacy callback hell and unhandled promise rejections. |
| **23** | **async / await** | JS Control Flow | `Planned (MVP)` | Linear, readable asynchronous control flow across controllers, service methods, and seed scripts. |
| **24** | **Closures** | JS Scope & Memory | `Planned (MVP)` | Lexical closures in `answers.map((answer) => { ... })` retaining scope access to the outer `questions` array and mutating the lexical `score` counter. |
| **25** | **Hoisting & Temporal Dead Zone** | JS Compilation | `Planned (MVP)` | Function declarations hoisted to module scope; variables declared strictly with `const` and `let` residing in the TDZ, preventing state bugs. |

---

## 33. Risks and Mitigations

| Risk ID | Risk Description | Severity | Probability | Architectural Mitigation |
|:---:|:---|:---:|:---|:---|
| **RSK-01** | **LLM Hallucinations / Invalid Code** | High | Medium | Low temperature (0.2); strict Zod schema validation; answer verification; automatic failover to verified seed questions. |
| **RSK-02** | **Prompt Injection / Jailbreak** | High | Low | Server-side prompt construction; XML input delimiters; system instructions forbidding prompt overrides. |
| **RSK-03** | **Uncontrolled AI API Costs** | Medium | Medium | Token bucket rate limiting (5 req/min); caching synthesized questions in MongoDB for reuse across learners. |
| **RSK-04** | **Browser Infinite Loops** | High | High | Sandboxed Web Worker runtime with hard 1,000ms watchdog termination guard (`worker.terminate()`). |
| **RSK-05** | **Quiz Answer Leakage (Cheating)** | High | Medium | Server-side projection `.select("-correctAnswer")` strips answers from HTTP responses. |
| **RSK-06** | **Concurrent Milestone Exploits** | Medium | Low | Atomic MongoDB `$inc` operators prevent race-condition XP duplication. |
| **RSK-07** | **Third-Party AI Outages** | High | Low | Graceful degradation to pre-seeded static question repository; zero user-facing crashes. |
| **RSK-08** | **Difficulty Miscalibration** | Medium | Medium | Socratic AI hint triggers after 2 consecutive failures; automatic difficulty down-stepping after 3 failures. |
| **RSK-09** | **Over-Engineered Tech Stack** | Low | Low | Modular monolith architecture; strict separation between MVP implementation and future proposed roadmap. |

---

## 34. Future Evolution

The CodeQuest architecture supports phased post-MVP expansion:
1. **Phase 2 — Adaptive AI Engine:** Deployment of server-side LLM prompt pipeline, Bloom's cognitive calibrator, and mistake remediation engine.
2. **Phase 3 — Multi-Language In-Browser Execution:** Integration of WebAssembly (Pyodide) to support sandboxed client-side Python execution with identical zero-server RCE guarantees.
3. **Phase 4 — Social & Relational Systems (PostgreSQL):** Migration of developer Guilds, collaborative team quests, and weekly competitive leaderboards utilizing PostgreSQL relational JOINs.
4. **Phase 5 — Advanced Coding Arena:** Full-screen IDE mode with Monaco editor integration, multi-file project workspaces, and automated Git portfolio synchronization.

---

## 35. HLD → LLD Boundary

| Architectural Concern | Defined in High-Level Design (HLD) | Detailed in Low-Level Design (LLD) |
|:---|:---|:---|
| **Component Topology** | Macro subsystem roles and inter-tier communication | Exact component JSX trees, props interfaces, and React state atoms |
| **REST APIs** | URI resources, supported verbs, and semantic status codes | Exact request/response JSON payload schemas and Zod regex patterns |
| **Data Persistence** | Polyglot division (Document vs. Relational) | Exact Mongoose schemas, compound index definitions, and SQL DDL |
| **Code Execution** | Web Worker isolation boundary and watchdog limits | Exact `postMessage` protocol, shadowed globals, and cleanup handlers |
| **AI Integration** | Pipeline architecture, prompt layering, and failover | Concrete system prompt templates, few-shot payloads, and Zod schemas |
| **Algorithms** | Cognitive staircase concept and mathematical triggers | Step-by-step rolling accuracy formulas and state transition code |

---

*End of High-Level Design Document.*
