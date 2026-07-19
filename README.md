# CivilVerge – AI-Based City Problem Tracking System

CivilVerge is an AI-powered civic complaint management platform that enables citizens to report city issues efficiently. The platform automatically categorizes complaints, assigns priorities, and routes them to the appropriate government department using Google's Gemini AI.

---

## Features

- User Authentication (JWT)
- Citizen Complaint Submission
- Image Upload Support
- AI-Powered Complaint Analysis
- Automatic Priority Detection
- Automatic Department Assignment
- Complaint Tracking
- Complaint History
- Voice Chatbot Support
- REST API with FastAPI
- Responsive React Frontend

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Axios
- CSS

### Backend
- FastAPI
- Python
- SQLAlchemy
- MySQL
- Pydantic
- JWT Authentication
- Alembic
- Google Gemini API (google-genai SDK)

---

## AI Features

The platform uses Google's Gemini model to analyze every complaint.

For each submitted report, the AI automatically generates:

- Complaint Summary
- Priority Level
- Responsible Department

Example:

Input

Title:
```
Large pothole near bus stand
```

Description

```
The pothole has become very deep and vehicles are getting damaged.
```

AI Output

```json
{
    "ai_summary": "Large pothole causing traffic and vehicle damage.",
    "priority": "High",
    "department_name": "Roads"
}
```

---

## Project Structure

```
civil_verge/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── config.py
│   │
│   ├── alembic/
│   ├── uploads/
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/civil_verge.git
cd civil_verge
```

---

### Backend Setup

```bash
cd server

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements
```

Create a `.env` file inside the `server` folder:

```
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

### Frontend Setup

```bash
cd client

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## API Workflow

```
User Login
      ↓
JWT Authentication
      ↓
Submit Complaint
      ↓
Upload Image (Optional)
      ↓
Gemini AI Analysis
      ↓
Priority Detection
      ↓
Department Assignment
      ↓
Store in MySQL
      ↓
Display on Dashboard
```

---

## API Endpoints

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`

### Reports

- POST `/api/reports`
- GET `/api/reports`
- GET `/api/reports/{id}`
- PUT `/api/reports/{id}`
- DELETE `/api/reports/{id}`

### Chatbot

- POST `/api/chatbot`

---

## Security

- Password Hashing using bcrypt
- JWT Authentication
- Environment Variables for Secrets
- Input Validation with Pydantic

---

## Future Improvements

- Email Notifications
- Admin Dashboard
- Real-time Complaint Updates
- GIS Map Integration
- Mobile Application
- Complaint Analytics Dashboard
- Multi-language Support
- AI Image Classification for Automatic Issue Detection

---

## Screenshots

Add screenshots of:

- Login Page
- Dashboard
- Complaint Form
- Complaint List
- AI Generated Summary
- Voice Chatbot

---

## Contributors

**Vasu Slaida**

---

## License

This project is developed for educational and portfolio purposes.