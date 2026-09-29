export type CheckIn = {
  stress: number;
  recovery: "yes" | "partial" | "fatigued";
  workload: "manageable" | "slightly" | "highly";
  note: string;
};

export type HrRecord = {
  serviceId: string;
  name: string;
  unit: string;
  role: string;
  deploymentDays: number;
  transfers24m: number;
  dutySchedule: string;
  nightCycles: number;
  leavesDenied: number;
  leavesPending: number;
  avgSleepHours: number;
  highIntensity: boolean;
  trend: number;
  // --- ML-engine features (not shown in the HR summary card, but sent to
  // the RakshaMitra ML Engine's /assess endpoint alongside the check-in) ---
  age: number;
  yearsOfService: number;
  dutyHoursPerWeek: number;
  consecutiveDutyDays: number;
  deploymentDaysLast90: number;
  leaveDaysTakenLast90: number;
  familyContactDays30: number;
  disciplinaryFlags180: number;
  priorIncidents: number;
};

export type RiskDriver = { label: string; value: number };

export type Assessment = {
  record: HrRecord;
  checkIn: CheckIn;
  score: number;
  band: "low" | "elevated" | "high" | "red";
  sentiment: "negative" | "neutral" | "positive";
  sentimentDelta: number;
  drivers: RiskDriver[];
  submittedAt: string;
  // Populated when the assessment came from the real ML Engine (XGBoost +
  // SHAP + VADER) rather than the local fallback formula below.
  engineSource: "ml-engine" | "fallback";
  recommendation?: string | null;
  requiresHumanReview?: boolean;
};

/** Score band thresholds, shared by the fallback scorer and the ML-engine
 * client so both sources land on the same four-tier UI (low/elevated/high/red). */
export function bandOf(value: number): Assessment["band"] {
  return value > 80 ? "red" : value > 65 ? "high" : value >= 40 ? "elevated" : "low";
}

export const HR_RECORDS: HrRecord[] = [
  {
    serviceId: "PC-2041-88",
    name: "Cpl. N. Ramesh",
    unit: "Sector 07 · B-Wing",
    role: "Traffic Control",
    deploymentDays: 412,
    transfers24m: 0,
    dutySchedule: "Night · 4/ck",
    nightCycles: 4,
    leavesDenied: 2,
    leavesPending: 1,
    avgSleepHours: 4.1,
    highIntensity: true,
    trend: 9,
    age: 29,
    yearsOfService: 8,
    dutyHoursPerWeek: 76,
    consecutiveDutyDays: 21,
    deploymentDaysLast90: 58,
    leaveDaysTakenLast90: 2,
    familyContactDays30: 3,
    disciplinaryFlags180: 0,
    priorIncidents: 0,
  },
  {
    serviceId: "PC-2041-72",
    name: "Sgt. A. Kulkarni",
    unit: "Sector 07 · A-Wing",
    role: "Riot Control",
    deploymentDays: 268,
    transfers24m: 2,
    dutySchedule: "Rotating · 3/ck",
    nightCycles: 2,
    leavesDenied: 1,
    leavesPending: 0,
    avgSleepHours: 5.6,
    highIntensity: true,
    trend: 0,
    age: 33,
    yearsOfService: 11,
    dutyHoursPerWeek: 64,
    consecutiveDutyDays: 12,
    deploymentDaysLast90: 45,
    leaveDaysTakenLast90: 4,
    familyContactDays30: 6,
    disciplinaryFlags180: 0,
    priorIncidents: 0,
  },
  {
    serviceId: "PC-2041-55",
    name: "Cpl. R. Menon",
    unit: "Sector 07 · C-Wing",
    role: "Investigation",
    deploymentDays: 154,
    transfers24m: 1,
    dutySchedule: "Day · 2/ck",
    nightCycles: 0,
    leavesDenied: 0,
    leavesPending: 1,
    avgSleepHours: 6.4,
    highIntensity: true,
    trend: -3,
    age: 27,
    yearsOfService: 5,
    dutyHoursPerWeek: 52,
    consecutiveDutyDays: 6,
    deploymentDaysLast90: 20,
    leaveDaysTakenLast90: 6,
    familyContactDays30: 10,
    disciplinaryFlags180: 0,
    priorIncidents: 0,
  },
  {
    serviceId: "PC-2041-31",
    name: "Cpl. D. Patel",
    unit: "Sector 07 · Station Diary",
    role: "Admin Duty",
    deploymentDays: 88,
    transfers24m: 1,
    dutySchedule: "Day · 1/ck",
    nightCycles: 0,
    leavesDenied: 0,
    leavesPending: 0,
    avgSleepHours: 7.2,
    highIntensity: false,
    trend: -5,
    age: 31,
    yearsOfService: 7,
    dutyHoursPerWeek: 42,
    consecutiveDutyDays: 3,
    deploymentDaysLast90: 5,
    leaveDaysTakenLast90: 10,
    familyContactDays30: 14,
    disciplinaryFlags180: 0,
    priorIncidents: 0,
  },
  {
    serviceId: "PC-2041-19",
    name: "Insp. S. Iyer",
    unit: "Sector 07 · Control Room",
    role: "Control Room",
    deploymentDays: 331,
    transfers24m: 3,
    dutySchedule: "Night · 2/ck",
    nightCycles: 2,
    leavesDenied: 1,
    leavesPending: 1,
    avgSleepHours: 5.1,
    highIntensity: false,
    trend: 4,
    age: 38,
    yearsOfService: 15,
    dutyHoursPerWeek: 58,
    consecutiveDutyDays: 9,
    deploymentDaysLast90: 30,
    leaveDaysTakenLast90: 5,
    familyContactDays30: 5,
    disciplinaryFlags180: 1,
    priorIncidents: 0,
  },
  {
    serviceId: "PC-2041-04",
    name: "Hav. K. Bora",
    unit: "Sector 07 · Patrol",
    role: "Patrol",
    deploymentDays: 197,
    transfers24m: 0,
    dutySchedule: "Rotating · 2/ck",
    nightCycles: 1,
    leavesDenied: 0,
    leavesPending: 0,
    avgSleepHours: 6.8,
    highIntensity: false,
    trend: -2,
    age: 25,
    yearsOfService: 4,
    dutyHoursPerWeek: 48,
    consecutiveDutyDays: 5,
    deploymentDaysLast90: 15,
    leaveDaysTakenLast90: 8,
    familyContactDays30: 12,
    disciplinaryFlags180: 0,
    priorIncidents: 0,
  },
];

const NEGATIVE_LEXICON = [
  "tired",
  "exhausted",
  "fatigue",
  "stress",
  "stressed",
  "anxious",
  "angry",
  "sleep",
  "insomnia",
  "family",
  "sick",
  "pain",
  "pressure",
  "overload",
  "burnout",
  "denied",
  "hopeless",
  "alone",
  "unable",
  "hard",
  "worried",
];

const POSITIVE_LEXICON = [
  "fine",
  "good",
  "rested",
  "ready",
  "fit",
  "calm",
  "motivated",
  "support",
  "better",
  "recovered",
];

export function analyseSentiment(text: string) {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  let neg = 0;
  let pos = 0;
  for (const w of words) {
    if (NEGATIVE_LEXICON.includes(w)) neg += 1;
    if (POSITIVE_LEXICON.includes(w)) pos += 1;
  }
  const net = neg - pos;
  const sentiment: Assessment["sentiment"] =
    net > 0 ? "negative" : net < 0 ? "positive" : "neutral";
  const sentimentDelta = Math.max(-6, Math.min(16, net * 5));
  return { sentiment, sentimentDelta, negativeHits: neg };
}

export function scoreAssessment(record: HrRecord, checkIn: CheckIn) {
  const stressPart = checkIn.stress * 3.6;
  const recoveryPart =
    checkIn.recovery === "fatigued" ? 16 : checkIn.recovery === "partial" ? 8 : 0;
  const workloadPart = checkIn.workload === "highly" ? 16 : checkIn.workload === "slightly" ? 8 : 0;
  const sleepPart = Math.max(0, (7 - record.avgSleepHours) * 5);
  const deploymentPart = Math.min(14, record.deploymentDays / 30);
  const leavePart = record.leavesDenied * 4;
  const transferPart = record.transfers24m * 2;
  const { sentiment, sentimentDelta } = analyseSentiment(checkIn.note);

  const raw =
    stressPart +
    recoveryPart +
    workloadPart +
    sleepPart +
    deploymentPart +
    leavePart +
    transferPart +
    sentimentDelta;

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const band = bandOf(score);

  const drivers: RiskDriver[] = [
    { label: "Sleep disruption", value: Math.round(sleepPart * 5) },
    { label: "Self-reported stress", value: Math.round(stressPart * 2.7) },
    { label: "Workload pressure", value: Math.round((workloadPart + recoveryPart) * 3) },
    { label: "Deployment duration", value: Math.round(deploymentPart * 6) },
    { label: "Leave denials", value: Math.round(leavePart * 8) },
    { label: "Negative sentiment", value: Math.round(Math.max(0, sentimentDelta) * 6) },
  ]
    .map((d) => ({ ...d, value: Math.max(0, Math.min(100, d.value)) }))
    .sort((a, b) => b.value - a.value);

  return {
    score,
    band,
    drivers,
    sentiment,
    sentimentDelta,
    engineSource: "fallback" as const,
    recommendation: null,
    requiresHumanReview: band === "high" || band === "red",
  };
}

export const BAND_LABEL: Record<Assessment["band"], string> = {
  low: "Low",
  elevated: "Elev",
  high: "High",
  red: "Red",
};
