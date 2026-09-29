# ML Engine integration

This project is the **secure-access-portal** frontend (sign-in, roles, masked
commander view) wired to the **RakshaMitra ML Engine** (FastAPI: XGBoost + SHAP + VADER),
the same way `duty-buddy-insight` was.

## Run it

1. Start the ML Engine (from the folder containing `api.py`, `risk_pipeline.py`,
   `explain_engine.py`, `sentiment_engine.py` and `model/`):

       uvicorn api:app --reload --port 8000

2. Start the frontend:

       cp .env.example .env      # ML_API_URL=http://127.0.0.1:8000
       bun install               # or: npm install
       bun run dev               # or: npm run dev

3. Sign in — Personnel: `PC-2041-88` / `raksha123` · Commander: `CMD-0007` / `command123`

If the ML Engine is unreachable, times out (4s) or errors, scoring silently falls back to
the local rule-based formula and the check-in page shows a **Fallback** badge instead of
**ML Engine**. Nothing breaks.

## What changed vs. the sign-in frontend

| File | Change |
| --- | --- |
| `src/lib/ml-engine-client.ts` | **New.** Server-side call to `POST /assess`; maps the response onto the existing `Assessment` shape. |
| `src/lib/readiness.functions.ts` | `submitCheckIn` and `applyAction` now score via the ML Engine with local fallback. Commander name-masking in `listAssessments` is kept. |
| `src/lib/personnel-data.ts` | HR records gain the 9 model features (age, years of service, duty hours, …); `Assessment` gains `engineSource`, `recommendation`, `requiresHumanReview`; shared `bandOf`. |
| `src/components/risk.tsx` | Re-exports the shared `bandOf` instead of defining a duplicate. |
| `src/routes/check-in.tsx` | "ML Engine / Fallback" badge + recommendation panel. |
| `src/routes/commander.tsx` | "ML Engine recommendation" panel in the drill-down. |
| `.env.example` | **New.** `ML_API_URL`. |

Sign-in, session, routing, and all styling are untouched.
