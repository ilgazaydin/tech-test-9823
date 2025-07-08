# Spreadsheet Application

A React TypeScript spreadsheet with formula calculations and multi-tab synchronization.

## Live Demo

[https://tech-test-9823.vercel.app](https://tech-test-9823.vercel.app)

## Running the Project

**One command setup:**
```bash
./dev.sh
```

**Manual setup:**
```bash
npm install
npm run dev
```

Then manually open http://localhost:5173

## Tech Stack

- React 18 + TypeScript
- AG Grid (Community Edition)
- Web Workers (for formula evaluation)
- BroadcastChannel API (for tab sync)
- Vite (for fast development build)

## Testing Functionality

1. **Basic editing**: Click any cell and type values
2. **Formulas**: Enter `=A1+B2` or `=(A1*B2)+C3` to test calculations
3. **Multi-tab sync**: Open multiple tabs and see changes sync automatically
4. **Visual feedback**: Negative values flash red

## Notes
- Formulas are not persisted. Only the evaluated result is stored, due to time constraints.
- Real-time sync broadcasts the full grid state for simplicity. In a production-level app, you'd optimize this to broadcast diffs.

