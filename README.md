# Local Development Setup

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

---

## Backend

```bash
cd backend

# create and activate virtual env
python -m venv venv
venv\Scripts\activate        # windows
source venv/bin/activate     # mac/linux

# install dependencies
pip install -r requirements.txt

# run migrations
python manage.py migrate

# seed data
python manage.py loaddata seed.json
```

You need **3 terminals** for the backend:

**Terminal 1 — Django server**
```bash
daphne -p 8000 core.asgi:application
```

**Terminal 2 — Celery worker**
```bash
celery -A core worker --loglevel=info --pool=solo
```

**Terminal 3 — Celery beat (scheduled tasks)**
```bash
celery -A core beat --loglevel=info
```

---

## Frontend

```bash
cd frontend

# install dependencies
npm install

# start dev server
npm run dev
```

App runs at http://localhost:5173

---

## Quick Reference

| Service | Command | Port |
|---|---|---|
| Django | `daphne -p 8000 core.asgi:application` | 8000 |
| Celery worker | `celery -A core worker --loglevel=info --pool=solo` | — |
| Celery beat | `celery -A core beat --loglevel=info` | — |
| Frontend | `npm run dev` | 5173 |
| Redis | must be running | 6379 |
| PostgreSQL | must be running | 5432 |