# Low-Level Design — CodeQuest

---

## 1. Document Overview

### 1.1 Purpose
The purpose of this Low-Level Design (LLD) document is to provide a complete, technically rigorous, and directly implementable engineering specification for the **CodeQuest** platform. While the Product Requirements Document ([`docs/PRD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/PRD.md)) defines educational objectives and user stories, and the High-Level Design ([`docs/HLD.md`](file:///c:/Users/tanus/OneDrive/Desktop/CodeVerse/docs/HLD.md)) establishes subsystem topology and security boundaries, this LLD provides the concrete implementation blueprints: component trees, state atoms, props interfaces, Express controller/service logic, Mongoose and PostgreSQL relational schemas, Zod validation schemas, exact prompt engineering templates, sequence diagrams, and failure recovery protocols.

### 1.2 Scope
This document covers the microscopic implementation details of:
1. **Frontend Tier (React 19 + Vite):** Component composition, local and lifted state, custom hooks, Web Worker sandbox runner, and live syntax emitter.
2. **Backend Application Gateway (Node.js + Express 5):** Layered modular monolith (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Repositories/Models), request validation, centralized error handling, and middleware pipelines.
3. **Dual Persistence Layer:**
   - **MongoDB (Mongoose v9):** Document modeling, compound indexing, anti-cheat query projections, and atomic operators for curriculum, quiz attempts, and AI question storage.
   - **PostgreSQL 16:** Normalized relational DDL, foreign key cascading, check constraints, and multi-table SQL JOIN queries designed for social systems and relational analytics.
4. **Visual Block Engine & Sandboxed Code Execution:** Abstract Syntax Tree (AST) serialization, magnetic socket typing, and isolated browser Web Worker execution with watchdog timeout guards.
5. **AI Subsystem & Deterministic Adaptive Difficulty:** Backend-isolated LLM prompt pipelines, Bloom's taxonomy cognitive staircases, strict JSON schema validation, and fail-safe seed question fallbacks.
6. **Academic & Engineering Viva Defense:** Explicit alignment to all 25 mandatory Project Score competencies, including JavaScript runtime internals (event loop, closures, hoisting, promises).

### 1.3 Intended Audience
- **Software Engineers & Implementers:** Full-stack developers building the platform components directly from these specifications without guessing interfaces.
- **Technical Viva Assessors & Evaluators:** Academic and industry examiners reviewing system design, architectural trade-offs, security postures, and code craftsmanship.
- **Code Reviewers & Auditors:** Reviewers verifying compliance with PRD specifications, security standards, and Git development workflows.

### 1.4 Relationship to PRD and HLD
The engineering trail of CodeQuest adheres to a strict hierarchical dependency:

$$\mathbf{PRD} \text{ (What \& Why)} \longrightarrow \mathbf{HLD} \text{ (High-Level System Architecture)} \longrightarrow \mathbf{LLD} \text{ (Detailed Implementation Design)}$$

| Dimension | Product Requirements Document (PRD) | High-Level Design (HLD) | Low-Level Design (LLD) |
|:---|:---|:---|:---|
| **Primary Question** | What problem are we solving and for whom? | What are the system boundaries, components, and data stores? | Exactly how does each function, component, schema, and API execute? |
| **Granularity** | Pedagogical tiers, user personas, non-goals, UX themes. | Decoupled client-server tiers, service groupings, polyglot storage rationale. | Class/interface signatures, Zod schemas, Mongoose DDL, SQL queries, regex patterns, worker contracts. |
| **State & Data** | High-level entities (Users, Levels, Concepts, XP). | Entity-Relationship diagrams and document collections. | Precise field types, indexes, unique constraints, foreign key cascades, nullability, atomic `$inc` updates. |
| **Execution Safety** | "No server-side RCE vulnerabilities." | "Web Worker isolation with 1,000ms watchdog." | Exact `postMessage` protocol, shadowed global environment, terminate triggers, memory cleanup. |
| **AI Integration** | "AI generates questions within curriculum boundaries." | Pipeline diagram (Prompt $\rightarrow$ LLM $\rightarrow$ Validator $\rightarrow$ DB). | Concrete system prompt templates, few-shot payloads, JSON schemas, temperature settings, retry algorithms. |

### 1.5 Implementation Status
- **Version Control:** Repository initialized on Git with established branching topology (`main`, `develop`, `docs/architecture-docs`).
- **Documentation Baseline:** `docs/PRD.md` (v1.0.0), `docs/HLD.md` (v1.0.0), and `docs/LLD.md` (v1.0.0).
- **Codebase Baseline:** Application source code (`frontend/` and `backend/`) is currently in the **Planned (MVP)** stage. Architectural prototypes, folder hierarchies, package configurations, and domain entities are specified in `README.md` and this LLD.

### 1.6 Architectural Assumptions
1. **Repository Reality vs. Implementation Scope:** The repository currently establishes the architectural baseline through version-controlled documentation. In accordance with engineering integrity principles, source code is explicitly documented as **Planned (MVP)** rather than artificially claimed as existing.
2. **Polyglot Persistence Allocation:** MongoDB serves as the primary document persistence engine for the MVP (handling users, curriculum topics, question banks, and quiz attempts). PostgreSQL relational tables and SQL JOIN queries are formally architected for Phase 4 social systems (Guilds, Guild Quests, relational leaderboards).
3. **Client-Side Execution Safety Invariant:** Untrusted learner code is executed strictly within isolated browser Web Workers backed by a 1,000ms watchdog timer. Untrusted code is never executed directly inside the Node.js API process.
4. **Application Authority over AI:** The Large Language Model (LLM) is strictly a pedagogical content generator. It has zero authority over user levels, XP awards, database writes, or curriculum unlocks. The application-level Adaptive Difficulty Engine deterministically calculates constraints before the LLM is invoked.

---

## 2. Implementation Status

| Feature / Subsystem | Status | Evidence / Location | Notes |
|:---|:---:|:---|:---|
| **Git Workflow & Branching Strategy** | `Implemented` | `.git`, branches `main`, `develop`, `docs/*` | Git flow enforcing Conventional Commits and branch isolation. |
| **Product Requirements Document (PRD)** | `Implemented` | `docs/PRD.md` (v1.0.0) | Complete problem analysis, Bloom's tiers, and non-goals. |
| **High-Level Design (HLD)** | `Implemented` | `docs/HLD.md` (v1.0.0) | Macro architecture, system context, and polyglot rationale. |
| **Low-Level Design (LLD)** | `Implemented` | `docs/LLD.md` (This document) | Implementation blueprints, schemas, interfaces, and algorithms. |
| **Frontend Shell & Tooling (Vite + React 19)** | `Planned (MVP)` | `frontend/package.json`, `src/App.jsx` | SPA architecture with Vite HMR and modern React 19 root mounting. |
| **Dark Futuristic Cyber HUD** | `Planned (MVP)` | `frontend/src/components/layout/DashboardHUD.jsx` | Tactical status bar displaying Level, XP meter, Streak, and User Avatar. |
| **Curriculum Roadmap Canvas** | `Planned (MVP)` | `frontend/src/components/roadmap/RoadmapCanvas.jsx` | Interactive node path rendering locked, active, and completed concepts. |
| **Visual Block Workspace (AST Engine)** | `Planned (MVP)` | `frontend/src/components/workspace/BlockWorkspace.jsx` | Snap-together geometry with type sockets generating Abstract Syntax Trees. |
| **Real-Time Dual-View Syntax Preview** | `Planned (MVP)` | `frontend/src/components/workspace/CodePreview.jsx` | Synchronized code panel emitting JavaScript code matching visual block state. |
| **Browser Web Worker Execution Sandbox** | `Planned (MVP)` | `frontend/src/workers/codeRunner.worker.js` | Sandboxed client runtime with shadowed globals and 1,000ms watchdog guard. |
| **Express REST API Gateway** | `Planned (MVP)` | `backend/src/app.js`, `backend/src/server.js` | Express 5 server mounting CORS, JSON parsers, and modular route routers. |
| **JWT Stateless Authentication** | `Planned (MVP)` | `backend/src/routes/auth.routes.js` | Registration with bcryptjs (salt=10), login issuing 24h signed JWTs. |
| **Authentication Middleware** | `Planned (MVP)` | `backend/src/middleware/authMiddleware.js` | Intercepts HTTP `Authorization: Bearer <token>`, decodes claims into `req.user`. |
| **Request Validation Middleware** | `Planned (MVP)` | `backend/src/middleware/validationMiddleware.js` | Schema validation interceptor using Zod/Mongoose ObjectId checks. |
| **Centralized Error Handling Middleware** | `Planned (MVP)` | `backend/src/middleware/errorHandler.js` | Catches application exceptions, transforms into standardized JSON envelopes. |
| **MongoDB Curriculum & Question Models** | `Planned (MVP)` | `backend/src/models/Topic.js`, `Question.js` | Mongoose schemas with enums, required validation, and ref relationships. |
| **Quiz Execution & Submission Engine** | `Planned (MVP)` | `backend/src/controllers/quiz.controller.js` | Server-side evaluation; `.select("-correctAnswer")` anti-cheat projection. |
| **Deterministic XP & Leveling Engine** | `Planned (MVP)` | `backend/src/services/gamificationService.js` | XP calculation formula $100 \times N^{1.5}$; streak updating on UTC activity. |
| **Adaptive Difficulty Engine** | `Planned (Phase 2)` | `backend/src/services/adaptiveEngine.js` | Deterministic Bloom's taxonomy staircase calibrated on 3-attempt accuracy. |
| **AI LLM Question Generation Service** | `Planned (Phase 2)` | `backend/src/services/aiQuestionService.js` | Low-temperature (0.2) LLM prompt synthesis with Zod structured output checks. |
| **Pre-Seeded Question Fallback Bank** | `Planned (Phase 2)` | `backend/src/services/fallbackQuestionBank.js` | Fail-safe question repository served when external LLM requests fail or timeout. |
| **PostgreSQL Relational Schema (Guilds/JOINs)** | `Planned (Phase 4)` | `database/migrations/001_relational_schema.sql` | Relational tables for Guilds and social graphs demonstrating multi-table SQL JOINs. |
| **Distributed Redis Cache** | `Future` | `backend/src/config/redis.js` | In-memory caching for curriculum hierarchies and rate-limiting counters. |

---

## 3. Technology Stack

| Technology | Purpose | Location | Status | Reason |
|:---|:---|:---|:---:|:---|
| **React 19** | Component-Driven Single Page Interface | `frontend/src/` | `Planned (MVP)` | Declarative UI updates, Virtual DOM reconciliation, stateful canvas composition. |
| **Vite 8** | Frontend Tooling & Development Server | `frontend/vite.config.js` | `Planned (MVP)` | Native ES module HMR, lightning-fast dev builds, Rollup production optimization. |
| **Vanilla CSS3** | Cyber Design System & Tokens | `frontend/src/index.css` | `Planned (MVP)` | Full control over custom properties, GPU micro-animations, zero library bloat. |
| **React Router v7** | Client-Side Declarative Routing | `frontend/src/routes/` | `Planned (MVP)` | Client routing with nested layouts, route guards, dynamic parameters. |
| **Web Worker API** | Untrusted Client Code Execution | `frontend/src/workers/` | `Planned (MVP)` | Native browser multi-threading providing complete execution isolation from DOM. |
| **Node.js 18+** | Backend Runtime Environment | Backend runtime | `Planned (MVP)` | Single-threaded asynchronous event loop powered by libuv for high-concurrency I/O. |
| **Express 5** | RESTful HTTP Gateway Framework | `backend/src/app.js` | `Planned (MVP)` | Lightweight routing, robust middleware pipeline, native Promise error handling. |
| **MongoDB 7 / Mongoose 9** | Primary Application Document Store | `backend/src/models/` | `Planned (MVP)` | Schema-enforced document storage ideal for polymorphic questions & dynamic attempts. |
| **PostgreSQL 16** | Relational Persistence (Social/Analytics)| `database/migrations/` | `Planned (Phase 4)` | Strict ACID guarantees, foreign key cascades, multi-table SQL JOIN queries. |
| **Zod 3.23** | Static & Runtime Schema Validation | `backend/src/validators/` | `Planned (MVP)` | TypeScript-first schema declaration and payload validation at API boundaries. |
| **jsonwebtoken (JWT)** | Stateless Session Authentication | `backend/src/middleware/` | `Planned (MVP)` | Cryptographically signed bearer tokens enabling stateless horizontal auto-scaling. |
| **bcryptjs 3.0** | Cryptographic Password Hashing | `backend/src/routes/auth.routes.js` | `Planned (MVP)` | Adaptive salted password hashing (10 salt rounds) resistant to rainbow tables. |
| **Google Gemini 1.5 Flash** | Adaptive Question Generation | `backend/src/services/aiService.js` | `Planned (Phase 2)` | High-speed, cost-efficient inference supporting native structured JSON output. |
| **Git & GitHub** | Source Version Control & Audit Trail | Entire repository | `Implemented` | Enforces branch isolation (`main`, `develop`, `docs/*`) and Conventional Commits. |

---

## 4. Repository Structure

```text
CodeQuest/
├── README.md                              # System architecture overview & viva documentation
├── docs/                                  # Architectural specifications
│   ├── PRD.md                             # Product Requirements Document
│   ├── HLD.md                             # High-Level Design
│   └── LLD.md                             # Low-Level Design (This document)
├── database/                              # Relational migration scripts
│   └── migrations/
│       └── 001_relational_schema.sql      # PostgreSQL 16 relational DDL & indexes
├── frontend/                              # Client Tier (React 19 + Vite 8 SPA)
│   ├── index.html                         # HTML5 shell with cyber fonts & viewport tags
│   ├── package.json                       # Frontend dependencies & build scripts
│   ├── vite.config.js                     # Vite HMR configuration & path aliases
│   └── src/
│       ├── main.jsx                       # React 19 root mounting
│       ├── App.jsx                        # Application root wrapping AuthProvider & Router
│       ├── index.css                      # Global cyber design system tokens & reset
│       ├── api/                           # Decoupled HTTP client
│       │   ├── apiClient.js               # Fetch/Axios client with JWT interceptors
│       │   └── endpoints.js               # Centralized REST URI constants
│       ├── components/                    # Modular component hierarchy
│       │   ├── common/                    # Reusable presentation primitives
│       │   │   ├── CyberButton.jsx        # Styled button with glow & variant states
│       │   │   ├── MetricCard.jsx         # Tactical telemetry card
│       │   │   ├── LoadingSkeleton.jsx    # Accessible cyber shimmer loader
│       │   │   └── ErrorAlert.jsx         # Actionable error alert panel
│       │   ├── layout/                    # Layout shells
│       │   │   ├── MainLayout.jsx         # Navigation shell with persistent HUD
│       │   │   └── DashboardHUD.jsx       # Tactical HUD (Level, XP, Streak, Avatar)
│       │   ├── roadmap/                   # Curriculum navigation
│       │   │   ├── RoadmapCanvas.jsx      # Interactive level roadmap
│       │   │   └── ConceptNode.jsx        # Discrete interactive concept node
│       │   └── workspace/                 # Challenge feature workspace
│       │       ├── MissionBrief.jsx       # Pedagogical brief, constraints & hints
│       │       ├── BlockWorkspace.jsx     # Visual block drag-and-drop canvas
│       │       ├── CodePreview.jsx        # Synchronized JavaScript code preview
│       │       └── TerminalDock.jsx       # Sandboxed terminal output dock
│       ├── context/                       # React context providers
│       │   └── AuthContext.jsx            # User session & token state
│       ├── hooks/                         # Custom React hooks
│       │   ├── useAuth.js                 # Authentication hook consuming AuthContext
│       │   ├── useCodeRunner.js           # Web Worker lifecycle & watchdog manager
│       │   └── useAsyncData.js            # Standardized 3-state data fetching hook
│       ├── pages/                         # Route targets
│       │   ├── DashboardPage.jsx          # Primary learner command deck
│       │   ├── ChallengePage.jsx          # Interactive challenge workspace page
│       │   ├── PracticePage.jsx           # AI adaptive practice question page
│       │   ├── LoginPage.jsx              # User login authentication page
│       │   ├── RegisterPage.jsx           # User registration page
│       │   └── NotFoundPage.jsx           # 404 tactical error page
│       ├── routes/                        # Declarative routing
│       │   ├── AppRoutes.jsx              # React Router v7 route definitions
│       │   └── ProtectedRoute.jsx         # Navigation guard redirecting unauthenticated users
│       └── workers/                       # Isolated client sandboxes
│           └── codeRunner.worker.js       # Web Worker running student JavaScript
└── backend/                               # Application Gateway (Node.js + Express 5)
    ├── package.json                       # Backend dependencies & scripts
    ├── .env.example                       # Documented environment variable template
    └── src/
        ├── app.js                         # Express 5 app setup with middleware stack
        ├── server.js                      # HTTP server listener & graceful shutdown
        ├── config/                        # Infrastructure configuration
        │   ├── database.js                # Mongoose connection & reconnect handlers
        │   └── postgres.js                # node-postgres (pg) connection pool
        ├── constants/                     # Centralized domain constants
        │   ├── httpStatusCodes.js         # Standard HTTP status code mappings
        │   └── errorCodes.js              # Standardized application error codes
        ├── controllers/                   # Transport adapters
        │   ├── auth.controller.js         # User registration & login handlers
        │   ├── topic.controller.js        # Curriculum hierarchy queries
        │   ├── quiz.controller.js         # Quiz questions delivery & submission grading
        │   └── aiQuestion.controller.js   # Adaptive question synthesis trigger
        ├── middleware/                    # Cross-cutting HTTP middleware
        │   ├── authMiddleware.js          # JWT Bearer token verification
        │   ├── validationMiddleware.js    # Zod schema validation interceptor
        │   ├── rateLimiter.js             # Express-rate-limit token bucket rules
        │   └── errorHandler.js            # Centralized exception formatter
        ├── models/                        # Mongoose schemas & models
        │   ├── User.js                    # User identity & gamification totals
        │   ├── Topic.js                   # Curriculum realms & concepts
        │   ├── Question.js                # Polymorphic challenge questions
        │   ├── QuizAttempt.js             # Immutable submission records
        │   └── AIQuestion.js              # Cached AI synthesized questions
        ├── services/                      # Pure domain business logic
        │   ├── authService.js             # Credential hashing & token issuance
        │   ├── gradingService.js          # Deterministic test assertions & grading
        │   ├── gamificationService.js     # XP formulas, level tiers, UTC streaks
        │   ├── adaptiveEngine.js          # Bloom's cognitive staircase calibrator
        │   ├── aiQuestionService.js       # Prompt synthesis, LLM client, schema checks
        │   └── fallbackQuestionBank.js    # Pre-seeded static question repository
        └── validators/                    # Zod payload validation schemas
            ├── auth.validator.js          # Registration & login schemas
            ├── quiz.validator.js          # Submission payload schemas
            └── aiQuestion.validator.js    # AI response structured output schema
```

---

## 5. Frontend Low-Level Design

### 5.1 Component Specifications

#### `DashboardHUD.jsx`
- **Responsibility:** Persistent top status bar displaying user credentials, current developer rank title, horizontal XP meter, daily streak counter, and logout trigger.
- **Props:** `{ user: UserProfile, onLogout: () => void }`
- **State:** `showProfileDropdown` (boolean, local)
- **Events:** `onClick` on avatar toggles dropdown; `onClick` on logout dispatches logout action.
- **Dependencies:** `XPMeter.jsx`, `CyberButton.jsx`, `AuthContext`.
- **API Interactions:** None directly (receives user profile from parent `MainLayout`).

#### `RoadmapCanvas.jsx`
- **Responsibility:** Interactive curriculum visualizer rendering sequential levels and concept nodes. Visually distinguishes between Mastered (green), Active (cyan), and Locked (slate) states.
- **Props:** `{ topics: Topic[], activeTopicId: string, onSelectTopic: (id: string) => void }`
- **State:** `hoveredNodeId` (string | null, local)
- **Events:** `onClick` on unlocked node triggers navigation to `/challenge/:id`.
- **Dependencies:** `ConceptNode.jsx`, `MetricCard.jsx`.
- **API Interactions:** Consumes topic hierarchy data fetched by `DashboardPage.jsx`.

#### `BlockWorkspace.jsx`
- **Responsibility:** Renders the drag-and-drop visual programming canvas, manages block palette categories, enforces geometric type sockets, and serializes block connections into an Abstract Syntax Tree (AST).
- **Props:** `{ initialBlocks?: BlockDefinition[], onChange: (ast: BlockAST, code: string) => void }`
- **State:** `activeCategory` (string, local), `workspaceDirty` (boolean, local)
- **Events:** `onBlockSnap`, `onBlockMove`, `onBlockDelete` trigger AST re-serialization.
- **Dependencies:** Custom SVG Canvas or Blockly integration.
- **API Interactions:** None directly.

#### `CodePreview.jsx`
- **Responsibility:** Real-time dual-view panel displaying syntax-highlighted JavaScript corresponding to the visual blocks assembled in `BlockWorkspace.jsx`.
- **Props:** `{ code: string, targetLanguage: 'javascript' | 'python', activeBlockId?: string }`
- **State:** `copiedToClipboard` (boolean, local)
- **Events:** `onClick` on copy button copies code to clipboard with visual feedback.
- **Dependencies:** Syntax highlighters (Prism / Monaco view).
- **API Interactions:** None.

#### `TerminalDock.jsx`
- **Responsibility:** Terminal-inspired output dock capturing and rendering execution stdout, stderr, execution duration, and assertion results.
- **Props:** `{ logs: ExecutionLog[], isExecuting: boolean, onClear: () => void }`
- **State:** `autoScroll` (boolean, local)
- **Events:** `onClick` on clear clears buffer; scroll listener toggles `autoScroll`.
- **Dependencies:** Monospace font styling, ANSI log parser.
- **API Interactions:** None.

---

## 6. React Component Composition

CodeQuest enforces a strict **unidirectional data flow** architecture separating presentation components from stateful feature modules:

```text
MainLayout (Owns Layout Shell)
  └── DashboardHUD (Receives user prop from AuthContext)
  └── <Outlet />
        ├── DashboardPage (Fetches topics & user progress)
        │     └── MetricSummaryGrid (Presentation)
        │     └── RoadmapCanvas (Passes topics & selection callback)
        │           └── ConceptNode (Pure presentation node)
        └── ChallengePage (Fetches challenge spec & manages attempt state)
              ├── MissionBrief (Presents requirements & hints)
              ├── BlockWorkspace (Owns block canvas & serializes AST)
              ├── CodePreview (Displays live generated code from AST)
              └── TerminalDock (Renders logs from useCodeRunner hook)
```

- **State Ownership:** `ChallengePage` owns the submitted solution state and attempt lifecycle.
- **Props Contracts:** Child presentation components (`ConceptNode`, `CodePreview`, `TerminalDock`) are pure functional components receiving data via props and emitting user actions via callbacks.

---

## 7. React State Design

### State Classification & Ownership
1. **Local State (`useState`):**
   - Workspace palette collapse: owned by `BlockWorkspace.jsx`.
   - Selected choice in MCQs: owned by `QuizPanel.jsx`.
   - Terminal log buffer: owned by `TerminalDock.jsx`.
2. **Lifted Feature State:**
   - Generated code string: lifted to `ChallengePage.jsx` to synchronize between `BlockWorkspace.jsx` and `CodePreview.jsx`.
3. **Global Shared State (React Context):**
   - User identity, total XP, level, and JWT token: owned by `AuthContext.jsx`.
4. **Server Remote State:**
   - Curriculum taxonomy, challenge definitions, and attempt histories: fetched via `apiClient.js` with structured loading/success/error states.

---

## 8. useEffect and Side Effects

### Concrete Hook Usage Patterns
1. **Canvas Initialization & Teardown:**
   ```javascript
   useEffect(() => {
     const workspace = initializeBlockCanvas(containerRef.current);
     workspace.addChangeListener(handleWorkspaceChange);
     return () => {
       workspace.dispose(); // Cleanup prevents memory leaks
     };
   }, [challengeId]);
   ```
2. **Web Worker Sandbox Lifecycle:**
   ```javascript
   useEffect(() => {
     const worker = new Worker(new URL('../workers/codeRunner.worker.js', import.meta.url), { type: 'module' });
     workerRef.current = worker;
     worker.onmessage = handleWorkerMessage;
     return () => {
       worker.terminate(); // Watchdog cleanup on unmount
     };
   }, []);
   ```
3. **Data Fetching with AbortController (Race Condition Prevention):**
   ```javascript
   useEffect(() => {
     const controller = new AbortController();
     fetchChallengeData(challengeId, { signal: controller.signal });
     return () => controller.abort(); // Cancels inflight requests on fast navigation
   }, [challengeId]);
   ```

---

## 9. Client-Side Routing

| Route | Component | Access | Purpose |
|:---|:---|:---:|:---|
| `/` | `Navigate to /dashboard` | Public | Root redirect to main learner deck. |
| `/login` | `LoginPage.jsx` | Public (Guest only) | User authentication entry point. |
| `/register` | `RegisterPage.jsx` | Public (Guest only) | New learner account registration. |
| `/dashboard` | `DashboardPage.jsx` | Protected (Bearer) | Command center: tactical HUD & roadmap canvas. |
| `/challenge/:id` | `ChallengePage.jsx` | Protected (Bearer) | Interactive visual challenge workspace. |
| `/practice/:topicId`| `PracticePage.jsx` | Protected (Bearer) | Dynamic AI-assisted adaptive practice arena. |
| `/404` | `NotFoundPage.jsx` | Public | Cyber-themed missing resource error page. |
| `*` | `Navigate to /404` | Public | Catch-all redirect for unmatched routes. |

---

## 10. API Client Design

The frontend communicates with the backend via a decoupled HTTP client (`apiClient.js`):
- **Base URL:** Sourced from `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'`.
- **Request Interceptor:** Automatically extracts JWT token from `localStorage` or memory and injects `Authorization: Bearer <token>` into outgoing request headers.
- **Response Interceptor:** Unwraps standardized `{ success, data, error }` envelopes; transparently detects `401 Unauthorized` responses to clear invalid tokens and redirect to `/login`.
- **Timeout & Retry:** Default timeout of 10,000ms (3,000ms for AI question requests); retries network timeouts once with exponential backoff before reporting errors.

---

## 11. Backend Architecture

The backend implements a **layered modular monolith**:
```text
HTTP Request
     │
     ▼
[Express Routes] ──► Parse path & extract params
     │
     ▼
[Middleware Pipeline] ──► CORS -> Helmet -> RateLimit -> Auth -> Validation (Zod)
     │
     ▼
[Controllers] ──► Unpack req.body/params/user; invoke domain services; map HTTP status
     │
     ▼
[Domain Services] ──► Pure business logic: grading, XP calculation, Bloom's progression
     │
     ▼
[Repositories & Mongoose Models] ──► Database queries with projections & atomic operators
     │
     ▼
[Centralized Error Middleware] ──► Catch AppErrors, CastErrors, format JSON envelopes
```

---

## 12. Backend Modules

1. **Auth Module (`auth.routes.js`, `auth.controller.js`, `authService.js`):** User registration, password verification, signed JWT issuance.
2. **Learning Module (`topic.routes.js`, `topic.controller.js`):** Curriculum hierarchy delivery, concept prerequisites, topic unlocking.
3. **Challenge Module (`quiz.routes.js`, `quiz.controller.js`, `gradingService.js`):** Challenge delivery with anti-cheat projection, server-side grading.
4. **Gamification Module (`gamificationService.js`):** XP formula evaluation ($100 \times N^{1.5}$), level advancement, UTC daily streaks.
5. **Adaptive Engine Module (`adaptiveEngine.js`):** Bloom's cognitive staircase calibration based on 3-attempt rolling accuracy.
6. **AI Service Module (`aiQuestionService.js`, `fallbackQuestionBank.js`):** Prompt synthesis, Gemini API calls, Zod output validation, static seed failover.

---

## 13. REST API Contracts

| Method | Endpoint | Purpose | Auth | Request Body | Response Body | Success | Error Codes |
|:---|:---|:---|:---:|:---|:---|:---:|:---:|
| `POST` | `/api/auth/register` | Register new account | Public | `{ username, email, password }` | `{ token, user: { id, username, totalXp, level } }` | `201` | `400, 409` |
| `POST` | `/api/auth/login` | Authenticate credentials | Public | `{ email, password }` | `{ token, user: { id, username, totalXp, level } }` | `200` | `400, 401` |
| `GET` | `/api/topics` | Get curriculum roadmap | Public | None | `[ { id, title, slug, concepts: [...] } ]` | `200` | `500` |
| `GET` | `/api/quizzes/:topicId` | Fetch questions for topic | Public | None (Answers stripped) | `[ { id, question, options, xp } ]` | `200` | `404` |
| `POST` | `/api/quizzes/:id/submit`| Submit quiz attempt | Bearer | `{ answers: [ { questionId, selectedAnswer } ] }`| `{ score, isPassed, xpAwarded, newLevel }` | `201` | `400, 401, 404` |
| `POST` | `/api/ai-questions/generate`| Generate adaptive question| Bearer | `{ conceptId: string }` | `{ id, question, options, hint, xp }` | `200` | `401, 429, 503` |

---

## 14. HTTP Status Codes

- **`200 OK`:** Successful resource query (`GET /api/topics`, `POST /api/ai-questions/generate`).
- **`201 Created`:** Successful resource creation (`POST /api/auth/register`, `POST /api/quizzes/:id/submit`).
- **`400 Bad Request`:** Payload fails Zod validation or contains invalid parameters.
- **`401 Unauthorized`:** Missing, malformed, or expired JWT bearer token.
- **`403 Forbidden`:** Authenticated user lacks permissions for target resource.
- **`404 Not Found`:** Resource ID does not exist in database.
- **`409 Conflict`:** Duplicate email or username during registration.
- **`422 Unprocessable Entity`:** Syntactically valid JSON failing semantic business rules.
- **`429 Too Many Requests`:** Rate limit exceeded (auth brute force or AI quota guard).
- **`500 Internal Server Error`:** Unhandled server exceptions (sanitized in production).

---

## 15. Validation

CodeQuest enforces **fail-fast validation at the API boundary** using Zod:
```javascript
// Registration Schema
export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

// Quiz Submission Schema
export const submitQuizSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    selectedAnswer: z.string().min(1)
  })).min(1)
});
```

---

## 16. Server Error Handling

Centralized error handling standardizes failure responses across all endpoints:
```javascript
export class AppError extends Error {
  constructor(message, statusCode, errorCode = 'OPERATIONAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.isOperational ? err.message : 'An unexpected internal error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.stack : null
    },
    timestamp: new Date().toISOString()
  });
}
```

---

## 17. Middleware

The Express 5 middleware pipeline processes requests in strict sequence:
1. `cors({ origin: process.env.CORS_ORIGIN, credentials: true })`
2. `helmet()` — Injects HSTS, CSP, and XSS protection headers.
3. `express.json({ limit: '1mb' })` — Parses request bodies.
4. `requestLogger` — Emits structured JSON logs with duration timestamps.
5. `rateLimiter` — Sliding window token bucket limiting request bursts.
6. `authMiddleware` — Verifies JWT bearer tokens and attaches `req.user`.
7. `validationMiddleware(schema)` — Validates payload against Zod schemas.
8. `routeHandler` — Executes domain service logic.
9. `notFoundHandler` — Intercepts unmatched routes (`404 Not Found`).
10. `errorHandler` — Global error handler formatting JSON error envelopes.

---

## 18. Authentication and Authorization

- **Password Storage:** User passwords are encrypted using `bcryptjs.hash(password, 10)` before storage.
- **Session Tokens:** Successfully authenticated users receive signed JWT tokens:
  ```javascript
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  ```
- **Route Protection:** Protected routes invoke `authMiddleware.js`, rejecting requests lacking `Authorization: Bearer <token>` with `401 Unauthorized`.

---

## 19. PostgreSQL Schema

To satisfy Project Score relational requirements and support multi-user social graphs in Phase 4, the platform defines a **normalized PostgreSQL 16 schema**:

```mermaid
erDiagram
    USERS ||--o{ GUILD_MEMBERS : joins
    GUILDS ||--o{ GUILD_MEMBERS : contains
    GUILDS ||--o{ GUILD_QUESTS : undertakes
    USERS ||--o{ USER_PROGRESS : tracks
    USERS ||--o{ ATTEMPTS : submits
    CONCEPTS ||--o{ USER_PROGRESS : evaluates
    CONCEPTS ||--o{ CHALLENGES : provides
    CHALLENGES ||--o{ ATTEMPTS : receives
    LEVELS ||--|{ CONCEPTS : groups
    LEARNING_PATHS ||--|{ LEVELS : organizes

    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        integer total_xp
        integer current_level
        integer current_streak
        timestamp created_at
    }

    GUILDS {
        uuid id PK
        varchar name UK
        uuid leader_id FK
        integer guild_xp
        timestamp created_at
    }

    GUILD_MEMBERS {
        uuid guild_id FK
        uuid user_id FK
        varchar role
        timestamp joined_at
    }

    GUILD_QUESTS {
        uuid id PK
        uuid guild_id FK
        varchar title
        integer target_xp
        integer current_xp
        boolean is_completed
    }

    LEARNING_PATHS {
        uuid id PK
        varchar slug UK
        varchar title
        integer order_index
    }

    LEVELS {
        uuid id PK
        uuid path_id FK
        integer level_number
        varchar title
        integer required_xp
    }

    CONCEPTS {
        uuid id PK
        uuid level_id FK
        varchar slug UK
        varchar title
        integer mastery_threshold
    }

    CHALLENGES {
        uuid id PK
        uuid concept_id FK
        varchar title
        varchar category
        integer base_xp
        integer difficulty_tier
    }

    ATTEMPTS {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        boolean is_correct
        integer xp_awarded
        timestamp created_at
    }

    USER_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid concept_id FK
        integer mastery_percent
        varchar status
        timestamp updated_at
    }
```

### Relational DDL Script (`database/migrations/001_relational_schema.sql`)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    guild_xp INTEGER DEFAULT 0 CHECK (guild_xp >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guild_members (
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id)
);

CREATE INDEX idx_guild_members_user ON guild_members(user_id);
```

---

## 20. SQL JOIN Design

### Meaningful Queries Demonstrating SQL Competence

#### Query 1: Guild Leaderboard Aggregation (`INNER JOIN`)
Aggregates member contributions to verify guild standing:
```sql
SELECT 
    g.id AS guild_id,
    g.name AS guild_name,
    COUNT(gm.user_id) AS active_members,
    COALESCE(SUM(u.total_xp), 0) AS calculated_guild_xp
FROM guilds g
INNER JOIN guild_members gm ON g.id = gm.guild_id
INNER JOIN users u ON gm.user_id = u.id
GROUP BY g.id, g.name
ORDER BY calculated_guild_xp DESC
LIMIT 10;
```
*Rationale:* `INNER JOIN` ensures only guilds with valid member records are calculated in the competitive leaderboard.

#### Query 2: Learner Challenge Completion Audit (`LEFT JOIN`)
Retrieves all challenges in a concept alongside the learner's completion status:
```sql
SELECT 
    c.id AS challenge_id,
    c.title,
    c.difficulty_tier,
    c.base_xp,
    COALESCE(bool_or(a.is_correct), FALSE) AS is_completed,
    COUNT(a.id) AS total_attempts
FROM challenges c
LEFT JOIN attempts a ON c.id = a.challenge_id AND a.user_id = $1
WHERE c.concept_id = $2
GROUP BY c.id, c.title, c.difficulty_tier, c.base_xp
ORDER BY c.difficulty_tier ASC;
```
*Rationale:* `LEFT JOIN` preserves all challenges even if the user has not attempted them yet.

---

## 21. MongoDB Schema

The MongoDB document database handles curriculum taxonomy, polymorphic questions, and attempts:

### Collection Schemas (Mongoose)

#### `models/User.js`
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  totalXp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  currentStreak: { type: Number, default: 0, min: 0 },
  lastActiveDate: { type: Date, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });
```

#### `models/Question.js`
```javascript
const questionSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: [arr => arr.length === 4, 'Must have exactly 4 options'] },
  correctAnswer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  xp: { type: Number, default: 20 },
  explanation: { type: String, default: '' }
}, { timestamps: true });

questionSchema.index({ topic: 1, difficulty: 1 });
```

---

## 22. Mongo CRUD Operations

1. **Create:** Creating attempt records: `await QuizAttempt.create({ user: userId, topic: topicId, score, answers });`
2. **Read with Anti-Cheat Projection:** `await Question.find({ topic: topicId }).select("-correctAnswer").lean();`
3. **Atomic Update:** Leveling up and awarding XP race-condition free:
   ```javascript
   await User.findByIdAndUpdate(userId, {
     $inc: { totalXp: xpEarned },
     $set: { level: calculatedNewLevel }
   }, { new: true });
   ```
4. **Delete:** Administrative clearing of test questions: `await Question.deleteMany({ topic: testTopicId });`

---

## 23. Learning Domain Model

- **LearningPath:** Top-level progression track (e.g. `web_foundations`).
- **Level:** Sequential pedagogical tier (Levels 1 to 7).
- **Concept:** Concrete computational primitive (e.g. `loops_while`).
- **Challenge:** Interactive task with acceptance assertions.
- **Attempt:** Immutable user submission with score and time taken.
- **Result:** Graded outcome (`isCorrect`, earned XP, feedback).
- **Progress:** Aggregate mastery score ($0\% - 100\%$) unlocking subsequent nodes.

---

## 24. Challenge Engine

```text
Challenge Selection ──► Workspace Assembly ──► Execution Run ──► Server Submission ──► Grading ──► Progress Update
```
- **Challenge Types:** Multiple Choice / Prediction, Visual Block Assembly, Constrained Optimization (max blocks $\le 4$), Bug Hunt (debugging flawed code), Syntax Translation.

---

## 25. Blockly / Visual Coding

```text
Workspace Drag & Drop ──► Type Socket Check ──► AST Serializer ──► Code Generator ──► Live Preview & Worker Runner
```
- **Magnetic Socket Typing:** Type enforcement prevents invalid connections (e.g. booleans cannot dock into arithmetic sockets).
- **Real-Time Code Sync:** Traverses AST and updates the adjacent code preview in $<16\text{ms}$.

---

## 26. Code Execution

```text
Frontend UI ──► useCodeRunner Hook ──► Web Worker Sandbox ──► Output Stream ──► Watchdog Timer (1,000ms)
```
- **Process Isolation:** Arbitrary student code runs inside a browser Web Worker thread with zero DOM or cookie access.
- **Shadowed Globals:** `window`, `document`, `fetch`, and `XMLHttpRequest` are shadowed or nullified.
- **Watchdog Timer:** If execution exceeds 1,000ms, the worker is terminated via `worker.terminate()` to prevent infinite loops from freezing the browser.

---

## 27. AI / LLM Integration

The backend AI service brokers all generative requests:
- **Provider:** Google Gemini 1.5 Flash API via official SDK.
- **Parameters:** Temperature 0.2, ResponseSchema constrained to JSON.
- **Timeout & Retry:** Strict 3,000ms timeout; on failure, serves static questions from `fallbackQuestionBank.js`.

---

## 28. Prompt Engineering

Prompts are assembled dynamically using five structured layers:
1. **System Role:** `"You are an expert, encouraging Computer Science Pedagogical Engine for CodeQuest..."`
2. **Pedagogical Constraints:** Topic ID, Bloom's cognitive tier, syntax whitelist (e.g. `['let', 'while', '<', '++']`).
3. **Learner Context:** Recent error category (e.g. infinite loop), rolling accuracy ($65\%$).
4. **Few-Shot Examples:** Golden JSON input/output demonstrations.
5. **JSON Schema Enforcement:** Exact output structure contract.

---

## 29. Structured Output

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

---

## 30. AI Question Generation Pipeline

```text
Learner Progress ──► Difficulty Engine ──► Prompt Builder ──► Gemini API ──► Zod Validation ──► MongoDB / Fallback ──► Sanitized Output
```

---

## 31. Adaptive Difficulty Algorithm

Let $A_3$ be the rolling accuracy over the last 3 submissions:
- **$A_3 \ge 85\%$:** Advance Bloom's stage ($\text{Stage} \leftarrow \min(\text{Stage} + 1, 5)$).
- **$A_3 < 60\%$:** Reduce Bloom's stage ($\text{Stage} \leftarrow \max(\text{Stage} - 1, 1)$); inject progressive hints.
- **$60\% \le A_3 < 85\%$:** Maintain current stage; vary problem contexts.

---

## 32. Answer Evaluation

- **Multiple Choice:** Server verifies submitted choice against `correctAnswer`.
- **Blockly & Real Code:** Client runs assertions in Web Worker; server verifies returned execution signature and block count constraints.

---

## 33. Progress Tracking

1. Attempt stored in `QuizAttempt` collection.
2. Concept accuracy updated in user mastery vector.
3. Earned XP awarded atomically via `$inc`.
4. Level threshold verified ($100 \times N^{1.5}$).
5. Daily practice streak updated based on UTC date comparison.

---

## 34. Gamification

- **XP Formula:** $\text{XP Required for Level } N = 100 \times N^{1.5}$.
- **Base XP:** Multiple Choice (10-15 XP), Visual Assembly (25-35 XP), Debugging (40-50 XP).
- **Streaks:** Maintained by comparing `lastActiveDate` with current UTC calendar date.

---

## 35. JavaScript Runtime Concepts

1. **Event Loop & libuv:** Non-blocking database calls and bcrypt hashing are offloaded to libuv worker threads, keeping the Call Stack free.
2. **Promises & async/await:** Linear asynchronous control flow across controllers replacing nested callback hell.
3. **Closures:** Inner iterators (`answers.map(a => ...)`) retain lexical access to outer `questions` array and mutate the lexical `score` counter.
4. **Hoisting & TDZ:** Variables declared strictly with `const` and `let` reside in the Temporal Dead Zone, preventing `undefined` state access.

---

## 36. Environment Variables and Secrets

```text
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=super_secret_cryptographic_key_minimum_32_chars
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/codequest
DATABASE_URL=postgresql://user:password@localhost:5432/codequest
AI_API_KEY=server_side_private_api_key_placeholder
```

---

## 37. Security

- **Authentication:** Stateless signed JWTs with 24h expiration.
- **Password Protection:** Irreversible bcrypt hashing (10 salt rounds).
- **Code Execution:** Client-side Web Worker sandboxing; zero server RCE.
- **Anti-Cheat:** `.select("-correctAnswer")` strips answers from API responses.
- **Injection Defense:** Mongoose typed schemas & parameterized SQL queries (`$1`).

---

## 38. Prompt Injection Defense

- User inputs are treated as data, never instructions.
- Prompts use explicit XML tags (`<user_error_context>`) with instruction override protections.

---

## 39. Rate Limiting

- **`/api/auth/*`:** 10 requests / 15 minutes per IP.
- **`/api/quizzes/:id/submit`:** 30 requests / 1 minute per User.
- **`/api/ai-questions/*`:** 5 requests / 1 minute per User.
- **General Reads:** 120 requests / 1 minute per IP.

---

## 40. Caching

- **Curriculum Taxonomy:** Cached in-memory with 24h TTL.
- **AI Questions:** Cached in MongoDB by concept and difficulty stage.
- **User Progress & XP:** **Never cached** (strict ACID consistency required).

---

## 41. Logging and Observability

- Structured JSON logging via Pino emitting `timestamp`, `level`, `reqId`, `method`, `path`, and `durationMs`.
- Passwords, tokens, and API keys are automatically redacted.

---

## 42. Testing Strategy

- **Unit Tests:** Grading assertions, XP formulas, and difficulty state transitions (Vitest/Jest).
- **Integration Tests:** Express routes and MongoDB operations using Supertest.
- **Component Tests:** React Testing Library for HUD, roadmap, and workspace.

---

## 43. Failure Scenarios

| Failure | Detection | Response | User Experience | Recovery |
|:---|:---|:---|:---|:---|
| **MongoDB Down** | Connection socket error | Express 500 error envelope | "Database unavailable. Retrying..." | Exponential reconnect backoff |
| **LLM Timeout (>3s)** | AbortSignal timeout | Failover to static question | Instant question delivered | Serves seed question seamlessly |
| **Malformed AI Output**| Zod schema parse failure | Log warning & trigger fallback | Pre-seeded question shown | Automatic seed failover |
| **Worker Infinite Loop**| 1,000ms watchdog trigger | `worker.terminate()` | "Infinite loop intercepted!" | Clean worker restart |
| **Expired JWT** | `TokenExpiredError` | 401 Unauthorized | Session expired notice | Redirect to `/login` |

---

## 44. Sequence Diagrams

### 1. Login Authentication
```mermaid
sequenceDiagram
    Learner->>API: POST /api/auth/login { email, password }
    API->>DB: User.findOne({ email })
    API->>API: bcrypt.compare(password, hash)
    API->>API: jwt.sign(claims, secret)
    API-->>Learner: 200 OK { token, user }
```

### 2. Challenge Submission & Grading
```mermaid
sequenceDiagram
    Learner->>API: POST /api/quizzes/:id/submit { answers }
    API->>DB: Question.find({ topic: id })
    API->>API: Evaluate answers & calculate XP
    API->>DB: User.findByIdAndUpdate({ $inc: { totalXp } })
    API->>DB: QuizAttempt.create(attemptData)
    API-->>Learner: 201 Created { score, isPassed, xpAwarded }
```

### 3. AI Question Generation & Fallback
```mermaid
sequenceDiagram
    Learner->>API: POST /api/ai-questions/generate { conceptId }
    API->>LLM: Invocate Gemini API (T=0.2)
    alt Response Valid < 3s
        LLM-->>API: JSON String
        API->>API: Zod validate
        API-->>Learner: 200 OK (Generated Question)
    else Timeout or Schema Error
        API->>SeedBank: Fetch pre-seeded question
        SeedBank-->>API: Seed Question
        API-->>Learner: 200 OK (Fallback Question)
    end
```

---

## 45. State Diagrams

### Challenge Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Locked
    Locked --> Active : Prerequisites Mastered
    Active --> InProgress : Workspace Opened
    InProgress --> Evaluating : Solution Submitted
    Evaluating --> Failed : Test Failed (0 XP)
    Failed --> InProgress : Retry
    Evaluating --> Passed : Test Passed (+XP)
    Passed --> Mastered : Mastery >= 85%
    Mastered --> [*]
```

---

## 46. API-to-Database Mapping

| API Endpoint | Controller | Service | Repository/Model | Database Entity |
|:---|:---|:---|:---|:---|
| `POST /api/auth/register` | `auth.controller.js` | `authService.js` | `models/User.js` | MongoDB `users` |
| `POST /api/auth/login` | `auth.controller.js` | `authService.js` | `models/User.js` | MongoDB `users` |
| `GET /api/topics` | `topic.controller.js`| `topicService.js` | `models/Topic.js` | MongoDB `topics` |
| `GET /api/quizzes/:id` | `quiz.controller.js` | `quizService.js` | `models/Question.js`| MongoDB `questions` |
| `POST /api/quizzes/:id/submit`| `quiz.controller.js`| `gradingService.js`| `models/QuizAttempt.js`| MongoDB `quizattempts` |
| `POST /api/ai-questions/generate`| `aiQuestion.controller.js`| `aiQuestionService.js`| `models/AIQuestion.js`| MongoDB `ai_questions` |

---

## 47. Requirement Traceability

| Requirement | PRD Reference | HLD Component | LLD Module | Status |
|:---|:---|:---|:---|:---:|
| **FR-001** (User Registration) | Section 37 | Section 6 | `auth.controller.js`, `models/User.js` | `Planned (MVP)` |
| **FR-002** (Password Hashing) | Section 29, 37 | Section 17 | `bcryptjs` salt rounds = 10 | `Planned (MVP)` |
| **FR-003** (Stateless JWT Auth) | Section 29, 37 | Section 17 | `authMiddleware.js`, `jwt.sign()` | `Planned (MVP)` |
| **FR-004** (Curriculum Taxonomy)| Section 10, 37 | Section 11 | `models/Topic.js`, `RoadmapCanvas.jsx`| `Planned (MVP)` |
| **FR-006** (Visual Block Canvas)| Section 16, 37 | Section 13 | `BlockWorkspace.jsx`, AST engine | `Planned (MVP)` |
| **FR-007** (Real-Time Code Sync)| Section 17, 37 | Section 13 | `CodePreview.jsx`, AST generator | `Planned (MVP)` |
| **FR-008** (Sandboxed Execution)| Section 8, 37 | Section 14 | `codeRunner.worker.js` (Web Worker)| `Planned (MVP)` |
| **FR-009** (Server Evaluation) | Section 37 | Section 12 | `quiz.controller.js`, `gradingService.js`| `Planned (MVP)` |
| **FR-010** (Anti-Cheat Query) | Section 29, 37 | Section 12 | `.select("-correctAnswer")` | `Planned (MVP)` |
| **FR-012** (Deterministic XP) | Section 20, 37 | Section 11 | `gamificationService.js` ($100 \times N^{1.5}$)| `Planned (MVP)` |
| **FR-014** (AI Adaptive Quest) | Section 14, 37 | Section 15 | `aiQuestionService.js`, low-temp LLM| `Planned (Phase 2)`|
| **FR-015** (AI Schema Checks) | Section 14, 37 | Section 15 | Zod structured schema validator | `Planned (Phase 2)`|
| **FR-016** (Static Seed Fallback)| Section 14, 37 | Section 15 | `fallbackQuestionBank.js` | `Planned (Phase 2)`|
| **NFR-003** (Watchdog Timeout) | Section 28, 38 | Section 14 | 1,000ms `setTimeout` $\rightarrow$ `worker.terminate()`| `Planned (MVP)` |

---

## 48. Project Score Mapping

| Concept # | Mandatory Viva Concept | Exact Implementation Location | Technical Explanation | Status |
|:---:|:---|:---|:---|:---:|
| **1** | **React Component Composition** | `frontend/src/components/layout/MainLayout.jsx` | Modular UI hierarchy composing pure presentation primitives with unidirectional props. | `Planned (MVP)` |
| **2** | **State Management (useState)** | `frontend/src/components/workspace/BlockWorkspace.jsx` | Local interactive state managing palette collapses, active tabs, and terminal buffer strings. | `Planned (MVP)` |
| **3** | **Side Effects (useEffect)** | `frontend/src/components/workspace/BlockWorkspace.jsx` | Canvas mounting, AST code generation synchronization, and Web Worker cleanup on unmount. | `Planned (MVP)` |
| **4** | **Async Data Fetching** | `frontend/src/api/apiClient.js` | Decoupled HTTP client with request/response interceptors, automatic JWT injection, error normalization. | `Planned (MVP)` |
| **5** | **Client-Side Routing** | `frontend/src/routes/AppRoutes.jsx` | Declarative routing with `ProtectedRoute` navigation guards redirecting unauthenticated users. | `Planned (MVP)` |
| **6** | **Problem Modeling** | `backend/src/models/` | Discrete domain models: Users, Topics, Questions, QuizAttempts, Guilds. | `Planned (MVP)` |
| **7** | **System Design Basics** | Macro Architecture | Multi-tier decoupled architecture: Vite React SPA $\rightarrow$ Express Gateway $\rightarrow$ MongoDB $\rightarrow$ Web Worker. | `Planned (MVP)` |
| **8** | **RESTful Endpoint Design** | `backend/src/routes/` | Resource URIs (`GET /api/topics`, `POST /api/quizzes/:id/submit`) using semantic verbs & JSON envelopes. | `Planned (MVP)` |
| **9** | **HTTP Status Codes** | `backend/src/constants/httpStatusCodes.js` | Precise status codes (`200`, `201`, `400`, `401`, `404`, `409`, `422`, `429`, `500`). | `Planned (MVP)` |
| **10** | **Server Error Handling** | `backend/src/middleware/errorHandler.js` | Centralized Express error middleware intercepting `AppError` and sanitizing client outputs. | `Planned (MVP)` |
| **11** | **Express Middleware** | `backend/src/middleware/` | Pipeline: `cors`, `helmet`, `authMiddleware` (JWT), `validationMiddleware` (Zod). | `Planned (MVP)` |
| **12** | **Mongo Schema Modeling** | `backend/src/models/` | Mongoose schemas with strict types, enums, required validation, compound indexes, `ref` links. | `Planned (MVP)` |
| **13** | **Mongo CRUD Operations** | `backend/src/controllers/` | Demonstrates `create()`, `find().select("-correctAnswer")`, `findByIdAndUpdate()` with atomic `$inc`. | `Planned (MVP)` |
| **14** | **PostgreSQL Relational Schema** | `database/migrations/001_relational_schema.sql` | Normalized SQL tables (`users`, `guilds`, `guild_members`) with PK, FK, and cascading deletes. | `Planned (Phase 4)` |
| **15** | **SQL JOINs** | `backend/src/services/socialService.js` | Multi-table `INNER JOIN` aggregating guild scores; `LEFT JOIN` querying challenge completion status. | `Planned (Phase 4)` |
| **16** | **LLM API Integration** | `backend/src/services/aiQuestionService.js` | Server-side integration calling Google Gemini API via secure backend client. | `Planned (Phase 2)` |
| **17** | **Prompt Engineering** | `backend/src/services/aiQuestionService.js` | System prompts enforcing role framing, Bloom's tiers, and syntax token whitelists. | `Planned (Phase 2)` |
| **18** | **Structured Outputs** | `backend/src/validators/aiQuestion.validator.js`| Low-temperature (0.2) inference constrained by strict JSON schema validated via Zod. | `Planned (Phase 2)` |
| **19** | **Git Workflow** | Entire repository | Multi-branch workflow (`main`, `develop`, `docs/*`), Conventional Commits. | `Implemented` |
| **20** | **Secrets Management** | `backend/src/config/` | Zero secrets in source code; configuration injected through `.env` files and `dotenv`. | `Planned (MVP)` |
| **21** | **JavaScript Event Loop** | Node.js Runtime | Non-blocking asynchronous I/O offloading database queries to libuv worker threads. | `Planned (MVP)` |
| **22** | **Promises vs Callbacks** | `backend/src/services/` | Modern Promise-based architecture consumed via `async/await`, eliminating callback hell. | `Planned (MVP)` |
| **23** | **async / await** | `backend/src/controllers/` | Linear, readable asynchronous control flow across controllers, service methods, and seed scripts. | `Planned (MVP)` |
| **24** | **Closures** | `backend/src/controllers/quiz.controller.js` | Array iterators (`answers.map(a => ...)`) retaining lexical scope to mutate outer counters. | `Planned (MVP)` |
| **25** | **Hoisting & Temporal Dead Zone** | Module Architecture | Function declarations hoisted cleanly; variables declared with `const`/`let` in the TDZ. | `Planned (MVP)` |

---

## 49. Scalability

1. **Stateless API Gateway:** Express servers store zero in-memory session state, allowing horizontal auto-scaling behind an Nginx or AWS Application Load Balancer.
2. **Read/Write Segregation:** High-volume curriculum reads route to MongoDB Atlas read replicas, reserving primary instances for writes.
3. **Decoupled Code Execution:** Offloading execution entirely to the learner's browser Web Worker means code execution compute costs scale at $O(1)$ on the server.
4. **Semantic Question Caching:** Caches synthesized AI questions in MongoDB indexed by `conceptId` and `difficultyStage`.

---

## 50. Performance

- **Frontend:** Vite code-splitting splits vendor bundles; routes are lazy-loaded via `React.lazy()`; canvas renders maintain 60 FPS ($<16\text{ms}$).
- **Backend:** Mongoose queries utilize `.lean()` on read-only queries to bypass heavy document hydration.
- **Indexes:** Compound indexes on `{ topic: 1, difficulty: 1 }` ensure quiz queries execute in $<5\text{ms}$.

---

## 51. Deployment

```mermaid
flowchart TB
    Learner["Learner Browser"]
    SPA["React 19 SPA (Vercel / Cloudflare Pages CDN)"]
    API["Express 5 REST API (Render / Fly.io / AWS ECS)"]
    Atlas[("MongoDB Atlas Managed Cluster")]
    Neon[("PostgreSQL Managed Instance (Phase 4)")]
    Gemini["Google Gemini 1.5 Flash API"]

    Learner -->|HTTPS Port 443| SPA
    SPA -->|API Requests /api/*| API
    API --> Atlas
    API -.-> Neon
    API --> Gemini
```

---

## 52. Architectural Tradeoffs

| Decision | Alternatives | Chosen Approach | Reason | Tradeoff Accepted |
|:---|:---|:---|:---|:---|
| **Code Execution** | Server-Side Docker / RCE | Client-Side Web Workers | Eliminates catastrophic server security liabilities (RCE) and zero compute cost. | Restricted to client JavaScript runtime; compiled languages require WASM or future containers. |
| **API Paradigm** | GraphQL / gRPC | RESTful HTTP Gateway | Standardized HTTP status codes, predictable caching boundaries, and zero client query complexity. | Fixed response envelopes; minor over-fetching compared to custom GraphQL queries. |
| **Difficulty Engine**| Pure Autonomous LLM | Deterministic Application Logic | Eliminates hallucinated level jumps and cheating; guarantees auditable curriculum progression. | Requires explicit state machine rules rather than open-ended generative adaptation. |
| **AI Integration** | Direct Frontend LLM Calls | Server-Side Proxy | Prevents API key leakage, enforces rate limits, validates JSON schemas, and enables caching. | Adds ~50ms proxy latency compared to direct browser-to-AI calls. |
| **Persistence Model**| Single Database | Polyglot Hybrid (Mongo + Postgres)| Documents fit polymorphic questions; SQL fits relational social graphs with strict ACID joins. | Managing two database connection configurations in production. |

---

## 53. Risks and Mitigations

| Risk ID | Risk Description | Severity | Probability | Architectural Mitigation |
|:---:|:---|:---:|:---|:---|
| **RSK-01** | **LLM Hallucinations / Invalid Code** | High | Medium | Low temperature (0.2); strict Zod schema validation; automatic failover to verified seed questions. |
| **RSK-02** | **Prompt Injection / Jailbreak** | High | Low | Server-side prompt construction; XML input delimiters; system instructions forbidding prompt overrides. |
| **RSK-03** | **Uncontrolled AI API Costs** | Medium | Medium | Token bucket rate limiting (5 req/min); caching synthesized questions in MongoDB for reuse. |
| **RSK-04** | **Browser Infinite Loops** | High | High | Sandboxed Web Worker runtime with hard 1,000ms watchdog termination guard (`worker.terminate()`). |
| **RSK-05** | **Quiz Answer Leakage (Cheating)** | High | Medium | Server-side projection `.select("-correctAnswer")` strips answers from HTTP responses. |
| **RSK-06** | **Concurrent Milestone Exploits** | Medium | Low | Atomic MongoDB `$inc` operators prevent race-condition XP duplication. |
| **RSK-07** | **Third-Party AI Outages** | High | Low | Graceful degradation to pre-seeded static question repository; zero user-facing crashes. |

---

## 54. Implementation Order

```text
Phase 1: Foundation Setup (Vite React + Express App + MongoDB Mongoose Connection)
    ↓
Phase 2: Authentication Subsystem (Bcrypt hashing, JWT generation & authMiddleware)
    ↓
Phase 3: Curriculum & Topic Domain (Topic Model, Seeders, GET /api/topics endpoints)
    ↓
Phase 4: Visual Block Workspace (Blockly integration, Type Sockets, Real-time Code Preview)
    ↓
Phase 5: Browser Web Worker Sandbox (codeRunner.worker.js, Watchdog Timeout Guard)
    ↓
Phase 6: Deterministic Quiz Grader (Question Model, Anti-cheat projection, Server Evaluation)
    ↓
Phase 7: XP & Gamification Engine (XP formulas, Level Up checks, Daily UTC Streaks)
    ↓
Phase 8: AI Question Service (Prompt synthesis, Gemini API client, Zod schema validation)
    ↓
Phase 9: Adaptive Difficulty Engine (Bloom's Cognitive Staircase, Accuracy calibrator)
    ↓
Phase 10: Testing Suite (Unit tests, Supertest integration tests, RTL component tests)
    ↓
Phase 11: Production Deployment (Vercel CDN, Render PaaS, MongoDB Atlas Cluster)
```

---

## 55. Viva Preparation

### Key LLD Decisions to Defend in Viva

#### Q1: Why React for the frontend instead of Next.js SSR?
> *"CodeQuest is an interactive, stateful web application dominated by visual canvas manipulation, drag-and-drop block docking, and client-side Web Workers. Server-Side Rendering (SSR) offers negligible performance advantages for an authenticated private dashboard, while introducing unnecessary server compute overhead. React 19 Single Page Application (SPA) with Vite provides near-instant client-side state reconciliation, zero-reload routing, and unconstrained access to browser threading APIs."*

#### Q2: Why REST instead of GraphQL?
> *"REST provides standardized HTTP status codes, predictable caching boundaries at the CDN and HTTP gateway level, and clear error handling. For our educational domain, the data access patterns are well-defined (fetching topics, starting quizzes, submitting attempts). GraphQL would introduce client-driven query complexity, require complex authorization layers to prevent nested query denial-of-service, and obscure HTTP caching."*

#### Q3: Why is code execution performed in browser Web Workers rather than Docker on the server?
> *"Executing untrusted learner code on backend servers creates catastrophic security vulnerabilities, specifically Remote Code Execution (RCE) and fork bombs, requiring complex container sandboxing (gVisor, Firecracker). For introductory JavaScript, executing inside isolated browser Web Workers provides 100% server isolation, zero server compute costs, zero network latency, and instant infinite loop termination via worker watchdog guards."*

#### Q4: Why is AI question generation handled on the backend rather than directly from the frontend?
> *"Calling AI APIs from the frontend would expose private API keys in client network bundles, allowing users to steal credentials. Furthermore, frontend AI calls prevent application-level rate limiting, bypass prompt injection sanitization, eliminate semantic caching in MongoDB, and prevent server-side validation against our deterministic curriculum constraints."*

#### Q5: Why should the LLM NOT control difficulty or award XP directly?
> *"LLMs are probabilistic, non-deterministic pattern matchers prone to hallucinations, prompt injections, and inconsistent evaluations. Letting an LLM decide learner progression would allow users to trick the model into awarding infinite XP. In CodeQuest, the application-level Adaptive Difficulty Engine deterministically calculates the learner's Bloom's taxonomy stage, and the backend deterministically grades attempts and awards XP. The LLM merely generates natural language question text within strict boundaries."*

#### Q6: How does the application prevent students from inspecting DevTools to find quiz answers?
> *"In `backend/src/controllers/quiz.controller.js`, when a learner fetches questions to start a quiz, Mongoose's `.select("-correctAnswer")` projection explicitly removes the correct answer field from the database query before serialization. The HTTP response sent to the browser does not contain the answer. Answers are evaluated exclusively on the server when the learner submits their selections."*

#### Q7: How does `async/await` interact with the Node.js Event Loop during a quiz submission?
> *"When `POST /api/quizzes/:id/submit` is invoked, the controller begins executing synchronously on the Call Stack. When it encounters `await Question.find()`, Node.js hands off the database I/O to libuv's worker thread pool and frees the Call Stack immediately. Node.js continues handling other incoming HTTP requests. When MongoDB returns the records, libuv pushes the resolved promise callback into the Microtask Queue. Once the Call Stack is empty, the Event Loop dequeues the microtask, resuming execution in the controller to evaluate answers."*

#### Q8: Where and why are JavaScript Closures utilized in the codebase?
> *"In `backend/src/controllers/quiz.controller.js`, closures are demonstrated during answer evaluation: `answers.map((answer) => { const q = questions.find(...); if (q.correctAnswer === answer.selectedAnswer) score++; return ...; })`. The inner callback function retains lexical scope access to the outer function's `questions` collection and mutates the outer `score` variable across iterations."*

#### Q9: What is the Temporal Dead Zone (TDZ) and how does it prevent bugs in the frontend?
> *"The Temporal Dead Zone is the period between entering a block scope and the actual evaluation of a `let` or `const` variable declaration. Unlike legacy `var` declarations (which are hoisted and initialized to `undefined`), accessing a `const` or `let` variable prior to its declaration throws a `ReferenceError`. Enforcing `const`/`let` ensures component states and configuration variables are never accessed before initialization."*

#### Q10: Why use both MongoDB and PostgreSQL in the architecture?
> *"We employ a polyglot persistence strategy. MongoDB's document model is ideal for semi-structured curriculum content, polymorphic AI-generated questions, and nested attempt answer logs. PostgreSQL is designed for Phase 4 social systems (Guilds, collaborative quests, relational leaderboards) where strict ACID transactional integrity, foreign key constraints, and relational SQL `JOIN`s are essential for consistent multi-table data aggregation."*

---

*End of Low-Level Design Document.*
