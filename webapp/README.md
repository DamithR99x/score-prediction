# T20 Intelligence Console

A modern, broadcast-quality replacement frontend for the existing Gradio
prediction app. React + Vite + Tailwind, dark-mode by default, cricket-themed.

## Quick start

```bash
cd webapp
npm install
npm run dev
```

Opens at http://localhost:5173. The UI ships with a local heuristic mock so
you can demo it without the backend (see [src/api.js](src/api.js)).

## Wiring to the Modal backend

The existing app uses `modal.Cls.from_name("t20-scorer-service", "Scorer")`
from Python. The cleanest production wiring is:

1. Add a tiny FastAPI shim (e.g. on the same Hugging Face Space, or a
   second Modal `@app.function` that runs `@web_endpoint`) that exposes
   `POST /predict` and forwards the prompt to the deployed `Scorer` class.
2. Set `VITE_PREDICT_URL=https://your-endpoint/predict` before
   `npm run build`.

Response shape expected by the UI:

```json
{ "score": 178, "confidence": 0.82, "range": [168, 188] }
```

If your model only returns a number, the frontend will still render — just
return `{ "score": <int> }` and the confidence/range UI will degrade
gracefully.

## Structure

- `src/App.jsx` — page composition + state
- `src/lib/cricket.js` — domain helpers (mirrors `research/app.py`)
- `src/components/*` — modular dashboard pieces
