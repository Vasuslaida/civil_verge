# CivilVerge — Backend & Frontend Pipelines

---

## 🖥️ Frontend Pipeline (React / Vite → Vercel)

```mermaid
flowchart TD
    A["User opens browser\nhttps://civilverge.vercel.app"] --> B["Vercel CDN\nServes index.html + JS bundle"]
    B --> C["React App boots\n(App.jsx + AuthProvider)"]
    C --> D{"Is user logged in?\n(localStorage token)"}
    D -- No --> E["Landing Page\n(Public route)"]
    D -- Yes --> F["Protected Routes\n/submit · /my-reports · /admin"]

    E --> E1["Fetch /api/analytics/summary\n(live stats for stat cards)"]
    E1 --> E2["Display: Reports Resolved\nRegistered Users · Top Category"]

    F --> G["axios instance\n(services/api.js)\nbaseURL = VITE_API_URL"]
    G --> H["FastAPI Backend\n(Render)"]

    C --> I["VoiceChatbot mounted\n(global, all pages)"]
    I --> J{"User opens panel?"}
    J -- Yes --> K["✅ Test Gemini connection\n(console log)"]
    J -- No --> L["Idle — hidden"]

    I --> M["User types / speaks"]
    M --> N["Web Speech API\nhi-IN recognition"]
    N --> O["Fills text input"]
    O --> P["handleSend()"]
    P --> Q["sendToGemini()\nPOST → Google API\n(browser → Google direct)"]
    Q --> R["Bot reply rendered\nin chat bubble"]
```

---

## ⚙️ Backend Pipeline (FastAPI / Python → Render)

```mermaid
flowchart TD
    A["HTTP Request\nfrom Vercel frontend"] --> B["Render Web Service\nuvicorn main:app\n--host 0.0.0.0 --port \$PORT"]

    B --> C["CORSMiddleware\nallow_origins: localhost:5173\nallow_origin_regex: *.vercel.app"]
    C --> D["FastAPI Router\n/api/..."]

    D --> R1["/api/auth/*\nRegister · Login · JWT"]
    D --> R2["/api/reports/*\nCRUD + photo upload"]
    D --> R3["/api/admin/*\nStaff dashboard ops"]
    D --> R4["/api/analytics/summary\n✅ PUBLIC — no auth needed"]

    R1 --> DB[("MySQL Database\nDATABASE_URL env var")]
    R2 --> AI["AI Triage Engine\nClaude / Gemini\n→ Category · Priority · Summary"]
    AI --> DB
    R3 --> DB
    R4 --> DB

    DB --> RESP["JSON Response\nreturned to frontend"]
```

---

## 🔄 Full End-to-End Request Lifecycle

```mermaid
sequenceDiagram
    actor Citizen
    participant Vercel as React App (Vercel)
    participant Render as FastAPI (Render)
    participant DB as MySQL Database
    participant AI as Gemini / Claude API

    Citizen->>Vercel: Opens app / navigates
    Vercel->>Render: GET /api/analytics/summary
    Render->>DB: COUNT resolved, users, categories
    DB-->>Render: Aggregated stats
    Render-->>Vercel: { totalReportsResolved, totalUsers, mostCommonCategory }
    Vercel-->>Citizen: Stat cards render with live data

    Citizen->>Vercel: Submits issue report (form + photo)
    Vercel->>Render: POST /api/reports (JWT token)
    Render->>AI: Classify · prioritize · summarise
    AI-->>Render: Category + Priority + AI summary
    Render->>DB: INSERT report record
    DB-->>Render: New report ID
    Render-->>Vercel: 201 Created
    Vercel-->>Citizen: Success screen

    Citizen->>Vercel: Opens VoiceChatbot & types Hindi
    Vercel->>AI: POST generativelanguage.googleapis.com\n(browser → Google directly, no backend involved)
    AI-->>Vercel: Hindi response text
    Vercel-->>Citizen: Bot reply in chat bubble
```

---

## 📁 Project File Structure

```
civil_verge/
├── client/                        ← Vercel deployment
│   ├── src/
│   │   ├── App.jsx                 ← Routes + global <VoiceChatbot />
│   │   ├── components/
│   │   │   └── VoiceChatbot.jsx    ← Gemini AI chatbot (browser-direct)
│   │   ├── pages/
│   │   │   ├── Landing.jsx         ← Live stats from /api/analytics/summary
│   │   │   ├── SubmitReport.jsx    ← Complaint form + AI triage
│   │   │   ├── MyReports.jsx       ← Status timeline
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Analytics.jsx
│   │   └── services/
│   │       └── api.js              ← Axios (baseURL = VITE_API_URL)
│   ├── .env.development            ← VITE_API_URL=http://localhost:8000
│   ├── .env.production             ← VITE_API_URL=https://civilverge-api.onrender.com
│   └── vercel.json                 ← SPA rewrites → index.html
│
└── server/                        ← Render deployment
    ├── main.py                     ← FastAPI app + CORS + routes
    ├── requirements.txt
    ├── render.yaml                 ← One-click Render config
    └── app/
        ├── routes/
        │   ├── auth.py
        │   ├── reports.py
        │   ├── admin.py
        │   └── analytics.py        ← Public /summary endpoint
        ├── models/
        ├── services/
        │   └── ai.py               ← Gemini/Claude triage
        └── middleware/
            └── auth.py             ← JWT verification
```
