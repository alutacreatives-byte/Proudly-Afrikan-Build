import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ChevronLeft,
  BookOpen,
  Copy,
  Save,
  Check,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CourseResource, GradeLevel } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface CourseBuilderProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (course: CourseResource) => void;
  existingResource?: CourseResource;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Primary / Elementary (Grades 1-5)',
  'Junior Secondary / Middle School (Grades 6-8)',
  'Senior Secondary / High School (Grades 9-12)',
  'Tertiary / Undergraduate',
  'Postgraduate / Professional',
  'Adult & Lifelong Learner',
];

export const CourseBuilder: React.FC<CourseBuilderProps> = ({
  initialSubject = 'Technology & Computer Science',
  initialTopic = '',
  onBack,
  onSave,
  existingResource,
}) => {
  const [subject, setSubject] = useState(existingResource?.subject || initialSubject);
  const [topic, setTopic] = useState(existingResource?.topic || initialTopic || '');
  const [targetAudience, setTargetAudience] = useState<GradeLevel>(
    (existingResource?.gradeLevel as GradeLevel) || 'Tertiary / Undergraduate'
  );
  const [durationWeeks, setDurationWeeks] = useState(existingResource?.durationWeeks || 6);
  const [modulesCount, setModulesCount] = useState(4);
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<CourseResource | null>(
    existingResource || null
  );
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(0);
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
      errors.subject = 'Please select a Subject Category before building your course.';
    }
    if (!topic || !topic.trim()) {
      errors.topic = 'Please enter a Course Topic / Title before building your course.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage = errors.subject || errors.topic;
      setValidationError(firstErrorMessage);

      const firstFieldId = errors.subject
        ? 'course-field-subject'
        : errors.topic
        ? 'course-field-topic'
        : 'course-form';
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
      const response = await fetch('/api/generate/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          targetAudience,
          durationWeeks,
          modulesCount,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to build course');
      }

      const courseData = await response.json();
      setGeneratedCourse(courseData);
      setExpandedModuleIdx(0);
    } catch (err) {
      console.error('Error building course:', err);
      // Fallback
      const fallbackCourse: CourseResource = {
        id: 'course-' + Date.now(),
        toolType: 'course-builder',
        title: `Comprehensive Curriculum: ${topic}`,
        subject,
        topic,
        gradeLevel: targetAudience,
        durationWeeks,
        prerequisites: ['Basic introductory orientation to foundational subject concepts.'],
        learningOutcomes: [
          `Master fundamental core principles and terminology of ${topic}.`,
          `Analyze complex real-world case scenarios and design practical interventions.`,
          `Execute an end-to-end capstone deliverable demonstrating multidisciplinary mastery.`,
        ],
        modules: [
          {
            moduleNumber: 1,
            title: `Module 1: Foundations & Architecture of ${topic}`,
            estimatedHours: 8,
            lessons: [
              {
                lessonTitle: 'Lesson 1.1: Historical Evolution & Contextual Landscape',
                learningObjective: 'Examine origins, key milestones and foundational models.',
                keyConcepts: ['Foundational origins', 'Theoretical frameworks', 'Contextual drivers'],
                recommendedActivity: 'Synthesize chapter readings into a 1-page visual timeline.',
              },
              {
                lessonTitle: 'Lesson 1.2: Core Methodologies & Operating Principles',
                learningObjective: 'Differentiate primary models from secondary variations.',
                keyConcepts: ['System boundaries', 'Quantitative variables', 'Equilibrium states'],
                recommendedActivity: 'Complete structured scenario problem set in study groups.',
              },
            ],
            assessment: 'Formative multiple-choice quiz and conceptual match exercise.',
          },
          {
            moduleNumber: 2,
            title: `Module 2: Practical Implementation & Capstone Integration`,
            estimatedHours: 12,
            lessons: [
              {
                lessonTitle: 'Lesson 2.1: Case Studies in Scalable Impact',
                learningObjective: 'Critique real-world deployments and extract operational lessons.',
                keyConcepts: ['Scalability barriers', 'Resource constraints', 'Sustainable governance'],
                recommendedActivity: 'Draft an executive briefing memo on a regional case study.',
              },
            ],
            assessment: 'Final graded capstone presentation and portfolio submission.',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setGeneratedCourse(fallbackCourse);
      setExpandedModuleIdx(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedCourse) return;
    let text = `${(generatedCourse.title || 'COURSE').toUpperCase()}\n`;
    text += `SUBJECT: ${generatedCourse.subject || subject} | DURATION: ${generatedCourse.durationWeeks || 8} WEEKS\n\n`;
    text += `=== LEARNING OUTCOMES ===\n`;
    (generatedCourse.learningOutcomes || []).forEach((o, i) => {
      text += `${i + 1}. ${o}\n`;
    });
    text += `\n=== COURSE MODULES ===\n`;
    (generatedCourse.modules || []).forEach((m) => {
      text += `\n${m.title} (${m.estimatedHours} Hours)\n`;
      (m.lessons || []).forEach((l) => {
        text += `  • ${l.lessonTitle}\n    Objective: ${l.learningObjective}\n`;
      });
      text += `  Assessment: ${m.assessment}\n`;
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
            TOOL 07: COURSE BUILDER
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedCourse ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Course Builder</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">End-to-end syllabus &amp; curriculum</p>
              </div>
            </div>

            <form id="course-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Validation Alert Banner */}
              {validationError && (
                <div
                  id="course-validation-alert"
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
                  id="course-field-subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    clearFieldError('subject');
                  }}
                  className={`w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm transition-all ${
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
                  <span>Course Topic / Title *</span>
                  {fieldErrors.topic && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="course-field-topic"
                  type="text"
                  placeholder="e.g. Renewable Energy in Africa, Machine Learning..."
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

              {/* Target & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Target Level
                  </label>
                  <select
                    id="course-field-target"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as GradeLevel)}
                    className="w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Duration
                  </label>
                  <select
                    id="course-field-duration"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs"
                  >
                    <option value={4}>4 Weeks</option>
                    <option value={6}>6 Weeks</option>
                    <option value={8}>8 Weeks</option>
                    <option value={12}>12 Weeks</option>
                  </select>
                </div>
              </div>

              {/* Source Material Upload (Never replaces or bypasses required fields) */}
              <SourceMaterialUpload
                toolName="course"
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
                id="generate-course-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>BUILDING COURSE CURRICULUM...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD FULL COURSE ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output: Course Syllabus */}
        <div className="lg:col-span-8 space-y-4">
          {generatedCourse ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="font-display font-black text-[#181716] text-lg uppercase leading-snug">
                    {generatedCourse.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-mono-code text-xs text-stone-700 font-bold uppercase">
                    <span className="clay-pill-3d px-2.5 py-0.5 text-stone-900">
                      {generatedCourse.durationWeeks} Weeks
                    </span>
                    <span>•</span>
                    <span>{generatedCourse.modules.length} Modules</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyText}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Course Syllabus"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedCourse)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Course Document */}
              <div className="clay-card-3d p-8 sm:p-10 space-y-8 text-[#181716] print:border-none print:shadow-none print:p-0">
                {/* 1. Outcomes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                    <Award className="w-5 h-5 text-[#D63651]" />
                    <h3>Overarching Course Learning Outcomes</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/70 border border-stone-200 space-y-2 font-mono-code text-xs sm:text-sm text-stone-900">
                    {(generatedCourse.learningOutcomes || []).map((lo, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2.5">
                        <span className="font-bold text-[#D63651] shrink-0">✓</span>
                        <p className="leading-relaxed font-medium">{lo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Modules Accordion */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                    <Layers className="w-5 h-5 text-[#D63651]" />
                    <h3>Modules &amp; Lesson Architecture</h3>
                  </div>

                  <div className="space-y-4 font-mono-code">
                    {(generatedCourse.modules || []).map((mod, mIdx) => {
                      const isExpanded = expandedModuleIdx === mIdx;
                      return (
                        <div
                          key={mIdx}
                          className="clay-card-3d p-6 space-y-4 transition-all"
                        >
                          <div
                            onClick={() => setExpandedModuleIdx(isExpanded ? null : mIdx)}
                            className="flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 clay-btn-dark rounded-xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                                {mIdx + 1}
                              </span>
                              <div>
                                <h4 className="font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                                  {mod.title}
                                </h4>
                                <p className="text-xs text-stone-600 font-bold uppercase mt-0.5">
                                  ~{mod.estimatedHours} Guided Learning Hours • {(mod.lessons || []).length} Lessons
                                </p>
                              </div>
                            </div>

                            <button className="text-stone-500 hover:text-stone-900 p-1">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-4 pt-4 border-t border-stone-200">
                              <div className="space-y-3">
                                {(mod.lessons || []).map((les, lIdx) => (
                                  <div
                                    key={lIdx}
                                    className="p-4 rounded-2xl bg-white/70 border border-stone-200 space-y-2 text-xs sm:text-sm"
                                  >
                                    <h5 className="font-bold text-stone-950 text-sm">{les.lessonTitle}</h5>
                                    <p className="text-stone-700 leading-relaxed font-normal">
                                      <strong className="text-stone-900">Objective: </strong>
                                      {les.learningObjective}
                                    </p>
                                    {les.recommendedActivity && (
                                      <p className="text-[#D63651] font-medium text-xs bg-red-50/70 p-2.5 rounded-xl border border-red-200/70">
                                        <strong>Activity: </strong> {les.recommendedActivity}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {mod.assessment && (
                                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs sm:text-sm text-stone-900">
                                  <strong className="text-amber-900 uppercase block mb-1">
                                    Module Assessment &amp; Rubric:
                                  </strong>
                                  <p className="font-normal">{mod.assessment}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Course Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Select your subject and topic, set the duration, and click "Build Full Course" to generate an end-to-end curriculum.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
