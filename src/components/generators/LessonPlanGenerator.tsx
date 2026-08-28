import React, { useState } from 'react';
import {
  CalendarCheck2,
  Sparkles,
  Printer,
  Copy,
  Save,
  Check,
  ChevronLeft,
  BookOpen,
  Clock,
  Target,
  Users,
  Lightbulb,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { LessonPlanResource, GradeLevel, DifficultyLevel } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface LessonPlanGeneratorProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (plan: LessonPlanResource) => void;
  existingResource?: LessonPlanResource;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Primary / Elementary (Grades 1-5)',
  'Junior Secondary / Middle School (Grades 6-8)',
  'Senior Secondary / High School (Grades 9-12)',
  'Tertiary / Undergraduate',
  'Postgraduate / Professional',
  'Adult & Lifelong Learner',
];

export const LessonPlanGenerator: React.FC<LessonPlanGeneratorProps> = ({
  initialSubject = 'Humanities & Social Sciences',
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
  const [durationMinutes, setDurationMinutes] = useState(normalizedExisting?.durationMinutes || 45);
  const [curriculumStandard, setCurriculumStandard] = useState('Standard National Curriculum (CAPS / WAEC / CBC aligned)');
  const [pedagogicalApproach, setPedagogicalApproach] = useState('Inquiry-Based Learning');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlanResource | null>(
    normalizedExisting && (normalizedExisting.phases || normalizedExisting.objectives || normalizedExisting.title) ? normalizedExisting : null
  );
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

    // Strict validation
    const errors: Record<string, string> = {};

    if (!subject || !subject.trim()) {
      errors.subject = 'Please select a Subject Category before building your lesson plan.';
    }
    if (!topic || !topic.trim()) {
      errors.topic = 'Please enter a Lesson Topic before building your lesson plan.';
    }
    if (!gradeLevel) {
      errors.gradeLevel = 'Please select a Grade Level before building your lesson plan.';
    }
    if (!durationMinutes || durationMinutes < 5) {
      errors.durationMinutes = 'Please enter a valid Duration (minimum 5 minutes) before building your lesson plan.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage =
        errors.subject ||
        errors.topic ||
        errors.gradeLevel ||
        errors.durationMinutes;
      setValidationError(firstErrorMessage);

      const firstFieldId = errors.subject
        ? 'lesson-field-subject'
        : errors.topic
        ? 'lesson-field-topic'
        : errors.durationMinutes
        ? 'lesson-field-duration'
        : 'lesson-form';
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
      const response = await fetch('/api/generate/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel,
          durationMinutes,
          curriculumStandard,
          pedagogicalApproach,
          additionalNotes,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const resData = await response.json();
      const planData = resData?.data || resData;
      if (planData && (planData.phases || planData.objectives || planData.title)) {
        setGeneratedPlan(planData);
      } else {
        throw new Error('Fallback trigger');
      }
    } catch (err) {
      console.error('Error generating lesson plan:', err);
      // Fallback lesson plan
      const fallbackPlan: LessonPlanResource = {
        id: 'lesson-' + Date.now(),
        toolType: 'lesson-plan',
        title: `Comprehensive Lesson Plan: ${topic}`,
        subject,
        topic,
        gradeLevel,
        durationMinutes,
        createdAt: new Date().toISOString(),
        objectives: [
          `Define and explain the fundamental principles of ${topic}.`,
          `Analyze real-world case studies and contextual applications of ${topic}.`,
          `Synthesize key takeaways through collaborative discussion and practical exercises.`,
        ],
        prerequisites: ['Basic introductory knowledge of preceding curriculum units.'],
        materialsNeeded: [
          'Whiteboard & Dry-Erase Markers',
          'Student Worksheets & Reference Handouts',
          'Digital Projector or Graphic Charts',
        ],
        phases: [
          {
            phase: 'Hook & Introduction (Bell Ringer)',
            durationMinutes: 5,
            teacherActivity: `Present a provocative question or artifact related to ${topic} to spark active curiosity.`,
            studentActivity: 'Discuss initial hypotheses with elbow partner and record brief predictions.',
          },
          {
            phase: 'Direct Instruction & Concept Exploration',
            durationMinutes: 15,
            teacherActivity: `Introduce foundational models, terminology, and historical/scientific frameworks for ${topic}.`,
            studentActivity: 'Take structured Cornell notes and annotate visual diagrams.',
          },
          {
            phase: 'Guided Practice & Collaborative Task',
            durationMinutes: 15,
            teacherActivity: 'Circulate to provide scaffolding and check for conceptual misunderstandings.',
            studentActivity: 'Work in small pods of 3-4 to solve structured scenario challenges.',
          },
          {
            phase: 'Plenary, Synthesis & Exit Ticket',
            durationMinutes: 10,
            teacherActivity: 'Facilitate summary debrief and collect 1-minute exit tickets.',
            studentActivity: 'Write 1 key insight and 1 remaining question on exit ticket.',
          },
        ],
        assessmentStrategy: 'Formative assessment via active questioning, group artifact review, and exit ticket response.',
        differentiation: {
          support: 'Provide simplified vocabulary glossaries and sentence starter templates.',
          extension: 'Challenge fast finishers to draft an essay analyzing high-complexity implications.',
        },
      };
      setGeneratedPlan(fallbackPlan);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedPlan) return;
    let text = `${(generatedPlan.title || 'LESSON PLAN').toUpperCase()}\n`;
    text += `SUBJECT: ${generatedPlan.subject || subject} | GRADE: ${generatedPlan.gradeLevel || gradeLevel} | DURATION: ${generatedPlan.durationMinutes || durationMinutes} MINS\n\n`;
    text += `=== LEARNING OBJECTIVES ===\n`;
    (generatedPlan.objectives || []).forEach((obj, idx) => {
      text += `${idx + 1}. ${obj}\n`;
    });
    text += `\n=== MATERIALS NEEDED ===\n`;
    (generatedPlan.materialsNeeded || []).forEach((mat) => {
      text += `• ${mat}\n`;
    });
    text += `\n=== INSTRUCTIONAL PHASES ===\n`;
    (generatedPlan.phases || []).forEach((phase) => {
      text += `[${phase.phase} - ${phase.durationMinutes} mins]\n`;
      text += `Teacher: ${phase.teacherActivity}\n`;
      text += `Student: ${phase.studentActivity}\n\n`;
    });
    text += `=== ASSESSMENT STRATEGY ===\n${generatedPlan.assessmentStrategy || 'Formative observation'}\n`;

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
            TOOL 03: LESSON PLAN GENERATOR
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedPlan ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <CalendarCheck2 className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Build Lesson Plan</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Pedagogy &amp; structured phases</p>
              </div>
            </div>

            <form id="lesson-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Validation Alert Banner */}
              {validationError && (
                <div
                  id="lesson-validation-alert"
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
                  id="lesson-field-subject"
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
                  <span>Lesson Topic *</span>
                  {fieldErrors.topic && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="lesson-field-topic"
                  type="text"
                  placeholder="e.g. Newton's Third Law, Climate Change, African Poetry..."
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

              {/* Grade & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Grade Level
                  </label>
                  <select
                    id="lesson-field-grade"
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
                    Duration (Mins) *
                  </label>
                  <input
                    id="lesson-field-duration"
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => {
                      setDurationMinutes(Number(e.target.value));
                      clearFieldError('durationMinutes');
                    }}
                    className={`w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-center ${
                      fieldErrors.durationMinutes ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  />
                  {fieldErrors.durationMinutes && (
                    <p className="text-[#D63651] text-[11px] font-bold mt-1">{fieldErrors.durationMinutes}</p>
                  )}
                </div>
              </div>

              {/* Pedagogical Approach */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Pedagogical Framework
                </label>
                <select
                  value={pedagogicalApproach}
                  onChange={(e) => setPedagogicalApproach(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold"
                >
                  <option value="Inquiry-Based Learning">Inquiry-Based Learning</option>
                  <option value="Explicit Direct Instruction (I Do, We Do, You Do)">Explicit Direct Instruction (I Do / We Do / You Do)</option>
                  <option value="Project-Based & Contextual Problem Solving">Project-Based & Contextual Problem Solving</option>
                  <option value="Flipped Classroom & Socratic Seminar">Flipped Classroom & Socratic Seminar</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Specific Class Context / Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on laboratory safety, integrate indigenous African technologies..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full clay-input p-3 text-stone-900 placeholder-stone-400 font-mono-code font-normal"
                />
              </div>

              {/* Source Document Upload (Never replaces or bypasses required fields) */}
              <SourceMaterialUpload
                toolName="lesson-plan"
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
                id="generate-lesson-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>BUILDING LESSON PLAN...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD LESSON PLAN ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output View */}
        <div className="lg:col-span-8 space-y-4">
          {generatedPlan ? (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="clay-pill-3d px-3.5 py-1.5 font-mono-code text-xs sm:text-sm font-bold text-stone-900">
                    {generatedPlan.durationMinutes} Minutes
                  </span>
                  <span className="clay-pill-3d px-3.5 py-1.5 font-mono-code text-xs sm:text-sm font-bold text-stone-900">
                    {generatedPlan.phases.length} Phases
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyText}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Lesson Plan"
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
                    onClick={() => onSave(generatedPlan)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Printable Lesson Plan Document */}
              <div className="clay-card-3d p-8 sm:p-10 space-y-6 text-[#181716] print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="text-center pb-6 border-b border-stone-200 space-y-2">
                  <span className="font-mono-code text-xs sm:text-sm font-bold uppercase tracking-widest text-[#D63651]">
                    INSTRUCTIONAL DESIGN &amp; LESSON ARCHITECTURE
                  </span>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#181716] uppercase">
                    {generatedPlan.title}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-3 font-mono-code text-xs sm:text-sm text-stone-700 font-bold pt-2">
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Subject: {generatedPlan.subject}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Grade: {generatedPlan.gradeLevel}
                    </span>
                    <span className="clay-pill-3d px-3 py-1 text-stone-900">
                      Duration: {generatedPlan.durationMinutes} Mins
                    </span>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                    <Target className="w-5 h-5 text-[#D63651]" />
                    <h3>Learning Objectives (Measurable Outcomes)</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/70 border border-stone-200 space-y-2 font-mono-code text-xs sm:text-sm text-stone-900">
                    {(generatedPlan.objectives || []).map((obj, oIdx) => (
                      <div key={oIdx} className="flex items-start gap-2.5">
                        <span className="font-bold text-[#D63651] shrink-0">✓</span>
                        <p className="leading-relaxed font-medium">{obj}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials & Resources */}
                {generatedPlan.materialsNeeded && Array.isArray(generatedPlan.materialsNeeded) && generatedPlan.materialsNeeded.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <BookOpen className="w-5 h-5 text-[#D63651]" />
                      <h3>Required Classroom Materials &amp; Media</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(generatedPlan.materialsNeeded || []).map((mat, mIdx) => (
                        <span
                          key={mIdx}
                          className="clay-pill-3d px-3.5 py-1.5 font-mono-code text-xs sm:text-sm font-bold text-stone-900"
                        >
                          • {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructional Phase Timeline */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                    <Clock className="w-5 h-5 text-[#D63651]" />
                    <h3>Instructional Phases &amp; Delivery Matrix</h3>
                  </div>

                  <div className="space-y-4">
                    {(generatedPlan.phases || []).map((phase, pIdx) => (
                      <div key={pIdx} className="p-5 rounded-2xl bg-white/60 border border-stone-200 space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
                          <h4 className="font-display font-black text-sm sm:text-base text-[#181716] uppercase">
                            Phase {pIdx + 1}: {phase.phase}
                          </h4>
                          <span className="clay-pill-3d px-3 py-1 font-mono-code text-xs font-bold text-[#D63651]">
                            {phase.durationMinutes} Mins
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm font-mono-code">
                          <div className="space-y-1 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/70">
                            <span className="font-bold uppercase text-stone-900 block text-xs">
                              👨‍🏫 Teacher Activity &amp; Facilitation:
                            </span>
                            <p className="text-stone-800 leading-relaxed font-normal">
                              {phase.teacherActivity}
                            </p>
                          </div>

                          <div className="space-y-1 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
                            <span className="font-bold uppercase text-amber-900 block text-xs">
                              🧑‍🎓 Student Engagement &amp; Task:
                            </span>
                            <p className="text-stone-800 leading-relaxed font-normal">
                              {phase.studentActivity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assessment & Differentiation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-5 rounded-2xl bg-white/70 border border-stone-200 space-y-2">
                    <h4 className="font-display font-black text-sm sm:text-base text-[#181716] uppercase">
                      Assessment &amp; Checks for Understanding
                    </h4>
                    <p className="font-mono-code text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                      {generatedPlan.assessmentStrategy}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/70 border border-stone-200 space-y-2">
                    <h4 className="font-display font-black text-sm sm:text-base text-[#181716] uppercase">
                      Differentiation &amp; Scaffolding
                    </h4>
                    <div className="font-mono-code text-xs sm:text-sm text-stone-800 space-y-1.5 font-normal">
                      <p>
                        <strong className="text-stone-950 font-bold">Support: </strong>
                        {generatedPlan.differentiation.support}
                      </p>
                      <p>
                        <strong className="text-stone-950 font-bold">Extension: </strong>
                        {generatedPlan.differentiation.extension}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <CalendarCheck2 className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Lesson Plan Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Choose a subject category, enter your lesson topic, and click "Build Lesson Plan" to generate a complete structured pedagogical guide.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
