## MYCHAT APP (SaaS Chatbot Platform)

Production-grade chatbot web application with:
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.io
- **DB**: MongoDB (Mongoose)
- **Auth**: JWT (access + refresh)
- **Voice**: Web Speech API (STT) + Speech Synthesis (TTS)
- **AI**: OpenAI (pluggable provider layer)
- **Docker**: `docker-compose` for local + deploy-ready images

### Run (local dev)

#### 1) Install prerequisites
- Node.js **LTS** (includes `npm`)
- Docker Desktop (optional, for MongoDB)

#### 2) Setup environment
Copy `.env.example` → `.env` and fill keys.

#### 3) Start MongoDB (Docker)
```bash
docker compose up -d mongo
```

#### 4) Backend
```bash
cd backend
npm install
npm run dev
```

#### 5) Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Docker (full stack)
```bash
docker compose up --build
```

