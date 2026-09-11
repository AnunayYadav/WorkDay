# VirtualHQ — The Virtual Corporate Workplace Platform

> **Smart India Hackathon (SIH 2026)**  
> Next-Generation Distributed Corporate Workplace, Employee Induction, and Real-World Technical Training Platform.

---

## 🌟 Overview

**VirtualHQ** is an enterprise-grade digital workspace simulation engineered to bridge the gap between fresh recruits, squad leads, and executive leadership. It immerses junior developers and employees into an authentic corporate operating environment with authentic GitHub issue solving, interactive IDE coding, host terminal execution, live website previewing, and peer code reviews.

---

## ✨ Key Capabilities & Architecture

### 1. Apple-Tier Interactive Cinematic Landing View
* **400-Frame Scroll-Driven Animation**: Smooth, hardware-accelerated canvas renderer cycling through high-fidelity workspace frames as the user scrolls.
* **Corporate Onboarding Induction**: 4-step onboarding pipeline (Legal Identity, Department Selection, Role & Manager Assignment, Digital NDA Signature).
* **Enterprise Authentication**: Instant GitHub OAuth SSO and email login powered by Supabase Auth.

### 2. The 10-Area Executive Workspace Suite
* **My Desk**: Real-time KPI metrics, active sprint focus card, squad status board, and live induction progress tracker.
* **Career Journey**: Visual role progression roadmap with unlocked clearance tiers, milestone XP credits, and managerial endorsements.
* **My Tasks**: Sprint backlog with priority sorting, acceptance criteria checklists, and direct launch into Monaco Studio.
* **Projects / Sprints**: Live GitHub repository cards (`frontend-reactjs`, `backend-service`, etc.) displaying open community issues and PR statuses.
* **Messages**: Real-time squad messaging with team channels and DM feeds.
* **Calendar**: Interactive monthly schedule with executive standups, 1-on-1 sprint reviews, and sprint deadlines.
* **My Team**: Department hierarchy tree with active presence badges and clearance levels.
* **My Manager**: Direct access to squad lead (Marcus Vance), performance ratings, and 1-on-1 mentorship bookings.
* **Meetings**: Video conference staging room with live transcription streams and call controls.
* **Company**: Enterprise company directory, departmental overview, and corporate policies.

### 3. High-Fidelity In-Browser VS Code IDE (Monaco Studio)
* **Authentic VS Code Layout**: Left Activity Bar, collapsible and resizable file tree explorer, breadcrumbs bar, editor tabs with active accent top line, and bottom drawer.
* **Material Theme File Icons**: Custom SVG vector icons for React (`.tsx`, `.jsx`), TypeScript (`.ts`), JSON, Markdown, CSS, and folders.
* **Draggable Sidebar Resizer**: Smooth cursor drag handle (`cursor: col-resize`) allowing flexible Explorer resizing from 160px to 480px.
* **Monaco Editor Engine**: VS Code Dark+ theme, minimap, bracket pair colorization, line numbers, and font ligatures.
* **100% Real Interactive Host Terminal**: Powered by `@xterm/xterm`, `@xterm/addon-fit`, and a bidirectional Node.js WebSocket bridge (`server/terminal.js`) running a genuine `powershell.exe` or `bash` shell on the host computer.
* **Live Website Previewer**: Side-by-side split browser sandbox with hot reloading and responsive device switcher (**Desktop 1280px**, **Tablet 768px**, **Mobile 375px**).

### 4. Real Manager Review Dashboard
* **Side-by-Side Monaco Diff Viewer**: Colorized red/green line diff inspection comparing pristine baseline code vs. employee submitted patches.
* **Manager Actions**: 1-click **Approve & Merge** (+50 XP) or **Request Changes** with required inline mentor feedback.
* **Dual-Column Storage**: Guarantees zero code corruption by storing both byte-perfect full modified files and unified git diffs in Supabase.

---

## 🚀 Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Monaco Editor (`@monaco-editor/react`), `@xterm/xterm`, `@xterm/addon-fit`, Canvas-Confetti, Lucide Icons.
* **Styling**: Vanilla CSS Design System with dark luxury tokens, glassmorphism, and responsive layouts.
* **Backend & Cloud**: Supabase (PostgreSQL 15, Row Level Security, Realtime Publication channels, Auth & GitHub OAuth).
* **Terminal Engine**: Node.js WebSocket Bridge (`ws`) streaming host PTY / child processes.

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/virtualhq.git
cd virtualhq
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase Cloud Backend
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** > **New Query**, copy the script from [`data/supabase_schema.sql`](./data/supabase_schema.sql), and click **Run**.
3. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start the Application
Run both the Vite frontend server and the terminal bridge server concurrently:
```bash
npm run dev
```

* **Frontend Application**: `http://localhost:8080/`
* **Real Terminal Bridge**: `ws://localhost:8082`

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Vite frontend and the Terminal WebSocket bridge concurrently |
| `npm run dev:vite` | Starts only the Vite dev server (`http://localhost:8080`) |
| `npm run dev:terminal` | Starts only the real terminal WebSocket daemon (`ws://localhost:8082`) |
| `npm run build` | Compiles TypeScript and builds production bundle (`tsc -b && vite build`) |
| `npm run preview` | Previews the production build locally |

---

## 🛡️ License

Built for **Smart India Hackathon (SIH 2026)**. Distributed under the MIT License.
