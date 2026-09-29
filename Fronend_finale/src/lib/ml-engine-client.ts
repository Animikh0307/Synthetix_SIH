import {
  bandOf,
  type Assessment,
  type CheckIn,
  type HrRecord,
  type RiskDriver,
} from "./personnel-data";

/**
 * Base URL of the RakshaMitra ML Engine (FastAPI: XGBoost + SHAP + VADER).
 * Runs as a separate Python service -- see /rakshamitra_ml in the ML repo.
 * Override with ML_API_URL in the server's environment (this file only
 * ever runs server-side, inside TanStack Start server functions, so the
 * URL never reaches the browser bundle).
 */
const ML_API_URL = process.env["ML_API_URL"] ?? "http://127.0.0.1:8000";
const ML_API_TIMEOUT_MS = 4000;

// --- Shapes returned by POST /assess on the FastAPI side (api.py) ---
type MlTopFactor = {
  feature: string;
  value: number;
  impact: number;
  direction: "increased" | "decreased";
};

type MlAssessResponse = {
  predicted_risk_label: "Low" | "Medium" | "High";
  risk_score_0_100: number;
  class_probabilities: Record<string, number>;
  top_factors: MlTopFactor[];
  journal_sentiment: {
    sentiment_compound: number;
    sentiment_neg: number;
    sentiment_neu: number;
    sentiment_pos: number;
  };
  recommendation: string | null;
  requires_human_review: boolean;
};

/** checkIn.stress is 1-10 where 10 = most stressed; the model was trained
 * on a 1-10 mood score where 10 = best mood. Invert to line them up. */
function stressToMoodScore(stress: number): number {
  return Math.max(1, Math.min(10, 11 - stress));
}

function toMlPayload(serviceId: string, record: HrRecord, checkIn: CheckIn) {
  return {
    service_id: serviceId,
    age: record.age,
    years_of_service: record.yearsOfService,
    deployment_days_last_90: record.deploymentDaysLast90,
    avg_duty_hours_per_week: record.dutyHoursPerWeek,
    consecutive_duty_days: record.consecutiveDutyDays,
    leave_days_taken_last_90: record.leaveDaysTakenLast90,
    sleep_hours_avg: record.avgSleepHours,
    family_contact_days_last_30: record.familyContactDays30,
    disciplinary_flags_last_180: record.disciplinaryFlags180,
    prior_incident_count: record.priorIncidents,
    self_report_mood_score: stressToMoodScore(checkIn.stress),
    journal_text: checkIn.note ?? "",
    top_k: 6,
  };
}

/** Turns SHAP top_factors into the 0-100 bars DriverBars already renders,
 * scaled as each factor's share of the total impact among the returned
 * factors (so the bars are comparable to each other, not to a fixed scale). */
function toDrivers(topFactors: MlTopFactor[]): RiskDriver[] {
  const totalAbsImpact = topFactors.reduce((sum, f) => sum + Math.abs(f.impact), 0) || 1;
  return topFactors
    .map((f) => ({
      label: f.feature,
      value: Math.round((Math.abs(f.impact) / totalAbsImpact) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

function toSentiment(journalSentiment: MlAssessResponse["journal_sentiment"]) {
  const compound = journalSentiment.sentiment_compound;
  // Standard VADER thresholds.
  const sentiment: Assessment["sentiment"] =
    compound >= 0.05 ? "positive" : compound <= -0.05 ? "negative" : "neutral";
  // Display-only rescale for the existing "risk adjusted by ±N" copy --
  // the real contribution is already inside risk_score_0_100 via SHAP.
  const sentimentDelta = Math.round(-compound * 10);
  return { sentiment, sentimentDelta };
}

/**
 * Calls the RakshaMitra ML Engine (XGBoost + SHAP + VADER) and maps its
 * response onto the frontend's existing Assessment shape, so none of the
 * display components (DriverBars, band colors, etc.) need to change.
 * Throws on network failure, timeout, or a non-2xx response -- callers
 * should catch and fall back to the local scoreAssessment() formula.
 */
export async function assessViaMlEngine(
  serviceId: string,
  record: HrRecord,
  checkIn: CheckIn,
): Promise<Assessment> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${ML_API_URL}/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toMlPayload(serviceId, record, checkIn)),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`ML Engine returned ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as MlAssessResponse;
  const score = Math.round(data.risk_score_0_100);
  const { sentiment, sentimentDelta } = toSentiment(data.journal_sentiment);

  return {
    record,
    checkIn,
    score,
    band: bandOf(score),
    sentiment,
    sentimentDelta,
    drivers: toDrivers(data.top_factors),
    submittedAt: new Date().toISOString(),
    engineSource: "ml-engine",
    recommendation: data.recommendation,
    requiresHumanReview: data.requires_human_review,
  };
}
