/**
 * Proudly Afrikan Build - Type Definitions
 * Ecosystem: STUDY (Learn), QUIZ (Test), BUILD (Create)
 */

export type PlatformId = 'study' | 'quiz' | 'build';

export type ToolType =
  | 'exam'
  | 'worksheet'
  | 'lesson-plan'
  | 'pdf-quiz'
  | 'pdf-studypack'
  | 'presentation'
  | 'course-builder'
  | 'learning-path';

export interface SubjectCategory {
  id: string;
  name: string;
  isAfrican?: boolean;
  description: string;
  subtopics: string[];
}

export type GradeLevel =
  | 'Primary / Elementary (Grades 1-5)'
  | 'Junior Secondary / Middle School (Grades 6-8)'
  | 'Senior Secondary / High School (Grades 9-12)'
  | 'Tertiary / Undergraduate'
  | 'Postgraduate / Professional'
  | 'Adult & Lifelong Learner';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Rigorous / Olympiad';

// 1. Exam Generator
export interface ExamQuestion {
  id: string;
  number?: number;
  questionNumber?: number;
  type?: 'multiple-choice' | 'short-answer' | 'essay' | 'problem-solving' | 'true-false' | string;
  prompt?: string;
  text?: string;
  marks: number;
  options?: string[]; // for multiple choice
  correctAnswer?: string;
  markingGuidance: string;
  rubricCriteria?: string[];
}

export interface ExamSection {
  id?: string;
  title: string;
  instructions: string;
  totalMarks?: number;
  marks?: number;
  questions: ExamQuestion[];
}

export interface ExamResource {
  id: string;
  toolType?: string;
  title: string;
  institutionHeader?: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  totalMarks: number;
  generalInstructions?: string[];
  instructions?: string;
  sections: ExamSection[];
  overallMarkingNotes?: string;
  createdAt: string;
}

// 2. Worksheet Generator
export interface WorksheetActivity {
  id?: string;
  activityNumber?: number;
  type?: 'fill-in-blanks' | 'matching' | 'structured-questions' | 'practical-exercise' | 'diagram-labeling' | 'critical-thinking' | string;
  title: string;
  instructions: string;
  items?: {
    id?: string;
    prompt?: string;
    question?: string;
    scaffoldingOrClues?: string;
    blankLinesCount?: number;
    answerKey?: string;
    explanation?: string;
  }[];
  questions?: any[];
  points?: number;
}

export interface WorksheetResource {
  id: string;
  toolType?: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  difficulty: DifficultyLevel;
  totalMarks?: number;
  learningObjectives?: string[];
  estimatedCompletionTimeMinutes?: number;
  estimatedDurationMinutes?: number;
  instructions?: string;
  studentHeaderFields?: { name: boolean; date: boolean; score: boolean; class: boolean };
  introductionOrOverview?: string;
  activities?: WorksheetActivity[];
  exercises?: any[];
  sections?: any[];
  teacherSolutionsNote?: string;
  teacherNotes?: string;
  createdAt: string;
}

// 3. Lesson Plan Generator
export interface LessonPhase {
  phase?: string;
  phaseName?: string;
  durationMinutes: number;
  teacherActions?: string;
  teacherActivity?: string;
  learnerActions?: string;
  studentActivity?: string;
  keyQuestionsOrCheckpoints?: string[];
  materialsNeeded?: string[];
}

export interface LessonPlanResource {
  id: string;
  toolType?: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  durationMinutes: number;
  curriculumStandardsOrTheme?: string;
  objectives?: string[];
  learningObjectives?: any;
  keyVocabulary?: { term: string; definition: string }[];
  requiredResourcesAndMaterials?: string[];
  prerequisites?: string[];
  materialsNeeded?: string[];
  phases: LessonPhase[];
  assessmentStrategy?: any;
  differentiation?: any;
  reflectionNotes?: string;
  createdAt: string;
}

// 4. PDF -> Quiz
export interface PdfQuizQuestion {
  id: string;
  number?: number;
  questionNumber?: number;
  question: string;
  type?: 'multiple-choice' | 'true-false' | 'short-answer' | string;
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceQuote?: string;
  sourceReferenceQuote?: string;
  groundingQuote?: string;
}

export interface PdfQuizResource {
  id: string;
  toolType?: string;
  title: string;
  subject?: string;
  topic?: string;
  sourceDocName?: string;
  sourceDocumentName?: string;
  sourceDocSummary?: string;
  summaryOfDocument?: string;
  gradeLevel: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  questions: PdfQuizQuestion[];
  afrikanQuizCompatibilityTag?: string;
  createdAt: string;
}

// 5. PDF -> Study Pack
export interface StudyPackConcept {
  id?: string;
  concept?: string;
  conceptName?: string;
  summary?: string;
  explanation?: string;
  inDepthExplanation?: string;
  importance?: string;
  realWorldApplication?: string;
  realWorldExampleOrApplication?: string;
  contextualRelevance?: string;
  africanContext?: string;
}

export interface StudyPackResource {
  id: string;
  toolType?: string;
  title: string;
  subject?: string;
  topic?: string;
  sourceDocName?: string;
  sourceDocumentName?: string;
  documentOverview?: string;
  overview?: string;
  gradeLevel: string;
  keyConcepts: StudyPackConcept[];
  essentialGlossary: { term: string; definition: string; context?: string }[];
  highYieldTakeaways?: string[];
  highYieldRevisionPoints?: string[];
  selfCheckQuestions: { question: string; answer?: string; expectedAnswer?: string; hint?: string }[];
  activeRecallActivities?: string[];
  afrikanStudyCompatibilityTag?: string;
  createdAt: string;
}

export type PdfStudyPackResource = StudyPackResource;

// 6. Presentation Generator
export interface PresentationSlide {
  id?: string;
  slideNumber: number;
  slideType?: 'title' | 'content' | 'comparison' | 'case-study' | 'summary' | 'q-and-a' | string;
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  speakerNotes: string;
  suggestedVisualOrDiagram?: string;
  visualOrMediaSuggestion?: string;
  visualSuggestion?: string;
  discussionOrEngagementPrompt?: string;
  discussionPrompt?: string;
}

export type SlideItem = PresentationSlide;

export interface PresentationResource {
  id: string;
  toolType?: string;
  title: string;
  subtitle?: string;
  subject: string;
  topic: string;
  gradeLevel?: string;
  targetAudience?: string;
  themeOrColorMood?: string;
  presentationStyle?: string;
  presentationOverview?: string;
  learningObjectives?: string[];
  slidesCount?: number;
  slideCount?: number;
  slides: PresentationSlide[];
  conclusionTakeaway?: string;
  createdAt: string;
}

// 7. Course Builder
export interface CourseLesson {
  id?: string;
  lessonNumber?: number;
  title?: string;
  lessonTitle?: string;
  learningObjective?: string;
  keyConcepts?: string[];
  recommendedActivity?: string;
  estimatedMinutes?: number;
  estimatedDurationMinutes?: number;
  summary?: string;
  learningOutcomes?: string[];
  keyLearningOutcomes?: string[];
  format?: 'Lecture' | 'Discussion' | 'Practical Lab' | 'Case Study' | 'Assessment' | string;
  deliveryFormat?: 'Lecture' | 'Discussion' | 'Practical Lab' | 'Case Study' | 'Assessment' | string;
  linkedResource?: {
    type: ToolType;
    title: string;
  };
}

export interface CourseModule {
  id?: string;
  moduleNumber: number;
  title: string;
  description?: string;
  overview?: string;
  estimatedHours?: number;
  lessons: CourseLesson[];
  assessment?: string;
}

export interface CourseResource {
  id: string;
  toolType?: string;
  title: string;
  subtitle?: string;
  subject: string;
  topic?: string;
  gradeLevel?: string;
  description?: string;
  durationWeeks?: number;
  prerequisites?: string[];
  courseObjectives?: string[];
  courseLearningOutcomes?: string[];
  learningOutcomes?: string[];
  targetAudience?: string;
  totalEstimatedHours?: number;
  estimatedTotalHours?: number;
  modules: CourseModule[];
  assessmentAndGradingOutline?: string;
  createdAt: string;
}

// 8. Learning Path Builder
export interface MilestoneProject {
  title?: string;
  deliverableDescription?: string;
  validationCriteria?: string;
}

export interface LearningPathMilestone {
  milestoneNumber: number;
  phaseName: string;
  targetWeeks: string;
  keyObjectives: string[];
  recommendedResources?: string[];
  milestoneProject?: string | MilestoneProject;
}

export interface LearningPathStage {
  id?: string;
  stageNumber?: number;
  tier?: 'Foundation / Beginner' | 'Intermediate / Practitioner' | 'Advanced / Specialist' | 'Mastery & Capstone' | string;
  stageName?: string;
  title?: string;
  description?: string;
  focusDescription?: string;
  estimatedWeeks?: number;
  competenciesToMaster?: string[];
  keyCompetenciesToMaster?: string[];
  recommendedModulesOrTopics?: string[];
  milestoneProjectOrAssessment?: string;
  milestoneProject?: MilestoneProject | any;
  prerequisitesBeforeEntry?: string[];
}

export interface LearningPathResource {
  id: string;
  toolType?: string;
  title: string;
  subject: string;
  topic?: string;
  goal?: string;
  startingLevel?: string;
  targetLevel?: string;
  targetGoalOrCareer?: string;
  targetCareerOrEducationalGoal?: string;
  totalEstimatedDuration?: string;
  estimatedTotalWeeks?: number;
  estimatedTotalDurationMonths?: number;
  overview?: string;
  overallDescription?: string;
  learningOutcomes?: string[];
  milestones?: LearningPathMilestone[];
  stages?: LearningPathStage[];
  certificationOrExitMilestone?: string;
  createdAt: string;
}

// Universal Saved Resource Envelope
export interface SavedResource {
  id: string;
  toolType: ToolType;
  title: string;
  subject: string;
  topic?: string;
  gradeLevel?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  tags?: string[];
  data:
    | ExamResource
    | WorksheetResource
    | LessonPlanResource
    | PdfQuizResource
    | StudyPackResource
    | PresentationResource
    | CourseResource
    | LearningPathResource;
}
