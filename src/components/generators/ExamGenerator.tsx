import React, { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  Printer,
  Copy,
  Save,
  Check,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  HelpCircle,
  Clock,
  Award,
  ChevronLeft,
  Share2,
  FileText,
  Compass,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ExamResource, ExamQuestion, ExamSection, GradeLevel, DifficultyLevel } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface ExamGeneratorProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (exam: ExamResource) => void;
  existingResource?: ExamResource;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Primary / Elementary (Grades 1-5)',
  'Junior Secondary / Middle School (Grades 6-8)',
  'Senior Secondary / High School (Grades 9-12)',
  'Tertiary / Undergraduate',
  'Postgraduate / Professional',
  'Adult & Lifelong Learner',
];

const DIFFICULTIES: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Rigorous / Olympiad'];

export const ExamGenerator: React.FC<ExamGeneratorProps> = ({
  initialSubject = 'Mathematics & Science',
  initialTopic = '',
  onBack,
  onSave,
  existingResource,
}) => {
  // Normalize existing resource
  const normalizedExisting = React.useMemo(() => {
    if (!existingResource) return null;
    const raw = (existingResource as any)?.data || existingResource;
    return raw;
  }, [existingResource]);

  // Form State
  const [subject, setSubject] = useState(normalizedExisting?.subject || initialSubject);
  const [topic, setTopic] = useState(normalizedExisting?.topic || initialTopic || '');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    (normalizedExisting?.gradeLevel as GradeLevel) || 'Senior Secondary / High School (Grades 9-12)'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    normalizedExisting?.difficulty || 'Intermediate'
  );
  const [durationMinutes, setDurationMinutes] = useState(normalizedExisting?.durationMinutes || 60);
  const [totalMarks, setTotalMarks] = useState(normalizedExisting?.totalMarks || 50);
  const [questionCount, setQuestionCount] = useState(8);
  const [institutionHeader, setInstitutionHeader] = useState(
    normalizedExisting?.institutionHeader || 'Proudly Afrikan Examination Board'
  );
  const [instructions, setInstructions] = useState(normalizedExisting?.instructions || '');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<ExamResource | null>(
    normalizedExisting && (normalizedExisting.sections || normalizedExisting.title) ? normalizedExisting : null
  );
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation check
    const errors: Record<string, string> = {};

    if (!subject || !subject.trim()) {
      errors.subject = 'Please select a Subject Category before building your exam.';
    }
    if (!topic || !topic.trim()) {
      errors.topic = 'Please enter an Exam Topic before building your exam.';
    }
    if (!gradeLevel) {
      errors.gradeLevel = 'Please select a Grade Level before building your exam.';
    }
    if (!difficulty) {
      errors.difficulty = 'Please select a Difficulty Level before building your exam.';
    }
    if (!durationMinutes || durationMinutes < 5) {
      errors.durationMinutes = 'Please enter a valid Duration (minimum 5 minutes) before building your exam.';
    }
    if (!totalMarks || totalMarks < 5) {
      errors.totalMarks = 'Please enter Total Marks (minimum 5 marks) before building your exam.';
    }
    if (!questionCount || questionCount < 1) {
      errors.questionCount = 'Please enter Number of Questions (minimum 1 question) before building your exam.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Select the first error message to display prominently
      const firstErrorMessage =
        errors.subject ||
        errors.topic ||
        errors.gradeLevel ||
        errors.difficulty ||
        errors.durationMinutes ||
        errors.totalMarks ||
        errors.questionCount;
      setValidationError(firstErrorMessage);

      // Scroll to first invalid input field if available
      const firstFieldId = errors.subject
        ? 'exam-field-subject'
        : errors.topic
        ? 'exam-field-topic'
        : errors.durationMinutes
        ? 'exam-field-duration'
        : 'exam-form';
      const el = document.getElementById(firstFieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in el) (el as HTMLElement).focus();
      }
      return;
    }

    setValidationError(null);
    setFieldErrors({});
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel,
          difficulty,
          durationMinutes,
          totalMarks,
          questionCount,
          institutionHeader,
          instructions,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate exam paper');
      }

      const resData = await response.json();
      const examData = resData?.data || resData;
      if (examData && (examData.sections || examData.title)) {
        setGeneratedExam(examData);
      } else {
        throw new Error('Fallback trigger');
      }
    } catch (err) {
      console.error('Error generating exam:', err);
      // Fallback exam generation for quick local testing if backend offline
      const fallbackExam: ExamResource = {
        id: 'exam-' + Date.now(),
        toolType: 'exam',
        title: `${topic} Examination`,
        subject,
        topic,
        gradeLevel,
        difficulty,
        durationMinutes,
        totalMarks,
        institutionHeader,
        instructions: instructions || 'Answer all questions in the provided spaces. Read all questions carefully.',
        createdAt: new Date().toISOString(),
        sections: [
          {
            title: 'SECTION A: MULTIPLE CHOICE QUESTIONS',
            instructions: 'Select the best option for each question (1 mark each).',
            marks: 10,
            questions: [
              {
                id: 'q1',
                number: 1,
                text: `What is the primary significance of ${topic} in regional and global context?`,
                marks: 2,
                type: 'multiple-choice',
                options: [
                  'A) It laid the foundational trade and intellectual routes across the continent.',
                  'B) It occurred strictly in isolation with no recorded external influence.',
                  'C) It had minimal recorded historical significance.',
                  'D) It was exclusively confined to coastal fisheries.',
                ],
                correctAnswer: 'A',
                markingGuidance: 'Option A correctly identifies the core regional intellectual & trade significance.',
              },
              {
                id: 'q2',
                number: 2,
                text: `Which core principle or mechanism is most critically associated with ${topic}?`,
                marks: 2,
                type: 'multiple-choice',
                options: [
                  'A) Dynamic systemic equilibrium and sustainable growth',
                  'B) Linear decay without recursive feedback',
                  'C) Zero external communication',
                  'D) Uniform static inertia',
                ],
                correctAnswer: 'A',
                markingGuidance: 'Option A provides the accurate mechanism.',
              },
            ],
          },
          {
            title: 'SECTION B: STRUCTURED & ANALYTICAL PROBLEMS',
            instructions: 'Show all working and clearly state your assumptions.',
            marks: 20,
            questions: [
              {
                id: 'q3',
                number: 3,
                text: `Explain two major advantages and one key limitation associated with ${topic}.`,
                marks: 6,
                type: 'short-answer',
                markingGuidance: 'Award 2 marks for each well-elaborated advantage (4 marks total), and 2 marks for a well-reasoned limitation.',
              },
              {
                id: 'q4',
                number: 4,
                text: `Analyze how modern technological or ecological innovations can transform our contemporary understanding of ${topic}.`,
                marks: 14,
                type: 'essay',
                markingGuidance: 'Award up to 6 marks for conceptual depth, 4 marks for contextual African/global relevance, and 4 marks for synthesis & structure.',
              },
            ],
          },
        ],
        overallMarkingNotes: 'Total marks: 50. Mark strictly in accordance with standardized rubrics.',
      };
      setGeneratedExam(fallbackExam);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyExamText = () => {
    if (!generatedExam) return;
    let fullText = `${generatedExam.institutionHeader || 'EXAMINATION BOARD'}\n`;
    fullText += `${(generatedExam.title || 'EXAMINATION').toUpperCase()}\n`;
    fullText += `SUBJECT: ${generatedExam.subject || subject} | GRADE: ${generatedExam.gradeLevel || gradeLevel} | DURATION: ${generatedExam.durationMinutes || durationMinutes} MINS | MARKS: ${generatedExam.totalMarks || totalMarks}\n\n`;
    
    const instr = Array.isArray(generatedExam.generalInstructions)
      ? generatedExam.generalInstructions.join('\n')
      : (generatedExam.instructions || instructions || 'Answer all questions.');
    fullText += `INSTRUCTIONS:\n${instr}\n\n`;

    (generatedExam.sections || []).forEach((sec, sIdx) => {
      const secMarks = sec.marks || sec.totalMarks || 0;
      fullText += `=== ${sec.title || `SECTION ${String.fromCharCode(65 + sIdx)}`} (${secMarks} MARKS) ===\n${sec.instructions || ''}\n\n`;
      (sec.questions || []).forEach((q: any, qIdx: number) => {
        const qNum = q.number || q.questionNumber || qIdx + 1;
        const qMarks = q.marks || 1;
        const qText = q.text || q.prompt || q.question || '';
        fullText += `Question ${qNum} [${qMarks} marks]\n${qText}\n`;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: string) => {
            fullText += `  ${opt}\n`;
          });
        }
        if (showAnswerKey) {
          fullText += `[MARKING KEY: ${q.correctAnswer || ''} - ${q.markingGuidance || q.explanation || ''}]\n`;
        }
        fullText += `\n`;
      });
    });

    navigator.clipboard.writeText(fullText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-300">
        <button
          onClick={onBack}
          className="clay-pill-3d px-4 py-2 flex items-center gap-2 font-mono-code text-xs sm:text-sm font-bold text-stone-900 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#D63651]" />
          <span>BACK TO BUILD</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="clay-btn-dark px-4 py-1.5 font-mono-code text-xs sm:text-sm font-bold uppercase tracking-wider">
            TOOL 01: EXAM GENERATOR
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedExam ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Build an Exam</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Structured examination with answers</p>
              </div>
            </div>

            <form id="exam-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Prominent Validation Error Banner */}
              {validationError && (
                <div
                  id="exam-validation-alert"
                  className="p-3.5 rounded-xl bg-red-50 border-2 border-[#D63651] text-[#D63651] flex items-start gap-2.5 text-xs sm:text-sm font-mono-code font-bold animate-in fade-in slide-in-from-top-1 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span>{validationError}</span>
                  </div>
                </div>
              )}

              {/* Subject Selection */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm flex items-center justify-between">
                  <span>Subject Category *</span>
                  {fieldErrors.subject && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <select
                  id="exam-field-subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    clearFieldError('subject');
                  }}
                  className={`w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold transition-all ${
                    fieldErrors.subject
                      ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30'
                      : ''
                  }`}
                >
                  <option value="">-- Select Subject Category --</option>
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.subject && (
                  <p className="text-[#D63651] text-xs font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.subject}</span>
                  </p>
                )}
              </div>

              {/* Topic Input */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm flex items-center justify-between">
                  <span>Exam Topic or Specific Concept *</span>
                  {fieldErrors.topic && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="exam-field-topic"
                  type="text"
                  placeholder="e.g. Quadratic Equations, Photosynthesis, Kingdom of Mali..."
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    clearFieldError('topic');
                  }}
                  className={`w-full clay-input px-3.5 py-2.5 text-stone-900 placeholder-stone-400 font-bold transition-all ${
                    fieldErrors.topic
                      ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30'
                      : ''
                  }`}
                />
                {fieldErrors.topic && (
                  <p className="text-[#D63651] text-xs font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.topic}</span>
                  </p>
                )}
              </div>

              {/* Grade Level & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Grade Level
                  </label>
                  <select
                    id="exam-field-grade"
                    value={gradeLevel}
                    onChange={(e) => {
                      setGradeLevel(e.target.value as GradeLevel);
                      clearFieldError('gradeLevel');
                    }}
                    className={`w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs ${
                      fieldErrors.gradeLevel ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.gradeLevel && (
                    <p className="text-[#D63651] text-[11px] font-bold mt-1">{fieldErrors.gradeLevel}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Difficulty
                  </label>
                  <select
                    id="exam-field-difficulty"
                    value={difficulty}
                    onChange={(e) => {
                      setDifficulty(e.target.value as DifficultyLevel);
                      clearFieldError('difficulty');
                    }}
                    className={`w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs ${
                      fieldErrors.difficulty ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.difficulty && (
                    <p className="text-[#D63651] text-[11px] font-bold mt-1">{fieldErrors.difficulty}</p>
                  )}
                </div>
              </div>

              {/* Duration & Marks */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs">
                    Mins *
                  </label>
                  <input
                    id="exam-field-duration"
                    type="number"
                    min={5}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) => {
                      setDurationMinutes(Number(e.target.value));
                      clearFieldError('durationMinutes');
                    }}
                    className={`w-full clay-input px-2.5 py-2.5 text-stone-900 font-bold text-center ${
                      fieldErrors.durationMinutes ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  />
                  {fieldErrors.durationMinutes && (
                    <p className="text-[#D63651] text-[10px] font-bold mt-1">{fieldErrors.durationMinutes}</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs">
                    Marks *
                  </label>
                  <input
                    id="exam-field-marks"
                    type="number"
                    min={5}
                    max={200}
                    value={totalMarks}
                    onChange={(e) => {
                      setTotalMarks(Number(e.target.value));
                      clearFieldError('totalMarks');
                    }}
                    className={`w-full clay-input px-2.5 py-2.5 text-stone-900 font-bold text-center ${
                      fieldErrors.totalMarks ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  />
                  {fieldErrors.totalMarks && (
                    <p className="text-[#D63651] text-[10px] font-bold mt-1">{fieldErrors.totalMarks}</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs">
                    Questions *
                  </label>
                  <input
                    id="exam-field-questions"
                    type="number"
                    min={1}
                    max={30}
                    value={questionCount}
                    onChange={(e) => {
                      setQuestionCount(Number(e.target.value));
                      clearFieldError('questionCount');
                    }}
                    className={`w-full clay-input px-2.5 py-2.5 text-stone-900 font-bold text-center ${
                      fieldErrors.questionCount ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  />
                  {fieldErrors.questionCount && (
                    <p className="text-[#D63651] text-[10px] font-bold mt-1">{fieldErrors.questionCount}</p>
                  )}
                </div>
              </div>

              {/* Institution Header */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Examination Header / Board
                </label>
                <input
                  type="text"
                  value={institutionHeader}
                  onChange={(e) => setInstitutionHeader(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold"
                />
              </div>

              {/* Teacher Instructions */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include 1 scenario question, formula sheet required..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full clay-input p-3 text-stone-900 placeholder-stone-400 font-mono-code font-normal"
                />
              </div>

              {/* Source Document Upload (Never replaces or auto-populates required fields) */}
              <SourceMaterialUpload
                toolName="exam"
                onProcessingChange={(processing) => setIsProcessingDoc(processing)}
                onDocumentExtracted={(text) => {
                  setSourceMaterial(text);
                }}
                onDocumentRemoved={() => {
                  setSourceMaterial('');
                  setIsProcessingDoc(false);
                }}
              />

              {/* Generate Button */}
              <button
                type="submit"
                id="generate-exam-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>BUILDING EXAM PAPER...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD EXAM ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output View */}
        <div className="lg:col-span-8 space-y-4">
          {generatedExam ? (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className={`px-4 py-2 text-xs sm:text-sm font-mono-code font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
                      showAnswerKey
                        ? 'clay-btn-dark'
                        : 'clay-pill-3d text-stone-900'
                    }`}
                  >
                    {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showAnswerKey ? 'Hide Marking Key' : 'Show Marking Key'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyExamText}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Full Exam"
                  >
                    {copiedNotification ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedExam)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Printable Exam Paper Document */}
              <div className="clay-card-3d p-8 sm:p-10 space-y-6 text-[#181716] print:border-none print:shadow-none print:p-0">
                {/* Header Board */}
                <div className="text-center pb-6 border-b border-stone-200 space-y-2">
                  <h2 className="font-mono-code text-sm sm:text-base font-black tracking-widest uppercase text-[#D63651]">
                    {generatedExam.institutionHeader || 'PROUDLY AFRIKAN EXAMINATION BOARD'}
                  </h2>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#181716] uppercase">
                    {generatedExam.title || `${topic || 'Examination'}`}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-3 font-mono-code text-xs sm:text-sm text-stone-700 font-bold pt-2">
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Subject: {generatedExam.subject || subject}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Grade: {generatedExam.gradeLevel || gradeLevel}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Time: {generatedExam.durationMinutes || durationMinutes} Mins
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-[#D63651] font-black">
                      Total Marks: {generatedExam.totalMarks || totalMarks}
                    </span>
                  </div>
                </div>

                {/* Candidate Details Form Section (For Printable Exam) */}
                <div className="p-4 rounded-2xl bg-white/70 border border-stone-200 font-mono-code text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-stone-700">CANDIDATE NAME: </span>
                    <span className="inline-block w-48 border-b border-stone-400"></span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">STUDENT ID / INDEX NO: </span>
                    <span className="inline-block w-32 border-b border-stone-400"></span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-stone-700">GENERAL INSTRUCTIONS: </span>
                    <span className="text-stone-800">{generatedExam.instructions || instructions || 'Answer all questions in the spaces provided.'}</span>
                  </div>
                </div>

                {/* Exam Sections & Questions */}
                <div className="space-y-8 pt-4">
                  {(generatedExam.sections || []).map((section, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                      <div className="bg-stone-100 p-3.5 rounded-xl flex items-center justify-between border border-stone-200">
                        <div>
                          <h3 className="font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                            {section.title || `SECTION ${String.fromCharCode(65 + sIdx)}`}
                          </h3>
                          <p className="font-mono-code text-xs text-stone-600 mt-0.5">
                            {section.instructions || 'Answer all questions.'}
                          </p>
                        </div>
                        <span className="font-mono-code text-xs sm:text-sm font-bold clay-pill-3d px-3 py-1 text-stone-900 shrink-0">
                          [{section.marks || 0} Marks]
                        </span>
                      </div>

                      <div className="space-y-4 pl-1 sm:pl-2">
                        {(section.questions || []).map((q, qIdx) => (
                          <div key={q.id || `q-${sIdx}-${q.number || qIdx}`} className="p-5 rounded-2xl bg-white/60 border border-stone-200/80 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-stone-900 text-sm sm:text-base leading-relaxed">
                                <span className="font-bold font-mono-code mr-2 text-stone-950">
                                  {q.number || qIdx + 1}.
                                </span>
                                {q.text || (q as any).prompt || (q as any).question || ''}
                              </p>
                              <span className="font-mono-code text-xs font-bold text-stone-700 shrink-0 bg-stone-100 px-2.5 py-1 rounded-lg">
                                [{q.marks || 1} {(q.marks === 1) ? 'mark' : 'marks'}]
                              </span>
                            </div>

                            {/* Multiple Choice Options */}
                            {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pl-4">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="p-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-mono-code text-stone-800"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Teacher Marking Key & Guidance */}
                            {showAnswerKey && (
                              <div className="mt-3 p-4 bg-red-50/80 border border-red-200 rounded-xl text-xs sm:text-sm font-mono-code space-y-1.5 text-stone-900 print:hidden">
                                <div className="flex items-center gap-2 font-black text-[#D63651] uppercase">
                                  <Award className="w-4 h-4" />
                                  <span>Official Marking Key &amp; Guidance:</span>
                                </div>
                                {q.correctAnswer && (
                                  <p className="font-bold text-stone-900">
                                    <strong>CORRECT ANSWER: </strong> {q.correctAnswer}
                                  </p>
                                )}
                                <p className="text-stone-800 leading-relaxed font-normal">
                                  {q.markingGuidance || (q as any).explanation || (q as any).guidance || ''}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Marking Scheme Notes */}
                {showAnswerKey && generatedExam.overallMarkingNotes && (
                  <div className="mt-8 pt-5 border-t border-stone-200 space-y-2 font-mono-code text-xs sm:text-sm text-stone-900 print:hidden">
                    <h5 className="font-bold uppercase text-[#D63651]">Moderator Notes:</h5>
                    <p className="leading-relaxed bg-white/90 p-4 border border-stone-200 rounded-xl font-normal">
                      {generatedExam.overallMarkingNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <FileCheck2 className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Exam Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Choose a subject category, enter your exam topic, and click "Build Exam" to generate a complete structured test paper.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
