export type PenaltySituation = 
  | "ABSENT" 
  | "BEYOND_LIMIT" 
  | "IMPERSONATION" 
  | "CHEATING" 
  | "OTHERS";

export type PenaltyTarget = "INDIVIDUAL" | "TEAM_TOTAL" | "BOTH";

export interface PenaltyRuleConfig {
  defaultDeduction: number;
  defaultTarget: PenaltyTarget;
  action: "MARK_ABSENT" | "DEDUCT_MARKS" | "DISQUALIFY" | "DISQUALIFY_AND_DEDUCT" | "CUSTOM";
  label: string;
  disqualify?: boolean;
}

export type FestivalPenaltyRules = Record<PenaltySituation, PenaltyRuleConfig>;

export const DEFAULT_PENALTY_RULES: FestivalPenaltyRules = {
  ABSENT: {
    defaultDeduction: 0,
    defaultTarget: "INDIVIDUAL",
    action: "MARK_ABSENT",
    label: "Absent",
    disqualify: true
  },
  BEYOND_LIMIT: {
    defaultDeduction: 5,
    defaultTarget: "INDIVIDUAL",
    action: "DEDUCT_MARKS",
    label: "Beyond the Limit (Time / Rules)",
    disqualify: false
  },
  IMPERSONATION: {
    defaultDeduction: 20,
    defaultTarget: "TEAM_TOTAL",
    action: "DISQUALIFY_AND_DEDUCT",
    label: "Impersonation",
    disqualify: true
  },
  CHEATING: {
    defaultDeduction: 15,
    defaultTarget: "TEAM_TOTAL",
    action: "DISQUALIFY_AND_DEDUCT",
    label: "Cheating / Malpractice",
    disqualify: true
  },
  OTHERS: {
    defaultDeduction: 0,
    defaultTarget: "INDIVIDUAL",
    action: "CUSTOM",
    label: "Others",
    disqualify: false
  }
};

export function parsePenaltyRules(rawJson?: string | null): FestivalPenaltyRules {
  if (!rawJson) return DEFAULT_PENALTY_RULES;
  try {
    const parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    return {
      ABSENT: { ...DEFAULT_PENALTY_RULES.ABSENT, ...(parsed.ABSENT || {}) },
      BEYOND_LIMIT: { ...DEFAULT_PENALTY_RULES.BEYOND_LIMIT, ...(parsed.BEYOND_LIMIT || {}) },
      IMPERSONATION: { ...DEFAULT_PENALTY_RULES.IMPERSONATION, ...(parsed.IMPERSONATION || {}) },
      CHEATING: { ...DEFAULT_PENALTY_RULES.CHEATING, ...(parsed.CHEATING || {}) },
      OTHERS: { ...DEFAULT_PENALTY_RULES.OTHERS, ...(parsed.OTHERS || {}) },
    };
  } catch (e) {
    console.error("Failed to parse penaltyRules JSON, returning defaults", e);
    return DEFAULT_PENALTY_RULES;
  }
}
