export interface ExamQuestion {
  id: number; // 0-indexed (0 to 59)
  number: number; // 1-indexed (1 to 60)
  prompt: string;
  choices: [string, string, string, string];
}

export interface ExamPage {
  pageNumber: number;
  section: string;
  subSection?: string;
  passage?: string;
  dialogue?: { speaker: string; text: string }[];
  questions: ExamQuestion[];
}

export const MOCK_EXAM_PAGES: ExamPage[] = [
  {
    pageNumber: 1,
    section: "Part 1: Speaking & Everyday Communication (1–3)",
    subSection: "Situation: At the university library",
    dialogue: [
      { speaker: "Seth", text: "Excuse me, (1) __________ if anyone is sitting here?" },
      { speaker: "Librarian", text: "(2) __________. You can take this seat." },
      { speaker: "Seth", text: "Thank you so much. Also, could you please tell me (3) __________?" },
      { speaker: "Librarian", text: "The copy machines are right beside the reference counter on the first floor." }
    ],
    questions: [
      {
        id: 0,
        number: 1,
        prompt: "Choose the best expression to fill in blank (1).",
        choices: ["do you mind", "would you like", "are you sure", "is it possible"]
      },
      {
        id: 1,
        number: 2,
        prompt: "Choose the best expression to fill in blank (2).",
        choices: ["Not at all", "Never mind", "Of course not you", "You're welcome"]
      },
      {
        id: 2,
        number: 3,
        prompt: "Choose the best expression to fill in blank (3).",
        choices: ["where the photocopier is", "how the photocopier operates", "which photocopier is available", "when the photocopier opens"]
      }
    ]
  },
  {
    pageNumber: 2,
    section: "Part 1: Speaking & Communication (4–6)",
    subSection: "In a common room (4–6)",
    dialogue: [
      { speaker: "Seth", text: "Do you know (4) __________ in the theater?" },
      { speaker: "Amber", text: "(5) __________ What type of movies do you like?" },
      { speaker: "Seth", text: "Horror films. Others are just too boring and make me feel sleepy. How about you?" },
      { speaker: "Amber", text: "(6) __________. I prefer reading books, for my imagination will not be circumscribed." }
    ],
    passage: "So many times have I been disappointed with the movies just because they were not the same as how I imagined them while reading from the books.",
    questions: [
      {
        id: 3,
        number: 4,
        prompt: "Choose the best expression to fill in blank (4).",
        choices: ["what I like", "which show is popular", "if there’s anything good", "how long that film has been"]
      },
      {
        id: 4,
        number: 5,
        prompt: "Choose the best expression to fill in blank (5).",
        choices: ["Not really, I haven't checked.", "I doubt it very much.", "Sounds great to me.", "Certainly not today."]
      },
      {
        id: 5,
        number: 6,
        prompt: "Choose the best expression to fill in blank (6).",
        choices: ["Quite the opposite", "Same here actually", "I agree with you", "I don't mind at all"]
      }
    ]
  },
  {
    pageNumber: 3,
    section: "Part 1: Speaking & Communication (7–10)",
    subSection: "A person new in town (7–10)",
    dialogue: [
      { speaker: "Karen", text: "Excuse me. (7) __________. Could you tell me how to go to the bus terminal?" },
      { speaker: "Susan", text: "Of course. Keep walking along the street and take the third left. (8) __________." },
      { speaker: "Karen", text: "Thank you so much. I have only been here for three days, and the city is quite large. (9) __________." },
      { speaker: "Susan", text: "(10) __________. Have a pleasant stay in our city!" }
    ],
    questions: [
      {
        id: 6,
        number: 7,
        prompt: "Choose the best expression to fill in blank (7).",
        choices: ["I’m a stranger around here", "I know this neighborhood", "I just missed my bus", "I’m heading out today"]
      },
      {
        id: 7,
        number: 8,
        prompt: "Choose the best expression to fill in blank (8).",
        choices: ["You can't miss it", "You should avoid it", "It is nowhere nearby", "Take your time walking"]
      },
      {
        id: 8,
        number: 9,
        prompt: "Choose the best expression to fill in blank (9).",
        choices: ["I really appreciate your guidance", "I couldn't care less", "It is none of your concern", "You are fully excused"]
      },
      {
        id: 9,
        number: 10,
        prompt: "Choose the best expression to fill in blank (10).",
        choices: ["My pleasure", "Don't mention it to others", "No question at all", "Never mind"]
      }
    ]
  },
  {
    pageNumber: 4,
    section: "Part 2: Reading Comprehension (11–16)",
    subSection: "Passage 1: Coastal Ecosystems and Mangroves",
    passage: "Mangrove forests are vital coastal ecosystems that protect shorelines from erosion and severe storm surges. Their dense root systems trap sediments, slowing water flow and stabilizing the coastline. Moreover, they provide critical nurseries for juvenile fish and absorb vast amounts of carbon dioxide from the atmosphere, mitigating the impacts of climate change.",
    questions: [
      {
        id: 10,
        number: 11,
        prompt: "What is the primary function of mangrove root systems mentioned in the passage?",
        choices: ["Trapping sediments and stabilizing shorelines", "Attracting predatory sea birds", "Preventing rainfall in coastal zones", "Drying out wetlands"]
      },
      {
        id: 11,
        number: 12,
        prompt: "The word 'vital' in the first sentence is closest in meaning to __________.",
        choices: ["essential", "optional", "decorative", "fragile"]
      },
      {
        id: 12,
        number: 13,
        prompt: "According to the passage, mangrove forests serve as nurseries for __________.",
        choices: ["young marine species", "terrestrial wildlife", "migratory birds", "agricultural crops"]
      },
      {
        id: 13,
        number: 14,
        prompt: "How do mangroves contribute to mitigating climate change?",
        choices: ["By sequestering carbon dioxide", "By creating offshore barriers", "By increasing ocean temperatures", "By purifying rainwater"]
      },
      {
        id: 14,
        number: 15,
        prompt: "What can be inferred if coastal mangrove forests are destroyed?",
        choices: ["Shoreline erosion will likely accelerate", "Fish populations will dramatically grow", "Storm surges will become weaker", "Sediments will permanently dissolve"]
      },
      {
        id: 15,
        number: 16,
        prompt: "Which title best captures the theme of the passage?",
        choices: ["The Ecological Value of Mangroves", "The Danger of Coastal Erosion", "Carbon Footprints of Oceans", "Modern Marine Biology"]
      }
    ]
  },
  {
    pageNumber: 5,
    section: "Part 2: Reading Comprehension (17–22)",
    subSection: "Passage 2: Artificial Intelligence in Modern Classrooms",
    passage: "As artificial intelligence tools become integrated into educational institutions, educators are experiencing a notable paradigm shift. Adaptive algorithms analyze students' learning speeds in real-time, tailoring exercises to individual needs. However, educational psychologists caution that relying too heavily on automated feedback might diminish essential human collaboration and critical dialogue.",
    questions: [
      {
        id: 16,
        number: 17,
        prompt: "The term 'paradigm shift' implies a __________.",
        choices: ["fundamental change in approach", "minor temporary disruption", "complete decline in standards", "gradual loss of interest"]
      },
      {
        id: 17,
        number: 18,
        prompt: "What benefit of adaptive algorithms is highlighted in the text?",
        choices: ["Customizing lessons to individual pace", "Eliminating human teachers entirely", "Automating school lunch programs", "Shortening school semesters"]
      },
      {
        id: 18,
        number: 19,
        prompt: "Why are psychologists cautious about automated systems?",
        choices: ["They may reduce human collaboration", "They consume too much electricity", "They cannot grade mathematical equations", "They distract students with graphics"]
      },
      {
        id: 19,
        number: 20,
        prompt: "The author's perspective toward classroom AI is best described as __________.",
        choices: ["balanced and objective", "hostile and cynical", "blindly optimistic", "completely indifferent"]
      },
      {
        id: 20,
        number: 21,
        prompt: "Which approach would the author most likely support?",
        choices: ["Combining AI tools with teacher guidance", "Replacing textbooks with automated bots", "Banning computers during study hours", "Eliminating peer group discussions"]
      },
      {
        id: 21,
        number: 22,
        prompt: "In the passage, the word 'diminish' can be replaced by __________.",
        choices: ["lessen", "accelerate", "strengthen", "celebrate"]
      }
    ]
  },
  {
    pageNumber: 6,
    section: "Part 3: Structure & Writing - Cloze Test (23–28)",
    subSection: "Passage: Nutrition and Cognitive Focus",
    passage: "Good nutrition is critical for cognitive development. Students who consume balanced meals (23) __________ higher concentration levels in morning lectures. Scientists (24) __________ that skipping breakfast leads to fatigue, (25) __________ negatively impacts problem-solving performance. Therefore, schools (26) __________ encourage healthy dietary choices. Nutritionists also recommend (27) __________ adequate hydration throughout the day, as mild dehydration (28) __________ mental alertness.",
    questions: [
      {
        id: 22,
        number: 23,
        prompt: "Choose the correct grammatical form for blank (23).",
        choices: ["consistently demonstrate", "consistent demonstrating", "to demonstrate consistency", "demonstrating consistent"]
      },
      {
        id: 23,
        number: 24,
        prompt: "Choose the correct verb tense for blank (24).",
        choices: ["have observed", "were observing", "will have been observed", "had been observed"]
      },
      {
        id: 24,
        number: 25,
        prompt: "Choose the correct relative pronoun for blank (25).",
        choices: ["which", "who", "whom", "whose"]
      },
      {
        id: 25,
        number: 26,
        prompt: "Choose the correct modal auxiliary for blank (26).",
        choices: ["ought to", "used to", "would rather", "had better not"]
      },
      {
        id: 26,
        number: 27,
        prompt: "Choose the correct form for blank (27).",
        choices: ["maintaining", "to have maintained", "maintain", "maintained"]
      },
      {
        id: 27,
        number: 28,
        prompt: "Choose the word that fits blank (28) best.",
        choices: ["impairs", "enhances", "relieves", "promotes"]
      }
    ]
  },
  {
    pageNumber: 7,
    section: "Part 3: Vocabulary in Context (29–34)",
    subSection: "Sentence Completion with Academic Vocabulary",
    passage: "Choose the most appropriate word to complete each sentence logically and grammatically.",
    questions: [
      {
        id: 28,
        number: 29,
        prompt: "The committee reached a __________ decision after reviewing all available evidence.",
        choices: ["unanimous", "skeptical", "ambiguous", "reckless"]
      },
      {
        id: 29,
        number: 30,
        prompt: "Due to severe weather conditions, the outdoor sports festival was __________ until next week.",
        choices: ["postponed", "commenced", "demolished", "accelerated"]
      },
      {
        id: 30,
        number: 31,
        prompt: "The researcher provided a __________ explanation that clarified the intricate theoretical model.",
        choices: ["lucid", "confusing", "vague", "tedious"]
      },
      {
        id: 31,
        number: 32,
        prompt: "Public transport fares have remained __________ despite recent fluctuations in fuel costs.",
        choices: ["stable", "volatile", "unpredictable", "hazardous"]
      },
      {
        id: 32,
        number: 33,
        prompt: "Volunteers worked tirelessly to __________ emergency relief packages to flood victims.",
        choices: ["distribute", "confiscate", "accumulate", "withhold"]
      },
      {
        id: 33,
        number: 34,
        prompt: "Regular cardiovascular exercise is widely acknowledged to __________ feelings of chronic stress.",
        choices: ["alleviate", "exacerbate", "manufacture", "provoke"]
      }
    ]
  },
  {
    pageNumber: 8,
    section: "Part 4: Sentence Structure & Grammar (35–40)",
    subSection: "Advanced Grammar & Syntax",
    questions: [
      {
        id: 34,
        number: 35,
        prompt: "Neither the head professor nor the teaching assistants __________ aware of the schedule change.",
        choices: ["were", "was", "has been", "is being"]
      },
      {
        id: 35,
        number: 36,
        prompt: "Had we known the morning flight was delayed, we __________ at home longer.",
        choices: ["would have stayed", "will stay", "stayed", "had stayed"]
      },
      {
        id: 36,
        number: 37,
        prompt: "The new campus regulations require that every visitor __________ their student pass at the entrance.",
        choices: ["present", "presents", "presented", "is presenting"]
      },
      {
        id: 37,
        number: 38,
        prompt: "Scarcely __________ into the examination hall when the final warning bell rang.",
        choices: ["had they walked", "they walked", "did they walk", "they had walked"]
      },
      {
        id: 38,
        number: 39,
        prompt: "The laboratory team developed a smart battery __________ lifespan extends up to five years.",
        choices: ["whose", "which", "where", "that it"]
      },
      {
        id: 39,
        number: 40,
        prompt: "The lecturer spoke with such conviction __________ every listener in the auditorium was convinced.",
        choices: ["that", "so", "as", "than"]
      }
    ]
  },
  {
    pageNumber: 9,
    section: "Part 5: Critical Reading & Data Analysis (41–50)",
    subSection: "Passage: Campus Clubs and Student Well-being",
    passage: "According to a nationwide university survey, students participating in extracurricular societies report a 24% higher level of subjective well-being than non-participating peers. Team sports and performing arts showed the strongest correlation with stress resilience, whereas academic debate societies were notably correlated with analytical problem solving and civic engagement.",
    questions: [
      {
        id: 40,
        number: 41,
        prompt: "What is the primary conclusion of the university survey?",
        choices: ["Extracurricular societies correlate positively with well-being", "Club membership reduces overall study hours", "Sports should replace formal lectures", "Debate societies cause high emotional distress"]
      },
      {
        id: 41,
        number: 42,
        prompt: "Which activity had the highest correlation with stress resilience?",
        choices: ["Team sports and performing arts", "Competitive academic debate", "Individual online gaming", "Solo library study"]
      },
      {
        id: 42,
        number: 43,
        prompt: "Students in debate societies showed noticeable gains in __________.",
        choices: ["analytical problem solving", "physical stamina", "accent imitation", "artistic design"]
      },
      {
        id: 43,
        number: 44,
        prompt: "The word 'subjective' implies that the measured well-being is based on __________.",
        choices: ["personal feelings and experiences", "laboratory blood samples", "numeric exam score averages", "teacher assessments"]
      },
      {
        id: 44,
        number: 45,
        prompt: "What would the survey researchers most likely recommend?",
        choices: ["Encouraging student participation in diverse campus clubs", "Disbanding all sports clubs to focus on tests", "Mandating daily debate training for all majors", "Eliminating student club funding"]
      },
      {
        id: 45,
        number: 46,
        prompt: "Which statement is directly supported by the survey data?",
        choices: ["Non-participating students reported lower subjective well-being", "Club members guaranteed graduation with honors", "Sports players scored highest on debate quizzes", "Debaters had lower resilience than average"]
      },
      {
        id: 46,
        number: 47,
        prompt: "Why does the author cite '24% higher' in the text?",
        choices: ["To provide quantitative evidence for the findings", "To question the validity of the survey", "To criticize earlier educational research", "To demonstrate high membership fees"]
      },
      {
        id: 47,
        number: 48,
        prompt: "The word 'correlation' in the passage refers to a __________.",
        choices: ["mutual connection or relationship", "direct physical cause and effect", "sudden disagreement between parties", "statistical computation error"]
      },
      {
        id: 48,
        number: 49,
        prompt: "In this context, the word 'peers' means __________.",
        choices: ["fellow university students", "academic professors", "university administrators", "guidance counselors"]
      },
      {
        id: 49,
        number: 50,
        prompt: "What aspects of student life were measured in the survey?",
        choices: ["Subjective well-being and resilience", "Physical sprint speed", "Post-graduation salaries", "Standardized test score gains"]
      }
    ]
  },
  {
    pageNumber: 10,
    section: "Part 6: Synthesis & Advanced Reading (51–60)",
    subSection: "Passage: Sustainable Architecture and Green Urbanism",
    passage: "Sustainable architecture is rapidly transitioning from a niche preference to a mainstream standard. Contemporary architects incorporate passive solar heating, rainwater harvesting, and recycled composite materials. These green buildings significantly decrease carbon footprints while lowering long-term operational expenditures.",
    questions: [
      {
        id: 50,
        number: 51,
        prompt: "What key transition in sustainable architecture is highlighted?",
        choices: ["From a niche preference to a mainstream standard", "From urban high-rises to rural timber cottages", "From energy efficiency to pure ornament", "From affordable materials to rare metals"]
      },
      {
        id: 51,
        number: 52,
        prompt: "Passive solar heating is an example of __________.",
        choices: ["energy-efficient architectural design", "artificial fossil fuel heating", "rainwater collection technique", "interior acoustic treatment"]
      },
      {
        id: 52,
        number: 53,
        prompt: "What dual benefits do green buildings provide?",
        choices: ["Lower carbon footprints and reduced running costs", "Increased building height and higher rent", "No maintenance requirements whatsoever", "Replacing sunlight with fluorescent bulbs"]
      },
      {
        id: 53,
        number: 54,
        prompt: "The word 'expenditures' is closest in meaning to __________.",
        choices: ["expenses", "investments", "revenues", "donations"]
      },
      {
        id: 54,
        number: 55,
        prompt: "Which material is explicitly mentioned as being used in green buildings?",
        choices: ["Recycled composite materials", "Imported marble and gold leaf", "Single-use plastic sheeting", "Untreated coal tar"]
      },
      {
        id: 55,
        number: 56,
        prompt: "Why are property developers motivated to adopt sustainable methods?",
        choices: ["Long-term savings on utility expenditures", "Guaranteed subsidies without review", "Zero initial construction expenses", "Immediate exemption from all zoning laws"]
      },
      {
        id: 56,
        number: 57,
        prompt: "The tone of the passage towards green architecture is best described as __________.",
        choices: ["supportive and progressive", "skeptical and hesitant", "nostalgic for traditional brick", "dismissive of modern methods"]
      },
      {
        id: 57,
        number: 58,
        prompt: "It can be inferred that conventional buildings generally __________.",
        choices: ["incur higher long-term operating costs than green buildings", "are completely impervious to carbon emissions", "always use recycled composite materials", "require passive solar heating"]
      },
      {
        id: 58,
        number: 59,
        prompt: "The word 'niche' indicates that green architecture was previously __________.",
        choices: ["appealing only to a specialized segment", "universally mandated by national building codes", "completely rejected by all civil engineers", "the sole construction technique available"]
      },
      {
        id: 59,
        number: 60,
        prompt: "What is the best overall title for this reading passage?",
        choices: ["The Rise of Sustainable Architecture", "How Rainwater Is Harvested", "The History of Fossil Fuels", "Building Skyscrapers in Cities"]
      }
    ]
  }
];

export const TOTAL_MOCK_QUESTIONS = 60;
export const TOTAL_MOCK_PAGES = MOCK_EXAM_PAGES.length;

export function getPageForQuestion(questionId: number): number {
  const page = MOCK_EXAM_PAGES.find((p) =>
    p.questions.some((q) => q.id === questionId)
  );
  return page ? page.pageNumber : 1;
}
