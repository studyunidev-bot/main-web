/**
 * TGAT3 Dynamic Scoring Engine & Blueprint Preset
 * Supports the 4 official myTCAS Blueprint scoring modes:
 * 1. Single Choice (1 full point or 0)
 * 2. Weighted Single Choice (partial points per choice: 0.25, 0.50, 0.75, 1.00)
 * 3. Multiple Response (0.25 per correct selection status across 4 choices, 0 if completely unanswered)
 * 4. Linked Questions (paired evaluation: 2 points for accepted pair, 0 for mismatched/partial)
 */

export type TGAT3ScoringType = "single" | "weighted" | "multiple" | "linked";

export type TGAT3AcceptedPair = {
  q1: string; // Choice for first question (e.g. "1")
  q2: string; // Choice for second question (e.g. "1")
  score: number; // Score if matched (default 2.00)
};

export type TGAT3AnswerRule = {
  id: string;
  questionNumber: number;
  choiceCount?: number;
  partId: "part1" | "part2" | "part3" | "part4" | string;
  partTitle: string;
  responseType: TGAT3ScoringType;
  maxScore: number;
  // 1. Single Choice
  singleCorrectChoice?: string; // e.g. "2" or "B"
  // 2. Weighted Single Choice
  weightedScores?: Record<string, number>; // { "1": 0.25, "2": 0.50, "3": 0.75, "4": 1.00 }
  // 3. Multiple Response
  targetChoices?: string[]; // e.g. ["1", "3"]
  // 4. Linked Questions
  linkedPairQuestionNumber?: number; // e.g. 4
  acceptedPairs?: TGAT3AcceptedPair[];
  isSecondOfLinkedPair?: boolean; // True if this is the dependent question of a linked pair
  isReviewed?: boolean;
};

export type TGAT3ScoreSummary = {
  totalQuestions: number;
  rawTotalScore: number;
  scaledTotalScore: number; // Scaled to 100 max
  questionScores: Array<{
    questionNumber: number;
    pairedQuestionNumber?: number;
    partId: string;
    rawScore: number;
    maxRawScore: number;
  }>;
  sections: Array<{
    partId: string;
    partTitle: string;
    questionCount: number;
    rawScore: number;
    maxRawScore: number;
    scaledScore: number; // Contribution to the 100-point section total
  }>;
};

/**
 * Normalizes choice letters/numbers to standard "1", "2", "3", "4" or strings
 */
export function normalizeChoice(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  const str = String(val).trim().toUpperCase();
  if (str === "A") return "1";
  if (str === "B") return "2";
  if (str === "C") return "3";
  if (str === "D") return "4";
  if (str === "E") return "5";
  return str;
}

/**
 * Normalizes array of choices
 */
export function normalizeChoices(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(normalizeChoice).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(/[,/ ]+/)
      .map(normalizeChoice)
      .filter(Boolean);
  }
  return [normalizeChoice(String(val))].filter(Boolean);
}

/**
 * 1. Single Choice Grading: 1 full point or 0
 */
export function gradeSingleChoice(rule: TGAT3AnswerRule, studentAnswer: unknown): number {
  const answer = normalizeChoice(studentAnswer as string);
  const correct = normalizeChoice(rule.singleCorrectChoice);
  if (!answer || !correct) return 0;
  return answer === correct ? rule.maxScore : 0;
}

/**
 * 2. Weighted Single Choice Grading: Partial points depending on choice
 */
export function gradeWeightedChoice(rule: TGAT3AnswerRule, studentAnswer: unknown): number {
  const answer = normalizeChoice(studentAnswer as string);
  if (!answer || !rule.weightedScores) return 0;
  const score = rule.weightedScores[answer];
  return typeof score === "number" && Number.isFinite(score) ? score : 0;
}

/**
 * 3. Multiple Response Grading:
 * - Compares all four choices, awarding 0.25 per correctly marked or unmarked choice.
 * - Special condition: 0 points if student left the entire question unanswered.
 */
export function gradeMultipleResponse(rule: TGAT3AnswerRule, studentAnswer: unknown): number {
  const allChoices = ["1", "2", "3", "4"];
  const validChoices = new Set(allChoices);
  const selected = normalizeChoices(studentAnswer).filter((choice) =>
    validChoices.has(choice),
  );
  if (selected.length === 0) {
    // Special myTCAS condition: Leaving the question empty gives 0 points
    return 0;
  }

  const targets = (rule.targetChoices || [])
    .map(normalizeChoice)
    .filter((choice) => validChoices.has(choice));
  let correctCount = 0;

  for (const choice of allChoices) {
    const isTarget = targets.includes(choice);
    const isSelected = selected.includes(choice);
    // Student gets 0.25 if they chose a target, or correctly didn't choose a non-target
    if ((isTarget && isSelected) || (!isTarget && !isSelected)) {
      correctCount += 1;
    }
  }

  return Number(((correctCount * rule.maxScore) / 4).toFixed(4));
}

/**
 * 4. Linked Questions Grading:
 * - Evaluates question 1 and question 2 as an inseparable pair.
 * - If combination matches an accepted pair -> returns score (usually 2.00).
 * - Otherwise 0.
 */
export function gradeLinkedQuestions(
  rule: TGAT3AnswerRule,
  q1Answer: unknown,
  q2Answer: unknown
): number {
  const a1 = normalizeChoice(q1Answer as string);
  const a2 = normalizeChoice(q2Answer as string);
  if (!a1 || !a2 || !rule.acceptedPairs || rule.acceptedPairs.length === 0) {
    return 0;
  }

  const match = rule.acceptedPairs.find(
    (pair) => normalizeChoice(pair.q1) === a1 && normalizeChoice(pair.q2) === a2
  );

  return match ? match.score : 0;
}

/**
 * General grader for any TGAT3 question row
 */
export function gradeTGAT3Question(
  rule: TGAT3AnswerRule,
  studentAnswer: unknown,
  pairedAnswer?: unknown
): number {
  if (rule.isSecondOfLinkedPair) {
    // Second question of a pair does not get independent score
    return 0;
  }

  switch (rule.responseType) {
    case "single":
      return gradeSingleChoice(rule, studentAnswer);
    case "weighted":
      return gradeWeightedChoice(rule, studentAnswer);
    case "multiple":
      return gradeMultipleResponse(rule, studentAnswer);
    case "linked":
      return gradeLinkedQuestions(rule, studentAnswer, pairedAnswer);
    default:
      return 0;
  }
}

/**
 * Scale the configured raw maximum across all TGAT3 question types to 100.
 */
export function calculateTGAT3Summary(
  rules: TGAT3AnswerRule[],
  studentAnswers: Record<number, unknown>
): TGAT3ScoreSummary {
  const partMap: Record<
    string,
    {
      partId: string;
      partTitle: string;
      questionCount: number;
      rawScore: number;
      maxRawScore: number;
    }
  > = {
    part1: {
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      questionCount: 0,
      rawScore: 0,
      maxRawScore: 0,
    },
    part2: {
      partId: "part2",
      partTitle: "2. การแก้ไขปัญหาที่ซับซ้อน",
      questionCount: 0,
      rawScore: 0,
      maxRawScore: 0,
    },
    part3: {
      partId: "part3",
      partTitle: "3. การบริหารจัดการอารมณ์",
      questionCount: 0,
      rawScore: 0,
      maxRawScore: 0,
    },
    part4: {
      partId: "part4",
      partTitle: "4. การเป็นพลเมืองที่มีส่วนร่วมของสังคม",
      questionCount: 0,
      rawScore: 0,
      maxRawScore: 0,
    },
  };

  let totalRaw = 0;
  const questionScores: TGAT3ScoreSummary["questionScores"] = [];
  const linkedSecondaryQuestionNumbers = new Set(
    rules
      .filter(
        (rule) =>
          rule.responseType === "linked" &&
          !rule.isSecondOfLinkedPair &&
          rule.linkedPairQuestionNumber,
      )
      .map((rule) => rule.linkedPairQuestionNumber as number),
  );

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const isLinkedSecondary =
      rule.isSecondOfLinkedPair ||
      linkedSecondaryQuestionNumbers.has(rule.questionNumber);
    const pid = rule.partId || "part1";
    if (!partMap[pid]) {
      partMap[pid] = {
        partId: pid,
        partTitle: rule.partTitle || pid,
        questionCount: 0,
        rawScore: 0,
        maxRawScore: 0,
      };
    }

    partMap[pid].questionCount += 1;
    partMap[pid].maxRawScore += isLinkedSecondary ? 0 : rule.maxScore;

    let pairedAns: unknown = undefined;
    if (rule.responseType === "linked" && rule.linkedPairQuestionNumber) {
      const pairedIndex = rules.findIndex(
        (r) => r.questionNumber === rule.linkedPairQuestionNumber
      );
      if (pairedIndex !== -1) {
        pairedAns = studentAnswers[pairedIndex];
      }
    }

    const earned = isLinkedSecondary
      ? 0
      : gradeTGAT3Question(rule, studentAnswers[i], pairedAns);
    partMap[pid].rawScore += earned;
    totalRaw += earned;
    if (!isLinkedSecondary) {
      questionScores.push({
        questionNumber: rule.questionNumber,
        ...(rule.responseType === "linked" && rule.linkedPairQuestionNumber
          ? { pairedQuestionNumber: rule.linkedPairQuestionNumber }
          : {}),
        partId: pid,
        rawScore: earned,
        maxRawScore: rule.maxScore,
      });
    }
  }

  const totalMaxRawScore = Object.values(partMap).reduce(
    (total, part) => total + part.maxRawScore,
    0,
  );
  const sections = Object.values(partMap).map((part) => {
    // Each section contributes its share of the configured total maximum.
    const scaled =
      totalMaxRawScore > 0 ? (part.rawScore / totalMaxRawScore) * 100 : 0;
    return {
      ...part,
      rawScore: Number(part.rawScore.toFixed(2)),
      maxRawScore: Number(part.maxRawScore.toFixed(2)),
      scaledScore: Number(scaled.toFixed(2)),
    };
  });

  const scaledTotal = totalMaxRawScore > 0
    ? Math.min(100, (totalRaw / totalMaxRawScore) * 100)
    : 0;

  return {
    totalQuestions: rules.length,
    rawTotalScore: Number(totalRaw.toFixed(2)),
    scaledTotalScore: Number(scaledTotal.toFixed(2)),
    questionScores,
    sections,
  };
}

/**
 * Generates the official 60-question standard TGAT3 Blueprint preset
 */
export function getTGAT3BlueprintPreset(): TGAT3AnswerRule[] {
  const rules: TGAT3AnswerRule[] = [];

  // Part 1: การสร้างคุณค่าและนวัตกรรม (15 questions: 3 situations x 5 questions)
  // Each situation:
  // q1: single
  // q2: multiple
  // q3-q4: linked pair
  // q5: multiple
  for (let s = 0; s < 3; s++) {
    const base = s * 5 + 1;
    rules.push({
      id: `tgat3_q${base}`,
      questionNumber: base,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "single",
      maxScore: 1.0,
      singleCorrectChoice: "2",
      isReviewed: true,
    });
    rules.push({
      id: `tgat3_q${base + 1}`,
      questionNumber: base + 1,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "multiple",
      maxScore: 1.0,
      targetChoices: ["1", "3"],
      isReviewed: true,
    });
    rules.push({
      id: `tgat3_q${base + 2}`,
      questionNumber: base + 2,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "linked",
      maxScore: 2.0,
      linkedPairQuestionNumber: base + 3,
      acceptedPairs: [
        { q1: "1", q2: "1", score: 2.0 },
        { q1: "2", q2: "3", score: 2.0 },
        { q1: "3", q2: "2", score: 2.0 },
        { q1: "4", q2: "4", score: 2.0 },
      ],
      isReviewed: true,
    });
    rules.push({
      id: `tgat3_q${base + 3}`,
      questionNumber: base + 3,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "linked",
      maxScore: 0.0,
      linkedPairQuestionNumber: base + 2,
      isSecondOfLinkedPair: true,
      isReviewed: true,
    });
    rules.push({
      id: `tgat3_q${base + 4}`,
      questionNumber: base + 4,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "multiple",
      maxScore: 1.0,
      targetChoices: ["2", "4"],
      isReviewed: true,
    });
  }

  // Part 2: การแก้ไขปัญหาที่ซับซ้อน (15 questions: Questions 16 to 30)
  // Blueprint: Situations containing multiple response and weighted single choice
  // q1: multiple, q2: weighted, q3: weighted, q4: multiple
  const part2Structure: TGAT3ScoringType[] = [
    "multiple", "weighted", "weighted", "multiple", // situation 1 (q16-19)
    "multiple", "weighted", "weighted", "multiple", // situation 2 (q20-23)
    "multiple", "weighted", "weighted", "multiple", // situation 3 (q24-27)
    "multiple", "weighted", "weighted",             // situation 4 (q28-30)
  ];

  for (let i = 0; i < 15; i++) {
    const qNum = 16 + i;
    const type = part2Structure[i];
    if (type === "weighted") {
      rules.push({
        id: `tgat3_q${qNum}`,
        questionNumber: qNum,
        partId: "part2",
        partTitle: "2. การแก้ไขปัญหาที่ซับซ้อน",
        responseType: "weighted",
        maxScore: 1.0,
        weightedScores: { "1": 0.25, "2": 0.5, "3": 0.75, "4": 1.0 },
        isReviewed: true,
      });
    } else {
      rules.push({
        id: `tgat3_q${qNum}`,
        questionNumber: qNum,
        partId: "part2",
        partTitle: "2. การแก้ไขปัญหาที่ซับซ้อน",
        responseType: "multiple",
        maxScore: 1.0,
        targetChoices: ["1", "4"],
        isReviewed: true,
      });
    }
  }

  // Part 3: การบริหารจัดการอารมณ์ (15 questions: Questions 31 to 45)
  // All single choice
  for (let i = 0; i < 15; i++) {
    const qNum = 31 + i;
    rules.push({
      id: `tgat3_q${qNum}`,
      questionNumber: qNum,
      partId: "part3",
      partTitle: "3. การบริหารจัดการอารมณ์",
      responseType: "single",
      maxScore: 1.0,
      singleCorrectChoice: String((i % 4) + 1),
      isReviewed: true,
    });
  }

  // Part 4: การเป็นพลเมืองที่มีส่วนร่วมของสังคม (15 questions: Questions 46 to 60)
  // All single choice
  for (let i = 0; i < 15; i++) {
    const qNum = 46 + i;
    rules.push({
      id: `tgat3_q${qNum}`,
      questionNumber: qNum,
      partId: "part4",
      partTitle: "4. การเป็นพลเมืองที่มีส่วนร่วมของสังคม",
      responseType: "single",
      maxScore: 1.0,
      singleCorrectChoice: String(((i + 2) % 4) + 1),
      isReviewed: true,
    });
  }

  return rules;
}
