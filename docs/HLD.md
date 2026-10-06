# CodeQuest (ByteArena) — High-Level Design (HLD)

---

## 1. Document Overview

### 1.1 Purpose
The purpose of this High-Level Design (HLD) document is to establish the macro-system architecture, component boundaries, inter-service communication protocols, data storage topology, and security postures for **CodeQuest** (codenamed **ByteArena** / **CodeVerse**). 

This document serves as the architectural bridge connecting the business and pedagogical requirements defined in the Product Requirements Document ([`docs/PRD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/PRD.md)) to the microscopic implementation specifications detailed in the Low-Level Design ([`docs/LLD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/LLD.md)). It provides technical viva evaluators, software architects, and engineering teams with a clear, defensible blueprint of how the complete platform operates as a cohesive, reliable, and scalable system.

### 1.2 Scope
This document covers:
- System context, runtime boundaries, and multi-tier decoupled client-server architecture.
- Frontend architecture (React 19 SPA, visual block canvas, Web Worker sandbox runner, cyber HUD).
- Backend application gateway (Node.js + Express 5 modular monolith, middleware pipelines, error handling).
- Polyglot persistence strategy (MongoDB document store for curriculum/AI questions + PostgreSQL relational schema for social systems and SQL JOINs).
- AI subsystem integration (isolated backend LLM pipeline, prompt engineering guardrails, structured JSON output validation, fallback handling).
- Deterministic Adaptive Difficulty Engine (Bloom's cognitive staircase owned strictly by the application).
- Defense-in-depth security model (zero server RCE, stateless JWT auth, bcrypt hashing, anti-cheat query projections, rate limiting).
- Academic and engineering viva defense mapping across all 25 mandatory Project Score competencies.

### 1.3 Target Audience
- **Technical Viva Evaluators & Assessors:** Examining architectural reasoning, design trade-offs, technology selection, and runtime fundamentals.
- **Full-Stack Software Engineers:** Implementing features, services, and schemas directly from architectural blueprints.
- **System Architects & Reviewers:** Auditing scalability, failure resilience, cost controls, and security postures.

### 1.4 Architectural Hierarchy: PRD vs. HLD vs. LLD
CodeQuest enforces a disciplined engineering trail:

$$\mathbf{PRD} \text{ (What \& Why)} \longrightarrow \mathbf{HLD} \text{ (System Architecture \& Components)} \longrightarrow \mathbf{LLD} \text{ (Microscopic Code Blueprints)}$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PRODUCT REQUIREMENTS DOCUMENT (PRD)                                 │
│ - Pedagogical philosophy: PLAY -> BUILD -> UNDERSTAND -> CODE -> MASTER│
│ - Target user personas (beginners, college freshmen, career switchers) │
│ - Core functional requirements and out-of-scope non-goals              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. HIGH-LEVEL DESIGN (HLD) — THIS DOCUMENT                             │
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
│ - Concrete React component props, state atoms, and custom hook logic   │
│ - Express route handler signatures and Zod validation schemas          │
│ - Exact Mongoose models, compound indexes, and PostgreSQL DDL scripts  │
│ - Web Worker postMessage communication protocols and watchdog timers   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Current Project Implementation Status
To maintain complete integrity during engineering audits, features are classified across four auditable states:
- **Implemented:** Code or documentation artifact exists directly in the repository and has been verified.
- **Partially Implemented:** Scaffolding, configuration, or documentation stubs exist, but complete operational integration is pending.
- **Planned (MVP):** Formally designed and scheduled for immediate implementation in the upcoming MVP sprint.
- **Future Scope:** Post-MVP architectural enhancements scheduled for subsequent roadmap phases.

| System Subsystem | Architectural Status | Repository Evidence | Technical Notes |
|:---|:---:|:---|:---|
| **Git Workflow & Branching** | `Implemented` | `.git`, branches `main`, `develop`, `docs/*` | Git flow enforcing Conventional Commits and branch isolation. |
| **Product Requirements (PRD)** | `Implemented` | `docs/PRD.md` (v1.0.0) | Complete problem analysis, Bloom's tiers, and non-goals. |
| **High-Level Design (HLD)** | `Implemented` | `docs/HLD.md` (This document) | System architecture, polyglot storage, and AI safety. |
| **Low-Level Design (LLD)** | `Implemented` | `docs/LLD.md` (v1.0.0) | Implementation contracts, schemas, interfaces, and algorithms. |
| **Frontend UI Shell (React 19)**| `Planned (MVP)` | `frontend/src/App.jsx`, `main.jsx` | SPA architecture with Vite HMR and modern React 19 root mounting. |
| **Cyber HUD & Roadmap View** | `Planned (MVP)` | `frontend/src/components/layout/` | Tactical command bar (Level, XP, Streak) and interactive map. |
| **Visual Block Workspace** | `Planned (MVP)` | `frontend/src/components/workspace/` | Snap-together geometry generating Abstract Syntax Trees (AST). |
| **Sandboxed Code Execution** | `Planned (MVP)` | `frontend/src/workers/codeRunner.worker.js`| Isolated client Web Worker with 1,000ms watchdog timeout guard. |
| **Express REST API Gateway** | `Planned (MVP)` | `backend/src/app.js`, `server.js` | Express 5 application with modular routes, CORS, and JSON parser. |
| **JWT Stateless Authentication** | `Planned (MVP)` | `backend/src/routes/auth.routes.js` | Bcrypt hashing (salt=10), signed 24h JWT tokens, auth middleware. |
| **MongoDB Document Store** | `Planned (MVP)` | `backend/src/models/` | Mongoose schemas for Users, Topics, Questions, and QuizAttempts. |
| **Deterministic Quiz Grader** | `Planned (MVP)` | `backend/src/controllers/quiz.controller.js`| Server-side grading; `.select("-correctAnswer")` anti-cheat projection. |
| **Deterministic XP Economy** | `Planned (MVP)` | `backend/src/services/gamificationService.js`| Formula $100 \times N^{1.5}$; streak tracking based on UTC calendar. |
| **Adaptive Difficulty Engine** | `Planned (Phase 2)`| `backend/src/services/adaptiveEngine.js` | Deterministic Bloom's taxonomy staircase calibrated on 3-attempt accuracy. |
| **AI LLM Question Generator** | `Planned (Phase 2)`| `backend/src/services/aiQuestionService.js` | Low-temp (0.2) LLM prompt synthesis with Zod structured output checks. |
| **PostgreSQL Relational Layer** | `Planned (Phase 4)`| `database/migrations/001_relational_schema.sql`| Normalized SQL tables for Guilds and social graphs using SQL JOINs. |
| **Distributed Redis Cache** | `Future Scope` | `backend/src/config/redis.js` | In-memory caching for curriculum hierarchies and rate limits. |

### 1.6 Architectural Assumptions
1. **Source Code Baseline:** The repository currently establishes the architectural baseline through `README.md`, `docs/PRD.md`, `docs/HLD.md`, and `docs/LLD.md`. Source code files described in `README.md` represent the planned architecture for the implementation sprint and are accurately classified as `Planned (MVP)`.
2. **Persistence Allocation:** MongoDB serves as the primary document persistence engine for the MVP (handling users, curriculum topics, question banks, and quiz attempts). PostgreSQL relational tables and SQL JOIN queries are formally architected for Phase 4 social systems (Guilds, Guild Quests, relational leaderboards) to demonstrate dual-database competence without introducing premature operational overhead.
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

A single missing quotation mark produces intimidating, opaque error messages (`SyntaxError: unexpected EOF while parsing`). Beginners spend up to $85\%$ of their initial learning time debugging punctuation rather than building computational reasoning. Existing solutions either infantilize the subject with childish cartoon mascots (alienating university students and adult career changers) or assume pre-existing syntax fluency (like LeetCode).

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
- Near-black deep space canvas base (`#0F172A`) and dark navy panels (`#111827`).
- Restrained neon accents: Cyan (`#06B6D4`), Electric Blue (`#3B82F6`), Controlled Violet (`#7C3AED`), and Matrix Emerald (`#22C55E`).
- Code-editor-inspired split-views and terminal-inspired diagnostic docks.
- Zero childish mascots, zero bouncing emojis, zero pastel rainbow palettes.

---

## 3. Architecture Goals

The architecture of CodeQuest is designed around ten non-negotiable engineering goals:

1. **Maintainability & Modularity:** Clean separation of concerns between views, gateway controllers, pure domain services, and data repositories.
2. **Absolute Code Execution Safety:** Zero server-side Remote Code Execution (RCE) vulnerability; arbitrary student code is strictly isolated.
3. **Deterministic Progression & Economy:** Game rules, XP calculation, streaks, and milestone unlocks are calculated deterministically on the backend; the LLM never controls progression.
4. **Defensive AI Architecture:** The external LLM is never exposed to the client, never given raw execution access, and raw completions are validated against strict JSON schemas.
5. **High Interactive Performance:** Initial application shell renders in $<1.5\text{s}$; block dragging and live syntax synchronization maintain 60 FPS ($<16\text{ms}$ frame time); REST endpoints respond in $<200\text{ms}$.
6. **Graceful Degradation:** External AI provider downtime, latency spikes, or quota exhaustion never block learner progress; the system automatically falls back to verified pre-seeded question banks.
7. **Simplicity over Over-Engineering:** Prefer a modular monolith with clear domain boundaries over premature microservices infrastructure.
8. **Stateless API Gateway:** Express application instances maintain zero in-memory session state, enabling seamless horizontal auto-scaling.
9. **Explainable Adaptive Learning:** Multi-stage Bloom's cognitive staircase based on auditable rolling accuracy rather than black-box AI algorithms.
10. **Viva & Audit Traceability:** Every architectural layer directly demonstrates fundamental computer science principles (event loop, closures, relational integrity, stateless auth) defendable in technical examinations.

---

## 4. Architecture Principles

1. **Principle 1: Prefer Simplicity over Unnecessary Complexity:** Solve real problems with direct solutions. Do not introduce microservices, distributed message brokers, or container orchestration until user scale and operational requirements justify them.
2. **Principle 2: Keep Responsibilities Separated:** Controllers handle HTTP transport; services handle pure domain rules; models handle data persistence; Web Workers handle code execution.
3. **Principle 3: Validate at Every System Boundary:** Validate all incoming HTTP payloads via Zod schemas before touching business logic; validate all external LLM completions before touching databases or clients.
4. **Principle 4: Never Trust Raw LLM Output:** Treat external AI completions as untrusted user input. Enforce strict JSON schema validation, type checks, and distractor verification.
5. **Principle 5: Never Expose Secrets to the Frontend:** Private API keys, database connection URIs, and JWT signing secrets reside exclusively in backend environment variables.
6. **Principle 6: Keep AI Strictly Behind the Backend Gateway:** The client never connects directly to external AI providers. The backend brokers all AI interactions to enforce rate limits, caching, and prompt guardrails.
7. **Principle 7: Curriculum Authority Stays Inside the Application:** The application determines what concepts exist, what difficulty tier to present, and whether the learner advances. The LLM generates content within these constraints.
8. **Principle 8: Isolate Arbitrary Code Execution:** Execute untrusted student code within isolated browser Web Workers with shadowed globals and a hard 1,000ms watchdog timeout guard.
9. **Principle 9: Design Explicitly for Failures:** Build failover mechanisms into every external dependency (database reconnects, AI seed fallbacks, worker watchdog termination).
10. **Principle 10: Anti-Cheat by Default:** Assessment questions sent to the client explicitly strip out correct answers and hidden test assertions (`.select("-correctAnswer")`). Evaluation is performed server-side.
11. **Principle 11: Add Infrastructure Only When Justified:** Deploy Redis only when caching high-scale curriculum reads; deploy PostgreSQL only when relational social graphs require SQL JOINs.
12. **Principle 12: Keep the System Easy to Defend in a Viva:** Every architectural decision must have an articulate computer science rationale and clear trade-off analysis.

---

## 5. High-Level System Architecture

The macro-system architecture decouples client interaction, application routing, business services, polyglot persistence, and external AI systems:

```mermaid
flowchart TB
    Learner["🧑‍💻 Learner / Student Browser"]

    subgraph ClientTier["Frontend Presentation Tier (React 19 + Vite)"]
        UI["Cyber HUD & Layout Shell\n(GameHeader.jsx)"]
        Roadmap["Curriculum Roadmap View\n(KingdomMap.jsx)"]
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

### Detailed Component Specifications

#### 1. Frontend Application
- **Responsibility:** Single Page Application providing interactive visual programming, live code synchronization, interactive curriculum roadmap, and responsive cyber HUD.
- **Inputs:** User clicks, drag-and-drop block connections, keyboard inputs, HTTP API payloads.
- **Outputs:** Visual canvas updates, Web Worker execution triggers, REST API requests.
- **Dependencies:** React 19, Vite 8, React Router v7, Web Worker API.
- **Data Owned:** Transient UI state, active block AST, terminal output buffer, JWT token in memory.
- **Failure Behavior:** Renders cyber error alert with actionable retry options; displays offline banner on network drop.
- **Status:** `Planned (MVP)`

#### 2. Backend API Gateway
- **Responsibility:** Central HTTP ingress point managing CORS, security headers, rate limiting, authentication, payload validation, and request routing.
- **Inputs:** HTTPS REST requests with JSON payloads and Bearer tokens.
- **Outputs:** Standardized JSON response envelopes (`{ success, data, error, timestamp }`).
- **Dependencies:** Node.js 18+, Express 5.2.1, Helmet, Cors, Express-Rate-Limit.
- **Data Owned:** HTTP request context, routing tables.
- **Failure Behavior:** Unhandled exceptions intercepted by centralized error middleware; returns sanitized 500 error envelopes.
- **Status:** `Planned (MVP)`

#### 3. Authentication Module
- **Responsibility:** User registration, password hashing via bcryptjs, credential verification, and signed JWT issuance.
- **Inputs:** Username, email, plaintext password, Bearer tokens.
- **Outputs:** Signed JWT strings, sanitized user profile claims (`id`, `username`, `role`).
- **Dependencies:** `bcryptjs` (salt=10), `jsonwebtoken`.
- **Data Owned:** `User` credential documents.
- **Failure Behavior:** Invalid credentials return `401 Unauthorized`; duplicate email returns `409 Conflict`.
- **Status:** `Planned (MVP)`

#### 4. Learning Module
- **Responsibility:** Curriculum hierarchy delivery, topic listing, level progression, and concept prerequisite validation.
- **Inputs:** Topic or level IDs, category query parameters (`frontend`, `dsa`).
- **Outputs:** Sanitized topic trees, unlocked concept nodes.
- **Dependencies:** MongoDB `Topic` collection.
- **Data Owned:** Curriculum hierarchy and prerequisite dependencies.
- **Failure Behavior:** Missing topic returns `404 Not Found`.
- **Status:** `Planned (MVP)`

#### 5. Challenge Module & Grading Service
- **Responsibility:** Challenge retrieval with anti-cheat protection (`.select("-correctAnswer")`) and server-side evaluation of submitted solutions.
- **Inputs:** Challenge IDs, student answer payloads (quiz selections, block AST, generated code).
- **Outputs:** Pass/fail status, detailed diagnostics, earned XP calculations.
- **Dependencies:** MongoDB `Question` and `QuizAttempt` collections.
- **Data Owned:** Question banks, test assertions, attempt logs.
- **Failure Behavior:** Assertion failure returns 200 OK with failure diagnostics and zero XP (non-punitive).
- **Status:** `Planned (MVP)`

#### 6. Progress Module
- **Responsibility:** Concept mastery score calculation, attempt history auditing, and unlock trigger evaluation.
- **Inputs:** Verified attempt results, user ID, concept ID.
- **Outputs:** Concept mastery vectors ($0\% - 100\%$), unlocked roadmap nodes.
- **Dependencies:** MongoDB `QuizAttempt` collection.
- **Data Owned:** User progress vectors.
- **Failure Behavior:** Database write failure logs error and rolls back transaction.
- **Status:** `Planned (MVP)`

#### 7. Gamification Module
- **Responsibility:** Deterministic XP calculation, level-up threshold formula evaluation ($100 \times N^{1.5}$), and UTC daily streak tracking.
- **Inputs:** Challenge base XP, constraint bonuses, user last active timestamp.
- **Outputs:** Total XP increments, new level notifications, active streak counts.
- **Dependencies:** MongoDB `User` collection.
- **Data Owned:** User XP, current level, current streak.
- **Failure Behavior:** Atomic `$inc` updates prevent race conditions and duplicate XP exploits.
- **Status:** `Planned (MVP)`

#### 8. AI Question Service
- **Responsibility:** Prompt assembly with role framing and syntax whitelists, external LLM invocation, low-temp inference, and Zod output schema validation.
- **Inputs:** Concept ID, Bloom's difficulty stage, target pitfall classification.
- **Outputs:** Validated, kid-friendly practice questions adhering to JSON schema.
- **Dependencies:** External LLM API (Gemini / OpenAI), Zod validator, Fallback Seed Bank.
- **Data Owned:** `ai_questions` collection, prompt templates.
- **Failure Behavior:** LLM timeout or schema failure automatically serves pre-seeded static question.
- **Status:** `Planned (Phase 2)`

#### 9. Adaptive Difficulty Engine
- **Responsibility:** Deterministic Bloom's cognitive staircase calibration based on 3-attempt rolling accuracy.
- **Inputs:** Last 3 attempt outcomes for active concept.
- **Outputs:** Next Bloom's difficulty stage (Stages 1–5), remediation flags.
- **Dependencies:** Progress Module attempt logs.
- **Data Owned:** Cognitive staircase transition rules.
- **Failure Behavior:** Defaults to Stage 1 (Recognition) on uninitialized learner profiles.
- **Status:** `Planned (Phase 2)`

#### 10. Blockly / Visual Coding Module
- **Responsibility:** Interactive spatial canvas with magnetic snapping, type-enforced sockets, and live Abstract Syntax Tree serialization.
- **Inputs:** Drag-and-drop block movements, input socket values.
- **Outputs:** Cleanly formatted JavaScript syntax string, in-memory AST payload.
- **Dependencies:** Blockly or custom SVG AST canvas.
- **Data Owned:** Canvas workspace state.
- **Failure Behavior:** Invalid connections simply do not snap; prevents syntax errors before execution.
- **Status:** `Planned (MVP)`

#### 11. Sandboxed Code Execution Runner
- **Responsibility:** Isolated client-side execution of generated JavaScript code with console log interception and watchdog timeout enforcement.
- **Inputs:** Serialized code string, test input parameters.
- **Outputs:** Intercepted console logs, execution return values, runtime error strings.
- **Dependencies:** Browser Web Worker API.
- **Data Owned:** Ephemeral execution memory.
- **Failure Behavior:** Execution exceeding 1,000ms triggers `worker.terminate()` and reports an infinite loop alert.
- **Status:** `Planned (MVP)`

#### 12. MongoDB Database
- **Responsibility:** Primary document persistence for flexible, semi-structured data (topics, questions, attempt logs, AI questions).
- **Inputs:** Mongoose ODM queries.
- **Outputs:** BSON document records.
- **Dependencies:** MongoDB 7.0 engine.
- **Data Owned:** `users`, `topics`, `questions`, `quizattempts`, `ai_questions`.
- **Failure Behavior:** Connection drops trigger automated reconnect with exponential backoff.
- **Status:** `Planned (MVP)`

#### 13. PostgreSQL Database
- **Responsibility:** Relational persistence for multi-user social graphs, Guilds, and SQL JOIN query leaderboards.
- **Inputs:** Parameterized SQL queries via node-postgres (`pg`).
- **Outputs:** Relational rows with strict foreign key integrity.
- **Dependencies:** PostgreSQL 16 engine.
- **Data Owned:** `guilds`, `guild_members`, `guild_quests`.
- **Failure Behavior:** Relational constraint violations return 400 Bad Request; connection failures fall back to cached read replicas.
- **Status:** `Planned (Phase 4)`

#### 14. Fallback Seed Question Bank
- **Responsibility:** Verified static question repository guaranteeing 100% platform uptime during external AI outages.
- **Inputs:** Target concept ID, difficulty tier.
- **Outputs:** Pre-validated question document matching schema.
- **Dependencies:** Local filesystem / MongoDB seed documents.
- **Data Owned:** Curated seed questions.
- **Failure Behavior:** Always succeeds; zero external network dependencies.
- **Status:** `Planned (Phase 2)`

#### 15. External LLM Gateway
- **Responsibility:** High-speed, structured generative inference for on-demand practice questions.
- **Inputs:** System prompt, user context XML, JSON response schema, temperature 0.2.
- **Outputs:** Raw JSON completion string.
- **Dependencies:** Google Gemini 1.5 Flash / OpenAI API.
- **Data Owned:** External model weights.
- **Failure Behavior:** Throttled or down service intercepted within 3,000ms by fallback handler.
- **Status:** `Planned (Phase 2)`

#### 16. Logging & Observability Subsystem
- **Responsibility:** Structured JSON request logging, error tracing, latency monitoring, and PII redaction.
- **Inputs:** HTTP request/response lifecycles, error objects.
- **Outputs:** Formatted JSON log streams to stdout / logging sink.
- **Dependencies:** Pino / Winston logger.
- **Data Owned:** Ephemeral log records.
- **Failure Behavior:** Logging failures operate asynchronously without blocking HTTP request execution.
- **Status:** `Planned (MVP)`

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
        HUD["GameHeader.jsx (Level, XP Bar, Streak, Avatar)"]
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

### 7.1 React Component Composition
The frontend decomposes complex interactive screens into focused, reusable components adhering to strict parent-child contracts:
- **Presentation Components (`components/common/`):** Pure UI primitives (`CyberButton`, `MetricCard`, `XPMeter`, `LoadingSkeleton`, `Badge`). Receive state via props; hold zero API logic.
- **Feature Modules (`components/workspace/`):** Coordinate domain logic (block snapping, AST serialization, code generation, terminal logging).
- **Container Pages (`pages/`):** Manage route parameter extraction, data fetching lifecycles, and high-level layout assembly.

---

## 8. Backend Architecture

The backend is engineered as a **modular monolith** enforcing strict layered separation between transport protocols, authorization, domain logic, and physical data persistence:

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
- **Statelessness:** Every request carries its authentication token (`Authorization: Bearer <token>`); no session affinity is stored in server memory.
- **Resource-Oriented URIs:** Nouns identify resources (`/api/topics`, `/api/quizzes`); HTTP verbs define operations (`GET`, `POST`).
- **Standardized Response Envelope:** Every response conforms to a predictable JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-06T12:00:00.000Z"
}
```

### 9.1 Core Endpoint Groups & HTTP Status Codes

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

| Storage Engine | Primary Entities | Architectural Justification | Roadmap Status |
|:---|:---|:---|:---:|
| **MongoDB (Mongoose v9)** | `User`, `Topic`, `Question`, `QuizAttempt`, `AIQuestion` | Document model fits polymorphic question formats (MCQ, bug hunt, prediction), nested option arrays, and dynamic quiz attempts. Eliminates migration overhead for iterative curriculum changes. | `Planned (MVP)` |
| **PostgreSQL 16** | `users`, `guilds`, `guild_members`, `guild_quests` | Relational tables with strict primary/foreign keys and ACID transactions. Essential for collaborative multi-user social graphs where SQL JOINs aggregate member contributions without document size limits. | `Planned (Phase 4)` |

---

## 11. Learning Architecture

The educational progression of CodeQuest is structured into an extensible 7-tier domain hierarchy:

$$\text{Learning Path} \longrightarrow \text{Level} \longrightarrow \text{Concept} \longrightarrow \text{Challenge} \longrightarrow \text{Attempt} \longrightarrow \text{Progress Record}$$

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
    Progress -.->|Unlocks When Mastery >= 85%| Concept
```

### Cognitive Bloom's Staircase
Learners do not jump directly into typing raw syntax. Instead, they climb a multi-stage cognitive staircase:
1. **Stage 1: Recognition:** Predict outputs or identify syntax functions without writing code.
2. **Stage 2: Construction:** Assemble logic using unconstrained snap-together visual blocks.
3. **Stage 3: Application & Optimization:** Solve puzzles respecting resource constraints (e.g., max 4 blocks).
4. **Stage 4: Debugging (Bug Hunt):** Trace execution through flawed programs and correct logical defects.
5. **Stage 5: Real Code Synthesis:** Translate verified visual block logic into typed syntax.

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

### 13.1 Bridge from Visual Blocks to Real Code
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

### 14.1 Execution Security Controls
- **Process Isolation:** Code executes inside a dedicated browser Web Worker thread with zero access to the DOM, `document.cookie`, `localStorage`, or window object.
- **Shadowed Network Globals:** `fetch`, `XMLHttpRequest`, and `WebSocket` are shadowed or nullified within worker scope.
- **Watchdog Timer:** A hard 1,000ms timeout terminates the worker via `worker.terminate()` if execution does not complete, preventing browser UI lockup on infinite loops.

---

## 15. AI / LLM Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CODEQUEST CLIENT TIER                           │
│  React 19 SPA | Learner requests adaptive challenge / extra practice   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND APPLICATION GATEWAY                         │
│  Rate Limiting (5 req/min) | Auth Verification | Zod Input Validation  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   ADAPTIVE DIFFICULTY ENGINE                           │
│  Computes Bloom's cognitive stage (1-5) & syntax whitelists            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PROMPT ENGINEERING BUILDER                          │
│  Injects system role, curriculum boundaries, few-shots, JSON schema    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL LLM INFERENCE                             │
│  Google Gemini 1.5 Flash API (T = 0.2, Structured Output Mode)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Raw JSON String
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STRUCTURED OUTPUT VALIDATOR                          │
│  Zod Schema Validation | Distractor & Correct Answer Checks            │
└─────────────────┬──────────────────────────────────┬───────────────────┘
                  │ Valid Schema                     │ Invalid / Timeout
                  ▼                                  ▼
┌──────────────────────────────────┐   ┌─────────────────────────────────┐
│     MONGODB QUESTION STORE       │   │    FALLBACK SEED QUESTION BANK  │
│  Cache question for reuse        │   │  Retrieve pre-seeded question   │
└─────────────────┬────────────────┘   └─────────────┬───────────────────┘
                  │                                  │
                  └─────────────────┬────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SANITIZED CLIENT DELIVERY                          │
│  correctAnswer stripped via projection -> Delivered to learner browser │
└────────────────────────────────────────────────────────────────────────┘
```

### 15.1 Why the Frontend MUST NOT Call the LLM Directly
1. **API Key Protection:** Direct browser calls expose private API credentials in client network bundles, allowing malicious users to steal keys.
2. **Cost & Quota Protection:** Bypassing the backend prevents rate limiting and semantic caching, enabling bad actors to exhaust API quotas and incur massive bills.
3. **Prompt Injection Defense:** Centralized server prompts prevent users from manipulating system instructions or bypassing curriculum boundaries.
4. **Validation Integrity:** The server guarantees that all questions conform to strict JSON schemas before reaching the client.

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

### 16.1 Why the Application Owns Progression (Not the LLM)
1. **Determinism:** Progression rules are mathematical and predictable, avoiding random difficulty spikes.
2. **Auditability & Testing:** Progression algorithms can be verified with 100% test coverage using unit tests.
3. **Anti-Cheating:** Prevents learners from jailbreaking the LLM to award unearned unlocks or infinite XP.
4. **Pedagogical Consistency:** Guarantees that every learner masters prerequisite cognitive stages before advancing.

---

## 17. AI Structured Output Architecture

Structured output guarantees machine readability and eliminates frontend UI crashes:

### 17.1 Schema Contract
```json
{
  "level": 3,
  "concept": "loops_while",
  "difficulty": "medium",
  "questionType": "multiple_choice",
  "question": "Which statement must be added inside the while loop so it terminates after 5 runs?",
  "options": [
    "count = count + 1;",
    "count = count - 1;",
    "let count = 0;",
    "count == 5;"
  ],
  "correctAnswer": "count = count + 1;",
  "hint": "What needs to change on every iteration so count < 5 eventually becomes false?",
  "explanation": "Incrementing count ensures count reaches 5, causing the while condition to evaluate to false.",
  "xp": 40
}
```

### 17.2 Validation & Fallback Handling
- **Parsing:** `JSON.parse()` extracts the completion string.
- **Zod Schema:** Checks field types, enum values, array lengths ($= 4$), and verifies `options.includes(correctAnswer)`.
- **Failover:** If validation fails, the system logs the failure and serves a verified question from the Pre-Seeded Question Bank without disrupting the learner.

---

## 18. Authentication and Authorization

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

## 19. Middleware Architecture

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

## 20. Security Architecture

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

## 22. Error Handling Architecture

Centralized error handling standardizes failure responses across all endpoints:

### 22.1 Error Response Envelope
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

### 22.2 Error Interception Strategy
- Custom `AppError` class establishes operational errors with defined HTTP status codes.
- Mongoose `CastError` (invalid ObjectId) automatically converts to `400 Bad Request`.
- Mongoose duplicate key error (`E11000`) automatically converts to `409 Conflict`.
- Unhandled rejections and database drops return `500 Server Error` with stack traces suppressed in production.

---

## 23. Logging and Observability

- **Structured JSON Logging:** Pino logger emits formatted JSON streams with `timestamp`, `level`, `reqId`, `method`, `path`, `statusCode`, and `durationMs`.
- **PII Redaction:** Passwords, tokens, API keys, and personal contact info are filtered and redacted from all log streams.
- **Health Check Endpoints:** `/health/live` (verifies process liveness) and `/health/ready` (verifies active MongoDB/Postgres database connections).

---

## 24. Rate Limiting

Rate limiting protects the platform from denial-of-service attacks, credential brute-forcing, and runaway LLM costs:

| Endpoint Group | Window | Max Requests | Violation Response | Rationale |
|:---|:---:|:---:|:---:|:---|
| `/api/auth/*` | 15 min | 10 per IP | `429 Too Many Requests` | Mitigates automated credential stuffing attacks. |
| `/api/quizzes/:id/submit`| 1 min | 30 per User | `429 Too Many Requests` | Prevents automated answer farming and script flooding. |
| `/api/ai-questions/*` | 1 min | 5 per User | `429 Too Many Requests` | Protects external LLM quota and infrastructure costs. |
| General Read Endpoints | 1 min | 120 per IP | `429 Too Many Requests` | Shields database from resource exhaustion. |

---

## 25. Caching

Caching is evaluated based on concrete performance metrics rather than speculative complexity:

| Data Candidate | Cache Justification | Invalidation Strategy | Implementation Status |
|:---|:---|:---|:---:|
| **Static Curriculum Hierarchy** | Topics and levels are read on every dashboard load but rarely change. High read-to-write ratio. | Event-driven cache eviction on curriculum update; 24h TTL fallback. | `Planned (Phase 3)` |
| **Synthesized AI Questions** | Reusable practice questions for matching difficulty stages eliminate expensive LLM calls. | MongoDB collection indexed by `conceptId` and `difficultyStage`. | `Planned (Phase 2)` |
| **Rate Limit Counters** | Fast atomic increments for API rate-limiting windows. | In-memory sliding window / Redis key TTL (60s). | `Planned (Phase 3)` |
| **Learner XP & Real-Time Progress**| **DO NOT CACHE.** High write frequency, strict consistency; stale cache risks duplicate XP exploits. | Direct database read/write with atomic updates. | `Rejected for Cache` |

---

## 26. External System Integrations

| External System | Integration Method | Data Exchanged | Failure Mode | Security & Defense |
|:---|:---|:---|:---|:---|
| **Google Gemini API** | Outbound HTTPS SDK | Prompt XML context $\rightarrow$ Structured JSON | Intercepted within 3s $\rightarrow$ Pre-seeded fallback | Private key isolated on server; low temp (0.2). |
| **MongoDB Atlas** | Mongoose TCP Socket | BSON document queries & updates | Auto-reconnect with exponential backoff | SSL/TLS connection; IP access whitelisting. |
| **PostgreSQL (Neon)**| node-postgres TCP Socket| Parameterized SQL queries | Fallback to cached read replicas | SSL connection string; parameterized queries (`$1`). |
| **Cloudflare / Vercel**| HTTPS Edge CDN | Static React assets (HTML, JS, CSS) | Edge CDN failover | DDoS mitigation; strict HTTPS/TLS termination. |

---

## 27. High-Level Data Flows

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

## 28. Deployment Architecture

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

## 29. Scalability

1. **Stateless API Clustering:** Express instances store zero in-memory session state. Authentication relies strictly on stateless JWTs, allowing horizontal auto-scaling behind an Nginx or AWS Application Load Balancer.
2. **Read/Write Database Segregation:** High-volume curriculum reads (`GET /api/topics`, `GET /api/quizzes/:id`) can be routed to MongoDB Atlas read replicas, reserving primary instances for attempt writes.
3. **Client-Side Compute Offloading:** Offloading code execution entirely to the learner's browser Web Worker means code execution compute costs scale at $O(1)$ on the server.
4. **Semantic Question Caching:** Storing synthesized questions in MongoDB indexed by `conceptId` and `difficultyStage` prevents repetitive LLM queries for learners at matching levels.

---

## 30. Modular Monolith Decision

CodeQuest is architectured as a **Modular Monolith** rather than microservices:
1. **Engineering Velocity & Simplicity:** A single repository and unified deployment pipeline eliminates distributed network latency, RPC serialization overhead, and distributed transaction complexity (Saga patterns).
2. **Clean Domain Boundaries:** Code is partitioned into distinct domain modules (`AuthModule`, `LearningModule`, `QuizModule`, `AIModule`) communicating via explicit in-memory interfaces.
3. **Future Extraction Ready:** If the AI Question Generation engine or Code Execution runner experiences disproportionate traffic in post-MVP phases, they can be extracted into dedicated microservices without refactoring domain business rules.

---

## 31. Architectural Tradeoffs

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

## 32. Technology Stack

| Technology | Purpose | Why Chosen | Alternative Considered | Status |
|:---|:---|:---|:---|:---:|
| **React 19** | Frontend SPA Library | Declarative UI, Virtual DOM reconciliation, seamless component composition | Vue / Angular / Svelte | `Planned (MVP)` |
| **Vite 8** | Frontend Tooling & Bundler | Native ES modules, ultra-fast HMR, optimized Rollup production builds | Webpack / Parcel | `Planned (MVP)` |
| **Vanilla CSS3** | Cyber Design System | Precise control over CSS variables, GPU animations, zero CSS bloat | TailwindCSS / Bootstrap | `Planned (MVP)` |
| **Web Worker API** | Code Execution Sandbox | Native browser threading; zero server security risk; hard watchdog guards | Docker / Judge0 / WASM | `Planned (MVP)` |
| **Node.js 18+** | Backend Runtime | Non-blocking asynchronous event loop; handles concurrent I/O efficiently | Python / Go / Java | `Planned (MVP)` |
| **Express 5.2.1** | REST API Framework | Lightweight, un-opinionated routing, robust middleware pipeline | NestJS / Fastify | `Planned (MVP)` |
| **MongoDB 7 / Mongoose 9**| Primary Document Store | Schema-enforced document storage ideal for polymorphic questions & attempts | CouchDB / DynamoDB | `Planned (MVP)` |
| **PostgreSQL 16** | Relational Social Store | Strict ACID guarantees, foreign keys, and multi-table SQL JOIN queries | MySQL / MariaDB | `Planned (Phase 4)` |
| **Zod 3.23** | Schema Validation | TypeScript-first static & runtime validation for API bodies and LLM outputs | Joi / Yup | `Planned (MVP)` |
| **jsonwebtoken (JWT)** | Stateless Session Auth | Cryptographically signed bearer tokens; zero server session storage | Express-Session / OAuth | `Planned (MVP)` |
| **bcryptjs 3.0** | Password Hashing | One-way salted cryptographic hashing (10 rounds) | Argon2 / PBKDF2 | `Planned (MVP)` |
| **Google Gemini 1.5 Flash**| External LLM Provider | Fast inference, cost-effective, native JSON structured output support | OpenAI GPT-4o / Claude | `Planned (Phase 2)` |

---

## 33. Project Score Mapping

| Concept # | Mandatory Viva Concept | Architectural Area | Status | Architectural Role & Technical Explanation |
|:---:|:---|:---|:---:|:---|
| **1** | **React Component Composition** | Frontend Architecture | `Planned (MVP)` | Modular UI hierarchy (`MainLayout`, `GameHeader`, `KingdomMap`, `BlockWorkspace`, `TerminalDock`). Demonstrates pure presentation primitives and unidirectional data flow. |
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
| **19** | **Git Workflow** | Engineering Discipline | `Implemented` | Multi-branch workflow (`main`, `develop`, `docs/*`), Conventional Commits (`docs: add high level design`), and clean staging. |
| **20** | **Secrets Management** | Security Posture | `Planned (MVP)` | Zero hardcoded credentials in source code; configuration injected through `.env` files and validated via `dotenv`. |
| **21** | **JavaScript Event Loop** | JS Runtime Internals | `Planned (MVP)` | Non-blocking asynchronous I/O delegating database queries and bcrypt hashing to libuv worker threads, unblocking the single main thread. |
| **22** | **Promises vs Callbacks** | JS Control Flow | `Planned (MVP)` | Modern Promise-based architecture consumed via `async/await`, eliminating legacy callback hell and unhandled promise rejections. |
| **23** | **async / await** | JS Control Flow | `Planned (MVP)` | Linear, readable asynchronous control flow across controllers, service methods, and seed scripts. |
| **24** | **Closures** | JS Scope & Memory | `Planned (MVP)` | Lexical closures in `answers.map((answer) => { ... })` retaining scope access to the outer `questions` array and mutating the lexical `score` counter. |
| **25** | **Hoisting & Temporal Dead Zone** | JS Compilation | `Planned (MVP)` | Function declarations hoisted to module scope; variables declared strictly with `const` and `let` residing in the TDZ, preventing state bugs. |

---

## 34. Risks and Mitigations

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

## 35. Future Evolution

The CodeQuest architecture supports phased post-MVP expansion:
1. **Phase 2 — Adaptive AI Engine:** Deployment of server-side LLM prompt pipeline, Bloom's cognitive calibrator, and mistake remediation engine.
2. **Phase 3 — Multi-Language In-Browser Execution:** Integration of WebAssembly (Pyodide) to support sandboxed client-side Python execution with identical zero-server RCE guarantees.
3. **Phase 4 — Social & Relational Systems (PostgreSQL):** Migration of developer Guilds, collaborative team quests, and weekly competitive leaderboards utilizing PostgreSQL relational JOINs.
4. **Phase 5 — Advanced Coding Arena:** Full-screen IDE mode with Monaco editor integration, multi-file project workspaces, and automated Git portfolio synchronization.

---

## 36. HLD → LLD Boundary

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
