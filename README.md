# Task Progress Management System (Beta 1.0)

A lightweight project progress management system built with:

- Frontend: HTML + CSS + Vanilla JavaScript
- Backend: Java 21 + Spring Boot 3.x
- Database: SQLite

This version is ready for **Beta 1.0** deployment.

## 1. Project Structure

```text
/Users/kaihan/task-app/
├─ frontend/
│  ├─ index.html          # English default UI
│  ├─ zh.html             # Chinese UI
│  ├─ app.en.js
│  ├─ app.zh.js
│  └─ style.css
├─ backend/
│  ├─ src/main/java/...
│  ├─ src/main/resources/
│  │  ├─ application.yml
│  │  ├─ schema.sql
│  │  ├─ data.sql
│  │  └─ sample-data-en.sql
│  ├─ scripts/
│  │  └─ init_sample_db.sh
│  └─ build.gradle
└─ data/
   └─ tasks.db
```

## 2. Database Construction (Sample Method)

To build a fresh SQLite database with pure English sample data:

```bash
cd /Users/kaihan/task-app
./backend/scripts/init_sample_db.sh
```

What it does:

1. Removes old `/Users/kaihan/task-app/data/tasks.db`
2. Applies `/Users/kaihan/task-app/backend/src/main/resources/schema.sql`
3. Seeds `/Users/kaihan/task-app/backend/src/main/resources/sample-data-en.sql`

## 3. Run Locally

### Start Backend

```bash
cd /Users/kaihan/task-app/backend
./gradlew bootRun
```

Backend API base URL:

```text
http://localhost:8080/api
```

### Start Frontend (Static)

```bash
cd /Users/kaihan/task-app/frontend
python3 -m http.server 5500
```

Open in browser:

- English UI: `http://localhost:5500/index.html`
- Chinese UI: `http://localhost:5500/zh.html`

## 4. Key Features in Beta 1.0

- Multi-project progress tracking
- Dynamic phases per project
- Phase description support
- Progress calculation from phase statuses
- Search + sorting
- Project priority
- Dashboard sections
- Stale project highlight
- Soft delete (`is_deleted` flag)
- Multi-note system per project (`task_notes`)
- Project detail drawer with knowledge preview mode
- Mobile-adaptive layout

## 5. Main API Endpoints

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}` (soft delete)
- `POST /api/tasks/{id}/notes`

## 6. Deploy to Oracle VM (Non-Docker)

### Backend

1. Install Java 21 and `sqlite3`
2. Upload project to `/opt/task-app`
3. Build and run backend:

```bash
cd /opt/task-app/backend
./gradlew build -x test
nohup ./gradlew bootRun > /opt/task-app/backend/backend.log 2>&1 &
```

### Frontend

Use Nginx or any static server to host `/opt/task-app/frontend`.

### Recommended Production Setup

- Nginx as reverse proxy
- Serve frontend on port 80/443
- Proxy `/api` to Spring Boot (port 8080)
- Keep DB at `/opt/task-app/data/tasks.db`

## 7. Notes

- `spring.sql.init.mode=always` is enabled, so schema/data scripts run on startup.
- For migration safety, runtime SQLite migration logic is handled in `SqliteMigrationConfig`.
- If you need to reset to the English sample dataset, re-run:

```bash
./backend/scripts/init_sample_db.sh
```

---

Beta tag recommendation: **v1.0.0-beta.1**
