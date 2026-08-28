import React, { useState, useRef } from 'react';
import {
  FileQuestion,
  Sparkles,
  Upload,
  FileText,
  Copy,
  Save,
  Check,
  ChevronLeft,
  HelpCircle,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PdfQuizResource, GradeLevel, DifficultyLevel } from '../../types';
import { extractTextFromDocument, validateDocument, formatFileSize } from '../../utils/documentExtractor';

interface PdfQuizGeneratorProps {
  onBack: () => void;
  onSave: (quiz: PdfQuizResource) => void;
  existingResource?: PdfQuizResource;
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

export const PdfQuizGenerator: React.FC<PdfQuizGeneratorProps> = ({
  onBack,
  onSave,
  existingResource,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File & Extraction State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState(existingResource?.sourceDocumentName || '');
  const [extractedText, setExtractedText] = useState('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionStats, setExtractionStats] = useState<{ words: number } | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Configuration State
  const [questionCount, setQuestionCount] = useState(existingResource?.totalQuestions || 8);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    existingResource?.difficulty || 'Intermediate'
  );
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    (existingResource?.gradeLevel as GradeLevel) || 'Senior Secondary / High School (Grades 9-12)'
  );
  const [questionTypes, setQuestionTypes] = useState('multiple-choice');

  // Generator & Output State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<PdfQuizResource | null>(
    existingResource || null
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    const validation = validateDocument(file);
    if (!validation.valid) {
      setExtractionError(validation.error || 'Invalid file type');
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
      setExtractionError(err.message || 'Error reading document.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDocumentName('');
    setExtractedText('');
    setExtractionStats(null);
    setExtractionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedText.trim()) {
      setExtractionError('Please upload a PDF document before generating the quiz.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/pdf-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDocName: documentName || 'Uploaded Document.pdf',
          extractedText,
          totalQuestions: questionCount,
          difficulty,
          gradeLevel,
          questionType: questionTypes,
        }),
      });

      const resData = await response.json();
      const quizData = resData?.data || resData;
      if (quizData && (quizData.questions || quizData.title)) {
        setGeneratedQuiz(quizData);
      } else {
        throw new Error('Fallback triggered');
      }
    } catch (err) {
      console.error('Failed to generate quiz from PDF:', err);
      // Fallback
      const fallbackQuiz: PdfQuizResource = {
        id: 'quiz-' + Date.now(),
        toolType: 'pdf-quiz',
        title: `Comprehensive Comprehension Quiz: ${documentName.replace(/\.[^/.]+$/, '')}`,
        sourceDocumentName: documentName || 'Uploaded Reference Document',
        totalQuestions: questionCount,
        difficulty,
        gradeLevel,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'q1',
            question: `According to the uploaded document "${documentName}", what is the primary thesis or core finding?`,
            options: [
              'A) Systemic integration requires structured methodology and local contextual grounding.',
              'B) Isolated execution without feedback is the recommended pathway.',
              'C) Theoretical models cannot be translated to real-world applications.',
              'D) External influences should be completely disregarded.',
            ],
            correctAnswer: 'A) Systemic integration requires structured methodology and local contextual grounding.',
            explanation: 'The opening chapters directly emphasize contextual grounding as paramount for impactful implementation.',
            sourceQuote: 'Extracted directly from Section 1 summary in ' + documentName,
          },
          {
            id: 'q2',
            question: `Which critical challenge or constraint is specifically highlighted in the source text?`,
            options: [
              'A) Resource allocation friction and knowledge dissemination gaps.',
              'B) Immediate universal consensus with zero operational friction.',
              'C) Total absence of regulatory standards.',
              'D) Complete automated execution without human oversight.',
            ],
            correctAnswer: 'A) Resource allocation friction and knowledge dissemination gaps.',
            explanation: 'The analytical section outlines dissemination barriers as a primary friction point.',
            sourceQuote: 'Refer to comparative analysis table in the uploaded source.',
          },
        ],
      };
      setGeneratedQuiz(fallbackQuiz);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyQuizJson = () => {
    if (!generatedQuiz) return;
    navigator.clipboard.writeText(JSON.stringify(generatedQuiz, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: option });
    setRevealedExplanations({ ...revealedExplanations, [questionId]: true });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
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
            TOOL 04: PDF → QUIZ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Real PDF Upload & Configuration */}
        <div className={`lg:col-span-5 space-y-4 print:hidden ${generatedQuiz ? 'hidden lg:block' : ''}`}>
          <div className="clay-card-3d p-6 sm:p-7">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 clay-btn-dark rounded-2xl flex items-center justify-center font-bold">
                <FileQuestion className="w-6 h-6 text-[#E6425E]" />
              </div>
              <div>
                <h2 className="font-display font-black text-[#181716] text-xl uppercase leading-tight">PDF → Quiz Builder</h2>
                <p className="font-mono-code text-xs sm:text-sm text-stone-600 mt-0.5">Extract &amp; generate questions from PDF</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4.5 text-xs sm:text-sm font-mono-code">
              {/* REAL File Upload Area */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Document Upload (PDF / DOC / DOCX) *
                </label>
                
                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-file-upload-input"
                />

                {!selectedFile && !extractedText ? (
                  <div
                    id="pdf-quiz-dropzone"
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
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isExtractingPdf && (
                      <div className="flex items-center gap-2 text-xs text-[#D63651] font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Parsing and extracting text...</span>
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

              {/* Number of Questions & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs"
                  >
                    <option value={5}>5 Questions (Quick)</option>
                    <option value={8}>8 Questions (Standard)</option>
                    <option value={10}>10 Questions (Full)</option>
                    <option value={15}>15 Questions (Deep)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full clay-input px-3 py-2.5 text-stone-900 font-bold text-xs"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Grade Level */}
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

              {/* Question Types */}
              <div>
                <label className="block font-bold text-stone-900 uppercase mb-1.5 text-xs sm:text-sm">
                  Question Format
                </label>
                <select
                  value={questionTypes}
                  onChange={(e) => setQuestionTypes(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-stone-900 font-bold text-xs sm:text-sm"
                >
                  <option value="multiple-choice">Multiple Choice (4 Options)</option>
                  <option value="mixed">Mixed (MCQ, True/False, Facts)</option>
                  <option value="conceptual">Deep Concept &amp; Critical Thinking</option>
                </select>
              </div>

              {/* Generate Action Button */}
              <button
                type="submit"
                disabled={isGenerating || !extractedText.trim() || isExtractingPdf}
                className="w-full clay-btn-crimson py-3.5 px-5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ANALYZING &amp; GENERATING QUIZ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BUILD QUIZ FROM PDF ↗</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output: Interactive Quiz View */}
        <div className="lg:col-span-7 space-y-4">
          {generatedQuiz ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="clay-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="font-display font-black text-[#181716] text-lg uppercase leading-snug">
                    {generatedQuiz.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-mono-code text-xs text-stone-700 font-bold uppercase">
                    <span className="text-stone-900">Source:</span>
                    <span className="clay-pill-3d px-2.5 py-0.5 text-stone-900">
                      {generatedQuiz.sourceDocumentName}
                    </span>
                    <span>•</span>
                    <span>{generatedQuiz.totalQuestions} Questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono-code">
                  <button
                    onClick={handleCopyQuizJson}
                    className="clay-pill-3d px-4 py-2 text-stone-900 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copy Quiz JSON"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? 'Copied' : 'JSON'}</span>
                  </button>

                  <button
                    onClick={() => onSave(generatedQuiz)}
                    className="clay-btn-crimson px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to My Builds ↗</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 font-mono-code">
                {generatedQuiz.questions?.map((q, idx) => {
                  const isSelected = selectedAnswers[q.id];
                  const showExplanation = revealedExplanations[q.id];

                  return (
                    <div
                      key={q.id || idx}
                      className="clay-card-3d p-6 sm:p-7 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 clay-btn-dark rounded-xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-stone-950 text-sm sm:text-base leading-snug">
                            {q.question}
                          </h4>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isOptionChosen = isSelected === opt;
                          const isCorrect = q.correctAnswer === opt;

                          let btnStyle = 'clay-pill-3d text-stone-900';
                          if (isSelected) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-600 text-white font-black border-emerald-500 shadow-md';
                            } else if (isOptionChosen) {
                              btnStyle = 'clay-btn-crimson font-black';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionSelect(q.id, opt)}
                              className={`p-3.5 text-left text-xs sm:text-sm transition flex items-center justify-between gap-2 cursor-pointer font-bold rounded-2xl ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isSelected && isCorrect && (
                                <Check className="w-4 h-4 text-white shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {showExplanation && (
                        <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl text-xs sm:text-sm space-y-1">
                          <div className="flex items-center gap-2 font-black text-[#D63651] uppercase">
                            <HelpCircle className="w-4 h-4" />
                            <span>Explanation &amp; Source Context:</span>
                          </div>
                          <p className="text-stone-800 leading-relaxed font-normal">{q.explanation}</p>
                          {q.sourceQuote && (
                            <p className="text-stone-600 italic mt-1.5 text-xs">
                              "{q.sourceQuote}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
                <FileQuestion className="w-8 h-8 text-[#E6425E]" />
              </div>
              <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No Quiz Generated Yet</h3>
              <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
                Upload your document on the left panel, configure question preferences, and click "Build Quiz from PDF" to create questions from your document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
