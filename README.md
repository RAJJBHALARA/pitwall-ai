# BoxBox — Your F1 Intelligence Hub

> **AI-powered Formula 1 race analysis, rivalry tracking, fantasy picks, driver career timelines, and live telemetry — all in one dark-themed dashboard.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-boxbox-E10600?style=for-the-badge&logo=vercel)](https://box-box-raj.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://pitwall-ai-q77t.onrender.com/api/health)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏁 **Race Analysis** | Lap time charts, driver comparisons, tire strategy visualizations |
| ⚔️ **Rivalry Tracker** | Head-to-head stats with Gemini AI narrative analysis |
| 🎯 **Fantasy Picks** | AI-powered driver & constructor recommendations |
| 🏆 **Career Timeline** | Full career stats, season breakdowns, and GOAT comparisons |
| 📊 **Standings** | Live 2025 driver & constructor championship standings |
| 📐 **Lap Explainer** | Telemetry breakdown with AI coaching commentary |
| 🔔 **Race Weekend Alerts** | Live session detection + email signup for race previews |
| 🌙 **Beginner Mode** | Simplified explanations for new F1 fans |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Framer Motion, Recharts |
| **Backend** | FastAPI (Python 3.11), FastF1, Google Gemini 1.5 Pro |
| **Deployment** | Vercel (Frontend) + Render (Backend) |
| **Data** | FastF1, Jolpica/Ergast API, OpenF1 API |
| **AI** | Google Gemini 1.5 Pro via `google-generativeai` |

---

## 🚀 Local Development

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Create backend/.env with:
# GEMINI_API_KEY=your_key
# API_SECRET_KEY=your_secret
# ALLOWED_ORIGINS=http://localhost:5173
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
# Create frontend/.env.local with:
# VITE_API_URL=http://localhost:8000
# VITE_API_KEY=your_secret
npm run dev
```

---

## 🌍 Deployment

- **Backend** → Render (root dir: `backend`, see `render.yaml`)
- **Frontend** → Vercel (root dir: `frontend`, see `vercel.json`)

---

## 📄 License

MIT — built for F1 fans, by F1 fans. 🏎️
