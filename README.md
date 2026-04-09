# Backlog Maintainer (Electron + React + SQLite)

Local-first desktop backlog tool inspired by Jira, Trello, and ClickUp.

## Tech Stack

- Electron (main process + preload + IPC)
- React + TypeScript (renderer)
- TailwindCSS
- SQLite via `better-sqlite3`

## Project Structure

- `electron/` - Electron `main.ts` and `preload.ts`
- `database/` - SQLite setup and CRUD queries
- `renderer/` - React UI (dashboard, feature view, kanban)
- `shared/` - Shared TypeScript types

## Data Storage

The SQLite database is created in an OS-safe writable location using:

- `app.getPath("userData")`

Database file name:

- `backlog-maintainer.sqlite`

## Features Implemented (MVP)

- Feature (Epic) CRUD
- Backlog Item CRUD
- Dashboard cards with item count + progress
- Feature detail view grouped by status
- Kanban board (`Todo`, `Doing`, `Done`) with drag-and-drop
- IPC-safe renderer API through `preload.ts`

## Development

### 1) Prerequisites

- Node.js 20+ and npm installed

### 2) Install dependencies

```bash
npm install
```

### 3) Run locally (macOS or Windows)

```bash
npm start
```

This starts:

- Vite dev server for renderer
- Electron app window loading from local Vite URL

**Tela em branco no dev?** O Vite escuta em **127.0.0.1:5174** (mesma URL do Electron). Se outro processo usar 5174, o Vite falha ao subir — encerre o que estiver na 5174. O Electron **abre a janela na hora** e tenta carregar o Vite em loop até responder (não usa mais `wait-on`, que podia travar e impedir a janela de abrir).

## Build

### Build all

```bash
npm run build
```

### Build portable Windows executable (.exe)

```bash
npm run dist:win
```

`electron-builder` is configured with Windows target `portable`, which outputs a portable `.exe` (no installer required).

### Optional macOS app directory output

```bash
npm run dist:mac
```

## Notes

- No cloud dependencies
- No auth
- Fully offline local-first app
