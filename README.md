# Local Printing Queue Manager

Local printing queue manager to organize 3D printing jobs and workflow.

## Quick start (Docker)

### Prerequisites

- Docker Engine installed
- Docker Compose:
  - Recommended: **Compose v2** (`docker compose ...`)
  - Also works: standalone **`docker-compose`** binary (what this project uses in the examples below)
- Linux permissions:
  - Either run commands with `sudo`, or add your user to the `docker` group and re-login

### Run

From the repository root:

```bash
sudo docker-compose up --build
```

### Telegram bot (optional)

The backend can run a Telegram bot for uploading STL files and viewing the queue.

- Create `backend/.env` (it is **ignored by git**) based on `backend/.env.example`
- Set:
  - `TELEGRAM_BOT_TOKEN=<your token>`

If `TELEGRAM_BOT_TOKEN` is missing, the bot is disabled automatically.

### Open the app

- Frontend (web UI): `http://localhost:4000`
- Backend (API): `http://localhost:3000`

### Stop

```bash
sudo docker-compose down
```

### Persistent data

These folders are mounted into the backend container so data survives restarts:

- `backend/storage` → `/app/storage`
- `backend/metadata` → `/app/metadata` (SQLite DB: `queue.db`)

## Changing Printing Presets

If you would like to change presets while the server is running:

- Open the app and go to **Settings** (`/settings`)
- Edit the JSON and press **Save**

These changes are stored in `backend/metadata/config/` (volume-mounted), so they persist across container restarts.

If you prefer editing files manually, the default config files live in:

```
backend/config/ -> config_*.json
```

If you change defaults and want them baked into the image, rebuild:

```bash
sudo docker-compose build frontend
sudo docker-compose up
```
