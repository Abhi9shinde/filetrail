# FileTrail — Project Context

## 1. What Is FileTrail?

FileTrail is a privacy-first, local-first Windows desktop application designed to give files a searchable history.

**Tagline:** Your files have a memory.

Traditional file search helps users find files that exist now. FileTrail aims to help users understand what happened to their files over time.

Users should eventually be able to answer questions such as:

- What happened to this file?
- Where did this file come from?
- What was its previous name?
- Where was it moved?
- Which files were modified or renamed yesterday?
- Where can I find a recently downloaded PDF?

FileTrail is not intended to be another generic file explorer or an AI chatbot dashboard. Its primary value is file history, context, and traceability.

## 2. Product Principles

- Privacy-first: process and store file history locally by default.
- User-controlled: users explicitly choose which folders to monitor.
- Reliable: distinguish confirmed events from inferred or unavailable information.
- Minimal: deliver a premium, restrained interface without unnecessary UI elements.
- Transparent: never invent file events, download sources, application names, or historical details.
- Practical: prioritize useful file tracking and search over unnecessary AI features.

Do not upload users' file contents or history to external services by default.

## 3. Technology Stack

Current application stack:

- Electron
- React
- TypeScript
- Vite / electron-vite
- Tailwind CSS
- lucide-react for icons

Planned technologies:

- SQLite for persistent local history.
- Windows filesystem monitoring using an appropriate native or operating-system-supported approach.
- A narrow, typed Electron preload API and validated IPC.
- Windows installer packaging.

Inspect the actual repository before changing dependencies, replacing libraries, or assuming any component is already implemented.

## 4. Current Project State

The application has been initialized using electron-vite with React and TypeScript. Dependencies are installed, and the development application launches.

The UI prototype includes:

- A dark, minimal interface.
- A sidebar with Home, Activity, Search, Starred, and Settings.
- A search area with the headline "Find anything you've touched."
- Suggested search queries.
- An activity timeline containing mock events.
- Clickable activity rows.
- A right-side File Inspector.
- A file history section inside the inspector.
- Expandable event rows, currently with prototype-only details.

Existing architecture includes components organized into separate folders, a Home page, shared types, and mock data.

Likely existing paths include:

- `src/components/Sidebar/`
- `src/components/SearchHero/`
- `src/components/ActivityTimeline/`
- `src/components/FileInspector/`
- `src/pages/Home/`
- `src/types/`
- `src/data/`
- `src/App.tsx`
- `src/main.tsx`
- `electron/main.ts`
- `electron/preload.ts`

These paths are a guide, not a guarantee. Inspect the repository and use the actual current structure.

## 5. Current Data Models

The activity type currently represents events such as:

- download
- modify
- rename
- move
- delete

The Activity model contains an ID, file ID, time, type, filename, and description.

The FileRecord model contains an ID, name, path, extension, and size.

Mock activities currently demonstrate the history of a resume file:

1. Downloaded from LinkedIn.
2. Edited.
3. Renamed from `resume.pdf` to `resume_final.pdf`.
4. Moved from Downloads to Documents.

These are demonstration records, not verified operating-system events.

Important improvement: replace display-only time strings with real timestamps. Store timestamps consistently, preferably as ISO 8601 strings at the TypeScript boundary, and use a shared formatter for display labels such as "Today · 10:47" or "Yesterday · 18:42".

Never store human-readable date labels as the underlying database timestamp.

## 6. Existing UI Data Flow

The Home page owns the search query and selected file ID.

The search component receives the query and its change callback.

The Activity Timeline filters mock activities using text matching against the filename and description.

Clicking an activity selects its associated file. The Home page resolves that file and displays the File Inspector.

The File Inspector filters the activity history by file ID and renders the corresponding history items.

Keep state local to the components that need it. Do not introduce Redux, global state libraries, or Context API without a demonstrated requirement.

## 7. UI and UX Decisions

Use a premium, minimal dark interface.

Preferred:

- Clear typography and hierarchy.
- Restrained spacing and borders.
- Consistent icons from lucide-react.
- Subtle interactions and animation where useful.
- Concise event descriptions.
- Useful empty states and clear selection behavior.
- Responsive layouts that remain usable at different window sizes.

Avoid:

- Excessive gradients.
- Too many cards and borders.
- Unnecessary emojis.
- Generic AI dashboard styling.
- Decorative charts without a product purpose.
- Excessive animations.
- Large components that combine unrelated responsibilities.

The File Inspector should explain the selected file's history, not merely repeat the selected activity.

Show newest events first. Make event rows expandable only when meaningful, real details are available. Do not display fabricated raw events or claim that mock details are real.

Add multiple mock files when necessary to test search, selection, and history behavior.

## 8. Search Strategy

Start with structured filters, text matching, and sensible ranking.

Search should eventually support combinations of:

- Filename.
- Extension.
- File path.
- Event type.
- Date range.
- Source, when known.
- Previous filename.
- Current filename.

Example searches:

- "resume renamed yesterday"
- "PDFs downloaded yesterday"
- "files moved to Documents"
- "recently modified files"

Do not start with a complex NLP pipeline or add an LLM just to interpret simple search queries.

First build reliable, understandable search behavior. Add semantic search only if actual user needs justify it.

## 9. Filesystem Monitoring

The eventual Windows application should record relevant file events, including:

- Creation.
- Modification.
- Rename.
- Move.
- Deletion.

Evaluate Windows directory-change notifications as an initial monitoring approach. Design carefully for buffer overflow, duplicate notifications, directory recursion, application restarts, and recovery.

Investigate NTFS USN Journal support later if it provides meaningful benefits for recovering missed events or understanding renames and moves.

Important limitations:

- Universal copy tracking is not guaranteed.
- Download source attribution is best-effort.
- Identifying which application modified a file is not always possible.
- A deleted file's contents may no longer be accessible.
- File identity and rename detection require careful handling.

Do not promise capabilities until they have been implemented and tested.

Do not implement a kernel minifilter driver for the initial version.

## 10. SQLite and Data Architecture

SQLite should become the local source of truth for persisted file history.

Before integrating it:

- Define file and event records.
- Decide how file identity and paths are represented.
- Define timestamp conventions.
- Plan indexes and migration strategy.
- Consider duplicate event handling.
- Plan efficient history queries and search.
- Verify compatibility with the selected Electron and native module versions.

Do not assume a Node.js SQLite package automatically works in Electron. Verify compatibility and choose an appropriate integration strategy.

For large histories, load older activity incrementally. Prefer a real database cursor or stable pagination strategy rather than loading thousands of rows at once.

Do not call mock-array slicing real database pagination.

## 11. Electron Security

Keep Electron security enabled.

Required principles:

- `contextIsolation: true`.
- `nodeIntegration: false`.
- A narrow, typed preload API.
- Validated IPC messages.
- Explicitly defined operations.
- No unrestricted Node.js access from the renderer.
- No direct database access from React components.
- No arbitrary filesystem operations exposed to the renderer.

The renderer should request supported operations through the preload bridge. The main process should validate requests and perform privileged operations.

## 12. Planned Implementation Order

### Phase 1 — Stabilize the UI Prototype

- Audit the existing UI.
- Improve the timestamp model and formatting.
- Ensure histories are ordered newest first.
- Make expandable event details data-driven.
- Add multiple mock files.
- Test search, selection, empty states, and the inspector.
- Fix TypeScript errors and remove obsolete styles.

### Phase 2 — Design Persistent Storage

- Define database schema and relationships.
- Choose an Electron-compatible SQLite integration.
- Implement migrations and repository/service boundaries.
- Persist file records and activity events.

### Phase 3 — Integrate Electron APIs

- Define typed preload APIs.
- Implement narrow, validated IPC handlers.
- Keep privileged operations in the main process.
- Test security boundaries and error handling.

### Phase 4 — Implement File Monitoring

- Allow users to select and manage tracked folders.
- Monitor relevant filesystem events.
- Normalize and deduplicate notifications.
- Track renames and moves carefully.
- Handle restarts, overflow, and recovery.
- Test against real files and folders.

### Phase 5 — Build Search and Reliability

- Implement database-backed filters and ranking.
- Add efficient history pagination.
- Improve error states and monitoring status.
- Test large histories and performance.
- Add packaging and Windows installer support.

This roadmap is a plan, not a claim that these features already exist.

## 13. How to Collaborate and Make Changes

The developer is learning while building FileTrail using AI-assisted coding. Explain meaningful decisions before implementing them.

For important tasks, explain:

1. What we are building.
2. Why it is needed.
3. The viable alternatives.
4. Why the proposed approach fits FileTrail.
5. Which files will change.
6. How to verify the implementation.

Work in small, reviewable milestones.

Inspect existing code before editing. Reuse working components where sensible. Make minimal changes that solve the actual problem.

Do not rewrite working files merely to match a preferred style.

Do not change unrelated components, dependencies, architecture, or UI without justification.

Never silently discard existing functionality.

After each meaningful change:

- Explain what changed.
- List the relevant files.
- Report the tests or checks actually run.
- State any known limitations.
- Explain how the developer can verify the result.

Do not claim tests passed if they were not run.

## 14. Immediate Next Step

First inspect the actual repository and compare it with this document.

Provide a concise audit containing:

- Current architecture.
- What is implemented.
- What is incomplete.
- Bugs or inconsistencies found.
- Important differences between the repository and this context.
- The single best next task and why.

Do not immediately implement the entire roadmap or perform a broad refactor.

Wait for approval before major changes. Small, clearly necessary audit-related observations can be reported without modifying files.

## 15. Non-Negotiable Rules

- Preserve the existing working project.
- Never fabricate file history or real-world events.
- Do not build all planned phases simultaneously.
- Do not introduce AI/LLM infrastructure without a justified need.
- Do not compromise Electron security for convenience.
- Do not overengineer the prototype.
- Keep privacy and local-first behavior central.
- Prioritize correctness, clarity, and maintainability over speed.
- Make architecture and product decisions understandable to the developer.
