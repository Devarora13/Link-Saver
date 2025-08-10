# Client (React) – Link Saver

Implements UI for:
- Authentication (login / register)
- Bookmark list with auto summaries
- Tag filtering
- Dark mode toggle (persisted to localStorage)
- Drag & drop reordering (HTML5 DnD API)

## Development
1. `npm install`
2. `npm run dev`

Ensure backend running at `http://localhost:5000` or adjust fetch URLs in `pages/` components.

## Environment
No env vars required on client currently. Uses localStorage for:
- `token` (JWT)
- `theme` (light | dark)

## Structure
`src/pages/` route components: Login, Register, Dashboard.

## Future Enhancements
- Extract API layer
- Add optimistic updates & skeleton loaders
- Use React Query / TanStack Query for caching
- Convert to Next.js for SSR & edge caching
