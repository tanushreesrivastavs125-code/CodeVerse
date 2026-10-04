# CodeQuest — High-Level Design (HLD)

---

## 1. Document Information

- **Project Name:** CodeQuest (ByteArena)
- **Document Version:** 1.0.0
- **Document Type:** System Architecture & High-Level Design (HLD)
- **Status:** Architecture Approved / Ready for Review
- **Date:** October 2026
- **Repository:** `tanushreesrivastavs125-code/CodeVerse`
- **Active Branch:** `docs/hld` (targeting `develop`)
- **Upstream Baseline:** [PRD.md](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/PRD.md) (v1.0.0, Merged into `develop`)
- **Target Audience:** Engineering Evaluators, Technical Viva Assessors, System Architects, Full-Stack Developers
- **Core Educational Paradigm:** $\mathbf{PLAY} \longrightarrow \mathbf{BUILD} \longrightarrow \mathbf{UNDERSTAND} \longrightarrow \mathbf{CODE} \longrightarrow \mathbf{MASTER}$

---

## 2. Architecture Overview

**CodeQuest** is a professional gamified programming-learning web platform engineered to bridge the cognitive divide between zero programming experience and production-grade software engineering. The platform combines visual block-based algorithmic manipulation, real-time syntax code preview, deterministic challenge evaluation, and an adaptive AI question synthesis engine—all delivered within a focused cyber-developer SaaS aesthetic.

Architecturally, CodeQuest is structured as a **decoupled, multi-tier client-server system**:
1. **Frontend Presentation Tier:** A modern Single-Page Application (React 19 + Vite) providing a zero-latency visual block canvas, live-synchronized code views, interactive curriculum roadmaps, and an in-browser sandboxed execution environment.
2. **Backend Application Tier:** A stateless RESTful API gateway (Node.js + Express 5) managing authentication, curriculum state, challenge grading, deterministic XP/progression calculations, and controlled AI interactions.
3. **Data & Persistence Tier:** A justified hybrid data architecture leveraging relational storage (PostgreSQL) for structured entities requiring ACID transactions and relational joins (users, progress, achievements, curriculum hierarchy), paired with document storage (MongoDB) for semi-structured, polymorphic payloads (AI question banks, evaluation logs, dynamic prompts).
4. **AI & Adaptive Subsystem:** An isolated backend service managing prompt construction, syntactic whitelisting, low-temperature LLM inference, and strict schema validation, orchestrated by an application-domain Adaptive Difficulty Engine.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CODEQUEST CLIENT TIER                           │
│  React 19 SPA | Visual Block Canvas | Real-Time Preview | Web Worker   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JWT Bearer)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API GATEWAY                             │
│  Express 5 | Security Headers | Rate Limiter | Auth & Validation MW    │
└─────────┬─────────────────────────┬──────────────────────────┬─────────┘
          │                         │                          │
          ▼                         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐
│ LEARNING SERVICE │      │ PROGRESS SERVICE │       │  AI & ADAPTIVE   │
│ & CHALLENGE ENG  │      │ & GAMIFICATION   │       │     SERVICE      │
└─────────┬────────┘      └─────────┬────────┘       └─────────┬────────┘
          │                         │                          │
          ├─────────────────────────┘                          ▼
          ▼                                          ┌──────────────────┐
┌──────────────────┐                                 │   EXTERNAL LLM   │
│    POSTGRESQL    │                                 │ (Structured JSON)│
│ (Relational Data)│                                 └─────────┬────────┘
└──────────────────┘                                           │
                                                               ▼
                                                     ┌──────────────────┐
                                                     │     MONGODB      │
                                                     │ (AI Question DB) │
                                                     └──────────────────┘
```

---

## 3. Architectural Goals

1. **Strict Separation of Concerns:** Frontend views, backend business logic, code execution runtimes, AI synthesis, and data stores remain strictly decoupled with explicit interfaces.
2. **Defensive AI Architecture:** The external LLM is never exposed to the client, never given raw execution access, and never allowed to autonomously dictate learner progression or award XP.
3. **Zero Server-Side RCE Vulnerability:** Learner-generated code is never executed directly inside the backend server process. Execution occurs within isolated browser Web Workers (MVP) or dedicated container sandboxes (future roadmap).
4. **Deterministic Progress & Economy:** All challenge grading, XP calculations, streak maintenance, and milestone unlocks are performed deterministically on the backend server.
5. **High Interactive Performance:** Initial application shell renders in $<1.5\text{s}$; block dragging and AST-to-syntax code synchronization maintain 60 FPS ($<16\text{ms}$ frame time); REST endpoints respond in $<200\text{ms}$.
6. **Graceful Degradation:** External AI provider downtime, network latency, or quota exhaustion never blocks learner progress; the system automatically falls back to pre-seeded static challenge banks.
7. **Viva & Audit Traceability:** Every architectural layer directly demonstrates fundamental computer science principles (event loop, closures, relational integrity, stateless auth) defendable in technical examinations.

---

## 4. Architectural Principles

- **Principle 1: Separation of Concerns (SoC):** Each subsystem owns a single discrete domain. The client manages user interaction and spatial block assembly; the backend enforces business logic, security, and persistence; the AI synthesizes natural language and practice scenarios.
- **Principle 2: Explicit API Contracts:** All inter-tier communication occurs over stateless HTTP REST APIs utilizing standardized JSON envelopes, semantic status codes, and validated payload schemas.
- **Principle 3: AI Isolation & Defense-in-Depth:** Private LLM API credentials, prompt templates, and system instructions reside exclusively on the server. The client never communicates directly with AI providers.
- **Principle 4: Controlled & Bounded AI:** Educational scope, prerequisite concepts, Bloom's difficulty tiers, and allowed syntax tokens are calculated deterministically by the application before prompt construction. The LLM operates strictly within these guardrails.
- **Principle 5: Validation at Every Layer:** Input payloads are validated before reaching controllers; database writes are validated by schemas; raw LLM completions are validated against strict JSON schemas before client delivery.
- **Principle 6: Anti-Cheat by Default:** Assessment questions sent to the client explicitly strip out correct answers and hidden test assertions (`.select("-correctAnswer")`). Evaluation is performed server-side.
- **Principle 7: Honest Implementation Demarcation:** The system architecture distinguishes between verified existing artifacts, MVP planned features, and proposed post-MVP extensions.

---

## 5. System Context

The system context diagram illustrates the boundary of the CodeQuest platform, external actors, and third-party integrations:

```mermaid
flowchart TB
    Learner["🧑‍💻 Learner / Student\n(Web Browser)"]
    Evaluator["👨‍🏫 Technical Evaluator\n(Viva Examiner)"]

    subgraph PlatformBoundary["CodeQuest System Boundary"]
        ClientApp["Web Client\n(React 19 SPA)"]
        BackendGateway["Backend API Gateway\n(Node.js / Express 5)"]
        RelationalStore["Relational Data Store\n(PostgreSQL / Structured Data)"]
        DocumentStore["Document Data Store\n(MongoDB / AI Questions)"]
        SandboxEnv["Sandboxed Execution Runner\n(Browser Web Worker / WASM)"]
    end

    subgraph ExternalServices["External Services"]
        LLMProvider["External AI Provider\n(Gemini / OpenAI API)"]
        CDNStatic["Static Hosting / CDN\n(Cloudflare / Vercel)"]
    end

    Learner -->|Interacts with UI & Assembles Blocks| ClientApp
    Evaluator -->|Audits Code & Progress| ClientApp
    CDNStatic -->|Serves Production Assets| ClientApp
    ClientApp -->|Executes Untrusted Code Safely| SandboxEnv
    ClientApp -->|HTTP REST + JWT Bearer| BackendGateway
    BackendGateway -->|Curriculum, Users, Progress, Attempts| RelationalStore
    BackendGateway -->|AI Questions, Prompts, Logs| DocumentStore
    BackendGateway -->|Structured Generation Request| LLMProvider
```

---

## 6. High-Level System Architecture

The detailed component architecture maps the operational layers of CodeQuest:

```mermaid
flowchart TB
    User["Learner / User"]

    subgraph Client["Web Client (React 19 + Vite)"]
        UI["Cyber UI Shell / HUD"]
        Roadmap["Curriculum Roadmap View"]
        Blockly["Visual Block Canvas (AST Engine)"]
        CodePreview["Real-Time Dual Code Preview"]
        WorkerSandbox["Sandboxed Web Worker (JS Runtime)"]
    end

    subgraph Gateway["Backend API Gateway (Express 5)"]
        Router["REST API Router"]
        AuthMW["Auth Middleware (JWT Verify)"]
        ValMW["Validation Middleware (Zod)"]
        RateMW["Rate Limiter (Token Bucket)"]
        ErrMW["Centralized Error Middleware"]
    end

    subgraph Services["Core Domain Services"]
        AuthService["Authentication Service (bcryptjs / JWT)"]
        LearningService["Curriculum & Learning Service"]
        ChallengeService["Challenge & Evaluation Service"]
        ProgressService["Progress & Mastery Service"]
        GamificationService["Gamification Service (XP & Streaks)"]
        AdaptiveEngine["Adaptive Difficulty Engine"]
        AIService["AI Question Service (Prompt + Validation)"]
    end

    subgraph Storage["Data & Cache Tier"]
        SQL[(PostgreSQL / Structured Entities)]
        Mongo[(MongoDB / Flexible AI Docs)]
        Cache[(Redis / Proposed Caching)]
    end

    subgraph External["External Subsystems"]
        LLM["External LLM API Provider"]
    end

    User --> UI
    UI --> Roadmap
    UI --> Blockly
    Blockly --> CodePreview
    Blockly --> WorkerSandbox
    UI --> Router

    Router --> RateMW --> AuthMW --> ValMW

    ValMW --> AuthService
    ValMW --> LearningService
    ValMW --> ChallengeService
    ValMW --> ProgressService
    ValMW --> GamificationService
    ValMW --> AIService

    ChallengeService --> AdaptiveEngine
    AdaptiveEngine --> AIService
    AIService --> LLM

    AuthService --> SQL
    LearningService --> SQL
    ProgressService --> SQL
    GamificationService --> SQL
    ChallengeService --> SQL

    AIService --> Mongo
    LearningService -.-> Cache
    Router -.-> ErrMW
```

### Component Status Summary
- **Git Workflow & Documentation:** `[IMPLEMENTED]` (Multi-branch protocol, Conventional Commits, PRD, HLD).
- **React Frontend & Cyber HUD:** `[MVP PLANNED]` (Single Page App, responsive layout, dark neon tokens).
- **Visual Block Canvas & Live Syntax:** `[MVP PLANNED]` (Magnetic snapping, AST-to-code translator).
- **Browser Sandboxed Runner:** `[MVP PLANNED]` (Isolated Web Worker execution with 1,000ms guard).
- **Express Backend & Auth:** `[MVP PLANNED]` (JWT authentication, bcrypt hashing, REST routing).
- **Core Challenge & XP Engine:** `[MVP PLANNED]` (Server-side deterministic grading, level progression).
- **PostgreSQL Relational Layer:** `[PROPOSED / ROADMAP]` (Normalized relational tables for users and curricula).
- **MongoDB Question Store:** `[MVP PLANNED]` (Document collections for flexible AI question items).
- **Adaptive AI Question Engine:** `[PLANNED PHASE 2]` (Prompt pipeline, low-temp inference, Zod schema checks).
- **Distributed Redis Cache:** `[PROPOSED / FUTURE]` (In-memory caching for high-scale curriculum delivery).

---

## 7. Frontend Architecture

The frontend is structured as a component-driven Single Page Application adhering to unidirectional data flow:

```text
Pages (Route Targets: Dashboard, Challenge, Profile)
  │
  ├── Layouts (Global Cyber HUD, Sidebar Navigation, Footer)
  │     │
  │     ├── Feature Components (RoadmapCanvas, BlockWorkspace, DualCodePanel, OutputDock)
  │     │     │
  │     │     └── Shared UI Primitives (CyberButton, MetricCard, XPMeter, Modal, Badge)
  │     │
  │     └── Custom React Hooks (useAuth, useChallenge, useBlockWorkspace, useWorkerRunner)
  │           │
  │           └── API Service Client (Axios / Fetch with JWT Interceptors & Error Adapters)
  │                 │
  ▼                 ▼
Backend REST API  Browser Web Worker Sandbox
```

### Key Subsystems
1. **Routing & Guards:** Client-side routing with route guards redirecting unauthenticated learners to `/login` and preserving attempted target routes.
2. **Cyber HUD Shell:** Persistent top status bar displaying player handle, current rank, XP bar, and active streak counter.
3. **Visual Block Workspace:** Interactive canvas managing block geometry, socket typing, connection rules, and AST generation.
4. **Synchronized Code Matrix:** Read-only / editable code editor (using Monaco or lightweight syntax highlighter) reflecting the block AST in real time.
5. **Execution & Diagnostic Dock:** Split-pane console displaying execution output, assertion checks, animated avatar state transitions, and diagnostic feedback.
6. **State Lifecycle Handling:** Every async operation explicitly renders one of three states:
   - *Loading State:* Shimmering cyber-skeleton with accessible ARIA live attributes.
   - *Success State:* Immediate DOM rendering with optimistic UI updates.
   - *Error State:* Human-friendly diagnostic card with actionable recovery buttons ("Retry", "Reset Blocks").

---

## 8. Backend Architecture

The backend implements a clean, layered architecture enforcing strict separation between transport, authorization, validation, business logic, and data persistence:

```text
┌────────────────────────────────────────────────────────┐
│ HTTP Request (e.g., POST /api/challenges/submit)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Global Middleware (Cors, Helmet, JSON Body Parser)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Security & Rate Limiting Middleware                    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Authentication Middleware (Verify JWT Bearer Token)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Validation Middleware (Zod Request Payload Schema)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Controller Layer (HTTP Parameter Extraction & Mapping) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Domain Service Layer (Pure Business Logic & Rules)     │
│ - Grader, XP Calculator, Mastery Updater, Prompt Synth │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│ Relational Repository /   │ │ Document Model /         │
│ Database (PostgreSQL)     │ │ Storage (MongoDB)        │
└─────────────┬─────────────┘ └────────────┬─────────────┘
              │                            │
              └─────────────┬──────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Centralized Error Middleware (Transforms to Envelope)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ HTTP Response (Standard JSON Envelope: 200/201/400...) │
└────────────────────────────────────────────────────────┘
```

### Architectural Justification
- **Testability:** Domain services are decoupled from Express `req`/`res` objects, enabling isolated unit testing of grading, XP formulas, and difficulty algorithms.
- **Security:** Validation middleware rejects malformed payloads before they reach business logic or query engines.
- **Maintainability:** Clear boundaries prevent database queries from leaking into presentation routes.

---

## 9. API Architecture

The API adheres to RESTful architectural principles:
- **Statelessness:** No session affinity or state is stored in memory between requests; every request carries its authorization token.
- **Resource-Oriented URIs:** Nouns identify resources; HTTP methods denote operations.
- **Consistent Response Envelopes:** All responses share a standard JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-05T00:00:00.000Z"
}
```

### High-Level API Domains

| Endpoint Group | Primary Resource | Supported Methods | Responsibility |
|:---|:---|:---:|:---|
| `/api/auth` | User Identity & Sessions | `POST` | User registration, credential authentication, token issuance |
| `/api/users` | Learner Profiles | `GET`, `PATCH` | Profile retrieval, settings, avatar customization |
| `/api/learning` | Curricula & Taxonomy | `GET` | Hierarchy listing, learning paths, level metadata, concept nodes |
| `/api/challenges` | Interactive Tasks | `GET` | Challenge retrieval (anti-cheat sanitized, answers stripped) |
| `/api/attempts` | Submissions & Grading | `POST`, `GET` | Solution submission, deterministic grading, attempt history |
| `/api/progress` | Learner Mastery | `GET` | Concept mastery vectors, completed nodes, active roadmap |
| `/api/gamification`| XP & Streaks | `GET` | XP breakdown, current level thresholds, streak tracking |
| `/api/ai-questions`| Adaptive Practice | `POST`, `GET` | Synthesis of adaptive practice questions via LLM pipeline |

---

## 10. Authentication Architecture

CodeQuest implements a stateless token-based authentication architecture:

```mermaid
sequenceDiagram
    autonumber
    actor User as Learner / Client
    participant API as API Gateway (/api/auth)
    participant Auth as Auth Service
    participant DB as User Database (PostgreSQL/Mongo)

    Note over User,DB: Registration Flow
    User->>API: POST /api/auth/register (username, email, password)
    API->>Auth: Validate credentials (format, length >= 6)
    Auth->>Auth: Hash password with bcryptjs (salt rounds = 10)
    Auth->>DB: Check unique email/username & Insert user record
    DB-->>Auth: User Created
    Auth->>Auth: Sign JWT (payload: { id, username, role }, expires: 24h)
    Auth-->>User: 201 Created { token, user: { id, username, xp, level } }

    Note over User,DB: Authenticated Resource Access
    User->>API: GET /api/learning/roadmap (Header: Bearer <token>)
    API->>API: authMiddleware verifies JWT signature & expiry
    alt Token Valid
        API->>API: Attach req.user = decodedToken
        API-->>User: 200 OK (Roadmap Data)
    else Token Missing or Invalid
        API-->>User: 401 Unauthorized (Invalid or expired token)
    end
```

### Security Specifications
- **Credential Storage:** Raw passwords are never persisted. Passwords are irreversibly hashed using `bcryptjs` with a work factor of 10 salt rounds.
- **Token Format:** Signed JSON Web Tokens using `HS256` or `RS256` algorithm with an expiration lifetime of 24 hours.
- **Client Storage:** Tokens are retained in memory or secure storage; transmitted strictly via the HTTP `Authorization: Bearer <token>` header.

---

## 11. Learning Engine

The Learning Engine coordinates curriculum progression, concept dependencies, and prerequisite unlocking:

```text
Learning Path (e.g., "Web Fundamentals" / "Python Core")
      │
      ▼
Level (e.g., "Level 3: Control Flow & Logic")
      │
      ▼
Concept (e.g., "Conditionals: if/else Branching")
      │
      ├── Prerequisites Checked (Requires "Level 1: Sequencing" & "Level 2: Variables")
      │
      ▼
Challenge Pool (Ordered & Adaptive Challenge Nodes)
      │
      ▼
Attempt Evaluation (Accuracy, Velocity, Constraints Met)
      │
      ▼
Concept Mastery Updated (Exponential Moving Average or Accuracy Ratio)
      │
      ▼
Unlock Next Concept / Level (Triggered when Mastery >= 85%)
```

### Unlocking Algorithm
1. A concept node has three statuses: `LOCKED`, `ACTIVE`, `MASTERED`.
2. A concept transitions from `LOCKED` to `ACTIVE` only when all prerequisite concepts have achieved `MASTERED` status.
3. A concept transitions from `ACTIVE` to `MASTERED` when the learner achieves $\ge 85\%$ accuracy across a minimum of 3 unique challenges or conquers the concept milestone challenge.

---

## 12. Challenge Engine

The Challenge Engine governs the lifecycle of an interactive task from presentation to grading:

```text
Learner Selects Challenge
           │
           ▼
API Strips Hidden Tests & Answers (Anti-Cheat Projection)
           │
           ▼
Learner Loads Challenge in Visual Workspace
           │
           ▼
Learner Builds Logic with Blocks / Edits Code
           │
           ▼
Client Executes in Sandbox (Immediate Visual State Feedback)
           │
           ▼
Learner Submits Solution Payload to Backend
           │
           ▼
Server-Side Deterministic Evaluator Executes Acceptance Tests
           │
     ┌─────┴────────────────────────────────┐
     ▼                                      ▼
[Assertion Passed]                    [Assertion Failed]
- Calculate Base XP + Bonuses         - Log failed assertion diagnostic
- Update Mastery & Streaks            - No XP deduction (non-punitive)
- Return 201 Created with XP earned   - Return 200 OK with hint recommendation
```

### Challenge Typology
1. **Recognition:** Predict output of given code/block snippet.
2. **Construction:** Assemble program from scratch to satisfy behavioral spec.
3. **Constrained Optimization:** Solve within strict block/instruction limits (e.g., max 4 blocks).
4. **Bug Hunt:** Trace flawed program, identify logic error, and correct it.
5. **Syntax Translation:** Bridge visual block logic to equivalent written code.

---

## 13. Block-Based Coding Architecture

The block coding architecture decouples visual spatial manipulation from abstract syntax generation and code execution:

```mermaid
flowchart LR
    Palette["Block Palette\n(Actions, Logic, Loops, Vars)"]
    Canvas["Visual Canvas\n(Magnetic Snapping & Type Sockets)"]
    AST["Abstract Syntax Tree\n(Visual AST Representation)"]
    CodeGen["Target Code Generator\n(JS / Python Emitters)"]
    Preview["Live Dual-View\nSyntax Panel"]
    Sandbox["Sandboxed Web Worker\n(Client Execution)"]

    Palette -->|Drag & Drop| Canvas
    Canvas -->|Enforces Socket Constraints| AST
    AST -->|Serializes Clean Code| CodeGen
    CodeGen -->|Synchronizes Syntax| Preview
    CodeGen -->|Feeds Executable Script| Sandbox
```

### Architectural Guarantees
- **Type-Enforced Geometry:** Socket shapes prevent syntactically invalid combinations (e.g., boolean conditions cannot be plugged into numeric arithmetic slots).
- **Zero-Latency AST Synchronization:** Code generation runs synchronously on AST change events without server round-trips.

---

## 14. Code Execution Architecture

Executing untrusted learner code represents the **primary security boundary** of the platform:

```text
┌────────────────────────────────────────────────────────┐
│                  SECURITY BOUNDARY                     │
│  Learner-submitted code is UNTRUSTED by definition.   │
│  It MUST NEVER be executed in the main Node.js process.│
└────────────────────────────────────────────────────────┘
```

```mermaid
flowchart TB
    CodeInput["Learner Code + Test Harness"]
    WorkerManager["Web Worker Manager\n(Main Thread)"]
    TimerGuard["Watchdog Timer\n(Strict 1,000ms Hard Timeout)"]

    subgraph Sandbox["Isolated Web Worker Sandbox"]
        WorkerScope["Dedicated Worker Global Scope"]
        SanitizedEnv["Shadowed Globals (window, fetch, xhr disabled)"]
        Interpreter["JavaScript Runtime (V8 Engine)"]
    end

    OutputCapture["Captured Output & Diagnostics"]

    CodeInput --> WorkerManager
    WorkerManager -->|Spawn / PostMessage| Sandbox
    WorkerManager -->|Arm Watchdog| TimerGuard

    SanitizedEnv --> Interpreter
    Interpreter -->|Console Logs & Return Values| OutputCapture

    TimerGuard -->|If Execution > 1,000ms| TerminateSignal["Force Worker.terminate()\nReport Infinite Loop Error"]
    OutputCapture -->|Normal Completion| WorkerManager
```

### Execution Controls
- **Isolation:** Web Workers run in a distinct thread with zero access to the DOM, `localStorage`, `document.cookie`, or network sockets (`fetch`/`XMLHttpRequest` are shadowed or nullified).
- **Infinite Loop Defense:** A watchdog timer terminates the worker at exactly 1,000 milliseconds if execution does not complete, preventing browser UI lockup.
- **Multi-Language Roadmap (Future):** Python execution will leverage WebAssembly via Pyodide; compiled languages (C++/Java) will execute in isolated containerized cloud runners (gVisor/Docker).

---

## 15. Progress Architecture

Learner progress is treated as auditable, persistent state owned exclusively by the backend:

```text
Learner Progress State Hierarchy
└── User Record (ID, Handle, Account Timestamp)
      ├── Global HUD Metrics (Total XP, Level, Current Streak, Last Active UTC)
      ├── Curriculum Status Vector
      │     ├── Completed Paths []
      │     ├── Active Level ID
      │     └── Concept Mastery Map { [conceptId]: { accuracy, attempts, status } }
      ├── Challenge Attempt History [ (Immutable Audit Log) ]
      │     └── { attemptId, challengeId, timestamp, code, passed, score, xpAwarded }
      └── Unlocked Achievements [ { badgeId, unlockedAt } ]
```

### Persistence Rule
Client-side `localStorage` stores only transient UI preferences and JWT tokens. All educational progress, XP, and attempt records are written to database storage with idempotent update checks to prevent duplicate XP exploits.

---

## 16. Gamification Architecture

Gamification is calibrated to reinforce intrinsic motivation and deliberate practice rather than vanity clicks:

```mermaid
flowchart LR
    Sub["Successful Attempt\n(Server Verified)"]
    Calc["XP Calculator\n(Base + Bonus Rules)"]
    Prof["Update Progress\n& Total XP"]
    Lvl["Level Threshold\nFormula Check"]
    Strk["Streak Evaluator\n(UTC Calendar Check)"]
    Achv["Achievement Evaluator\n(Rule Engine)"]
    HUD["Client HUD\nNotification"]

    Sub --> Calc
    Calc --> Prof
    Prof --> Lvl
    Prof --> Strk
    Prof --> Achv
    Lvl --> HUD
    Strk --> HUD
    Achv --> HUD
```

### XP Economy & Formulas
- **Level Threshold Formula:**
  $$\text{XP Required for Level } N = 100 \times N^{1.5}$$
- **Economy Scale:**
  - Recognition Quiz: 10 Base XP (+5 first-try bonus)
  - Visual Block Assembly: 25 Base XP (+10 optimal block count bonus)
  - Algorithmic Challenge: 50 Base XP (+15 zero-hints bonus)
  - Bug Hunt Debugging: 40 Base XP (+10 under-2-runs bonus)
  - Milestone Exam: 100 Base XP (+25 score $\ge 90\%$ bonus)

---

## 17. AI Question Generation Architecture

The AI subsystem serves as an on-demand pedagogical tutor and practice question synthesizer. It is strictly bounded by application-level controls:

```mermaid
flowchart TB
    Learner["Learner Context\n(Mastery, Weaknesses, Level)"]
    DiffEngine["Adaptive Difficulty Engine\n(Calculates Concept & Bloom's Tier)"]
    PromptBuilder["Prompt Construction Service\n(Applies Rules, Whitelist & Output Schema)"]
    LLM["External LLM Provider\n(Low Temp: 0.2)"]
    Parser["Structured JSON Parser"]
    Validator["Zod Schema Validator\n(Type, Distractor & Answer Checks)"]
    Fallback["Pre-Seeded Question Bank\n(Fallback Repository)"]
    QuestionStore["MongoDB AI Question Store"]
    ClientDelivery["Sanitized Question to Client\n(Correct Answer Excluded)"]

    Learner --> DiffEngine
    DiffEngine --> PromptBuilder
    PromptBuilder -->|System & User Prompt| LLM
    LLM -->|Raw Completion| Parser
    Parser --> Validator

    Validator -->|Valid Schema| QuestionStore
    Validator -->|Invalid Schema or Timeout| Fallback

    QuestionStore --> ClientDelivery
    Fallback --> ClientDelivery
```

### Backend Ownership
- **No Direct Frontend Access:** The frontend never connects to the AI provider.
- **Cost & Rate Control:** Backend throttles AI question synthesis, caching generated questions in MongoDB to reuse across learners at matching difficulty stages.

---

## 18. Adaptive Difficulty Architecture

The Adaptive Difficulty Engine ensures the learner stays in the optimal zone of proximal development (flow state) using a deterministic multi-stage cognitive staircase:

```text
[STAGE 1: Recognition]
  Prediction / Multiple-Choice / Code Tracing
        │
        ▼ (Accuracy >= 75%)
[STAGE 2: Construction]
  Unconstrained Block Building to Satisfy Spec
        │
        ▼ (Accuracy >= 80%)
[STAGE 3: Constrained Optimization]
  Building with Resource Constraints (Max Blocks / Max Statements)
        │
        ▼ (Accuracy >= 85%)
[STAGE 4: Debugging (Bug Hunt)]
  Identifying & Fixing Flawed Logic / Edge Cases
        │
        ▼ (Accuracy >= 90%)
[STAGE 5: Code Synthesis]
  Translating Logic to Real Written Syntax
```

### Decision Matrix
- **Remediation Trigger ($<60\%$ accuracy on last 3 attempts):** Reduce difficulty tier by 1 stage; provide scaffolded hints; generate targeted practice on recent error categories.
- **Consolidation Zone ($60\%-84\%$ accuracy):** Maintain current stage; vary problem contexts within identical concept boundaries.
- **Advancement Trigger ($\ge 85\%$ accuracy across $\ge 3$ attempts):** Elevate to subsequent Bloom's stage or unlock subsequent concept node.

---

## 19. AI Prompt Architecture

The Prompt Pipeline enforces strict pedagogical and safety boundaries before invoking external models:

```text
┌────────────────────────────────────────────────────────┐
│ 1. SYSTEM PROMPT (Fixed Behavioral Directives)          │
│ - Role: Expert Computer Science Educator               │
│ - Tone: Professional, encouraging, precise             │
│ - Rule: Output strictly valid JSON conforming to schema│
│ - Rule: Never introduce concepts outside whitelist     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. CONTEXT INJECTION (Application-Calculated State)    │
│ - Target Concept: [e.g., "for-loop iteration"]         │
│ - Difficulty Stage: [e.g., "Stage 4: Debugging"]       │
│ - Allowed Syntax Whitelist: [e.g., "let", "for", "<="] │
│ - Forbidden Constructs: ["arrays", "objects", "async"] │
│ - Common Error Pattern to Target: ["off-by-one index"] │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. FEW-SHOT EXAMPLES & SCHEMA CONSTRAINTS              │
│ - 1-2 Golden standard JSON question examples           │
│ - Exact JSON schema template definition                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. LOW-TEMPERATURE INFERENCE (Temperature = 0.2)       │
└────────────────────────────────────────────────────────┘
```

---

## 20. AI Structured Output

Structured output is mandatory to prevent UI crashes and ensure programmatic validation.

### Expected Conceptual JSON Schema
```json
{
  "concept": "loops",
  "difficultyStage": 4,
  "questionTitle": "Off-by-One Loop Debugger",
  "promptText": "The following loop is intended to print numbers 1 through 5, but prints 1 through 4. Identify the bug.",
  "codeSnippet": "for (let i = 1; i < 5; i++) {\n  console.log(i);\n}",
  "questionType": "multiple_choice",
  "options": [
    "Change let i = 1 to let i = 0",
    "Change i < 5 to i <= 5",
    "Change i++ to i + 1",
    "Add console.log(5) after loop"
  ],
  "correctOptionIndex": 1,
  "hint": "Check the loop termination condition. Does < 5 include 5?",
  "explanation": "The condition i < 5 stops when i becomes 5. Using i <= 5 ensures 5 is printed.",
  "xpValue": 40
}
```

### Validation & Repair Pipeline
```text
LLM Completion
      │
      ▼
JSON.parse() ──► [Malformed Syntax] ──► Retry / Failover to Pre-Seeded Bank
      │
      ▼ (Valid JSON)
Zod Schema Validation
      ├── Check field types (strings, numbers, arrays)
      ├── Check array length (options.length >= 4)
      ├── Check index bounds (0 <= correctOptionIndex < options.length)
      └── Check whitelist conformity (no forbidden tokens)
      │
      ├──► [Fails Validation] ──► Log Error & Serve Pre-Seeded Question
      │
      ▼ [Passes Validation]
Save to MongoDB Question Bank & Serve to Client (Stripping correctOptionIndex)
```

---

## 21. Database Architecture

CodeQuest requires both **rigorous relational guarantees** for learner progress and **flexible document structures** for dynamic AI pedagogical content. Rather than forcing a single model to handle opposing requirements, the architecture designates explicit domains for each:

```text
                              CODEQUEST PERSISTENCE TIER
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
            RELATIONAL DOMAIN                          DOCUMENT DOMAIN
          (PostgreSQL / SQL)                         (MongoDB / NoSQL)
                     │                                         │
       ├── Strict Referential Integrity           ├── Polymorphic Payloads
       ├── ACID Transactions (XP / Level Up)      ├── Dynamic AI Question Schemas
       ├── Complex Relational Joins               ├── LLM Evaluation Logs & Traces
       └── Normalized Progress Audits             └── Rapid Schema Prototyping
```

### Justification Matrix

| Storage Engine | Primary Entities | Why This Database Fits | Roadmap Status |
|:---|:---|:---|:---:|
| **PostgreSQL** | Users, Learning Paths, Levels, Concepts, Challenges, Attempts, Progress, Achievements | Highly structured, relational data where cascading deletes, foreign key integrity, and ACID transactional updates (e.g. updating XP, streaks, and milestone unlocks simultaneously) are non-negotiable. | Proposed Phase 4 Architecture |
| **MongoDB** | AI-Generated Questions, Dynamic Prompts, Error Classification Tags, Raw LLM Inference Logs | Semi-structured and polymorphic data. AI questions vary significantly across question types (multiple-choice, bug hunt, fill-in-blank); schema changes in prompt design require flexibility without database migrations. | MVP Planned Architecture |

*Note for Engineering Assessment:* For the MVP phase, MongoDB / Mongoose provides full initial application data persistence. The relational PostgreSQL schema is designed and documented as the architectural target for Phase 4 social features (guilds, complex leaderboards, relational analytics) to demonstrate dual-database competence.

---

## 22. PostgreSQL Architecture

The relational schema models structured core domain entities and their strict relational cardinality:

```mermaid
erDiagram
    USER ||--o{ PROGRESS : has
    USER ||--o{ ATTEMPT : submits
    USER ||--o{ USER_ACHIEVEMENT : earns
    ACHIEVEMENT ||--o{ USER_ACHIEVEMENT : awarded_in

    LEARNING_PATH ||--|{ LEVEL : contains
    LEVEL ||--|{ CONCEPT : organizes
    CONCEPT ||--o{ CHALLENGE : provides
    CHALLENGE ||--o{ ATTEMPT : evaluates
    CONCEPT ||--o{ PROGRESS : tracks

    USER {
        uuid id PK
        string username
        string email
        string password_hash
        int total_xp
        int current_level
        int current_streak
        timestamp created_at
    }

    LEARNING_PATH {
        uuid id PK
        string slug
        string title
        string description
        int order_index
    }

    LEVEL {
        uuid id PK
        uuid path_id FK
        int level_number
        string title
        int required_xp
    }

    CONCEPT {
        uuid id PK
        uuid level_id FK
        string slug
        string title
        int mastery_threshold
    }

    CHALLENGE {
        uuid id PK
        uuid concept_id FK
        string title
        string category
        int base_xp
        int difficulty_tier
    }

    ATTEMPT {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        boolean is_correct
        int xp_awarded
        timestamp created_at
    }

    PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid concept_id FK
        int mastery_percent
        string status
        timestamp updated_at
    }

    ACHIEVEMENT {
        uuid id PK
        string code
        string title
        int xp_bonus
    }

    USER_ACHIEVEMENT {
        uuid user_id FK
        uuid achievement_id FK
        timestamp unlocked_at
    }
```

---

## 23. MongoDB Architecture

MongoDB manages flexible, semi-structured document collections:

### Collections
1. `ai_questions`: Dynamic question documents generated by LLM or pre-seeded.
2. `ai_generation_logs`: Audit logs tracking prompt context, token usage, latency, and validation status.
3. `challenge_payloads`: Rich visual block challenge metadata (palette definitions, starter blocks, visual asset URLs).

### Question Document Model Design
```javascript
// Conceptual MongoDB Document: ai_questions
{
  "_id": ObjectId("6700abcd1234567890abcdef"),
  "conceptId": "concept_loops_while",
  "difficultyStage": 3,
  "bloomTier": "Application",
  "questionType": "bug_hunt",
  "payload": {
    "title": "Escape the Endless Loop",
    "prompt": "Find the reason the loop never terminates and select the fix.",
    "code": "let count = 0;\nwhile (count < 10) {\n  console.log(count);\n}",
    "options": [
      "Change count < 10 to count > 10",
      "Add count++ inside the loop body",
      "Change while to if",
      "Initialize count to 10"
    ],
    "correctAnswerIndex": 1, // Stripped when queried by client
    "hint": "What must change on every iteration for the condition to eventually become false?",
    "explanation": "Without incrementing count, count remains 0 forever, causing an infinite loop."
  },
  "constraints": {
    "allowedTokens": ["while", "let", "count", "console.log"],
    "maxExecutionMs": 1000
  },
  "metrics": {
    "timesServed": 142,
    "passRate": 0.78
  },
  "createdAt": ISODate("2026-10-02T10:00:00Z")
}
```

### Document Storage Design Decisions
- **Embedding vs Referencing:** Options, hints, and explanations are embedded directly inside the question document because they are always read together in a single atomic retrieval. User attempt history references `questionId` to prevent unbound document growth.
- **Indexing:** Compound index on `{ conceptId: 1, difficultyStage: 1, "metrics.passRate": 1 }` for rapid retrieval of candidate practice questions.

---

## 24. Caching Architecture

Caching is evaluated based on concrete system performance trade-offs rather than speculative complexity:

```text
[HTTP Request] ──► [Redis Cache Check] ──► HIT  ──► Return Cached JSON (<5ms)
                         │
                        MISS
                         │
                         ▼
             [Database Query / Aggregation]
                         │
                         ▼
             [Write to Cache with TTL] ──► Return Fresh JSON (50-150ms)
```

### Caching Evaluation

| Data Candidate | Cache Justification | Invalidation Strategy | Implementation Status |
|:---|:---|:---|:---:|
| **Static Curriculum Hierarchy** | Curriculum paths, levels, and concept trees rarely change but are fetched on every dashboard load. High read-to-write ratio. | Event-driven cache eviction on curriculum publication; fallback 24h TTL. | Proposed Phase 3 |
| **Pre-Seeded Question Banks** | Standard foundational questions can be cached in memory to eliminate MongoDB round-trips. | Warm cache at server startup; read-heavy. | Proposed Phase 3 |
| **Rate Limit Counters** | Fast atomic increments for API rate-limiting windows. | Automatic sliding-window key expiration (TTL = 60s). | Proposed Phase 3 |
| **Learner XP / Real-Time Progress** | **DO NOT CACHE.** High write frequency, strict consistency requirements; stale cache could cause duplicate XP exploits. | Direct database read/write with transactions. | Rejected for Cache |

*Architecture Stance:* For MVP development, in-memory process caching (or direct optimized database indexes) is sufficient. A distributed Redis cluster is designated as a **PROPOSED** enhancement when multi-instance horizontal scaling is introduced.

---

## 25. Error Handling Architecture

The platform enforces a comprehensive, end-to-end error handling pipeline that guarantees clean failure isolation and human-readable feedback:

```mermaid
flowchart TB
    ClientReq["Client Request"]
    Backend["Backend Gateway / Service"]
    ServiceErr["Service or External Failure"]
    CentralMW["Centralized Error Middleware"]
    ClientErr["Client Error Adapter"]
    UserFeedback["Human-Friendly Diagnostic UI"]

    ClientReq --> Backend
    Backend -->|Exception Caught| ServiceErr
    ServiceErr --> CentralMW

    CentralMW -->|400 / 401 / 404 / 422 / 500 / 503| ClientErr
    CentralMW -->|Log Full Trace & Request ID| ServerLogs["Internal Structured Logger"]

    ClientErr --> UserFeedback
```

### HTTP Status Code Conventions

| Status Code | Meaning | Architectural Trigger |
|:---:|:---|:---|
| **200 OK** | Success | Successful read or idempotent update |
| **201 Created** | Resource Created | Successful registration, completed attempt logged |
| **400 Bad Request** | Malformed Payload | Missing mandatory fields, invalid syntax |
| **401 Unauthorized** | Missing / Invalid Token | Missing Authorization header, expired JWT |
| **403 Forbidden** | Insufficient Permissions | Accessing another user's private attempt data |
| **404 Not Found** | Resource Missing | Concept, level, or challenge ID does not exist |
| **409 Conflict** | State Conflict | Username or email already registered |
| **422 Unprocessable** | Domain Rule Failure | Submitting attempt for locked prerequisite concept |
| **429 Too Many Req** | Rate Limit Tripped | Exceeded AI generation or submission threshold |
| **500 Server Error** | Internal Fault | Unhandled exception, database connection drop |
| **502/503 Gateway** | External Dependency | Third-party LLM provider timeout or outage |

---

## 26. Security Architecture

CodeQuest enforces a defense-in-depth security posture across all layers:

1. **Secrets Isolation:** No API keys, database passwords, or JWT secrets exist in source code. All configuration is injected via server-side environment variables loaded by `dotenv`.
2. **Client Sandbox Isolation:** Untrusted student code runs strictly within isolated browser Web Workers. The worker environment has disabled DOM and network APIs, backed by a 1,000ms watchdog termination guard.
3. **Anti-Cheat Assessment Defense:** Client question retrieval explicitly strips out correct answer indices and validation assertions (`.select("-correctAnswer")`). Evaluation is performed exclusively on the backend server.
4. **AI Prompt Injection Defense:** User inputs interpolated into AI prompts are stripped of markdown overrides, system prompt impersonations, and control characters.
5. **Deterministic AI Verification:** Raw LLM completions are treated as untrusted input. Every response must pass a strict Zod schema validation before reaching the database or learner.
6. **Authentication & Password Hashing:** Passwords hashed with `bcryptjs` (10 rounds); routes protected by stateless JWT bearer tokens.
7. **Rate Limiting:** IP and user-based token bucket rate limiting on sensitive routes (authentication attempts, AI question generation).

---

## 27. Environment & Secrets

Environment variables are organized into functional categories with explicit boundary rules:

```text
# Server Infrastructure
PORT=5000
NODE_ENV=development | staging | production
CORS_ORIGIN=http://localhost:5173

# Authentication Secrets
JWT_SECRET=super_secret_cryptographic_key_minimum_32_chars
JWT_EXPIRES_IN=24h

# Database Connections
DATABASE_URL=postgresql://user:password@localhost:5432/codequest
MONGO_URI=mongodb://localhost:27017/codequest

# External AI Provider
AI_PROVIDER=gemini | openai
AI_API_KEY=server_side_private_api_key_never_committed
AI_MODEL_NAME=gemini-1.5-flash

# Caching (Proposed)
REDIS_URL=redis://localhost:6379
```

### Environment Progression
- **Development:** Local MongoDB/PostgreSQL instances, mock AI provider option, detailed debug logging.
- **Staging:** Remote staging cluster, real AI API rate-limited test keys, production-mirrored validation.
- **Production:** Strict CORS origin checking, SSL/TLS database connections, restricted API keys, error stack traces suppressed from HTTP responses.

---

## 28. Observability

Observability enables proactive health verification and viva auditability without over-engineering:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Structured Logging (Pino / Winston)                 │
│ Output: JSON format                                    │
│ Fields: timestamp, level, reqId, method, path, status, │
│         latencyMs, userId, errorMessage                │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Core Operational Metrics                            │
│ - API Latency (p50, p95, p99)                          │
│ - AI Generation Latency & Schema Validation Failure %  │
│ - Code Execution Timeout Count                         │
│ - Challenge Submission Pass/Fail Ratios                │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Health Check Endpoints                              │
│ - GET /health/live   -> 200 OK (Process responsive)    │
│ - GET /health/ready  -> 200 OK (DB connections active) │
└────────────────────────────────────────────────────────┘
```

---

## 29. Scalability

The platform is designed to scale horizontally across independent layers:

```mermaid
flowchart TB
    LB["Load Balancer / Reverse Proxy\n(Cloudflare / Nginx)"]

    subgraph AppCluster["Stateless API Cluster"]
        Node1["Node.js Instance 1"]
        Node2["Node.js Instance 2"]
        Node3["Node.js Instance N"]
    end

    subgraph DataCluster["Persistent Data Tier"]
        DBPrimary["PostgreSQL Primary (Writes)"]
        DBReplica["PostgreSQL Replica (Reads)"]
        MongoCluster["MongoDB Atlas Cluster"]
    end

    LB --> Node1
    LB --> Node2
    LB --> Node3

    Node1 --> DBPrimary
    Node2 --> DBPrimary
    Node3 --> DBPrimary

    Node1 -.-> DBReplica
    Node2 -.-> DBReplica
    Node3 -.-> DBReplica

    Node1 --> MongoCluster
    Node2 --> MongoCluster
    Node3 --> MongoCluster
```

### Scalability Strategy
1. **Stateless Gateway:** Express instances hold zero in-memory session state; any instance can serve any authenticated request.
2. **Read/Write Splitting:** Curriculum browsing queries can be offloaded to read replicas, while attempt logging routes to primary database instances.
3. **Identified Bottlenecks & Mitigations:**
   - *LLM Latency Spike (2-5s):* Mitigated by pre-generating practice questions in the background and maintaining a warm MongoDB cache.
   - *High Concurrency Submissions:* Mitigated by lightweight deterministic server-side grading algorithms ($<5\text{ms}$ CPU time per attempt).

---

## 30. Deployment Architecture

The deployment topology illustrates the progression from initial MVP hosting to scalable cloud infrastructure:

```mermaid
flowchart TB
    subgraph ClientHosting["Frontend Hosting (Vercel / Cloudflare Pages)"]
        SPA["React 19 Production Bundle\n(Static Assets / Web Workers)"]
    end

    subgraph CloudNetwork["API Hosting (PaaS / Cloud VM)"]
        Nginx["Reverse Proxy / SSL Termination"]
        ExpressApp["Node.js / Express API Gateway"]
    end

    subgraph ManagedData["Managed Database Services"]
        PostgresService["PostgreSQL Database (Managed)"]
        MongoAtlas["MongoDB Atlas Cluster"]
    end

    subgraph CloudAI["AI Cloud Provider"]
        AIAPI["LLM Provider API Gateway\n(Gemini / OpenAI)"]
    end

    User["Learner Browser"] -->|HTTPS / Port 443| SPA
    SPA -->|API Requests /api/*| Nginx
    Nginx --> ExpressApp

    ExpressApp -->|Relational Queries| PostgresService
    ExpressApp -->|Document Queries| MongoAtlas
    ExpressApp -->|HTTPS Outbound| AIAPI
```

### Hosting Environments
- **Current Development:** Local development workspace (`localhost:5173` frontend, `localhost:5000` backend).
- **Proposed Production:** React SPA deployed to edge CDN (Vercel/Cloudflare Pages); Node.js REST API deployed on containerized PaaS (Render/Fly.io/AWS ECS); MongoDB Atlas managed cluster; managed PostgreSQL.

---

## 31. Data Flow Diagrams

### Flow 1: Authentication & Session Initialization
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant UI as React Client
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as Database

    User->>UI: Enters credentials & clicks "Login"
    UI->>API: POST /api/auth/login { email, password }
    API->>Auth: Authenticate credentials
    Auth->>DB: Query user by email
    DB-->>Auth: User record (with password_hash)
    Auth->>Auth: bcrypt.compare(password, password_hash)
    alt Password Matches
        Auth->>Auth: Generate JWT (expires in 24h)
        Auth-->>UI: 200 OK { token, user: { id, username, xp, level } }
        UI->>UI: Store token in memory/state & redirect to Dashboard
    else Password Mismatch
        Auth-->>UI: 401 Unauthorized { message: "Invalid credentials" }
        UI->>User: Display error message
    end
```

### Flow 2: Loading a Challenge with Anti-Cheat Protection
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant UI as React Client
    participant API as API Gateway
    participant Challenge as Challenge Service
    participant DB as Database

    User->>UI: Clicks active challenge node
    UI->>API: GET /api/challenges/:id (Bearer token)
    API->>Challenge: Fetch challenge details
    Challenge->>DB: Query challenge document/record
    DB-->>Challenge: Challenge entity (including test assertions & answers)
    Challenge->>Challenge: Sanitize payload: strip correct answers & secret tests
    Challenge-->>UI: 200 OK { title, description, starterBlocks, constraints }
    UI->>UI: Render Visual Block Canvas with starter blocks
```

### Flow 3: Solving a Visual Block Challenge in Sandboxed Web Worker
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant UI as React Workspace
    participant CodeGen as AST Code Generator
    participant Worker as Sandboxed Web Worker
    participant API as API Gateway

    User->>UI: Drags & snaps logic blocks on canvas
    UI->>CodeGen: Block connection change event
    CodeGen->>CodeGen: Traverse AST & serialize target code
    CodeGen-->>UI: Update live code preview editor
    User->>UI: Clicks "Run Code"
    UI->>Worker: postMessage({ code, inputParams })
    Worker->>Worker: Execute in isolated scope (watchdog timer armed)
    alt Normal Execution (<1,000ms)
        Worker-->>UI: postMessage({ status: "success", logs, resultState })
        UI->>User: Animate visual avatar & show terminal output
    else Infinite Loop (>1,000ms)
        UI->>Worker: Watchdog trips -> worker.terminate()
        UI->>User: Display "Execution Timeout: Infinite Loop Detected"
    end
```

### Flow 4: AI Practice Question Generation & Schema Validation
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant UI as React Client
    participant API as API Gateway
    participant AI as AI Question Service
    participant LLM as External LLM API
    participant DB as MongoDB Question Bank

    User->>UI: Requests extra practice / fails concept twice
    UI->>API: POST /api/ai-questions/generate { conceptId }
    API->>AI: Build prompt with concept boundaries & whitelist
    AI->>LLM: Invocate LLM (system prompt, few-shots, schema, temp: 0.2)
    alt LLM Returns Valid Structured JSON
        LLM-->>AI: Raw JSON string
        AI->>AI: Zod schema validation & answer verification
        AI->>DB: Store validated question
        AI->>AI: Strip correct answer from response
        AI-->>UI: 200 OK { question, options, hint }
    else LLM Timeout or Invalid Schema
        AI->>DB: Query pre-seeded fallback question for conceptId
        DB-->>AI: Fallback question
        AI-->>UI: 200 OK { question, options, hint, fallback: true }
    end
    UI->>User: Display adaptive practice challenge
```

### Flow 5: Adaptive Difficulty Recalibration
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant API as API Gateway
    participant Grader as Grader Service
    participant Adaptive as Adaptive Difficulty Engine
    participant DB as Database

    User->>API: POST /api/attempts { challengeId, solution }
    API->>Grader: Evaluate submission against test suite
    Grader->>DB: Record attempt & fetch last 5 attempts for concept
    DB-->>Grader: Attempt history array
    Grader->>Adaptive: Recalculate mastery(attemptHistory)
    Adaptive->>Adaptive: Compute rolling accuracy & error patterns
    alt Accuracy >= 85% (Mastery)
        Adaptive->>Adaptive: Elevate Bloom's Stage (e.g., Construction -> Debugging)
        Adaptive->>DB: Mark concept as MASTERED & unlock next node
    else Accuracy < 60% (Struggling)
        Adaptive->>Adaptive: Lower Bloom's Stage (e.g., Construction -> Recognition)
        Adaptive->>Adaptive: Flag targeted hint remediation
    else Consistent (60% - 84%)
        Adaptive->>Adaptive: Maintain current stage
    end
    Adaptive-->>API: Adaptive status & recommended next challenge
    API-->>User: Result with updated mastery status
```

### Flow 6: Deterministic Progress & XP Award
```mermaid
sequenceDiagram
    autonumber
    actor User as Learner
    participant API as API Gateway
    participant Grader as Grader Service
    participant XP as Gamification Service
    participant DB as Database

    User->>API: POST /api/attempts { challengeId, code }
    API->>Grader: Run server-side assertion tests
    alt All Assertions Passed
        Grader->>XP: Calculate XP(challengeType, constraintBonuses)
        XP->>DB: Atomic Update: User XP += earnedXP, check level threshold
        DB-->>XP: Updated User { totalXp, currentLevel, levelUp: boolean }
        XP->>DB: Update daily streak if first submission today UTC
        XP-->>API: { passed: true, xpEarned: 35, levelUp: false, streak: 4 }
        API-->>User: 201 Created { passed: true, score: 100, xpEarned: 35 }
    else Assertions Failed
        Grader-->>API: { passed: false, failureReason: "Expected 5, got 3" }
        API-->>User: 200 OK { passed: false, diagnostic: "...", xpEarned: 0 }
    end
```

---

## 32. Architectural Trade-offs

| Architectural Decision | Chosen Strategy | Alternative Considered | Justification & Viva Defense |
|:---|:---|:---|:---|
| **Frontend Framework** | React 19 SPA (Vite) | Next.js SSR / Vanilla JS | CodeQuest is an interactive spatial application with stateful drag-and-drop canvases and Web Workers. SSR offers negligible benefit for an authenticated, private dashboard, while React's component hierarchy manages complex workspace state cleanly. |
| **API Architecture** | RESTful HTTP Gateway | GraphQL | REST provides standardized HTTP status codes, simple caching boundaries, predictable error handling, and zero client-driven query complexity. Perfect for auditable engineering requirements. |
| **Persistence Model** | Hybrid: Relational (PostgreSQL) + Document (MongoDB) | Single Database (PostgreSQL only or Mongo only) | Progress, users, and levels are strictly relational and benefit from ACID foreign-key integrity. AI questions are polymorphic and semi-structured. Separating them prevents schema pollution. |
| **Code Execution** | Sandboxed Browser Web Workers | Server-Side Docker / RCE | Executing untrusted student code on backend servers creates catastrophic security liabilities (RCE) and massive container orchestration overhead. Web Workers provide instant, zero-cost execution isolation for JavaScript. |
| **Difficulty Engine** | Deterministic Application Rules | Pure LLM Autonomous Control | Letting an LLM decide learner levels or XP awards leads to unpredictable progression, hallucinated unlocks, and cheating. The application owns all pedagogical rules; the LLM merely fills in question text. |
| **AI Fallback** | Pre-Seeded Static Question Bank | Blocking Error / Retry Loop | If third-party AI APIs experience rate limits, outages, or high latency, learners must never be blocked. Pre-seeded questions ensure 100% operational uptime. |

---

## 33. Architectural Risks

| Risk ID | Risk Description | Severity | Impact | Architectural Mitigation |
|:---:|:---|:---:|:---|:---|
| **RSK-01** | **LLM Hallucinations / Invalid Code** | High | Confusing or mathematically impossible questions presented to beginner. | Low temperature (0.2); strict Zod schema validation; answer verification; fallback to verified seed questions. |
| **RSK-02** | **Prompt Injection / Jailbreak** | High | User injects instructions to alter AI behavior or bypass curriculum. | Server-side prompt construction; strict sanitization of user strings; system prompt framing with zero execution tools. |
| **RSK-03** | **Uncontrolled AI API Costs** | Medium | Excessive API billing from frequent practice requests. | Rate limiting per user; caching synthesized questions in MongoDB for reuse across learners at matching stages. |
| **RSK-04** | **AI Inference Latency (3-8s)** | Medium | Frustrated user waiting for next challenge. | Pre-generate practice challenges in background or serve immediate pre-seeded questions while async generation runs. |
| **RSK-05** | **Client-Side Infinite Loops** | High | Browser tab freezes when user writes `while(true)`. | Isolated Web Worker execution with a hard 1,000ms watchdog termination guard (`worker.terminate()`). |
| **RSK-06** | **Assessment Answer Leakage** | High | Cheating via browser DevTools network tab inspection. | Server explicitly strips `.select("-correctAnswer")` from question payloads; answers evaluated strictly on server. |
| **RSK-07** | **Progress Inconsistency / Duplicate XP** | High | User exploits network replay to farm infinite XP. | Server-side idempotency checks on challenge attempts; completed challenges do not re-award base XP. |
| **RSK-08** | **Database Concurrency on Milestones** | Medium | Race conditions when updating XP, streaks, and milestones. | Atomic increment operators (`$inc` in Mongo / `UPDATE ... SET xp = xp + $1` in PostgreSQL). |
| **RSK-09** | **Third-Party AI Outages** | High | System failure when OpenAI/Gemini is down. | Automatic failover to local MongoDB pre-seeded questions; zero user-facing application crashes. |
| **RSK-10** | **Difficulty Miscalibration** | Medium | User stuck on overly difficult challenge. | Socratic AI hint triggers after 2 consecutive failures; automatic difficulty down-stepping after 3 failures. |
| **RSK-11** | **Over-Engineered Tech Stack** | Low | Premature complexity confusing viva assessors. | Explicit separation between MVP implementation and future proposed roadmap; justifiable choices only. |

---

## 34. Project Score Alignment

CodeQuest directly demonstrates all mandatory engineering concepts required for technical viva assessments:

| Concept # | Mandatory Viva Concept | Architectural Area | Architectural Status | Concrete Architectural Role in CodeQuest |
|:---:|:---|:---|:---:|:---|
| **1** | **React Component Composition** | Frontend | 🚧 Planned (MVP) | Modular UI hierarchy: `GlobalHUD`, `RoadmapCanvas`, `BlockWorkspace`, `CodePreview`, `TerminalDock`. |
| **2** | **State Management (useState)** | Frontend | 🚧 Planned (MVP) | Local interactive state: active block AST, editor theme, modal dialog visibility, terminal log buffer. |
| **3** | **Side Effects (useEffect)** | Frontend | 🚧 Planned (MVP) | Synchronizing block AST changes with code generator; attaching Web Worker message listeners; cleanup on unmount. |
| **4** | **Async Data Fetching** | Frontend / API | 🚧 Planned (MVP) | Decoupled HTTP client using Axios/Fetch with JWT authorization headers and standard error adapters. |
| **5** | **Client-Side Routing** | Frontend | 🚧 Planned (MVP) | Declarative client routing between `/dashboard`, `/challenge/:id`, `/profile` with route authorization guards. |
| **6** | **Problem Modeling** | Domain Design | 🚧 Planned (MVP) | Discrete domain models: Users, Learning Paths, Levels, Concepts, Challenges, Attempts, Achievements. |
| **7** | **System Design** | Overall Architecture| 🚧 Planned (MVP) | Decoupled multi-tier client-server architecture with REST gateway, sandboxed workers, and isolated AI service. |
| **8** | **RESTful Endpoint Design** | Backend API | 🚧 Planned (MVP) | Resource-oriented semantic endpoints (`GET /api/learning`, `POST /api/attempts`) with standardized JSON envelopes. |
| **9** | **HTTP Status Codes** | Backend API | 🚧 Planned (MVP) | Standardized status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `503 Unavailable`). |
| **10** | **Server Error Handling** | Backend Core | 🚧 Planned (MVP) | Centralized Express error-handling middleware intercepting domain exceptions and sanitizing client outputs. |
| **11** | **Express Middleware** | Backend Core | 🚧 Planned (MVP) | Custom middleware pipeline: `cors`, `helmet`, `authMiddleware` (JWT verification), `validationMiddleware` (Zod). |
| **12** | **MongoDB Schema Modeling** | Data Layer | 🚧 Planned (MVP) | Mongoose schemas with strict types, field validations, timestamps, and indexes for AI questions and logs. |
| **13** | **MongoDB CRUD Operations** | Data Layer | 🚧 Planned (MVP) | Data access layer utilizing `create()`, `find()`, `findById()`, `updateOne()`, and `.select("-correctAnswer")`. |
| **14** | **PostgreSQL Relational Schema** | Data Layer | 🔮 Proposed (Phase 4)| Normalized SQL tables with Primary/Foreign keys, unique constraints, and referential cascades for social graphs. |
| **15** | **SQL JOINs** | Data Layer | 🔮 Proposed (Phase 4)| Relational queries (`INNER JOIN`, `LEFT JOIN`) aggregating user progress across concepts and guild leaderboards. |
| **16** | **LLM API Integration** | AI Subsystem | 🚧 Planned (Phase 2)| Backend service communicating with external LLM API via secure server-side SDKs. |
| **17** | **Prompt Engineering** | AI Subsystem | 🚧 Planned (Phase 2)| Structured prompt pipelines enforcing role definitions, Bloom's cognitive tiers, and concept whitelists. |
| **18** | **Structured Outputs** | AI Subsystem | 🚧 Planned (Phase 2)| Constrained JSON generation validated by Zod schemas to guarantee parseable, type-safe question objects. |
| **19** | **Git Workflow** | Engineering | ✅ Implemented | Multi-branch workflow (`main`, `develop`, `docs/*`, `feature/*`), Conventional Commits, Pull Request audits. |
| **20** | **Secrets Management** | Security | 🚧 Planned (MVP) | Zero hardcoded secrets; configuration injected via `.env` files and parsed via `dotenv`. |
| **21** | **Event Loop** | JavaScript Runtime | 🚧 Planned (MVP) | Non-blocking asynchronous I/O delegating database queries and network calls to the libuv worker thread pool. |
| **22** | **Promises vs Callbacks** | JavaScript Runtime | 🚧 Planned (MVP) | Modern Promise-based asynchronous architecture eliminating legacy callback hell and unhandled rejections. |
| **23** | **async / await** | JavaScript Runtime | 🚧 Planned (MVP) | Linear, readable asynchronous control flow across backend controllers, service methods, and test suites. |
| **24** | **Closures** | JavaScript Runtime | 🚧 Planned (MVP) | Lexical closures utilized in middleware factories, debounce handlers, and custom React hook state encapsulation. |
| **25** | **Hoisting & Scoping** | JavaScript Runtime | 🚧 Planned (MVP) | Strict adherence to block scoping (`const`/`let`) enforcing the Temporal Dead Zone; clean function declarations. |

---

## 35. HLD vs LLD Boundary

To maintain rigorous architectural discipline, this High-Level Design document establishes system boundaries while delegating implementation specifics to the Low-Level Design (LLD):

```text
┌────────────────────────────────────────────────────────┐
│ HIGH-LEVEL DESIGN (HLD) — THIS DOCUMENT                │
│ - System architecture & component topology             │
│ - Communication protocols & REST domain groupings      │
│ - Architectural principles & security boundaries       │
│ - Data persistence rationale (Relational vs Document)  │
│ - Code execution safety model (Web Worker isolation)   │
│ - Adaptive learning & AI guardrail pipeline            │
│ - Deployment topology & scalability strategy           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ LOW-LEVEL DESIGN (LLD) — DEFERRED TO NEXT PHASE        │
│ - Exact React component props, interfaces & JSX trees  │
│ - Exact Express route handlers & controller function   │
│   signatures (req, res, next)                          │
│ - Exact Mongoose schemas, SQL DDL migrations & indexes │
│ - Exact Zod validation schemas & regex patterns        │
│ - Exact prompt strings, system templates & few-shots   │
│ - Exact Web Worker postMessage contract payloads       │
│ - Concrete test cases, unit assertions & mock fixtures │
└────────────────────────────────────────────────────────┘
```

---

## 36. Future Architecture

The CodeQuest architecture is engineered for seamless post-MVP expansion:

1. **Phase 2 — Adaptive AI Integration:** Deployment of the server-side LLM prompt pipeline, Bloom's taxonomy difficulty calibrator, and automated mistake remediation engine.
2. **Phase 3 — Multi-Language In-Browser Execution:** Integration of WebAssembly (Pyodide) to support sandboxed client-side Python execution with identical zero-server RCE guarantees.
3. **Phase 4 — Social & Relational Systems (PostgreSQL):** Migration of structured progress and introduction of developer Guilds, collaborative team quests, and weekly competitive leaderboards utilizing PostgreSQL relational JOINs.
4. **Phase 5 — Advanced Coding Arena:** Full-screen IDE mode with Monaco editor integration, multi-file project workspaces, and automated Git-based portfolio synchronization.
