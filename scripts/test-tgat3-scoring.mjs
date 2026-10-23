import assert from "node:assert";
import {
  gradeSingleChoice,
  gradeWeightedChoice,
  gradeMultipleResponse,
  gradeLinkedQuestions,
  getTGAT3BlueprintPreset,
  calculateTGAT3Summary,
} from "../src/components/webb/tgat3-scoring.ts";

console.log("=== Testing TGAT3 Dynamic Scoring Engine ===");

// 1. Single Choice Testing
{
  const singleRule = {
    id: "q1",
    questionNumber: 1,
    partId: "part1",
    partTitle: "Part 1",
    responseType: "single",
    maxScore: 1.0,
    singleCorrectChoice: "2",
  };

  assert.strictEqual(gradeSingleChoice(singleRule, "2"), 1.0, "Single choice correct choice '2' must yield 1.0");
  assert.strictEqual(gradeSingleChoice(singleRule, "B"), 1.0, "Single choice letter 'B' must map to '2' and yield 1.0");
  assert.strictEqual(gradeSingleChoice(singleRule, "1"), 0.0, "Single choice wrong choice must yield 0");
  assert.strictEqual(gradeSingleChoice(singleRule, ""), 0.0, "Unanswered single choice must yield 0");
  console.log("✔ Single Choice tests passed");
}

// 2. Weighted Single Choice Testing
{
  const weightedRule = {
    id: "q2",
    questionNumber: 2,
    partId: "part2",
    partTitle: "Part 2",
    responseType: "weighted",
    maxScore: 1.0,
    weightedScores: { "1": 0.25, "2": 0.5, "3": 0.75, "4": 1.0 },
  };

  assert.strictEqual(gradeWeightedChoice(weightedRule, "1"), 0.25, "Choice 1 must give 0.25");
  assert.strictEqual(gradeWeightedChoice(weightedRule, "2"), 0.5, "Choice 2 must give 0.50");
  assert.strictEqual(gradeWeightedChoice(weightedRule, "3"), 0.75, "Choice 3 must give 0.75");
  assert.strictEqual(gradeWeightedChoice(weightedRule, "4"), 1.0, "Choice 4 must give 1.00");
  assert.strictEqual(gradeWeightedChoice(weightedRule, "D"), 1.0, "Choice D must map to 4 and give 1.00");
  assert.strictEqual(gradeWeightedChoice(weightedRule, ""), 0.0, "Unanswered weighted choice must give 0");
  console.log("✔ Weighted Single Choice tests passed");
}

// 3. Multiple Response Testing (The exact example from user prompt)
// Suppose answer key is: must choose 1 and 3, must not choose 2 and 4
{
  const multipleRule = {
    id: "q3",
    questionNumber: 3,
    partId: "part1",
    partTitle: "Part 1",
    responseType: "multiple",
    maxScore: 1.0,
    targetChoices: ["1", "3"],
  };

  // Case a: choose 1, 3 -> 1.00
  assert.strictEqual(gradeMultipleResponse(multipleRule, ["1", "3"]), 1.0, "Selecting [1, 3] must give 1.00");
  assert.strictEqual(gradeMultipleResponse(multipleRule, "1, 3"), 1.0, "Selecting '1, 3' string must give 1.00");

  // Case b: choose 1 only -> 0.75 (1 right, 2 right-unselected, 3 missed, 4 right-unselected)
  assert.strictEqual(gradeMultipleResponse(multipleRule, ["1"]), 0.75, "Selecting [1] must give 0.75");

  // Case c: choose 1, 2, 3 -> 0.75 (1 right, 2 wrong-selected, 3 right, 4 right-unselected)
  assert.strictEqual(gradeMultipleResponse(multipleRule, ["1", "2", "3"]), 0.75, "Selecting [1, 2, 3] must give 0.75");

  // Case d: choose 1, 2, 3, 4 -> 0.50 (1 right, 2 wrong, 3 right, 4 wrong)
  assert.strictEqual(gradeMultipleResponse(multipleRule, ["1", "2", "3", "4"]), 0.5, "Selecting [1, 2, 3, 4] must give 0.50");

  // Case e: choose nothing -> 0.00 (special myTCAS rule: empty question gives 0)
  assert.strictEqual(gradeMultipleResponse(multipleRule, []), 0.0, "Leaving empty must give 0.00");
  assert.strictEqual(gradeMultipleResponse(multipleRule, ""), 0.0, "Empty string must give 0.00");

  console.log("✔ Multiple Response tests passed");
}

// 4. Linked Questions Testing (The exact example from user prompt)
// Accepted pairs: 1-1, 2-3, 3-2, 4-4
{
  const linkedRule = {
    id: "q4",
    questionNumber: 4,
    partId: "part1",
    partTitle: "Part 1",
    responseType: "linked",
    maxScore: 2.0,
    linkedPairQuestionNumber: 5,
    acceptedPairs: [
      { q1: "1", q2: "1", score: 2.0 },
      { q1: "2", q2: "3", score: 2.0 },
      { q1: "3", q2: "2", score: 2.0 },
      { q1: "4", q2: "4", score: 2.0 },
    ],
  };

  assert.strictEqual(gradeLinkedQuestions(linkedRule, "1", "1"), 2.0, "Pair (1, 1) must give 2.00");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "2", "3"), 2.0, "Pair (2, 3) must give 2.00");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "3", "2"), 2.0, "Pair (3, 2) must give 2.00");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "4", "4"), 2.0, "Pair (4, 4) must give 2.00");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "A", "A"), 2.0, "Pair (A, A) must map to (1, 1) and give 2.00");

  // Mismatched or partial
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "1", "3"), 0.0, "Mismatched pair (1, 3) must give 0");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "2", "2"), 0.0, "Mismatched pair (2, 2) must give 0");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "1", ""), 0.0, "Missing second question must give 0");
  assert.strictEqual(gradeLinkedQuestions(linkedRule, "", "1"), 0.0, "Missing first question must give 0");

  console.log("✔ Linked Questions tests passed");
}

// 5. Blueprint Preset & Summary Testing
{
  const preset = getTGAT3BlueprintPreset();
  assert.strictEqual(preset.length, 60, "Preset must have exactly 60 questions");

  // Check part distributions
  const part1 = preset.filter((r) => r.partId === "part1");
  const part2 = preset.filter((r) => r.partId === "part2");
  const part3 = preset.filter((r) => r.partId === "part3");
  const part4 = preset.filter((r) => r.partId === "part4");

  assert.strictEqual(part1.length, 15, "Part 1 must have 15 questions");
  assert.strictEqual(part2.length, 15, "Part 2 must have 15 questions");
  assert.strictEqual(part3.length, 15, "Part 3 must have 15 questions");
  assert.strictEqual(part4.length, 15, "Part 4 must have 15 questions");

  console.log("✔ Blueprint Preset tests passed (60 questions distributed 15x4)");
}

console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
