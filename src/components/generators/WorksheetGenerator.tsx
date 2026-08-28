import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Printer,
  Copy,
  Save,
  Check,
  Edit3,
  Eye,
  EyeOff,
  ChevronLeft,
  BookOpen,
  Award,
  HelpCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { WorksheetResource, GradeLevel, DifficultyLevel } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface WorksheetGeneratorProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (worksheet: WorksheetResource) => void;
  existingResource?: WorksheetResource;
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

export const WorksheetGenerator: React.FC<WorksheetGeneratorProps> = ({
  initialSubject = 'Mathematics & Science',
  initialTopic = '',
  onBack,
  onSave,
  existingResource,
}) => {
  const normalizedExisting = React.useMemo(() => {
    if (!existingResource) return null;
    return (existingResource as any)?.data || existingResource;
  }, [existingResource]);

  const [subject, setSubject] = useState(normalizedExisting?.subject || initialSubject);
  const [topic, setTopic] = useState(normalizedExisting?.topic || initialTopic || '');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    (normalizedExisting?.gradeLevel as GradeLevel) || 'Junior Secondary / Middle School (Grades 6-8)'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    normalizedExisting?.difficulty || 'Beginner'
  );
  const [activityTypes, setActivityTypes] = useState<string[]>([
    'matching',
    'fill-in-blanks',
    'structured-questions',
    'critical-thinking',
  ]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<WorksheetResource | null>(
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

  const toggleActivityType = (type: string) => {
    clearFieldError('activityTypes');
    if (activityTypes.includes(type)) {
      if (activityTypes.length > 1) {
        setActivityTypes(activityTypes.filter((t) => t !== type));
      }
    } else {
      setActivityTypes([...activityTypes, type]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation
    const errors: Record<string, string> = {};

    if (!subject || !subject.trim()) {
      errors.subject = 'Please select a Subject Category before building your worksheet.';
    }
    if (!topic || !topic.trim()) {
      errors.topic = 'Please enter a Worksheet Topic before building your worksheet.';
    }
    if (!gradeLevel) {
      errors.gradeLevel = 'Please select a Grade Level before building your worksheet.';
    }
    if (!difficulty) {
      errors.difficulty = 'Please select a Difficulty Level before building your worksheet.';
    }
    if (!activityTypes || activityTypes.length === 0) {
      errors.activityTypes = 'Please select at least one Exercise Type before building your worksheet.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage =
        errors.subject ||
        errors.topic ||
        errors.gradeLevel ||
        errors.difficulty ||
        errors.activityTypes;
      setValidationError(firstErrorMessage);

      const firstFieldId = errors.subject
        ? 'worksheet-field-subject'
        : errors.topic
        ? 'worksheet-field-topic'
        : 'worksheet-form';
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
      const response = await fetch('/api/generate/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel,
          difficulty,
          activityTypes,
          additionalInstructions,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate worksheet');
      }

      const resData = await response.json();
      const wsData = resData?.data || resData;
      if (wsData && (wsData.sections || wsData.title || wsData.activities)) {
        setGeneratedWorksheet(wsData);
      } else {
        throw new Error('Fallback trigger');
      }
    } catch (err) {
      console.error('Error generating worksheet:', err);
      // Fallback worksheet
      const fallbackWorksheet: WorksheetResource = {
        id: 'worksheet-' + Date.now(),
        toolType: 'worksheet',
        title: `${topic} - Guided Mastery Worksheet`,
        subject,
        topic,
        gradeLevel,
        difficulty,
        totalMarks: 35,
        estimatedDurationMinutes: 45,
        createdAt: new Date().toISOString(),
        instructions: 'Complete all activities sequentially. Write your answers neatly in the spaces provided.',
        sections: [
          {
            title: 'Activity 1: Vocabulary & Key Terms Match',
            type: 'matching',
            instructions: 'Match each concept on the left with its correct definition on the right.',
            marks: 10,
            items: [
              {
                id: 'm1',
                prompt: '1. Primary Component of ' + topic,
                expectedAnswer: 'Foundational building block that drives system operations.',
              },
              {
                id: 'm2',
                prompt: '2. Secondary Interaction Factor',
                expectedAnswer: 'Environmental feedback loop influencing outcomes.',
              },
            ],
          },
          {
            title: 'Activity 2: Fill in the Blanks',
            type: 'fill-in-blanks',
            instructions: 'Fill in each missing blank with the appropriate academic term.',
            marks: 10,
            items: [
              {
                id: 'f1',
                prompt: `During the development of ${topic}, the process of __________ ensures optimal efficiency.`,
                expectedAnswer: 'equilibrium / catalysis',
              },
              {
                id: 'f2',
                prompt: `A key indicator of successful ${topic} deployment is __________.`,
                expectedAnswer: 'sustainable integration',
              },
            ],
          },
          {
            title: 'Activity 3: Critical Thinking & Scenario Application',
            type: 'critical-thinking',
            instructions: 'Read the prompt below and provide a reasoned paragraph response.',
            marks: 15,
            items: [
              {
                id: 'c1',
                prompt: `How might real-world communities leverage the core principles of ${topic} to solve local infrastructure or environmental challenges?`,
                expectedAnswer: 'Answers will vary. Look for clear articulation of practical relevance, evidence-based reasoning, and community impact.',
              },
            ],
          },
        ],
        teacherNotes: 'Use Activity 1 as a 5-minute bell-ringer and Activity 3 for peer discussion.',
      };
      setGeneratedWorksheet(fallbackWorksheet);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedWorksheet) return;
    let text = `${(generatedWorksheet.title || 'WORKSHEET').toUpperCase()}\n`;
    text += `SUBJECT: ${generatedWorksheet.subject || subject} | GRADE: ${generatedWorksheet.gradeLevel || gradeLevel} | ESTIMATED TIME: ${generatedWorksheet.estimatedDurationMinutes || 45} MINS\n\n`;
    text += `INSTRUCTIONS: ${generatedWorksheet.instructions || 'Complete all activities sequentially.'}\n\n`;

    (generatedWorksheet.sections || []).forEach((sec, idx) => {
      text += `--- ${sec.title || `Activity ${idx + 1}`} [${sec.marks || 0} Marks] ---\n`;
      text += `${sec.instructions || ''}\n\n`;
      (sec.items || []).forEach((item: any, itemIdx: number) => {
        text += `${itemIdx + 1}. ${item.prompt || item.text || item.question || ''}\n`;
        if (showAnswerKey && (item.expectedAnswer || item.answerKey)) {
          text += `   [ANSWER KEY: ${item.expectedAnswer || item.answerKey}]\n`;
        }
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
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
            TOOL 02: WORKSHEET GENERATOR
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedWorksheet ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Build a Worksheet</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Printable classroom exercises</p>
              </div>
            </div>

            <form id="worksheet-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Validation Alert Banner */}
              {validationError && (
                <div
                  id="worksheet-validation-alert"
                  className="p-3.5 rounded-xl bg-red-50 border-2 border-[#D63651] text-[#D63651] flex items-start gap-2.5 text-xs sm:text-sm font-mono-code font-bold animate-in fade-in slide-in-from-top-1 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span>{validationError}</span>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm flex items-center justify-between">
                  <span>Subject Category *</span>
                  {fieldErrors.subject && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <select
                  id="worksheet-field-subject"
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

              {/* Topic */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm flex items-center justify-between">
                  <span>Worksheet Topic *</span>
                  {fieldErrors.topic && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="worksheet-field-topic"
                  type="text"
                  placeholder="e.g. Chemical Bonding, Fractions, African Rivers & Lakes..."
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

              {/* Grade & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Grade Level
                  </label>
                  <select
                    id="worksheet-field-grade"
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
                    id="worksheet-field-difficulty"
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

              {/* Activity Types Selection */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-2 text-xs sm:text-sm flex items-center justify-between">
                  <span>Include Exercise Types *</span>
                  {fieldErrors.activityTypes && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">select at least one</span>
                  )}
                </label>
                <div
                  id="worksheet-field-activities"
                  className={`grid grid-cols-2 gap-2 p-1 rounded-xl transition-all ${
                    fieldErrors.activityTypes ? 'ring-2 ring-[#D63651]/30 bg-red-50/30' : ''
                  }`}
                >
                  {[
                    { id: 'matching', label: 'Matching' },
                    { id: 'fill-in-blanks', label: 'Fill in Blanks' },
                    { id: 'structured-questions', label: 'Structured Qs' },
                    { id: 'critical-thinking', label: 'Critical Thinking' },
                  ].map((type) => {
                    const isSelected = activityTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleActivityType(type.id)}
                        className={`p-2 text-xs font-mono-code font-bold uppercase rounded-xl transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'clay-btn-dark'
                            : 'clay-pill-3d text-stone-800'
                        }`}
                      >
                        <span>{type.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E6425E]" />}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.activityTypes && (
                  <p className="text-[#D63651] text-xs font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.activityTypes}</span>
                  </p>
                )}
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Teacher Notes / Customization (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include a short vocabulary bank, emphasize practical local examples..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full clay-input p-3 text-stone-900 placeholder-stone-400 font-mono-code font-normal"
                />
              </div>

              {/* Source Document Upload (Never replaces or bypasses required fields) */}
              <SourceMaterialUpload
                toolName="worksheet"
                onProcessingChange={(processing) => setIsProcessingDoc(processing)}
                onDocumentExtracted={(text) => setSourceMaterial(text)}
                onDocumentRemoved={() => {
                  setSourceMaterial('');
                  setIsProcessingDoc(false);
                }}
              />

              {/* Submit */}
              <button
                type="submit"
                id="generate-worksheet-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>BUILDING WORKSHEET...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD WORKSHEET ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output View */}
        <div className="lg:col-span-8 space-y-4">
          {generatedWorksheet ? (
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
                    <span>{showAnswerKey ? 'Hide Teacher Answers' : 'Show Teacher Answers'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyText}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Worksheet"
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
                    onClick={() => onSave(generatedWorksheet)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Printable Worksheet Document */}
              <div className="clay-card-3d p-8 sm:p-10 space-y-6 text-[#181716] print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="text-center pb-6 border-b border-stone-200 space-y-2">
                  <span className="font-mono-code text-xs sm:text-sm font-bold uppercase tracking-widest text-[#D63651]">
                    CLASSROOM PRACTICE &amp; MASTERY WORKSHEET
                  </span>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#181716] uppercase">
                    {generatedWorksheet.title}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-3 font-mono-code text-xs sm:text-sm text-stone-700 font-bold pt-2">
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Subject: {generatedWorksheet.subject}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Grade: {generatedWorksheet.gradeLevel}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Duration: ~{generatedWorksheet.estimatedDurationMinutes} Mins
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-[#D63651] font-black">
                      Total Marks: {generatedWorksheet.totalMarks}
                    </span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="p-4 rounded-2xl bg-white/70 border border-stone-200 font-mono-code text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-stone-700">STUDENT NAME: </span>
                    <span className="inline-block w-48 border-b border-stone-400"></span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">DATE: </span>
                    <span className="inline-block w-32 border-b border-stone-400"></span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-stone-700">INSTRUCTIONS: </span>
                    <span className="text-stone-800">{generatedWorksheet.instructions}</span>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-8 pt-4">
                  {(generatedWorksheet.sections || []).map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                      <div className="bg-stone-100 p-3.5 rounded-xl flex items-center justify-between border border-stone-200">
                        <div>
                          <h3 className="font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                            {sec.title}
                          </h3>
                          <p className="font-mono-code text-xs text-stone-600 mt-0.5">
                            {sec.instructions}
                          </p>
                        </div>
                        <span className="font-mono-code text-xs sm:text-sm font-bold clay-pill-3d px-3 py-1 text-stone-900 shrink-0">
                          [{sec.marks} Marks]
                        </span>
                      </div>

                      <div className="space-y-4 pl-1 sm:pl-2">
                        {(sec.items || []).map((item, iIdx) => (
                          <div key={item.id} className="p-5 rounded-2xl bg-white/60 border border-stone-200/80 space-y-3">
                            <p className="font-medium text-stone-900 text-sm sm:text-base leading-relaxed">
                              <span className="font-bold font-mono-code mr-2 text-stone-950">
                                {iIdx + 1}.
                              </span>
                              {item.prompt}
                            </p>

                            {/* Blank line for writing */}
                            <div className="pt-2">
                              <div className="w-full h-8 border-b border-dashed border-stone-300"></div>
                            </div>

                            {/* Teacher Key */}
                            {showAnswerKey && item.expectedAnswer && (
                              <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs sm:text-sm font-mono-code space-y-1 text-emerald-950 print:hidden">
                                <span className="font-bold uppercase text-emerald-700 block">
                                  ✓ Expected Answer / Rubric:
                                </span>
                                <p className="leading-relaxed">{item.expectedAnswer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Teacher Notes Footer */}
                {showAnswerKey && generatedWorksheet.teacherNotes && (
                  <div className="mt-8 pt-5 border-t border-stone-200 space-y-2 font-mono-code text-xs sm:text-sm text-stone-900 print:hidden">
                    <h5 className="font-bold uppercase text-[#D63651]">Teacher Lesson Integration Guide:</h5>
                    <p className="leading-relaxed bg-white/90 p-4 border border-stone-200 rounded-xl font-normal">
                      {generatedWorksheet.teacherNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Worksheet Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Choose a subject category, enter your worksheet topic, and click "Build Worksheet" to generate a complete printable activity set.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
