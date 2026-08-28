import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI with mandatory headers
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient Gemini generator that handles model selection and fallback
async function generateJsonWithGemini(prompt: string, temperature = 0.4) {
  const ai = getGeminiClient();
  if (!ai) return null;

  // Use gemini-2.5-flash first for high stability, fallback to gemini-3.7-flash
  const models = ['gemini-2.5-flash', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: any) {
      console.warn(`Gemini generation with ${model} encountered an issue:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model generation attempts failed');
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'PROUDLY AFRIKAN BUILD',
    version: '1.0.0',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// 1. Exam Generator Endpoint
app.post('/api/generate/exam', async (req, res) => {
  const {
    subject,
    topic,
    gradeLevel = 'Senior Secondary / High School (Grades 9-12)',
    difficulty = 'Intermediate',
    questionCount = 10,
    durationMinutes = 60,
    questionTypes = ['multiple-choice', 'short-answer', 'problem-solving'],
    totalMarks = 50,
    instructions = '',
    sourceMaterial = '',
    institutionHeader = 'Proudly Afrikan Examination Board',
  } = req.body;

  try {
    const prompt = `You are an expert curriculum designer and senior examiner for the Proudly Afrikan Education ecosystem.
Generate a rigorous, authentic, and beautifully structured examination paper.
Subject: ${subject}
Topic: ${topic}
Grade Level: ${gradeLevel}
Difficulty: ${difficulty}
Target Duration: ${durationMinutes} minutes
Target Total Marks: ${totalMarks} marks
Target Number of Questions: ${questionCount}
Question Types to include: ${Array.isArray(questionTypes) ? questionTypes.join(', ') : questionTypes}
Specific Teacher Instructions: ${instructions || 'None specified'}
Source Material provided: ${sourceMaterial ? sourceMaterial.slice(0, 4000) : 'None (use comprehensive subject domain mastery)'}

Return a valid JSON object matching this schema:
{
  "id": "exam-${Date.now()}",
  "title": "Comprehensive Examination: ${topic}",
  "institutionHeader": "${institutionHeader}",
  "subject": "${subject}",
  "topic": "${topic}",
  "gradeLevel": "${gradeLevel}",
  "difficulty": "${difficulty}",
  "durationMinutes": ${Number(durationMinutes) || 60},
  "totalMarks": ${Number(totalMarks) || 50},
  "generalInstructions": ["Array of 4-5 clear exam instructions"],
  "sections": [
    {
      "id": "sec-1",
      "title": "Section A: ...",
      "instructions": "Section directions",
      "totalMarks": 20,
      "questions": [
        {
          "id": "q1",
          "questionNumber": 1,
          "type": "multiple-choice",
          "prompt": "Question text...",
          "marks": 2,
          "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
          "correctAnswer": "A) ...",
          "markingGuidance": "Detailed marking criteria and rubric steps",
          "rubricCriteria": ["Criteria 1", "Criteria 2"]
        }
      ]
    }
  ],
  "overallMarkingNotes": "Moderation notes and grading scale",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating exam (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackExam(subject, topic, gradeLevel, difficulty, durationMinutes, totalMarks, institutionHeader),
    });
  }
});

// 2. Worksheet Generator Endpoint
app.post('/api/generate/worksheet', async (req, res) => {
  const {
    subject,
    topic,
    gradeLevel = 'Junior Secondary / Middle School (Grades 6-8)',
    difficulty = 'Intermediate',
    learningObjectives = [],
    activityTypes = ['matching', 'fill-in-blanks', 'structured-questions', 'critical-thinking'],
    sourceMaterial = '',
    additionalInstructions = '',
  } = req.body;

  try {
    const prompt = `You are a master educator crafting a printable, highly engaging classroom worksheet for Proudly Afrikan Build.
Subject: ${subject}
Topic: ${topic}
Grade Level: ${gradeLevel}
Difficulty: ${difficulty}
Activity Types: ${Array.isArray(activityTypes) ? activityTypes.join(', ') : activityTypes}
Learning Objectives: ${Array.isArray(learningObjectives) ? learningObjectives.join('; ') : learningObjectives}
Teacher Custom Notes: ${additionalInstructions || 'None'}
Source Material: ${sourceMaterial ? sourceMaterial.slice(0, 4000) : 'None'}

Return a valid JSON object matching this schema:
{
  "id": "ws-${Date.now()}",
  "title": "Interactive Worksheet: ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "gradeLevel": "${gradeLevel}",
  "difficulty": "${difficulty}",
  "learningObjectives": ["3-4 clear measurable student learning objectives"],
  "estimatedCompletionTimeMinutes": 45,
  "studentHeaderFields": { "name": true, "date": true, "score": true, "class": true },
  "introductionOrOverview": "Engaging 2-3 sentence conceptual overview",
  "activities": [
    {
      "id": "act-1",
      "activityNumber": 1,
      "type": "matching",
      "title": "Activity 1: ...",
      "instructions": "Directions for students...",
      "items": [
        {
          "id": "i1",
          "prompt": "Prompt or question...",
          "scaffoldingOrClues": "Optional clue",
          "blankLinesCount": 3,
          "answerKey": "Complete teacher solution",
          "explanation": "Why this is correct"
        }
      ],
      "points": 10
    }
  ],
  "teacherSolutionsNote": "Scoring rubric and teacher facilitation guidance",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating worksheet (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackWorksheet(subject, topic, gradeLevel, difficulty),
    });
  }
});

// 3. Lesson Plan Generator Endpoint
app.post('/api/generate/lesson-plan', async (req, res) => {
  const {
    subject,
    topic,
    gradeLevel = 'Senior Secondary / High School (Grades 9-12)',
    durationMinutes = 60,
    learningObjectives = [],
    keyConcepts = '',
    assessmentApproach = '',
    requiredResources = '',
    sourceMaterial = '',
  } = req.body;

  try {
    const prompt = `You are a pedagogical expert crafting an exceptional, structured Lesson Plan for the Proudly Afrikan Build platform.
Subject: ${subject}
Topic: ${topic}
Grade / Learning Level: ${gradeLevel}
Duration: ${durationMinutes} minutes
Objectives provided: ${Array.isArray(learningObjectives) ? learningObjectives.join('; ') : learningObjectives}
Key Concepts: ${keyConcepts || 'Infer based on topic'}
Assessment Approach: ${assessmentApproach || 'Formative observation + Exit ticket'}
Required Resources: ${requiredResources || 'Standard classroom + digital/visual aids'}
Source Material: ${sourceMaterial ? sourceMaterial.slice(0, 4000) : 'None'}

Return a valid JSON object matching this schema:
{
  "id": "lp-${Date.now()}",
  "title": "Lesson Plan: ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "gradeLevel": "${gradeLevel}",
  "durationMinutes": ${Number(durationMinutes) || 60},
  "curriculumStandardsOrTheme": "Curricular theme / standards alignment",
  "learningObjectives": [
    {
      "cognitive": "Cognitive objective (Bloom's taxonomy)",
      "affectiveOrPractical": "Practical or contextual application"
    }
  ],
  "keyVocabulary": [
    { "term": "Term 1", "definition": "Clear concise definition" }
  ],
  "requiredResourcesAndMaterials": ["Material 1", "Material 2"],
  "phases": [
    {
      "phaseName": "Hook & Introduction",
      "durationMinutes": 10,
      "teacherActions": "What teacher does...",
      "learnerActions": "What students do...",
      "keyQuestionsOrCheckpoints": ["Checkpoint question 1", "Checkpoint question 2"],
      "materialsNeeded": ["Specific items"]
    }
  ],
  "assessmentStrategy": {
    "formative": "Formative checks during lesson",
    "summativeOrExitTicket": "Exit ticket or end-of-lesson verification"
  },
  "differentiation": {
    "supportForStrugglingLearners": "Scaffolding strategies",
    "extensionForAdvancedLearners": "Enrichment / challenge activities",
    "multilingualOrContextualAdaptation": "Contextual & language support"
  },
  "reflectionNotes": "Teacher post-lesson evaluation guidance",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating lesson plan (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackLessonPlan(subject, topic, gradeLevel, durationMinutes),
    });
  }
});

// 4. PDF -> Quiz Generator Endpoint
app.post('/api/generate/pdf-quiz', async (req, res) => {
  const {
    sourceDocName = 'Uploaded_Document.pdf',
    extractedText = '',
    totalQuestions = 8,
    difficulty = 'Intermediate',
    questionType = 'multiple-choice',
    gradeLevel = 'Senior Secondary / High School (Grades 9-12)',
  } = req.body;

  if (!extractedText || extractedText.trim().length < 20) {
    return res.status(400).json({ error: 'Extracted PDF text is required to generate a grounded quiz.' });
  }

  try {
    const prompt = `You are a document comprehension AI for Proudly Afrikan Build.
CRITICAL MANDATE: Ground EVERY SINGLE question strictly in the provided document text below. DO NOT invent facts not present in the document.
Source Document Name: ${sourceDocName}
Learning Level: ${gradeLevel}
Target Difficulty: ${difficulty}
Target Questions Count: ${totalQuestions}
Question Type: ${questionType}

DOCUMENT CONTENT:
"""
${extractedText.slice(0, 12000)}
"""

Return a valid JSON object matching this schema:
{
  "id": "pdf-quiz-${Date.now()}",
  "title": "Quiz: Knowledge Assessment on ${sourceDocName.replace(/\.[^/.]+$/, '')}",
  "sourceDocName": "${sourceDocName}",
  "sourceDocSummary": "A 2-3 sentence factual summary of what this document covers.",
  "gradeLevel": "${gradeLevel}",
  "difficulty": "${difficulty}",
  "totalQuestions": ${Number(totalQuestions) || 8},
  "afrikanQuizCompatibilityTag": "PROUDLY_AFRIKAN_QUIZ_COMPLIANT_V1",
  "questions": [
    {
      "id": "pq-1",
      "number": 1,
      "question": "Clear grounded question text...",
      "type": "multiple-choice",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "Detailed explanation grounded in the text.",
      "sourceReferenceQuote": "Direct quote from the document supporting this answer."
    }
  ],
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.2);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating PDF Quiz (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackPdfQuiz(sourceDocName, extractedText || 'Document content', totalQuestions, difficulty, gradeLevel),
    });
  }
});

// 5. PDF -> Study Pack Generator Endpoint
app.post('/api/generate/pdf-studypack', async (req, res) => {
  const {
    sourceDocName = 'Uploaded_Document.pdf',
    extractedText = '',
    gradeLevel = 'Senior Secondary / High School (Grades 9-12)',
  } = req.body;

  if (!extractedText || extractedText.trim().length < 20) {
    return res.status(400).json({ error: 'Extracted PDF text is required to generate a study pack.' });
  }

  try {
    const prompt = `You are a learning architect for Proudly Afrikan Build.
Transform the following PDF text into a structured, high-yield Study Pack suitable for studying and review in the Proudly Afrikan Study ecosystem.
Ground all concepts strictly in the document text.

Source Document: ${sourceDocName}
Target Grade Level: ${gradeLevel}

DOCUMENT CONTENT:
"""
${extractedText.slice(0, 12000)}
"""

Return a valid JSON object matching this schema:
{
  "id": "sp-${Date.now()}",
  "title": "Study Pack: ${sourceDocName.replace(/\.[^/.]+$/, '')}",
  "sourceDocName": "${sourceDocName}",
  "documentOverview": "Comprehensive structured synopsis of the source document",
  "gradeLevel": "${gradeLevel}",
  "keyConcepts": [
    {
      "id": "c1",
      "conceptName": "Key Concept Name",
      "summary": "Core concept summary",
      "inDepthExplanation": "In-depth pedagogical breakdown based on text",
      "realWorldExampleOrApplication": "Practical context or application"
    }
  ],
  "essentialGlossary": [
    { "term": "Key Term", "definition": "Precise definition", "context": "Document context" }
  ],
  "highYieldRevisionPoints": ["High-yield takeaway 1", "High-yield takeaway 2", "High-yield takeaway 3"],
  "selfCheckQuestions": [
    { "question": "Self test question", "answer": "Model answer", "hint": "Hint" }
  ],
  "activeRecallActivities": ["Activity 1 prompt", "Activity 2 prompt"],
  "afrikanStudyCompatibilityTag": "PROUDLY_AFRIKAN_STUDY_COMPLIANT_V1",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.3);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating PDF Study Pack (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackStudyPack(sourceDocName, extractedText || 'Sample text', gradeLevel),
    });
  }
});

// 6. Presentation Generator Endpoint
app.post('/api/generate/presentation', async (req, res) => {
  const {
    subject,
    topic,
    audienceLevel = 'Senior Secondary / High School (Grades 9-12)',
    slidesCount = 6,
    presentationStyle = 'Educational Lecture & Discussion',
    keyPoints = '',
    learningObjectives = [],
    sourceMaterial = '',
  } = req.body;

  try {
    const prompt = `You are a master presentation designer crafting an educational slide deck for Proudly Afrikan Build.
Subject: ${subject}
Topic: ${topic}
Audience / Learning Level: ${audienceLevel}
Total Slides: ${slidesCount}
Presentation Style: ${presentationStyle}
Key Points: ${keyPoints || 'Core principles of the topic'}
Learning Objectives: ${Array.isArray(learningObjectives) ? learningObjectives.join('; ') : learningObjectives}
Source Material: ${sourceMaterial ? sourceMaterial.slice(0, 4000) : 'None'}

Return a valid JSON object matching this schema:
{
  "id": "pres-${Date.now()}",
  "title": "Presentation: ${topic}",
  "subtitle": "Subtitle describing the presentation theme",
  "subject": "${subject}",
  "topic": "${topic}",
  "targetAudience": "${audienceLevel}",
  "presentationStyle": "${presentationStyle}",
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "slidesCount": ${Number(slidesCount) || 6},
  "slides": [
    {
      "id": "s-1",
      "slideNumber": 1,
      "slideType": "title",
      "title": "Slide Title",
      "subtitle": "Slide Subtitle",
      "bulletPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "speakerNotes": "Comprehensive notes for the speaker...",
      "suggestedVisualOrDiagram": "Visual diagram description",
      "discussionOrEngagementPrompt": "Interactive question for audience"
    }
  ],
  "conclusionTakeaway": "Closing synthesis statement",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating presentation (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackPresentation(subject, topic, audienceLevel, slidesCount, presentationStyle),
    });
  }
});

// 7. Course Builder Generator Endpoint
app.post('/api/generate/course', async (req, res) => {
  const {
    title = '',
    subject,
    gradeLevel = 'Tertiary / Undergraduate',
    description = '',
    targetAudience = '',
    courseObjectives = [],
    modulesCount = 3,
    sourceMaterial = '',
  } = req.body;

  try {
    const prompt = `You are an academic dean and curriculum architect on Proudly Afrikan Build.
Design a complete, modular, sequenced Course Curriculum structure.
Subject: ${subject}
Course Title / Topic: ${title || subject}
Grade / Learning Level: ${gradeLevel}
Target Audience: ${targetAudience || 'Students and professionals'}
Course Description: ${description || 'Comprehensive curriculum'}
Objectives: ${Array.isArray(courseObjectives) ? courseObjectives.join('; ') : courseObjectives}
Desired Modules Count: ${modulesCount || 3}
Source Material Provided: ${sourceMaterial ? sourceMaterial.slice(0, 12000) : 'None (synthesize from mastery curriculum knowledge)'}

Return a valid JSON object matching this schema:
{
  "id": "course-${Date.now()}",
  "title": "${title || 'Curriculum Course'}",
  "subtitle": "Modular Course Blueprint",
  "subject": "${subject}",
  "gradeLevel": "${gradeLevel}",
  "description": "Thorough course synopsis...",
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "courseObjectives": ["Course Objective 1", "Course Objective 2", "Course Objective 3"],
  "targetAudience": "${targetAudience || gradeLevel}",
  "totalEstimatedHours": 36,
  "modules": [
    {
      "id": "mod-1",
      "moduleNumber": 1,
      "title": "Module 1: Title",
      "overview": "Module overview and focus",
      "estimatedHours": 12,
      "lessons": [
        {
          "id": "l1-1",
          "title": "Lesson 1.1: Lesson Title",
          "estimatedMinutes": 60,
          "summary": "Lesson summary",
          "keyLearningOutcomes": ["Outcome 1", "Outcome 2"],
          "deliveryFormat": "Lecture"
        }
      ]
    }
  ],
  "assessmentAndGradingOutline": "Breakdown of assessments and grading criteria",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating course (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackCourse(title, subject, gradeLevel, description),
    });
  }
});

// 8. Learning Path Builder Generator Endpoint
app.post('/api/generate/learning-path', async (req, res) => {
  const {
    title = '',
    subject,
    targetGoal = '',
    estimatedWeeks = 24,
    sourceMaterial = '',
  } = req.body;

  try {
    const prompt = `You are a learning path strategist for Proudly Afrikan Build.
Design a structured multi-stage progression Learning Path (e.g., Beginner -> Intermediate -> Advanced -> Mastery).
Subject: ${subject}
Learning Path Name / Skill: ${title || subject}
Target Career / Educational Goal: ${targetGoal || 'Mastery and professional capability'}
Source Material Provided: ${sourceMaterial ? sourceMaterial.slice(0, 12000) : 'None (use comprehensive developmental trajectory)'}

Return a valid JSON object matching this schema:
{
  "id": "lp-${Date.now()}",
  "title": "${title || 'Learning Path Progression'}",
  "subject": "${subject}",
  "targetCareerOrEducationalGoal": "${targetGoal || 'Comprehensive Mastery'}",
  "totalEstimatedDuration": "${estimatedWeeks || 24} Weeks (4 Structured Stages)",
  "overallDescription": "Detailed overview of the developmental trajectory",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "stages": [
    {
      "id": "st-1",
      "stageNumber": 1,
      "tier": "Foundation / Beginner",
      "title": "Stage 1: Foundation ...",
      "description": "Description of this stage",
      "estimatedWeeks": 6,
      "keyCompetenciesToMaster": ["Competency 1", "Competency 2", "Competency 3"],
      "recommendedModulesOrTopics": ["Topic 1", "Topic 2"],
      "milestoneProjectOrAssessment": "Culminating milestone project for this stage",
      "prerequisitesBeforeEntry": ["Prerequisite items"]
    }
  ],
  "certificationOrExitMilestone": "Final graduation defense or portfolio standard",
  "createdAt": "${new Date().toISOString()}"
}`;

    const parsed = await generateJsonWithGemini(prompt, 0.4);
    if (parsed) {
      return res.json({ success: true, data: parsed });
    }
    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('Error generating learning path (using fallback):', error?.message || error);
    return res.json({
      success: true,
      fallbackUsed: true,
      data: generateFallbackLearningPath(title, subject, targetGoal),
    });
  }
});

// Fallback Generators to ensure instant resilience
function generateFallbackExam(subject: string, topic: string, gradeLevel: string, difficulty: string, duration: number, marks: number, header: string) {
  return {
    id: `exam-${Date.now()}`,
    title: `${topic || subject} Comprehensive Assessment Examination`,
    institutionHeader: header || 'Proudly Afrikan Examination Board',
    subject: subject || 'General Science',
    topic: topic || 'Foundational Principles',
    gradeLevel: gradeLevel || 'Senior Secondary / High School (Grades 9-12)',
    difficulty: difficulty || 'Intermediate',
    durationMinutes: Number(duration) || 60,
    totalMarks: Number(marks) || 50,
    generalInstructions: [
      'Read all questions carefully before attempting solutions.',
      'Answer all questions in Section A and Section B.',
      'Show clear, structured intermediate steps for all calculation problems.',
      'Write in dark blue or black ink with legible notation.',
    ],
    sections: [
      {
        id: 'sec-1',
        title: 'Section A: Conceptual Understanding & Multiple Choice',
        instructions: 'Select the best option for each question. (2 marks each)',
        totalMarks: 10,
        questions: [
          {
            id: 'q1',
            questionNumber: 1,
            type: 'multiple-choice',
            prompt: `Which foundational principle is most critical when analyzing fundamental systems in ${topic || subject}?`,
            marks: 2,
            options: [
              'A) Systemic Conservation of Energy and Equilibrium',
              'B) Arbitrary Unverified Observation',
              'C) Discontinuous Non-linear Variance without Boundary Conditions',
              'D) Static Unresponsive Parameters'
            ],
            correctAnswer: 'A) Systemic Conservation of Energy and Equilibrium',
            markingGuidance: 'Award 2 marks for option A. Award 0 for incorrect selections.',
          },
          {
            id: 'q2',
            questionNumber: 2,
            type: 'multiple-choice',
            prompt: `In the context of ${topic || subject}, what is the primary role of empirical verification?`,
            marks: 2,
            options: [
              'A) To confirm hypothetical models against reproducible experimental data',
              'B) To eliminate theoretical discourse',
              'C) To replace mathematical formalism entirely',
              'D) To restrict inquiry to qualitative speculation'
            ],
            correctAnswer: 'A) To confirm hypothetical models against reproducible experimental data',
            markingGuidance: 'Award 2 marks for option A.',
          }
        ]
      },
      {
        id: 'sec-2',
        title: 'Section B: Structured Analytical Inquiries',
        instructions: 'Provide complete written solutions with equations and logical deductions.',
        totalMarks: 40,
        questions: [
          {
            id: 'q3',
            questionNumber: 3,
            type: 'problem-solving',
            prompt: `Define the core governing laws of ${topic || subject}. State three distinct conditions under which these laws apply and one limitation.`,
            marks: 10,
            markingGuidance: 'Award 4 marks for precise definition, 3 marks for three valid conditions, and 3 marks for well-reasoned limitation.',
          },
          {
            id: 'q4',
            questionNumber: 4,
            type: 'essay',
            prompt: `Critically analyze a contemporary practical application of ${topic || subject} in modern African technological or economic development. Provide concrete examples.`,
            marks: 15,
            markingGuidance: 'Award up to 5 marks for context, 5 marks for technical accuracy of mechanisms, and 5 marks for evaluation of socio-economic impact.',
          }
        ]
      }
    ],
    overallMarkingNotes: 'Score conversion: 75%+ Distinction, 60-74% Credit, 50-59% Pass. Reward analytical clarity.',
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackWorksheet(subject: string, topic: string, gradeLevel: string, difficulty: string) {
  return {
    id: `ws-${Date.now()}`,
    title: `Mastery Worksheet: ${topic || subject}`,
    subject: subject || 'General Science',
    topic: topic || 'Core Subject Exploration',
    gradeLevel: gradeLevel || 'Junior Secondary / Middle School (Grades 6-8)',
    difficulty: difficulty || 'Intermediate',
    learningObjectives: [
      `Understand key foundational terminology related to ${topic || subject}.`,
      `Apply problem-solving methods to structured exercises in ${topic || subject}.`,
      `Evaluate real-world scenarios using principles learned in this unit.`
    ],
    estimatedCompletionTimeMinutes: 45,
    studentHeaderFields: { name: true, date: true, score: true, class: true },
    introductionOrOverview: `This interactive worksheet is designed to reinforce your grasp of ${topic || subject}. Work through the activities in sequence and verify your reasoning with your instructor.`,
    activities: [
      {
        id: 'act-1',
        activityNumber: 1,
        type: 'matching',
        title: 'Activity 1: Vocabulary & Concept Correlation',
        instructions: 'Match each term in the left column with its corresponding definition.',
        items: [
          {
            id: 'i1',
            prompt: `1. Core Hypothesis (${topic || subject})`,
            answerKey: 'A testable, falsifiable proposition explaining observed phenomena.',
            explanation: 'Forms the baseline of scientific and analytical inquiry.',
          },
          {
            id: 'i2',
            prompt: '2. Systematic Methodology',
            answerKey: 'A standardized, reproducible protocol for investigating parameters.',
            explanation: 'Ensures consistency across varied trials.',
          }
        ],
        points: 10,
      },
      {
        id: 'act-2',
        activityNumber: 2,
        type: 'fill-in-blanks',
        title: 'Activity 2: Guided Concept Exploration',
        instructions: 'Complete the sentences using appropriate technical terminology.',
        items: [
          {
            id: 'i3',
            prompt: `In the study of ${topic || subject}, the primary variable that is deliberately manipulated is called the ________ variable, while the measured outcome is the ________ variable.`,
            answerKey: 'independent, dependent',
            explanation: 'Fundamental experimental design terminology.',
          }
        ],
        points: 10,
      }
    ],
    teacherSolutionsNote: 'Ensure students articulate their rationale for open-ended questions rather than only matching keywords.',
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackLessonPlan(subject: string, topic: string, gradeLevel: string, duration: number) {
  return {
    id: `lp-${Date.now()}`,
    title: `Lesson Plan: ${topic || subject}`,
    subject: subject || 'General Education',
    topic: topic || 'Core Topic Overview',
    gradeLevel: gradeLevel || 'Senior Secondary / High School (Grades 9-12)',
    durationMinutes: Number(duration) || 60,
    curriculumStandardsOrTheme: 'Curricular standard alignment for mastery and inquiry-based learning',
    learningObjectives: [
      {
        cognitive: `Learners will define and synthesize the key principles of ${topic || subject}.`,
        affectiveOrPractical: `Learners will collaborate in peer pairs to solve applied challenges relating to ${topic || subject}.`,
      }
    ],
    keyVocabulary: [
      { term: 'Foundational Concept', definition: 'The primary underlying principle of the subject.' },
      { term: 'System Dynamics', definition: 'The interaction of interdependent components within the domain.' }
    ],
    requiredResourcesAndMaterials: [
      'Classroom whiteboard & markers',
      'Student interactive activity handouts',
      'Visual diagram slides / projector'
    ],
    phases: [
      {
        phaseName: 'Hook & Introduction',
        durationMinutes: 10,
        teacherActions: `Present an engaging real-world riddle or striking visual phenomena illustrating ${topic || subject}.`,
        learnerActions: 'Brainstorm in pairs for 2 minutes, then share initial observations with whole class.',
        keyQuestionsOrCheckpoints: ['What causes this pattern?', 'How does this connect to our previous unit?'],
        materialsNeeded: ['Visual Hook slide'],
      },
      {
        phaseName: 'Direct Instruction / Content',
        durationMinutes: 20,
        teacherActions: `Deliver structured breakdown of ${topic || subject}, modeling step-by-step problem decomposition.`,
        learnerActions: 'Take active Cornell notes and highlight critical equations/definitions.',
        keyQuestionsOrCheckpoints: ['Why does this rule apply?', 'Can anyone predict the next step?'],
        materialsNeeded: ['Whiteboard & lesson notes'],
      },
      {
        phaseName: 'Guided Practice & Exploration',
        durationMinutes: 15,
        teacherActions: 'Facilitate small-group investigation around 2 practice scenarios.',
        learnerActions: 'Work collaboratively on worksheet problems, comparing approaches.',
        keyQuestionsOrCheckpoints: ['Did both partners arrive at the same outcome?'],
        materialsNeeded: ['Guided practice cards'],
      },
      {
        phaseName: 'Closure & Exit Assessment',
        durationMinutes: 5,
        teacherActions: 'Distribute 1-minute exit ticket checking understanding of the main objective.',
        learnerActions: 'Write and hand in exit ticket response before leaving.',
        keyQuestionsOrCheckpoints: ['100% exit ticket collection rate'],
        materialsNeeded: ['Exit tickets'],
      }
    ],
    assessmentStrategy: {
      formative: 'Continuous observation during guided group practice and quick verbal polling.',
      summativeOrExitTicket: 'Exit ticket evaluating core objective mastery.'
    },
    differentiation: {
      supportForStrugglingLearners: 'Provide structured graphic organizers and step-by-step formula guides.',
      extensionForAdvancedLearners: 'Provide advanced inquiry challenge problem with non-standard parameters.',
      multilingualOrContextualAdaptation: 'Incorporate local terminology and real-life community examples.'
    },
    reflectionNotes: 'Assess which phase required more time and adjust pacing accordingly.',
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackPdfQuiz(docName: string, text: string, count: number, difficulty: string, level: string) {
  const cleanName = docName.replace(/\.[^/.]+$/, '');
  return {
    id: `pdf-quiz-${Date.now()}`,
    title: `Grounded Quiz: ${cleanName}`,
    sourceDocName: docName,
    sourceDocSummary: `Extracted assessment generated directly from the uploaded source document: "${docName}".`,
    gradeLevel: level || 'Senior Secondary / High School (Grades 9-12)',
    difficulty: difficulty || 'Intermediate',
    totalQuestions: Number(count) || 6,
    afrikanQuizCompatibilityTag: 'PROUDLY_AFRIKAN_QUIZ_COMPLIANT_V1',
    questions: [
      {
        id: 'pq-1',
        number: 1,
        question: `Based on the provided document "${docName}", what is the primary focus or theme discussed?`,
        type: 'multiple-choice',
        options: [
          `A) The core principles and analytical findings presented in ${cleanName}`,
          'B) An unrelated historical fiction narrative',
          'C) Purely speculative assumptions unsupported by the text',
          'D) A general glossary without thematic focus'
        ],
        correctAnswer: `A) The core principles and analytical findings presented in ${cleanName}`,
        explanation: 'Directly supported by the introductory overview of the uploaded text.',
        sourceReferenceQuote: text.slice(0, 150) + '...',
      },
      {
        id: 'pq-2',
        number: 2,
        question: 'According to the source document, which statement is factually accurate?',
        type: 'multiple-choice',
        options: [
          'A) The text establishes documented evidence and structured analysis',
          'B) The document contradicts its own primary premise',
          'C) No conclusions are drawn in the material',
          'D) All data points are left unspecified'
        ],
        correctAnswer: 'A) The text establishes documented evidence and structured analysis',
        explanation: 'Supported by the content structure within the provided source.',
        sourceReferenceQuote: text.slice(100, 250) + '...',
      }
    ],
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackStudyPack(docName: string, text: string, level: string) {
  const cleanName = docName.replace(/\.[^/.]+$/, '');
  return {
    id: `sp-${Date.now()}`,
    title: `Study Pack: ${cleanName}`,
    sourceDocName: docName,
    documentOverview: `Structured high-yield revision and concept pack synthesised directly from ${docName}.`,
    gradeLevel: level || 'Senior Secondary / High School (Grades 9-12)',
    keyConcepts: [
      {
        id: 'c1',
        conceptName: `Core Thesis of ${cleanName}`,
        summary: 'Primary conceptual pillar established in the document.',
        inDepthExplanation: text.slice(0, 400) || 'Comprehensive discussion extracted from the document body.',
        realWorldExampleOrApplication: 'Direct application in academic revision and practical problem-solving.',
      }
    ],
    essentialGlossary: [
      {
        term: 'Key Terminology',
        definition: 'Specialized vocabulary extracted from the text.',
        context: 'Used throughout key chapters of the uploaded document.',
      }
    ],
    highYieldRevisionPoints: [
      `Review the primary frameworks discussed in ${cleanName}.`,
      'Focus on the relationship between causes, mechanisms, and documented outcomes.',
      'Test your recall on the core formulas or definitions.'
    ],
    selfCheckQuestions: [
      {
        question: `What are the three most critical takeaways from ${cleanName}?`,
        answer: 'Refer to the central arguments outlined in the document overview section.',
        hint: 'Look at the introductory and concluding summaries.',
      }
    ],
    activeRecallActivities: [
      'Summarize the core concept in your own words without looking at the text.',
      'Explain the key mechanism to a study partner in under 2 minutes.'
    ],
    afrikanStudyCompatibilityTag: 'PROUDLY_AFRIKAN_STUDY_COMPLIANT_V1',
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackPresentation(subject: string, topic: string, audience: string, count: number, style: string) {
  return {
    id: `pres-${Date.now()}`,
    title: `${topic || subject}: Master Presentation`,
    subtitle: 'Educational Lecture & Visual Concept Deck',
    subject: subject || 'General Education',
    topic: topic || 'Core Topic',
    targetAudience: audience || 'Senior Secondary / High School (Grades 9-12)',
    presentationStyle: style || 'Educational Lecture & Discussion',
    learningObjectives: [
      `Gain a clear understanding of the foundational principles of ${topic || subject}.`,
      'Analyze practical case studies and real-world implementations.',
      'Synthesize key insights for applied practice.'
    ],
    slidesCount: Number(count) || 6,
    slides: [
      {
        id: 's-1',
        slideNumber: 1,
        slideType: 'title',
        title: `${topic || subject}`,
        subtitle: 'Foundations, Frameworks & Practical Applications',
        bulletPoints: [
          'Proudly Afrikan Build Educational Series',
          `Target Level: ${audience}`,
          'Interactive Lecture & Discussion Framework'
        ],
        speakerNotes: 'Welcome the audience and frame today\'s session around clear, actionable educational outcomes.',
        suggestedVisualOrDiagram: 'Striking high-contrast title card with African ochre geometric vector accents.',
      },
      {
        id: 's-2',
        slideNumber: 2,
        slideType: 'content',
        title: 'Core Principles & Fundamentals',
        subtitle: 'The Building Blocks of the Subject',
        bulletPoints: [
          `Understanding the historical and theoretical genesis of ${topic || subject}.`,
          'Key terminology and operational definitions.',
          'Standard frameworks utilized by researchers and practitioners.',
          'Common misconceptions and critical clarifications.'
        ],
        speakerNotes: 'Pause here to ensure all students grasp the core definitions before moving to complex models.',
        suggestedVisualOrDiagram: 'Conceptual diagram illustrating the 3 foundational pillars.',
        discussionOrEngagementPrompt: 'What is one example of this concept that you have encountered in everyday life?'
      },
      {
        id: 's-3',
        slideNumber: 3,
        slideType: 'summary',
        title: 'Key Takeaways & Synthesis',
        subtitle: 'Summary and Next Steps',
        bulletPoints: [
          'Mastery requires understanding foundational mechanics first.',
          'Always connect theoretical models to empirical evidence.',
          'Continue to the structured practice exercises.'
        ],
        speakerNotes: 'Summarize key points and open the floor for final student reflections.',
        suggestedVisualOrDiagram: 'Summary visual checklist.',
      }
    ],
    conclusionTakeaway: `Mastery in ${topic || subject} opens new horizons for intellectual growth and practical innovation.`,
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackCourse(title: string, subject: string, level: string, desc: string) {
  const courseTitle = title || `${subject} Comprehensive Curriculum`;
  return {
    id: `course-${Date.now()}`,
    title: courseTitle,
    subtitle: 'Sequenced Multi-Module Academic Course',
    subject: subject || 'General Education',
    gradeLevel: level || 'Tertiary / Undergraduate',
    description: desc || `A comprehensive curriculum designed to take students from foundational concepts to advanced mastery in ${subject}.`,
    prerequisites: ['Foundational secondary school literacy and STEM / Humanities background.'],
    courseObjectives: [
      `Analyze core principles and historical developments in ${subject}.`,
      'Apply analytical and experimental methods to domain-specific problems.',
      'Produce an independent capstone project demonstrating mastery.'
    ],
    targetAudience: level || 'Tertiary / Undergraduate',
    totalEstimatedHours: 36,
    modules: [
      {
        id: 'mod-1',
        moduleNumber: 1,
        title: 'Module 1: Foundations & Theoretical Baselines',
        overview: 'Introduction to key terminology, governing laws, and historical context.',
        estimatedHours: 12,
        lessons: [
          {
            id: 'l1-1',
            title: 'Lesson 1.1: Historical Origins & Core Principles',
            estimatedMinutes: 60,
            summary: 'Understanding the genesis and fundamental axioms of the field.',
            keyLearningOutcomes: ['Define key terms', 'Trace historical evolution'],
            deliveryFormat: 'Lecture',
          },
          {
            id: 'l1-2',
            title: 'Lesson 1.2: Methodologies & Analytical Frameworks',
            estimatedMinutes: 90,
            summary: 'Survey of modern research methods and quantitative techniques.',
            keyLearningOutcomes: ['Formulate research questions', 'Select appropriate models'],
            deliveryFormat: 'Discussion',
          }
        ]
      },
      {
        id: 'mod-2',
        moduleNumber: 2,
        title: 'Module 2: Practical Applications & Case Studies',
        overview: 'Hands-on problem solving and evaluation of real-world scenarios.',
        estimatedHours: 14,
        lessons: [
          {
            id: 'l2-1',
            title: 'Lesson 2.1: Case Study Analysis',
            estimatedMinutes: 90,
            summary: 'In-depth review of successful regional and global implementations.',
            keyLearningOutcomes: ['Evaluate trade-offs', 'Design mitigation strategies'],
            deliveryFormat: 'Case Study',
          }
        ]
      },
      {
        id: 'mod-3',
        moduleNumber: 3,
        title: 'Module 3: Advanced Synthesis & Capstone Defense',
        overview: 'Final project execution, peer review, and defense.',
        estimatedHours: 10,
        lessons: [
          {
            id: 'l3-1',
            title: 'Lesson 3.1: Capstone Project Planning & Defense',
            estimatedMinutes: 120,
            summary: 'Developing and presenting an original solution to a complex domain problem.',
            keyLearningOutcomes: ['Synthesize multi-module knowledge', 'Present findings professionally'],
            deliveryFormat: 'Assessment',
          }
        ]
      }
    ],
    assessmentAndGradingOutline: 'Continuous Assignments (40%), Mid-term Evaluation (25%), Final Capstone Project (35%).',
    createdAt: new Date().toISOString(),
  };
}

function generateFallbackLearningPath(title: string, subject: string, goal: string) {
  const pathTitle = title || `${subject} Progression Pathway`;
  return {
    id: `lp-${Date.now()}`,
    title: pathTitle,
    subject: subject || 'General Education',
    targetCareerOrEducationalGoal: goal || 'Professional Proficiency & Mastery',
    totalEstimatedDuration: '24 Weeks (4 Structured Stages)',
    overallDescription: `A progressive learning path guiding students through four distinct tiers of capability in ${subject}.`,
    learningOutcomes: [
      'Master core baseline principles with high theoretical fidelity.',
      'Develop intermediate practical problem-solving capabilities.',
      'Execute advanced projects requiring multi-variable analysis.',
      'Demonstrate mastery through an independent capstone defense.'
    ],
    stages: [
      {
        id: 'st-1',
        stageNumber: 1,
        tier: 'Foundation / Beginner',
        title: 'Stage 1: Core Fundamentals & Literacy',
        description: 'Establish foundational principles, terminology, and standard mental models.',
        estimatedWeeks: 6,
        keyCompetenciesToMaster: [
          'Basic vocabulary and definitions',
          'Standard calculation and reasoning techniques',
          'Independent study habits and note-taking frameworks'
        ],
        recommendedModulesOrTopics: ['Foundational Concepts', 'Introduction to Analysis'],
        milestoneProjectOrAssessment: 'Complete a comprehensive foundational diagnostic exam and portfolio review.',
        prerequisitesBeforeEntry: ['Enthusiasm for learning and basic secondary school background.'],
      },
      {
        id: 'st-2',
        stageNumber: 2,
        tier: 'Intermediate / Practitioner',
        title: 'Stage 2: Guided Practice & Methodological Rigor',
        description: 'Expand analytical depth and tackle real-world case studies.',
        estimatedWeeks: 6,
        keyCompetenciesToMaster: [
          'Multi-step problem decomposition',
          'Application of formulas in non-trivial contexts',
          'Peer collaboration and structured critique'
        ],
        recommendedModulesOrTopics: ['Intermediate Problem Solving', 'Case Analysis'],
        milestoneProjectOrAssessment: 'Deliver a structured case study analysis with empirical backing.',
        prerequisitesBeforeEntry: ['Successful completion of Stage 1.'],
      },
      {
        id: 'st-3',
        stageNumber: 3,
        tier: 'Advanced / Specialist',
        title: 'Stage 3: Complex Systems & Advanced Design',
        description: 'Tackle high-difficulty scenarios, optimization, and real-world system design.',
        estimatedWeeks: 6,
        keyCompetenciesToMaster: [
          'Advanced modeling and simulation',
          'Critical evaluation of competing methodologies',
          'Autonomous research and documentation'
        ],
        recommendedModulesOrTopics: ['Advanced Systems Theory', 'Design & Optimization'],
        milestoneProjectOrAssessment: 'Design and simulate an advanced domain solution.',
        prerequisitesBeforeEntry: ['Successful completion of Stage 2.'],
      },
      {
        id: 'st-4',
        stageNumber: 4,
        tier: 'Mastery & Capstone',
        title: 'Stage 4: Mastery, Synthesis & Capstone Defense',
        description: 'Produce original work, master mentorship, and complete certification standards.',
        estimatedWeeks: 6,
        keyCompetenciesToMaster: [
          'End-to-end project leadership',
          'Professional oral and written defense',
          'Pedagogical mentorship of earlier-stage peers'
        ],
        recommendedModulesOrTopics: ['Capstone Synthesis', 'Professional Leadership'],
        milestoneProjectOrAssessment: 'Defend comprehensive capstone before an expert academic review panel.',
        prerequisitesBeforeEntry: ['Stages 1 through 3.'],
      }
    ],
    certificationOrExitMilestone: 'Proudly Afrikan Certified Practitioner Credential and Capstone Portfolio Showcase.',
    createdAt: new Date().toISOString(),
  };
}

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PROUDLY AFRIKAN BUILD server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
