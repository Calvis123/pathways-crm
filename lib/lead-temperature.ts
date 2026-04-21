export type LeadTemperatureStatus = "cold" | "warm" | "hot";

export interface LeadTemperatureSignals {
  contactCount: number;
  responseCount: number;
  engagementCount: number;
  followUpCount: number;
  highIntentCount: number;
  lastInteractionAt: string | null;
}

export interface LeadTemperatureScoreConfig {
  firstContact: number;
  firstResponse: number;
  followUpInteraction: number;
  highIntentAction: number;
  inactivityPenaltyMild: number;
  inactivityPenaltySevere: number;
  noResponsePenalty: number;
}

export interface LeadTemperatureThresholdConfig {
  staleDays: number;
  warmRecencyDays: number;
  hotRecencyDays: number;
  inactivityMildDays: number;
  inactivitySevereDays: number;
  noResponseDays: number;
  coldMax: number;
  warmMax: number;
}

export interface LeadTemperatureConfig {
  score: LeadTemperatureScoreConfig;
  thresholds: LeadTemperatureThresholdConfig;
}

export interface LeadTemperatureResult {
  status: LeadTemperatureStatus;
  label: "Cold" | "Warm" | "Hot";
  colorName: "Yellow" | "Green" | "Red";
  score: number;
  daysSinceLastActivity: number | null;
  reasons: string[];
  breakdown: {
    firstContact: number;
    firstResponse: number;
    followUps: number;
    highIntent: number;
    inactivityPenalty: number;
    noResponsePenalty: number;
  };
}

export const defaultLeadTemperatureConfig: LeadTemperatureConfig = {
  score: {
    firstContact: 10,
    firstResponse: 20,
    followUpInteraction: 10,
    highIntentAction: 25,
    inactivityPenaltyMild: -10,
    inactivityPenaltySevere: -20,
    noResponsePenalty: -10
  },
  thresholds: {
    staleDays: 7,
    warmRecencyDays: 5,
    hotRecencyDays: 3,
    inactivityMildDays: 4,
    inactivitySevereDays: 7,
    noResponseDays: 3,
    coldMax: 15,
    warmMax: 40
  }
};

function daysSince(timestamp: string | null, now = new Date()) {
  if (!timestamp) return null;
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return null;
  const msInDay = 1000 * 60 * 60 * 24;
  return Math.floor((now.getTime() - value) / msInDay);
}

export function classifyLeadTemperature(
  signals: LeadTemperatureSignals,
  config: LeadTemperatureConfig = defaultLeadTemperatureConfig,
  now = new Date()
): LeadTemperatureResult {
  const daysSinceLastActivity = daysSince(signals.lastInteractionAt, now);
  const firstContactPoints = signals.contactCount > 0 ? config.score.firstContact : 0;
  const firstResponsePoints = signals.responseCount > 0 ? config.score.firstResponse : 0;
  const followUpPoints = Math.min(3, Math.max(0, signals.followUpCount)) * config.score.followUpInteraction;
  const highIntentPoints = Math.max(0, signals.highIntentCount) * config.score.highIntentAction;

  let inactivityPenalty = 0;
  if (daysSinceLastActivity !== null && daysSinceLastActivity >= config.thresholds.inactivitySevereDays) {
    inactivityPenalty = config.score.inactivityPenaltySevere;
  } else if (daysSinceLastActivity !== null && daysSinceLastActivity >= config.thresholds.inactivityMildDays) {
    inactivityPenalty = config.score.inactivityPenaltyMild;
  }

  const noResponsePenalty =
    signals.contactCount >= 2 &&
    signals.responseCount === 0 &&
    daysSinceLastActivity !== null &&
    daysSinceLastActivity >= config.thresholds.noResponseDays
      ? config.score.noResponsePenalty
      : 0;

  const score = firstContactPoints + firstResponsePoints + followUpPoints + highIntentPoints + inactivityPenalty + noResponsePenalty;

  const isColdByHardRule =
    signals.contactCount === 0 ||
    (signals.contactCount >= 2 && signals.responseCount === 0) ||
    (daysSinceLastActivity !== null && daysSinceLastActivity >= config.thresholds.staleDays);

  const isHotByHardRule =
    (signals.responseCount >= 2 || signals.highIntentCount >= 1) &&
    signals.highIntentCount >= 1 &&
    daysSinceLastActivity !== null &&
    daysSinceLastActivity <= config.thresholds.hotRecencyDays;

  const isWarmByHardRule =
    signals.contactCount >= 1 &&
    (signals.responseCount >= 1 || signals.engagementCount >= 1) &&
    daysSinceLastActivity !== null &&
    daysSinceLastActivity <= config.thresholds.warmRecencyDays;

  let status: LeadTemperatureStatus;
  if (isColdByHardRule) {
    status = "cold";
  } else if (isHotByHardRule) {
    status = "hot";
  } else if (isWarmByHardRule) {
    status = "warm";
  } else if (score <= config.thresholds.coldMax) {
    status = "cold";
  } else if (score <= config.thresholds.warmMax) {
    status = "warm";
  } else {
    status = "hot";
  }

  const reasons: string[] = [];
  if (signals.contactCount === 0) reasons.push("No contact recorded yet.");
  if (signals.contactCount >= 2 && signals.responseCount === 0) reasons.push("Multiple follow-ups sent with no response.");
  if (signals.highIntentCount > 0) reasons.push("High-intent action detected (booking/pricing/details request).");
  if (signals.responseCount >= 1) reasons.push("Lead has responded or interacted.");
  if (daysSinceLastActivity !== null) reasons.push(`Last activity ${daysSinceLastActivity} day(s) ago.`);

  return {
    status,
    label: status === "cold" ? "Cold" : status === "warm" ? "Warm" : "Hot",
    colorName: status === "cold" ? "Yellow" : status === "warm" ? "Green" : "Red",
    score,
    daysSinceLastActivity,
    reasons,
    breakdown: {
      firstContact: firstContactPoints,
      firstResponse: firstResponsePoints,
      followUps: followUpPoints,
      highIntent: highIntentPoints,
      inactivityPenalty,
      noResponsePenalty
    }
  };
}
