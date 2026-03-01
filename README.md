# CourseCraft – Course Management System

A full-stack Learning Management System (LMS) where instructors can create and manage courses with lessons, and students can enroll, track progress, and watch video lessons.

---

## Live Links

| Resource | URL |
|---|---|
| Frontend | [https://cms-gamma-five.vercel.app/](https://cms-gamma-five.vercel.app/) |
| Backend API | [https://coursecraft-ip1f.onrender.com](https://coursecraft-ip1f.onrender.com) |
| Demo Video | [https://www.loom.com/share/158fb5d88ce6416ca29cf05a867faf37](https://www.loom.com/share/158fb5d88ce6416ca29cf05a867faf37) |

---

## Features

### Authentication
- User registration with role selection (Student / Instructor)
- JWT-based login with automatic access token refresh
- Secure logout with token blacklisting

### Student
- Browse and search all published courses (by title, description, or category)
- Enroll in courses
- Watch video lessons
- Mark lessons as complete
- Track course progress (percentage)
- View all enrolled courses in a personal dashboard

### Instructor
- Create, edit, and delete courses
- Add lessons with video URLs and durations
- Control lesson ordering within a course
- Manage all courses from a dedicated instructor dashboard

### General
- Role-based protected routes
- Responsive design (mobile-friendly)
- Dark / Light theme toggle
- PDF export support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Axios, Vite 7 |
| Backend | Django 6, Django REST Framework, SimpleJWT |
| Database | SQLite (development) / PostgreSQL (production) |
| Deployment | Vercel (frontend), Render (backend) |
| Auth | JWT (access + refresh tokens with rotation) |
| Static Files | WhiteNoise |
| Image Handling | Pillow |

---

## Setup – Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Course Management System"
```

### 2. Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt
```

Create a `.env` file inside the `Backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=                   
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

```bash
# Run migrations and start the server
cd Backend
python manage.py migrate
python manage.py createsuperuser   
python manage.py runserver
```

Backend will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup (React)

```bash
# From the project root
cd Frontend/cms

# Install dependencies
npm install
```

Create a `.env` file inside `Frontend/cms/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

```bash
# Start the development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## Environment Variables Reference

### Backend (`Backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Debug mode | `True` / `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `127.0.0.1,localhost` |
| `DATABASE_URL` | PostgreSQL URL (production) | `postgresql://cms_db_th6w_user:rdfKfhCBDrAPBHheqFgXkwIM0pyhdc7P@dpg-d6hgsipdrdic73cmh3mg-a/cms_db_th6w` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) | `https://cms-gamma-five.vercel.app/` |

### Frontend (`Frontend/cms/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `coursecraft-ip1f.onrender.com` |

---

## API Overview

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/auth/` | Register, login, logout, token refresh, profile |
| Courses | `/api/courses/` | List, create, retrieve, update, delete courses |
| Lessons | `/api/courses/<id>/lessons/` | Manage lessons within a course |
| Enrollments | `/api/enrollments/` | Enroll in courses, view enrollments |
| Progress | `/api/courses/<id>/progress/` | Track lesson completion and course progress |

Full API documentation is available at `http://127.0.0.1:8000/admin/` (Django admin) or via the Render deployment.

---

## Seeding Sample Data

```bash
cd Backend
python seed.py
```

This creates sample courses, lessons, and user accounts for testing.

---

## Demo Video

Watch a full walkthrough of the application: [https://www.loom.com/share/158fb5d88ce6416ca29cf05a867faf37](https://www.loom.com/share/158fb5d88ce6416ca29cf05a867faf37)

The demo covers:
- Student registration and login
- Browsing and enrolling in courses
- Watching lessons and tracking progress
- Instructor course creation and lesson management
