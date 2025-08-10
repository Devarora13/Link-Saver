# Link Saver + Auto-Summary

Full-stack take-home implementing authentication, bookmark saving with automatic content summarization (Jina AI), tagging, dark mode, and drag & drop reordering.

## Tech Stack
- Frontend: React 19, React Router, TailwindCSS, Vite
- Backend: Node.js, Express
- Auth: Custom (bcrypt + JWT)
- Data Store: JSON file (for simplicity) – could be swapped for SQLite / Mongo.
- Testing: Jest + Supertest (API tests)

## Features
Core:
- Email/password register & login (hashed passwords, JWT auth)
- Save URL -> fetch page title, favicon, and AI summary via `https://r.jina.ai/http://<URL>`
- List & delete bookmarks

Enhancements:
- Tagging of bookmarks & filter by tag
- Dark mode persisted to localStorage
- Drag & drop reordering persisted via reorder endpoint
- Robust summary fetch with timeout & graceful fallback

## API Endpoints (subset)
- POST /api/auth/register { email, password }
- POST /api/auth/login { email, password } -> { token }
- GET /api/bookmarks[?tag=tag]
- POST /api/bookmarks { url, tags[] }
- POST /api/bookmarks/reorder { order: [ids...] }
- DELETE /api/bookmarks/:id

## Local Setup
Backend:
1. `cd server`
2. Create `.env` with `JWT_SECRET=change_me`
3. `npm install`
4. `npm run dev` (nodemon) or `npm start`

Frontend:
1. `cd client`
2. `npm install`
3. `npm run dev`

Visit: http://localhost:5173 (default Vite port) – ensure server runs on 5000 or adjust fetch URLs.

## Tests
`cd server && npm test`

## Screenshots
Place screenshots in `docs/` directory:
1. Registration/Login UI
2. Dashboard with bookmarks + dark mode
3. Drag & drop demonstration

## Time Spent
Approx: (Fill after completion) ~3.5h split across setup, feature dev, polish, tests, docs.

## Possible Next Steps
- Migrate persistence to SQLite or MongoDB
- Add Google OAuth
- Pagination & search
- Rate limiting & input validation library (zod / joi)
- Optimistic UI & skeleton loaders for summaries

## License
MIT
