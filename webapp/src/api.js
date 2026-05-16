// Thin client for the Modal-backed prediction endpoint.
// In production, point VITE_PREDICT_URL at a small FastAPI shim or HF Space
// route that proxies the call to the Modal Scorer class (the same one
// research/app.py invokes via modal.Cls.from_name).

const ENDPOINT = import.meta.env.VITE_PREDICT_URL || '/api/predict';

export async function predictScore({ prompt, signal }) {
  // Mock mode for local dev when no backend is wired.
  if (import.meta.env.VITE_USE_MOCK === '1' || !import.meta.env.VITE_PREDICT_URL) {
    return mockPredict(prompt);
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) throw new Error(`Prediction failed (${res.status})`);
  return res.json(); // { score: number, confidence?: number, range?: [lo, hi] }
}

// Heuristic local mock so the UI is fully demoable without the backend.
function mockPredict(prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const runs = num(prompt, /Runs scored: (\d+)/);
      const overs = num(prompt, /Overs completed: ([\d.]+)/);
      const wkts = num(prompt, /Wickets lost: (\d+)/);
      const par = num(prompt, /Venue par score: (\d+)/) || 160;
      const last2 = num(prompt, /Runs in last 2 overs: (\d+)/);
      const bs = num(prompt, /Batting strength: ([\d.]+)/) || 5;

      const rr = overs > 0 ? runs / overs : 7;
      const oversLeft = Math.max(0, 20 - overs);
      const momentum = last2 / 2; // last 2 overs RR
      const projectedRR = 0.55 * rr + 0.35 * momentum + 0.10 * (par / 20);
      const wicketPenalty = Math.max(0, (wkts - 3)) * 4;
      const strengthBoost = (bs - 5) * 1.8;
      const projected = runs + projectedRR * oversLeft - wicketPenalty + strengthBoost;
      const score = Math.max(40, Math.round(projected));
      const spread = Math.round(8 + (oversLeft / 20) * 18);
      resolve({
        score,
        confidence: Math.max(0.45, 0.95 - (oversLeft / 20) * 0.45),
        range: [score - spread, score + spread],
      });
    }, 650);
  });
}

const num = (s, re) => {
  const m = s.match(re);
  return m ? Number(m[1]) : 0;
};
