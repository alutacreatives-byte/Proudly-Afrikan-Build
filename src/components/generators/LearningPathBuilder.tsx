import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ChevronLeft,
  Copy,
  Save,
  Check,
  Target,
  ArrowRight,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { LearningPathResource } from '../../types';
import { SUBJECT_CATEGORIES } from '../../data/subjects';
import { SourceMaterialUpload } from '../SourceMaterialUpload';

interface LearningPathBuilderProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack: () => void;
  onSave: (path: LearningPathResource) => void;
  existingResource?: LearningPathResource;
}

export const LearningPathBuilder: React.FC<LearningPathBuilderProps> = ({
  initialSubject = 'Science & Technology',
  initialTopic = '',
  onBack,
  onSave,
  existingResource,
}) => {
  const [subject, setSubject] = useState(existingResource?.subject || initialSubject);
  const [goal, setGoal] = useState(existingResource?.goal || initialTopic || '');
  const [startingLevel, setStartingLevel] = useState(
    existingResource?.startingLevel || 'Foundational (Basic Familiarity)'
  );
  const [targetLevel, setTargetLevel] = useState(
    existingResource?.targetLevel || 'Advanced Professional / Research Level'
  );
  const [timeCommitment, setTimeCommitment] = useState(
    existingResource?.estimatedTotalWeeks ? `${existingResource.estimatedTotalWeeks} Weeks` : '8 Weeks'
  );
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<LearningPathResource | null>(
    existingResource || null
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
      errors.subject = 'Please select a Discipline Category before building your learning pathway.';
    }
    if (!goal || !goal.trim()) {
      errors.goal = 'Please enter a Learning Goal / Target Skill before building your learning pathway.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage = errors.subject || errors.goal;
      setValidationError(firstErrorMessage);

      const firstFieldId = errors.subject
        ? 'path-field-subject'
        : errors.goal
        ? 'path-field-goal'
        : 'path-form';
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
      const response = await fetch('/api/generate/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          goal,
          startingLevel,
          targetLevel,
          timeCommitment,
          sourceMaterial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }

      const pathData = await response.json();
      setGeneratedPath(pathData);
    } catch (err) {
      console.error('Error building learning path:', err);
      // Fallback
      const fallbackPath: LearningPathResource = {
        id: 'path-' + Date.now(),
        toolType: 'learning-path',
        title: `Mastery Roadmap: ${goal}`,
        subject,
        goal,
        startingLevel,
        targetLevel,
        estimatedTotalWeeks: parseInt(timeCommitment) || 8,
        createdAt: new Date().toISOString(),
        milestones: [
          {
            milestoneNumber: 1,
            phaseName: 'Phase 1: Conceptual Foundations & Core Grammar',
            targetWeeks: 'Weeks 1-2',
            keyObjectives: [
              'Demystify fundamental principles, syntax, and foundational definitions.',
              'Set up development environment and local tooling workspace.',
              'Build first end-to-end toy model with instant feedback loops.',
            ],
            recommendedResources: [
              'Open-access core handbook & primer documentation',
              'Guided interactive walkthrough tutorials',
            ],
            milestoneProject: 'Self-contained diagnostic project verifying 100% prerequisite readiness.',
          },
          {
            milestoneNumber: 2,
            phaseName: 'Phase 2: Intermediate Systems & Problem Solving',
            targetWeeks: 'Weeks 3-5',
            keyObjectives: [
              'Tackle multi-variable edge cases and real-world domain friction.',
              'Incorporate performance benchmarking and automated testing practices.',
              'Analyze open-source case studies and peer implementations.',
            ],
            recommendedResources: [
              'Technical deep dives and research whitepapers',
              'Community code review threads and architecture blueprints',
            ],
            milestoneProject: 'A robust intermediate solution addressing a real localized problem.',
          },
          {
            milestoneNumber: 3,
            phaseName: 'Phase 3: Advanced Specialization & Capstone',
            targetWeeks: 'Weeks 6-8',
            keyObjectives: [
              'Optimize for high-scale throughput, security, and long-term maintainability.',
              'Author thorough documentation and deliverable presentation.',
              'Publish code and undergo external critique.',
            ],
            recommendedResources: [
              'Master-level case studies and industry standards documentation',
            ],
            milestoneProject: 'Production-ready capstone portfolio artifact published publicly.',
          },
        ],
      };
      setGeneratedPath(fallbackPath);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedPath) return;
    let text = `${(generatedPath.title || 'LEARNING PATH').toUpperCase()}\n`;
    text += `GOAL: ${generatedPath.goal || goal} | TIME: ~${generatedPath.estimatedTotalWeeks || 12} WEEKS\n\n`;
    (generatedPath.milestones || []).forEach((m) => {
      text += `=== ${m.phaseName.toUpperCase()} (${m.targetWeeks}) ===\n`;
      (m.keyObjectives || []).forEach((obj) => {
        text += `  • ${obj}\n`;
      });
      text += `  Project: ${m.milestoneProject}\n\n`;
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
            TOOL 08: LEARNING PATHWAY
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${generatedPath ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <Compass className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">Learning Pathway</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Custom progressive skill roadmap</p>
              </div>
            </div>

            <form id="path-form" onSubmit={handleGenerate} noValidate className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* Validation Alert Banner */}
              {validationError && (
                <div
                  id="path-validation-alert"
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
                  <span>Discipline Category *</span>
                  {fieldErrors.subject && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <select
                  id="path-field-subject"
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
                  <option value="">-- Select Discipline Category --</option>
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

              {/* Goal */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm flex items-center justify-between">
                  <span>Learning Goal / Target Skill *</span>
                  {fieldErrors.goal && (
                    <span className="text-[#D63651] font-bold text-[11px] lowercase tracking-normal">required</span>
                  )}
                </label>
                <input
                  id="path-field-goal"
                  type="text"
                  placeholder="e.g. Master African Economic History, Learn Data Science..."
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    clearFieldError('goal');
                  }}
                  className={`w-full clay-input px-3.5 py-2.5 text-stone-900 placeholder-stone-400 font-bold transition-all ${
                    fieldErrors.goal
                      ? 'border-2 border-[#D63651] ring-2 ring-[#D63651]/20 bg-red-50/30'
                      : ''
                  }`}
                />
                {fieldErrors.goal && (
                  <p className="text-[#D63651] text-xs font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.goal}</span>
                  </p>
                )}
              </div>

              {/* Starting & Target Level */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Current Starting Level
                  </label>
                  <select
                    value={startingLevel}
                    onChange={(e) => setStartingLevel(e.target.value)}
                    className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
                  >
                    <option value="Absolute Beginner (Zero Knowledge)">Absolute Beginner (Zero Knowledge)</option>
                    <option value="Foundational (Basic Familiarity)">Foundational (Basic Familiarity)</option>
                    <option value="Intermediate (Some Practical Experience)">Intermediate (Some Practical Experience)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Target Mastery Level
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
                  >
                    <option value="Working Proficiency (Independent Execution)">Working Proficiency (Independent Execution)</option>
                    <option value="Advanced Professional / Research Level">Advanced Professional / Research Level</option>
                    <option value="Domain Mastery (Thought Leadership & Innovation)">Domain Mastery (Thought Leadership & Innovation)</option>
                  </select>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Target Timeline / Duration
                </label>
                <select
                  value={timeCommitment}
                  onChange={(e) => setTimeCommitment(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
                >
                  <option value="4 Weeks (Accelerated Sprint)">4 Weeks (Accelerated Sprint)</option>
                  <option value="8 Weeks (Standard Mastery)">8 Weeks (Standard Mastery)</option>
                  <option value="12 Weeks (Comprehensive Deep Dive)">12 Weeks (Comprehensive Deep Dive)</option>
                  <option value="16 Weeks (Professional Specialization)">16 Weeks (Professional Specialization)</option>
                </select>
              </div>

              {/* Source Material Upload (Never replaces or bypasses required fields) */}
              <SourceMaterialUpload
                toolName="learning-path"
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
                id="generate-path-btn"
                disabled={isGenerating || isProcessingDoc}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>SYNTHESIZING ROADMAP...</span>
                  </>
                ) : isProcessingDoc ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PROCESSING DOCUMENT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>GENERATE PATHWAY ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output: Learning Pathway Roadmap */}
        <div className="lg:col-span-8 space-y-4">
          {generatedPath ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="font-display font-black text-[#181716] text-lg uppercase leading-snug">
                    {generatedPath.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-mono-code text-xs text-stone-700 font-bold uppercase">
                    <span className="clay-pill-3d px-2.5 py-0.5 text-stone-900">
                      ~{generatedPath.estimatedTotalWeeks} Weeks
                    </span>
                    <span>•</span>
                    <span>{generatedPath.milestones.length} Milestones</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyText}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Roadmap Text"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedPath)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Pathway Milestones Visual Timeline */}
              <div className="space-y-6">
                {(generatedPath.milestones || []).map((ms, idx) => (
                  <div
                    key={idx}
                    className="clay-card-3d p-6 sm:p-8 space-y-5 relative"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 clay-btn-dark rounded-xl font-black text-sm flex items-center justify-center shrink-0">
                          {ms.milestoneNumber}
                        </span>
                        <div>
                          <h4 className="font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                            {ms.phaseName}
                          </h4>
                          <span className="clay-pill-3d px-2.5 py-0.5 text-stone-900 font-bold text-xs mt-1 inline-block">
                            {ms.targetWeeks}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Objectives */}
                    <div className="space-y-2.5 font-mono-code">
                      <h5 className="font-bold text-stone-950 text-xs sm:text-sm uppercase flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-[#D63651]" />
                        <span>Core Learning Objectives:</span>
                      </h5>
                      <div className="p-4 rounded-2xl bg-white/70 border border-stone-200 space-y-2 text-xs sm:text-sm">
                        {(ms.keyObjectives || []).map((obj, oIdx) => (
                          <div key={oIdx} className="flex items-start gap-2.5">
                            <span className="font-bold text-[#D63651] shrink-0">→</span>
                            <span className="leading-relaxed font-normal text-stone-900">{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Project */}
                    {ms.milestoneProject && (
                      <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl text-xs sm:text-sm font-mono-code">
                        <strong className="text-[#D63651] uppercase block mb-1">
                          ★ Key Milestone Deliverable:
                        </strong>
                        <p className="text-stone-900 font-medium">{ms.milestoneProject}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <Compass className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Pathway Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Define your learning target, select your current and desired proficiency levels, and click "Generate Pathway" to build a structured step-by-step roadmap.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
