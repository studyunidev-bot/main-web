export type ExamDocumentSection = {
  id: "tgat1" | "tgat2" | "tgat3";
  title: string;
  questionStart: number;
  questionCount: number;
  answerIndexStart: number;
  choiceCount: number;
  durationMinutes: number;
  examPdf: string;
  solutionPdf: string;
};

type ExamSectionSource = Omit<ExamDocumentSection, "answerIndexStart">;

const suppliedSetFourSections: Record<ExamDocumentSection["id"], ExamSectionSource> = {
  tgat1: {
    id: "tgat1",
    title: "TGAT1 การสื่อสารภาษาอังกฤษ",
    questionStart: 1,
    questionCount: 60,
    choiceCount: 4,
    durationMinutes: 60,
    examPdf: "/exams/tgat/tgat1-set-04.pdf",
    solutionPdf: "/solutions/tgat/tgat1-set-04.pdf",
  },
  tgat2: {
    id: "tgat2",
    title: "TGAT2 การคิดอย่างมีเหตุผล",
    questionStart: 61,
    questionCount: 80,
    choiceCount: 5,
    durationMinutes: 60,
    examPdf: "/exams/tgat/tgat2-set-04.pdf",
    solutionPdf: "/solutions/tgat/tgat2-set-04.pdf",
  },
  tgat3: {
    id: "tgat3",
    title: "TGAT3 สมรรถนะการทำงาน",
    questionStart: 141,
    questionCount: 60,
    choiceCount: 4,
    durationMinutes: 60,
    examPdf: "/exams/tgat/tgat3-set-04.pdf",
    solutionPdf: "/solutions/tgat/tgat3-set-04.pdf",
  },
};

const sectionsByProduct: Record<string, ExamDocumentSection["id"][]> = {
  tgat1: ["tgat1"],
  tgat2: ["tgat2"],
  tgat3: ["tgat3"],
  tgat23: ["tgat2", "tgat3"],
  "tgat-full": ["tgat1", "tgat2", "tgat3"],
};

export type ExamPlan = {
  sections: ExamDocumentSection[];
  questionCount: number;
  durationMinutes: number;
  hasSuppliedExam: boolean;
  sourceSet: "04";
};

export type ExamResponseType = "single" | "multiple" | "linked";

export function getExamResponseDetails(plan: ExamPlan, answerIndex: number) {
  const section = plan.sections.find(
    (item) =>
      answerIndex >= item.answerIndexStart &&
      answerIndex < item.answerIndexStart + item.questionCount,
  );
  if (section?.id !== "tgat3") {
    return { responseType: "single" as const, linkedQuestionNumber: undefined };
  }

  const localIndex = answerIndex - section.answerIndexStart;
  if (localIndex < 15) {
    const position = localIndex % 5;
    if (position === 2 || position === 3) {
      return {
        responseType: "linked" as const,
        linkedQuestionNumber: section.questionStart + localIndex + (position === 2 ? 1 : -1),
      };
    }
    return {
      responseType: position === 1 || position === 4 ? "multiple" as const : "single" as const,
      linkedQuestionNumber: undefined,
    };
  }

  if (localIndex < 30) {
    const position = (localIndex - 15) % 4;
    return {
      responseType: position === 0 || position === 3 ? "multiple" as const : "single" as const,
      linkedQuestionNumber: undefined,
    };
  }

  return { responseType: "single" as const, linkedQuestionNumber: undefined };
}

export function getExamPlan(productId: string, examSet = "A"): ExamPlan {
  const sectionIds = sectionsByProduct[productId] || [];
  let answerIndexStart = 0;
  const sections = sectionIds.map((id) => {
    const source = suppliedSetFourSections[id];
    const section = { ...source, answerIndexStart };
    answerIndexStart += section.questionCount;
    return section;
  });
  const setHasSuppliedFile = examSet.toUpperCase() === "A" || examSet === "4";

  return {
    sections: setHasSuppliedFile ? sections : [],
    questionCount: sections.reduce((count, section) => count + section.questionCount, 0) || 60,
    durationMinutes: sections.reduce((minutes, section) => minutes + section.durationMinutes, 0) || 180,
    hasSuppliedExam: sections.length > 0 && setHasSuppliedFile,
    sourceSet: "04",
  };
}

export function getExamQuestionDetails(plan: ExamPlan, answerIndex: number) {
  const section = plan.sections.find(
    (item) => answerIndex >= item.answerIndexStart && answerIndex < item.answerIndexStart + item.questionCount,
  );

  if (!section) return { questionNumber: answerIndex + 1, choiceCount: 4 };

  return {
    questionNumber: section.questionStart + answerIndex - section.answerIndexStart,
    choiceCount: section.choiceCount,
  };
}
