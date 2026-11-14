# TrackIt 🏋️‍♂️

> A minimalist, lightning-fast workout tracking application designed for progressive overload and split routine management. Built with React Native (Expo) and an Express/MongoDB full-stack backend.

---

## ✨ Features

- **⚡ Fast Set Logging**:
  - Live set tracking table with Set Type cycling: Regular (`R`), Warmup (`W`), Drop Set (`D`), and Failure (`F`).
  - **Copy Last Set**: 1-click duplication of weights and reps from previous sets.
  - **Ghost Performance Targets**: Automatically recalls your previous workout's weights & reps for instant reference targets.
  - **Drag-and-Drop Reordering**: Rearrange exercises dynamically during a workout session with desktop drag handles (`⋮⋮`) or mobile-friendly `▲`/`▼` 1-tap buttons.
  - **Edit & Swap Movements**: Edit exercise parameters or swap in-place with an 800+ exercise library.

- **⏱️ Auto-Rest Timer**:
  - Automatically triggers countdown upon completing a set.
  - Floating banner with quick adjustments (`+30s`, `-15s`, `Skip`, `Dismiss`).
  - Fully customizable default duration (15s to 600s).

- **📋 Split & Program Manager**:
  - Built-in presets: **PPL** (Push/Pull/Legs), **Upper/Lower**, **Arnold Split**, **Bro Split**, **Full Body**, and **Custom**.
  - **"Start Empty" Mode**: Create split days with zero exercises and build routines dynamically as you train at the gym.
  - **1-Click Save**: Lock in an active workout session as the permanent template for that split.
  - Custom day addition, inline rename, permanent deletion, and day reordering.

- **🤖 Smart AI & Deterministic Parser**:
  - Single-line natural language parser (e.g. `"bench 3x8, incline db 3x10, lateral raises 4 sets"`).
  - OpenAI Structured Outputs (`gpt-4o-mini`) via Zod schema.
  - Offline deterministic fallback parser: strict equipment preservation (dumbbell vs barbell never interchanged) and biomechanical ordering (compounds first, accessories last).

- **🏆 History & Personal Records (PR)**:
  - Workout history log with session volume tonnage (kg lifted) and duration.
  - 1-click **Repeat Workout** from history.
  - PR celebration modal and dashboard showcase for max weight records.

- **🌐 Multi-Mode Offline & Cloud Sync**:
  - **Offline Mode**: Complete functionality stored locally with zero internet requirement.
  - **Online Mode**: Automatic synchronization with MongoDB Atlas.
  - **Smart AI Mode**: Natural language parsing combined with cloud persistence.
  - 1-click **Sync Center** in Settings to migrate local offline sessions to the cloud.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo (SDK 52), Expo Router, Lucide Icons, Zustand (State Management).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), CORS.
- **AI Engine**: OpenAI API (`gpt-4o-mini` with Zod Structured Outputs) + Smart deterministic local regex parser.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/<your-username>/TrackIt.git
cd TrackIt
```

### 3. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 4. Configure Environment
Copy the example `.env` file in `server/`:
```bash
cp server/.env.example server/.env
```
Edit `server/.env` with your MongoDB connection string and optional OpenAI API key:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key_optional
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 5. Build and Run
```bash
# Export the frontend web build
cd client && npx expo export --platform web
cd ..

# Start the full-stack server
node server/src/server.js
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!
