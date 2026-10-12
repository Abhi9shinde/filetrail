# FileTrail

> Your files have a memory.

Finding a file is not always enough. You may also want to know where it came from, what it was called before, or what happened to it. FileTrail is an early-stage, local-first Windows desktop prototype exploring searchable file history and context.

**The product vision is ahead of the implementation:** the current timeline and search use demonstration data. FileTrail does not monitor real files yet.

## What works in the prototype

- Desktop interface built with Electron, React, TypeScript, and Vite.
- Search over demonstration filenames, paths, previous names, and activity descriptions, with relevance ranking and composable event-type and extension filters.
- Activity timeline and a file inspector with per-file demonstration history.
- Sidebar navigation and the `Ctrl+K` search shortcut.
- Tracked-folder setup screen with add and remove interactions. Its list is in-memory demo state only; folders are not monitored or saved.
- SQLite persistence foundation in Electron's main process: versioned schema migrations, file and event tables, and typed operations exposed through a validated preload/IPC boundary.

## What is not implemented yet

- Filesystem monitoring or scanning.
- Recording and reliably associating real file creation, modification, rename, move, and deletion events.
- Connecting tracked-folder management or the timeline and search UI to persistent real data.
- Verified native-module rebuilds, IPC runtime integration, or a packaged Windows application.

The SQLite foundation is separate from the demonstration data. The app does not import fictional activity into the database, and the current UI does not read its stored history.

## Project status

Active development is temporarily paused while we reconsider the product's value and validate whether people need it. This is not an abandoned project; no resumption date has been decided.

FileTrail is an early prototype, not a production-ready file history tool. Search and the timeline show demonstration records. The tracked-folder list is temporary UI state and does not monitor or persist folders. SQLite schema and main-process operations exist in code, but native rebuild, IPC runtime verification, and packaged production compatibility remain incomplete.

## Technology

- Electron 30
- React 18 and TypeScript
- Vite with `vite-plugin-electron`
- Tailwind CSS
- lucide-react
- better-sqlite3 12.6.2 for the persistence foundation

## Architecture

The React renderer contains the prototype screens and currently reads mock activity and file records. Electron's main process owns SQLite under Electron's `userData` directory and applies schema migrations at startup. A narrow, typed preload API exposes specific persistence operations through validated IPC; it does not expose SQL or unrestricted filesystem access. Connecting those operations to the renderer is unfinished.

## Getting started

Use a Node.js version supported by the installed Electron and better-sqlite3 versions, then install dependencies and start Vite with Electron:

```powershell
npm install
npm run dev
```

The `postinstall` script asks electron-builder to rebuild native dependencies for the project's Electron version. If a compatible prebuilt `better-sqlite3` binary is unavailable and it must compile from source on Windows, install Python and Visual Studio Build Tools with the **Desktop development with C++** workload, including the x64 MSVC toolchain and a Windows SDK.

`npm run build` runs TypeScript, Vite, and electron-builder. A successful clean install or packaged production build has not been verified for this repository; native rebuild or packaging may still need environment setup.

## Tentative roadmap

Development is paused, so this roadmap may change:

1. Validate the problem and identify target users.
2. Resolve native SQLite rebuild and runtime verification.
3. Implement monitoring for folders users explicitly select.
4. Connect real file history to search and the timeline.
5. Test and package a reliable Windows application.

## Feedback and contributions

FileTrail is an early-stage prototype. Constructive feedback about the problem, target users, and product direction is welcome. Development is paused, so contributions and ongoing maintenance are not guaranteed.
