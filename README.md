# Zona Merah Project

This repository contains the website frontend (React + Vite) and an hourly Project Zomboid announcement sender via SSH for LinuxGSM.

## Hourly Announcement Bot (SSH + LinuxGSM)

The bot script is at `bot/hourly-announcement.js`.

### What it does

- Sends server message using LinuxGSM `send-servermsg`.
- Uses 2 dummy announcements by default (rotating).
- Runs every 1 hour using cron: `0 * * * *`.
- Reads credentials and config from `.env`.

### Setup

1. Copy `.env.example` to `.env`.
2. Fill your real SSH values (`SSH_HOST`, `SSH_USERNAME`, and password/private key).
3. Set `PZ_SERVER_DIR` and keep/update command template:
   - `PZ_SENDSERVERMSG_COMMAND_TEMPLATE=./pzserver send-servermsg {message}`
4. (Optional) Replace `PZ_ANNOUNCEMENTS` with your own messages separated by `|`.

### Run

```bash
npm install
npm run announce:hourly
```

The process should stay running to continue scheduling announcements every hour.

## Frontend Commands

```bash
npm run dev
npm run build
npm run preview
```
