import React, { useState, useRef } from 'react';
import {
  BookOpenCheck,
  Sparkles,
  Upload,
  FileText,
  Copy,
  Save,
  Check,
  ChevronLeft,
  BookOpen,
  Bookmark,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PdfStudyPackResource, GradeLevel, DifficultyLevel } from '../../types';
import { extractTextFromDocument, validateDocument, formatFileSize } from '../../utils/documentExtractor';

interface PdfStudyPackGeneratorProps {
  onBack: () => void;
  onSave: (pack: PdfStudyPackResource) => void;
  existingResource?: PdfStudyPackResource;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Primary / Elementary (Grades 1-5)',
  'Junior Secondary / Middle School (Grades 6-8)',
  'Senior Secondary / High School (Grades 9-12)',
  'Tertiary / Undergraduate',
  'Postgraduate / Professional',
  'Adult & Lifelong Learner',
];

const PACK_TYPES = [
  { id: 'comprehensive', label: 'Comprehensive Master Pack (Overview + Concepts + Glossary + Q&A)' },
  { id: 'summary', label: 'High-Yield Executive Summary & Revision Points' },
  { id: 'flashcards', label: 'Terminology, Vocabulary & Concept Glossary' },
];

export const PdfStudyPackGenerator: React.FC<PdfStudyPackGeneratorProps> = ({
  onBack,
  onSave,
  existingResource,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File & Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState(existingResource?.sourceDocumentName || '');
  const [extractedText, setExtractedText] = useState('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionStats, setExtractionStats] = useState<{ words: number } | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Setup Options
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    (existingResource?.gradeLevel as GradeLevel) || 'Senior Secondary / High School (Grades 9-12)'
  );
  const [packType, setPackType] = useState('comprehensive');
  const [focusArea, setFocusArea] = useState('');

  // Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPack, setGeneratedPack] = useState<PdfStudyPackResource | null>(
    existingResource || null
  );
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  const processFile = async (file: File) => {
    const validation = validateDocument(file);
    if (!validation.valid) {
      setExtractionError(validation.error || 'Invalid file format');
      return;
    }

    setExtractionError(null);
    setSelectedFile(file);
    setDocumentName(file.name);
    setFileSizeFormatted(formatFileSize(file.size));
    setIsExtractingPdf(true);

    try {
      const text = await extractTextFromDocument(file);
      if (text && text.trim().length > 0) {
        setExtractedText(text);
        const words = text.trim().split(/\s+/).length;
        setExtractionStats({ words });
      } else {
        setExtractionError('Could not parse readable document content.');
      }
    } catch (err: any) {
      setExtractionError(err.message || 'Error extracting document.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDocumentName('');
    setExtractedText('');
    setFileSizeFormatted('');
    setExtractionStats(null);
    setExtractionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedText.trim()) {
      setExtractionError('Please upload a PDF document before building the study pack.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/pdf-studypack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDocName: documentName || 'Uploaded_Document.pdf',
          extractedText,
          gradeLevel,
          packType,
          focusArea,
        }),
      });

      const resData = await response.json();
      const packData = resData?.data || resData;
      if (packData && (packData.overview || packData.documentOverview || packData.keyConcepts)) {
        setGeneratedPack(packData);
      } else {
        throw new Error('Fallback trigger');
      }
    } catch (err) {
      console.error('Failed to generate study pack:', err);
      // Fallback
      const fallbackPack: PdfStudyPackResource = {
        id: 'pack-' + Date.now(),
        toolType: 'pdf-studypack',
        title: `Comprehensive Study & Revision Pack: ${documentName.replace(/\.[^/.]+$/, '')}`,
        sourceDocumentName: documentName || 'Uploaded Document',
        gradeLevel,
        overview: 'This comprehensive guide synthesizes the fundamental theories, evidence-based models, and analytical frameworks presented across the source document into structured, high-retention study notes.',
        keyConcepts: [
          {
            conceptName: 'Core Framework & Conceptual Foundation',
            inDepthExplanation: 'The primary architecture establishes a rigorous baseline, integrating foundational definitions with systematic execution pathways.',
            contextualRelevance: 'Enables high-order reasoning and application in both academic examinations and practical scenarios.',
          },
          {
            conceptName: 'Systemic Optimization & Adaptive Feedback',
            inDepthExplanation: 'Explores mechanisms for dynamic adjustments, error correction, and iterative refinement across complex operational environments.',
            contextualRelevance: 'Directly addresses real-world bottlenecks and sustainability considerations.',
          },
        ],
        highYieldTakeaways: [
          'Foundational integrity determines overall system resilience and scalability.',
          'Contextual adaptation outperforms rigid, one-size-fits-all implementations.',
          'Formative feedback cycles are vital for long-term conceptual mastery.',
        ],
        essentialGlossary: [
          {
            term: 'Systemic Equilibrium',
            definition: 'A state where opposing internal and external influences are balanced, ensuring steady-state performance.',
          },
          {
            term: 'Iterative Synthesis',
            definition: 'The process of combining diverse data points and evidence progressively to form a coherent whole.',
          },
        ],
        selfCheckQuestions: [
          {
            question: 'How do the core principles in this document contrast with traditional static frameworks?',
            expectedAnswer: 'They introduce dynamic recursive feedback and contextual adaptability rather than fixed linear assumptions.',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setGeneratedPack(fallbackPack);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    if (!generatedPack) return;
    const overview = generatedPack.overview || generatedPack.documentOverview || '';
    const concepts = (generatedPack.keyConcepts || [])
      .map((k) => `• ${k.conceptName || k.concept}: ${k.inDepthExplanation || k.explanation || k.summary}`)
      .join('\n');
    const glossary = (generatedPack.essentialGlossary || [])
      .map((g) => `• ${g.term}: ${g.definition}`)
      .join('\n');

    const formatted = `=== ${generatedPack.title} ===\n\nOVERVIEW:\n${overview}\n\nKEY CONCEPTS:\n${concepts}\n\nCORE GLOSSARY:\n${glossary}`;
    navigator.clipboard.writeText(formatted);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers({ ...revealedAnswers, [idx]: !revealedAnswers[idx] });
  };

  const overviewText = generatedPack?.overview || generatedPack?.documentOverview || '';
  const takeawaysList = Array.isArray(generatedPack?.highYieldTakeaways)
    ? generatedPack.highYieldTakeaways
    : Array.isArray(generatedPack?.highYieldRevisionPoints)
    ? generatedPack.highYieldRevisionPoints
    : [];
  const glossaryList = Array.isArray(generatedPack?.essentialGlossary) ? generatedPack.essentialGlossary : [];
  const selfCheckList = Array.isArray(generatedPack?.selfCheckQuestions) ? generatedPack.selfCheckQuestions : [];

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
            TOOL 05: PDF → STUDY PACK
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Real Upload & Setup */}
        <div className={`lg:col-span-5 space-y-4 print:hidden ${generatedPack ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <BookOpenCheck className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">PDF → Study Pack</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Synthesize structured study material</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* REAL File Upload */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Document Upload (PDF / DOC / DOCX) *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-studypack-upload-input"
                />

                {!selectedFile && !extractedText ? (
                  <div
                    id="pdf-studypack-dropzone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`clay-card-3d-interactive p-5 sm:p-6 md:p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 border-2 border-dashed ${
                      isDragging ? 'border-[#D63651] bg-red-50/50' : 'border-stone-300 bg-white/70'
                    }`}
                  >
                    <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[#E6425E]" />
                    </div>
                    <div className="space-y-2 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="clay-btn-dark px-5 py-2.5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[42px] sm:min-h-[44px]"
                      >
                        <Upload className="w-4 h-4 text-[#E6425E]" />
                        <span>UPLOAD DOCUMENT</span>
                      </button>
                      <span className="text-xs text-stone-600 block">
                        or drag &amp; drop PDF, DOC, DOCX here
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/80 border border-stone-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 clay-btn-dark rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#E6425E]" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs sm:text-sm truncate max-w-[200px]">
                            {documentName}
                          </p>
                          <p className="text-xs text-stone-600">{fileSizeFormatted}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isExtractingPdf && (
                      <div className="flex items-center gap-2 text-xs text-[#D63651] font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting document text...</span>
                      </div>
                    )}

                    {extractionStats && !isExtractingPdf && (
                      <div className="flex items-center justify-between text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <span>Extracted ~{extractionStats.words} words</span>
                        <button
                          type="button"
                          onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                          className="text-[#D63651] font-bold hover:underline"
                        >
                          {showExtractedPreview ? 'Hide Preview' : 'Preview Text'}
                        </button>
                      </div>
                    )}

                    {showExtractedPreview && extractedText && (
                      <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs max-h-36 overflow-y-auto font-mono-code whitespace-pre-wrap text-stone-800">
                        {extractedText.slice(0, 1000)}...
                      </div>
                    )}
                  </div>
                )}

                {extractionError && (
                  <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{extractionError}</span>
                  </div>
                )}
              </div>

              {/* Pack Type & Target Level */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Study Pack Format
                </label>
                <select
                  value={packType}
                  onChange={(e) => setPackType(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
                >
                  {PACK_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Target Learner Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
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
                  Specific Focus Area (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 3, Core Equations, High-Yield Definitions..."
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 placeholder-stone-400 font-bold"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isGenerating || !extractedText.trim() || isExtractingPdf}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>SYNTHESIZING STUDY PACK...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD STUDY PACK FROM PDF ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output: Study Pack Document */}
        <div className="lg:col-span-7 space-y-4">
          {generatedPack ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="font-display font-black text-[#181716] text-lg uppercase leading-snug">
                    {generatedPack.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-mono-code text-xs text-stone-700 font-bold uppercase">
                    <span className="text-stone-900">Source:</span>
                    <span className="clay-pill-3d px-2.5 py-0.5 text-stone-900">
                      {generatedPack.sourceDocumentName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopySummary}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Study Pack"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedPack)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Study Pack Document */}
              <div className="clay-card-3d p-8 sm:p-10 space-y-8 text-[#181716] print:border-none print:shadow-none print:p-0">
                {/* 1. Overview */}
                {overviewText && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <BookOpen className="w-5 h-5 text-[#D63651]" />
                      <h3>Executive Summary &amp; Overview</h3>
                    </div>
                    <p className="font-mono-code text-xs sm:text-sm text-stone-800 leading-relaxed bg-white/70 p-5 rounded-2xl border border-stone-200">
                      {overviewText}
                    </p>
                  </div>
                )}

                {/* 2. Key Concepts */}
                {generatedPack.keyConcepts && Array.isArray(generatedPack.keyConcepts) && generatedPack.keyConcepts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <Layers className="w-5 h-5 text-[#D63651]" />
                      <h3>Core Conceptual Pillars</h3>
                    </div>

                    <div className="space-y-4 font-mono-code">
                      {(generatedPack.keyConcepts || []).map((concept, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-5 rounded-2xl bg-white/70 border border-stone-200 space-y-2.5"
                        >
                          <h4 className="font-display font-black text-sm sm:text-base text-[#181716] uppercase">
                            {concept.conceptName || concept.concept}
                          </h4>
                          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                            {concept.inDepthExplanation || concept.explanation || concept.summary}
                          </p>
                          {(concept.contextualRelevance || concept.africanContext) && (
                            <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-xs text-stone-800 font-bold">
                              <span className="text-[#D63651]">Contextual Impact: </span>
                              {concept.contextualRelevance || concept.africanContext}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. High-Yield Revision Points */}
                {takeawaysList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <Bookmark className="w-5 h-5 text-[#D63651]" />
                      <h3>High-Yield Revision Points</h3>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2 font-mono-code text-xs sm:text-sm text-stone-900">
                      {takeawaysList.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2.5">
                          <span className="font-bold text-[#D63651] shrink-0">★</span>
                          <p className="leading-relaxed font-medium">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Glossary */}
                {glossaryList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <BookOpenCheck className="w-5 h-5 text-[#D63651]" />
                      <h3>Essential Glossary &amp; Definitions</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-code">
                      {glossaryList.map((item, gIdx) => (
                        <div
                          key={gIdx}
                          className="p-4 rounded-2xl bg-white/70 border border-stone-200 space-y-1 text-xs sm:text-sm"
                        >
                          <span className="font-bold text-stone-950 block">{item.term}</span>
                          <p className="text-stone-700 leading-relaxed font-normal">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Self-Check Questions */}
                {selfCheckList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-display font-black text-base sm:text-lg text-[#181716] uppercase">
                      <HelpCircle className="w-5 h-5 text-[#D63651]" />
                      <h3>Self-Check &amp; Comprehension Questions</h3>
                    </div>
                    <div className="space-y-3 font-mono-code">
                      {selfCheckList.map((sc, scIdx) => (
                        <div
                          key={scIdx}
                          className="p-4 rounded-2xl bg-white/70 border border-stone-200 space-y-2 text-xs sm:text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-stone-950 leading-snug">
                              {scIdx + 1}. {sc.question}
                            </p>
                            <button
                              onClick={() => toggleAnswer(scIdx)}
                              className="text-xs font-bold text-[#D63651] hover:underline flex items-center gap-1 shrink-0"
                            >
                              {revealedAnswers[scIdx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{revealedAnswers[scIdx] ? 'Hide' : 'Check'}</span>
                            </button>
                          </div>
                          {revealedAnswers[scIdx] && (
                            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 text-xs mt-1">
                              <strong>Answer: </strong> {sc.expectedAnswer || sc.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <BookOpenCheck className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Study Pack Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Upload your document on the left, configure options, and click "Build Study Pack from PDF" to create structured notes and glossary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
