# 🚀 TaskOrbit

**Collaborative Kanban Productivity Platform**

TaskOrbit is a modern productivity and collaboration platform designed to help individuals and teams manage work efficiently using Kanban boards, analytics, calendar scheduling, and real-time collaboration.

It combines personal task management and team collaboration into a powerful productivity ecosystem, designed with a premium, mobile-first aesthetic.

---

## ✨ Features

### 🧠 Personal Productivity System
- **Personal Kanban board**
- Task creation and editing with rich descriptions
- Due date tracking
- Priority labels (High, Medium, Low)
- **Focus Mode** for assigned tasks

### 👥 Team Collaboration
- Create projects & Team Workspaces
- Invite team members via unique invite codes
- Assign tasks to teammates
- **Real-time task updates** instantly across all connected clients
- Team activity tracking and workload visualization

### 📋 Kanban Task Management
- Fluid drag-and-drop tasks using `dnd-kit`
- Standard Columns: To Do, In Progress, Done
- **Mobile-optimized interactions:**
  - Swipeable Kanban list views
  - Top drag-drop status bar for mobile
  - Swipe right/left gesture shortcuts for quick status changes

### 📅 Calendar Integration
- Full interactive calendar view
- Drag and drop tasks across days to change due dates
- Synced perfectly with Kanban tasks

### 📊 Productivity Analytics & Reviews
- **Productivity Dashboard:** Track completion trends, distribution, and team workload
- **Weekly & Monthly Reviews:**
  - Weekly Summary (Every Sunday) analyzing tasks completed, created, and overdue
  - Monthly Review with most productive weeks, average completion times, and consistency graphs
  - Charts powered by **Recharts**
  - Smart AI-like insights (e.g., "Your most productive day was Wednesday")

### 🗄️ Auto Task Archiving
- To keep the board clean, completed tasks are **automatically archived**
- Tasks move to the Archive after 2 days (customizable to 1 day, 7 days, or never)
- Archived tasks remain accessible, searchable, and restorable

###📱 Mobile-First Design
- TaskOrbit is fully optimized for mobile devices
- Floating Action Button (FAB) for quick task creation
- Bottom navigation bar styling
- Smooth glassmorphism UI

### 🎨 Interactive Landing Page
- Premium dark-theme aesthetic with glowing gradients
- Animated SVG characters
- **Cursor tracking eyes** (desktop) & **Touch tracking eyes** (mobile)
- Smooth floating animations & responsive layouts

---

## 🛠 Tech Stack

**Frontend**
- React 19
- Vite
- Vanilla CSS (Glassmorphism & Custom properties)
- Framer Motion

**Backend**
- Supabase (PostgreSQL)
- Supabase Realtime
- Supabase Auth
- Edge Functions & RPCs

**Libraries**
- **Visualization:** Recharts
- **Drag and Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Calendar:** @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/interaction

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shubhkashyap06/TASK-ORBIT.git
   cd TASK-ORBIT
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup:**
   Run the provided SQL migrations in your Supabase SQL Editor in this order:
   - `supabase/schema.sql` (Initial setup)
   - `supabase/collaboration_migration.sql`
   - `supabase/analytics_migration.sql`
   - `supabase/archive_migration.sql`
   - `supabase/productivity_migration.sql`

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The app will start at `http://localhost:5173`*

---

## 🚀 Deployment

TaskOrbit is optimized for deployment on Vercel or Netlify.

**Vercel Deployment**
1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
4. Deploy!

---

## 🧑‍💻 Author

**Shubh Kashyap**  
Creator of TaskOrbit — a modern productivity and collaboration platform.

