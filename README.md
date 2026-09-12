# WorkDay — The Distributed Corporate Operating System

> **WorkDay OS** is a unified, production-grade corporate operating system and digital workplace platform. It integrates real-world software engineering workflows, role-based governance, and interactive development tools into an Apple-minimalist, high-performance interface.

---

## 🏛️ System Overview

**WorkDay** bridges the divide between distributed individual contributors, engineering leads, and human resources in a single, cohesive operating system. Built for modern tech enterprises, it delivers an authentic corporate environment featuring real GitHub issue resolution, an in-browser VS Code-powered IDE with host terminal execution, live responsive website previewing, peer pull request reviews, automated career leveling, and encrypted digital contract compliance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              WorkDay OS                                │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│   Employee Workstation   │  Engineering Leadership     │  HR Hub &     │
│   & Monaco Studio IDE    │  Console (Manager Review)   │  Compliance   │
└──────────────────────────┴─────────────────────────────┴───────────────┘
```

---

## 💎 Core Architectural Pillars

### 1. Role-Based Access Control (RBAC) & Dedicated Workspaces
WorkDay enforces strict role isolation across three enterprise personas:
* **Employee (Engineer / Designer / PM / Data)**: Focused on sprint deliverables, 1-on-1 syncs with managers, Monaco IDE development, and career advancement.
* **Engineering Manager**: Centralized squad leadership console for task delegation, sprint planning, and side-by-side Monaco diff code reviews.
* **HR Executive**: Organization-wide talent governance, legal onboarding deed archives, compensation banding, and broadcast announcements.

---

### 2. The Employee Workstation (10 Dedicated Operating Hubs)
* **My Desk**: Real-time KPI metrics, active sprint focus card, squad status board, and live induction progress tracker.
* **Career Journey**: XP-driven career roadmap featuring leveling tiers (L1–L5), clearance progression, and milestone rewards.
* **Sprint Deliverables (My Tasks)**: Filterable sprint backlog with acceptance criteria checklists, difficulty ratings (Easy, Medium, Hard), and one-click launch into Monaco Studio.
* **Projects & Repositories**: Multi-repository tracking (`frontend-reactjs`, `backend-service`, etc.) displaying open repository issues and PR lifecycle states.
* **Squad Comms & Messages**: Real-time squad messaging with team channels (`#general`, `#engineering`) and direct mentor lines.
* **Corporate Calendar**: Interactive monthly schedule with executive standups, sprint reviews, and deployment deadlines.
* **Team Directory**: Organizational hierarchy with live presence indicators, clearance tags, and contact metadata.
* **My Manager & 1-on-1s**: Dedicated reporting manager profile, upcoming 1-on-1 schedule, read-only PR submission status tracker with inline mentor feedback, and direct manager dialogue.
* **Meetings & Standups**: Video conferencing staging room integrated with live Jitsi Meet WebRTC rooms for instant, zero-credential browser conferencing.
* **Company Portal**: Official corporate documentation, departmental charters, remote work policies, and executive directories.

---

### 3. Monaco Studio — Full In-Browser Cloud IDE
* **Authentic VS Code Layout**: Left Activity Bar, collapsible file tree explorer with draggable resize handle (`col-resize`), breadcrumbs trail, and multi-tab editor.
* **Custom Material File Icons**: Distinct vector icons for TypeScript, React (`.tsx`, `.jsx`), JSON, Markdown, CSS, and directory trees.
* **Monaco Editor Engine**: VS Code Dark+ theme, minimap, bracket pair colorization, line numbers, semantic highlighting, and font ligatures.
* **Interactive Host Terminal**: Powered by `@xterm/xterm`, `@xterm/addon-fit`, and a bidirectional Node.js WebSocket bridge (`server/terminal.js`) executing genuine host `powershell.exe` or `bash` commands.
* **Side-by-Side Responsive Previewer**: Built-in browser sandbox with responsive viewport toggles (**Desktop 1280px**, **Tablet 768px**, **Mobile 375px**) and live reloading.
* **Direct PR Dispatch**: Solved sprint issues submit pull requests directly to the lead manager's queue with clean commit generation and celebratory milestones.

---

### 4. Engineering Leadership Console (Manager Review Suite)
* **Squad Management & Task Delegation**: Create, prioritize, and assign sprint deliverables to team members or the unassigned backlog with custom deadlines.
* **Side-by-Side Monaco Diff Viewer**: Colorized red/green line diff inspection comparing pristine baseline repository files with employee submitted patches.
* **Manager Actions**: One-click **Approve & Merge** (+50 XP granted, automatic sprint progress update) or **Request Changes** with required constructive feedback.
* **Dual-Column Storage**: Stores both complete modified source files and unified git diffs in Supabase, preventing source corruption.

---

### 5. HR Leadership & Compliance Console
* **Talent Analytics**: Headcount tracking, onboarding completion rates, and functional department breakdown charts.
* **Legal Compliance Archive**: Cryptographically secured employment deeds storing digitized handwritten vector SVG signatures.
* **Executive Broadcast Engine**: Instant organizational broadcasts published across all enterprise channels and company watercooler feeds.
* **Compensation & Leveling Matrix**: Transparent L1–L5 salary bands, equity allowances, and an automated XP-based promotion evaluation engine.

---

### 6. Cinematic Apple-Tier Landing & Onboarding
* **400-Frame Scroll-Driven Animation**: Hardware-accelerated canvas renderer cycling through high-fidelity workstation frames on scroll.
* **4-Step Onboarding Pipeline**:
  1. *Legal Identity*: Full name, preferred handle, corporate email generation (`@company.corp`).
  2. *Department Selection*: Engineering, Product, Design, Data, or Operations.
  3. *Role & Manager Assignment*: Seniority tier and dedicated reporting manager pairing.
  4. *Digital Handwritten Signature*: In-canvas signature pad generating certified SVG deeds.
* **Enterprise Authentication**: Instant GitHub OAuth SSO and email login powered by Supabase Auth.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Terminal Subsystem** | `@xterm/xterm`, `@xterm/addon-fit`, Node.js WebSocket bridge (`ws`) |
| **Video Conferencing** | Jitsi Meet WebRTC (`meet.jit.si`) |
| **Design System** | Apple-minimalist Vanilla CSS, Tailwind CSS v4, Lucide Icons |
| **Cloud Backend** | Supabase (PostgreSQL 15, Row Level Security, Realtime Subscriptions) |
| **Authentication** | Supabase Auth (GitHub OAuth SSO & Passwordless Email) |

---

## 📁 Repository Structure

```
├── data/
│   └── supabase_schema.sql         # Supabase PostgreSQL schema, RLS policies, & indices
├── server/
│   └── terminal.js                 # Node.js WebSocket bridge for real host PTY terminal
├── src/
│   ├── components/
│   │   ├── auth/                   # GitHub SSO & Auth modal
│   │   ├── ide/                    # Monaco Studio, Explorer, Terminal, Previewer
│   │   ├── landing/                # 400-frame scroll-driven cinematic landing view
│   │   ├── onboarding/             # 4-step onboarding modal with handwritten signature canvas
│   │   └── workspace/              # Corporate Workspace orchestrator & 10 area modules
│   │       └── areas/              # Home, Tasks, Projects, Manager, HR, Team, Meetings, etc.
│   ├── lib/
│   │   ├── dataset.ts              # Sprint problem datasets and repository seeds
│   │   ├── supabase.ts             # Supabase client, CloudStorage API, and real-time subscriptions
│   │   └── toast.tsx               # Minimalist toast notification system
│   ├── styles/
│   │   └── style.css               # Core design tokens, typography, and component styling
│   ├── types.ts                    # TypeScript types and domain interfaces
│   ├── App.tsx                     # Main application state and view router
│   └── main.tsx                    # React entrypoint
├── package.json                    # Dependencies and runtime scripts
├── tsconfig.json                   # Project references configuration
└── vite.config.ts                  # Vite bundler plugins and server options
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher
* A free [Supabase](https://supabase.com) account

---

### 1. Clone & Install
```bash
git clone https://github.com/AnunayYadav/WorkDay.git
cd WorkDay
npm install
```

---

### 2. Configure Cloud Backend (Supabase)
1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**, paste the contents of [`data/supabase_schema.sql`](./data/supabase_schema.sql), and click **Run**.
3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

---

### 3. Run the Development Environment
Start both the Vite development server and the Host Terminal WebSocket daemon concurrently:
```bash
npm run dev
```

* **WorkDay Application**: `http://localhost:8080/`
* **Host Terminal Bridge**: `ws://localhost:8082`

---

## 📜 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs the Vite web server and the terminal daemon concurrently |
| `npm run dev:vite` | Starts only the Vite dev server (`http://localhost:8080`) |
| `npm run dev:terminal` | Starts only the terminal WebSocket server (`ws://localhost:8082`) |
| `npm run build` | Compiles TypeScript and builds production distribution (`tsc -b && vite build`) |
| `npm run preview` | Locally serves the optimized production build |
| `npm run lint` | Runs oxlint fast code linter |

---

## 🔒 Security & Data Isolation

* **Strict Role Boundaries**: Complete separation of employee action capabilities and manager approval authority.
* **Row-Level Security**: Supabase RLS policies ensure data cannot be queried or updated across unauthorized corporate tenants.
* **Encrypted Signatures**: Onboarding contract signatures are converted to vector SVG data URIs and sealed with verification timestamps.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
