import React, { useState } from 'react';
import {
  Presentation,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Save,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PresentationResource, GradeLevel } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface PresentationGeneratorProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (deck: PresentationResource) => void;
  existingResource?: PresentationResource;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Primary / Elementary (Grades 1-5)',
  'Junior Secondary / Middle School (Grades 6-8)',
  'Senior Secondary / High School (Grades 9-12)',
  'Tertiary / Undergraduate',
  'Postgraduate / Professional',
  'Adult & Lifelong Learner',
];

export const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({
  initialSubject = 'Business & Economics',
  initialTopic = '',
  onBack,
  onSave,
  existingResource,
}) => {
  const [subject, setSubject] = useState(existingResource?.subject || initialSubject);
  const [topic, setTopic] = useState(existingResource?.topic || initialTopic || '');
  const [slideCount, setSlideCount] = useState(7);
  const [targetAudience, setTargetAudience] = useState<GradeLevel>(
    (existingResource?.gradeLevel as GradeLevel) || 'Senior Secondary / High School (Grades 9-12)'
  );
  const [themeOrMood, setThemeOrMood] = useState('High Contrast Academic & Dynamic');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<PresentationResource | null>(
    existingResource || null
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      errors.subject = 'Please select a Subject Category before building your presentation.';
    }
    if (!topic || !topic.trim()) {
      errors.topic = 'Please enter a Presentation Topic before building your presentation.';
    }
    if (!slideCount || slideCount < 1) {
      errors.slideCount = 'Please select a valid number of slides before building your presentation.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage =
        errors.subject ||
        errors.topic ||
        errors.slideCount;
      setValidationError(firstErrorMessage);

      const firstFieldId = errors.subject
        ? 'presentation-field-subject'
        : errors.topic
        ? 'presentation-field-topic'
        : 'presentation-form';
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
      const response = await fetch('/api/generate/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          slideCount,
          targetAudience,
          themeOrMood,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slide deck');
      }

      const deckData = await response.json();
      setGeneratedDeck(deckData);
      setActiveSlideIndex(0);
    } catch (err) {
      console.error('Error generating presentation:', err);
      // Fallback
      const fallbackDeck: PresentationResource = {
        id: 'deck-' + Date.now(),
        toolType: 'presentation',
        title: `Mastery Presentation: ${topic}`,
        subject,
        topic,
        gradeLevel: targetAudience,
        themeOrColorMood: 'Clay Warm Bold Modern',
        createdAt: new Date().toISOString(),
        slides: [
          {
            slideNumber: 1,
            title: topic.toUpperCase(),
            subtitle: `Foundational Exploration • ${subject}`,
            bulletPoints: [
              'Essential concepts, definitions and real-world mechanisms',
              'Contextual significance and interdisciplinary relevance',
              'Collaborative enquiry & critical problem-solving',
            ],
            speakerNotes: 'Welcome students and introduce the overarching inquiry question for the session.',
          },
          {
            slideNumber: 2,
            title: 'Core Conceptual Architecture',
            subtitle: 'Key Drivers & Mechanisms',
            bulletPoints: [
              'Systemic equilibrium and structural components',
              'Input factors, transformation processes, and observable outcomes',
              'Comparative models across historical and contemporary settings',
            ],
            suggestedVisualOrDiagram: 'Diagram illustrating interconnected system flow and feedback cycles.',
            speakerNotes: 'Guide students to draw the cycle in their science/humanities notebooks.',
          },
          {
            slideNumber: 3,
            title: 'Real-World Case Study & Impact',
            subtitle: 'Practical Application',
            bulletPoints: [
              'Examining transformative interventions and scalability',
              'Addressing community-level challenges with localized solutions',
              'Key metrics of sustainable success',
            ],
            speakerNotes: 'Prompt small group discussion on how this principle applies in their home community.',
          },
        ],
      };
      setGeneratedDeck(fallbackDeck);
      setActiveSlideIndex(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const slides = generatedDeck?.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0] || {
    slideNumber: 1,
    title: 'Presentation Slide',
    subtitle: '',
    bulletPoints: [],
    suggestedVisualOrDiagram: '',
    discussionOrEngagementPrompt: '',
    speakerNotes: '',
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
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
            TOOL 06: PRESENTATION DECK
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedDeck ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <Presentation className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Build Presentation</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Interactive educational slide decks</p>
              </div>
            </div>

            <form id="presentation-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Validation Alert Banner */}
              {validationError && (
                <div
                  id="presentation-validation-alert"
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
                  id="presentation-field-subject"
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
                  <span>Presentation Topic *</span>
                  {fieldErrors.topic && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="presentation-field-topic"
                  type="text"
                  placeholder="e.g. Microeconomics, Space Exploration, Pan-African Trade..."
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

              {/* Slide Count & Audience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Slides
                  </label>
                  <select
                    id="presentation-field-slides"
                    value={slideCount}
                    onChange={(e) => {
                      setSlideCount(Number(e.target.value));
                      clearFieldError('slideCount');
                    }}
                    className={`w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs ${
                      fieldErrors.slideCount ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30' : ''
                    }`}
                  >
                    <option value={5}>5 Slides</option>
                    <option value={7}>7 Slides</option>
                    <option value={10}>10 Slides</option>
                    <option value={12}>12 Slides</option>
                  </select>
                  {fieldErrors.slideCount && (
                    <p className="text-[#D63651] text-[11px] font-bold mt-1">{fieldErrors.slideCount}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Audience
                  </label>
                  <select
                    id="presentation-field-audience"
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
              </div>

              {/* Source Document Upload (Never replaces or bypasses required fields) */}
              <SourceMaterialUpload
                toolName="presentation"
                onProcessingChange={(processing) => setIsProcessingDoc(processing)}
                onDocumentExtracted={(text) => setSourceMaterial(text)}
                onDocumentRemoved={() => {
                  setSourceMaterial('');
                  setIsProcessingDoc(false);
                }}
              />

              {/* Build Button */}
              <button
                type="submit"
                id="generate-presentation-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>DESIGNING SLIDE DECK...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD PRESENTATION ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output: Interactive Slide Deck */}
        <div className="lg:col-span-8 space-y-4">
          {generatedDeck && currentSlide ? (
            <div className="space-y-4 font-mono-code">
              {/* Header Action Bar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="font-display font-black text-[#181716] text-lg uppercase leading-snug">
                    {generatedDeck.title}
                  </h3>
                  <p className="text-xs font-mono-code text-stone-700 font-bold uppercase mt-1">
                    Slide {activeSlideIndex + 1} of {generatedDeck.slides.length} • {generatedDeck.themeOrColorMood}
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedDeck)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Main Slide Canvas */}
              <div
                className={`clay-card-3d p-8 sm:p-12 flex flex-col justify-between aspect-video min-h-[380px] relative overflow-hidden transition-all bg-gradient-to-br from-[#2E2B2A] to-[#181716] text-[#FAF7F0] ${
                  isFullscreen ? 'fixed inset-4 z-50 rounded-3xl' : ''
                }`}
              >
                {/* Slide Top */}
                <div className="flex items-center justify-between">
                  <span className="font-mono-code text-xs font-black tracking-widest text-[#E6425E] uppercase">
                    BUILD STUDIO • {generatedDeck.subject}
                  </span>
                  <span className="text-xs font-mono-code text-stone-400 font-bold">
                    {activeSlideIndex + 1} / {slides.length}
                  </span>
                </div>

                {/* Slide Middle */}
                <div className="space-y-5 my-auto max-w-2xl">
                  <h3 className="font-display font-black text-2xl sm:text-4xl text-white uppercase leading-tight">
                    {currentSlide.title}
                  </h3>

                  {currentSlide.subtitle && (
                    <p className="font-mono-code text-xs sm:text-sm font-bold text-[#E6425E] uppercase tracking-wider">
                      {currentSlide.subtitle}
                    </p>
                  )}

                  <ul className="space-y-3 font-mono-code text-xs sm:text-base text-stone-200">
                    {(currentSlide.bulletPoints || []).map((bp, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E6425E] mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed font-normal">{bp}</span>
                      </li>
                    ))}
                  </ul>

                  {(currentSlide.suggestedVisualOrDiagram || currentSlide.discussionOrEngagementPrompt) && (
                    <div className="bg-white/10 rounded-2xl border border-white/15 p-4 text-xs sm:text-sm font-medium text-stone-100 font-mono-code">
                      💡 {currentSlide.suggestedVisualOrDiagram || currentSlide.discussionOrEngagementPrompt}
                    </div>
                  )}
                </div>

                {/* Slide Bottom Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlideIndex(i)}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          activeSlideIndex === i ? 'w-8 bg-[#E6425E]' : 'w-2.5 bg-stone-600 hover:bg-stone-400'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                      disabled={activeSlideIndex === 0}
                      className="p-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveSlideIndex(
                          Math.min(slides.length - 1, activeSlideIndex + 1)
                        )
                      }
                      disabled={activeSlideIndex === slides.length - 1}
                      className="p-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Speaker Notes */}
              {currentSlide.speakerNotes && (
                <div className="clay-card-3d p-5 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-black text-[#181716] uppercase">
                    <MessageSquare className="w-4 h-4 text-[#D63651]" />
                    <span>Speaker Notes &amp; Discussion Guide:</span>
                  </div>
                  <p className="text-stone-800 leading-relaxed bg-white/80 p-4 rounded-2xl border border-stone-200 font-normal font-mono-code">
                    {currentSlide.speakerNotes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <Presentation className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Presentation Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Enter your subject and topic, select the number of slides, and click "Build Presentation" to generate structured educational slides.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
