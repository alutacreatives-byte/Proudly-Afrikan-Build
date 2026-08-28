import React, { useState, useRef } from 'react';
import {
  FileText,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import { extractTextFromDocument, validateDocument, formatFileSize } from '../utils/documentExtractor';

interface SourceMaterialUploadProps {
  toolName?: string;
  onDocumentExtracted: (text: string, fileName: string, file: File) => void;
  onDocumentRemoved: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  initialFileName?: string;
}

export const SourceMaterialUpload: React.FC<SourceMaterialUploadProps> = ({
  toolName = 'resource',
  onDocumentExtracted,
  onDocumentRemoved,
  onProcessingChange,
  initialFileName = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate
    const validation = validateDocument(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid document file.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileSizeFormatted(formatFileSize(file.size));
    setIsProcessing(true);
    onProcessingChange?.(true);

    try {
      const text = await extractTextFromDocument(file);
      if (!text || text.trim().length < 5) {
        throw new Error('No readable text found in document. Please verify the file contains readable text.');
      }

      const words = text.trim().split(/\s+/).length;
      setWordCount(words);
      setExtractedPreview(text.slice(0, 600));
      onDocumentExtracted(text, file.name, file);
    } catch (err: any) {
      console.error('Error processing source document:', err);
      setErrorMessage(
        err.message || 'Unable to extract text from this document. Please try a different PDF, DOC, or DOCX file.'
      );
      setSelectedFile(null);
      setFileName('');
      setWordCount(null);
    } finally {
      setIsProcessing(false);
      onProcessingChange?.(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setFileName('');
    setFileSizeFormatted('');
    setWordCount(null);
    setExtractedPreview('');
    setErrorMessage(null);
    setShowPreview(false);
    setIsProcessing(false);
    onProcessingChange?.(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDocumentRemoved();
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
      handleFile(file);
    }
  };

  const triggerPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="clay-card-3d p-4 space-y-3 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-stone-900 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-[#D63651]" />
          <span>ADD SOURCE MATERIAL</span>
        </div>
        <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 clay-pill-3d text-stone-700">
          OPTIONAL
        </span>
      </div>

      <p className="font-mono-code text-[11px] text-stone-600 leading-snug">
        Upload a PDF, DOC or DOCX to use as source material for this {toolName}.
      </p>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50/90 border border-red-300 rounded-xl text-red-800 text-xs font-mono-code flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">{errorMessage}</p>
            <button
              type="button"
              onClick={triggerPicker}
              className="underline text-[11px] font-bold hover:text-red-900 cursor-pointer"
            >
              Try choosing another file
            </button>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* State A: Processing */}
      {isProcessing && (
        <div className="p-3.5 clay-card-3d bg-amber-50/50 flex items-center gap-3 font-mono-code text-xs">
          <RefreshCw className="w-4 h-4 text-[#D63651] animate-spin shrink-0" />
          <div className="truncate">
            <span className="font-bold text-stone-900">Processing Document:</span>{' '}
            <span className="text-stone-700 truncate">{fileName}</span>
            <p className="text-[10px] text-stone-500">Extracting text and grounding context...</p>
          </div>
        </div>
      )}

      {/* State B: Document Successfully Loaded */}
      {!isProcessing && selectedFile && (
        <div className="space-y-2">
          <div className="clay-pill-3d !rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 clay-btn-dark rounded-xl flex items-center justify-center shrink-0">
                <FileCode className="w-4.5 h-4.5 text-[#E6425E]" />
              </div>
              <div className="min-w-0">
                <p className="font-mono-code text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {fileName}
                </p>
                <div className="flex flex-wrap items-center gap-2 font-mono-code text-[10px] sm:text-[11px] text-stone-500">
                  <span>{fileSizeFormatted}</span>
                  {wordCount !== null && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {wordCount.toLocaleString()} words extracted
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Replace & Remove */}
            <div className="flex items-center justify-end gap-2 shrink-0 font-mono-code text-xs self-end sm:self-center">
              <button
                type="button"
                onClick={triggerPicker}
                title="Replace document"
                className="clay-pill-3d px-3 py-1.5 font-bold text-[11px] uppercase transition cursor-pointer flex items-center gap-1.5 text-stone-800 hover:text-stone-900"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-700" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                title="Remove document"
                className="p-1.5 sm:p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible preview toggle */}
          {extractedPreview && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="font-mono-code text-[10px] font-bold text-stone-600 hover:text-[#D63651] uppercase flex items-center gap-1 cursor-pointer"
              >
                {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPreview ? 'Hide document preview' : 'View extracted document preview'}</span>
              </button>

              {showPreview && (
                <div className="mt-2 p-3 clay-card-3d text-[11px] font-mono text-stone-700 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {extractedPreview}...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* State C: No Document Selected -> Upload Button & Dropzone */}
      {!isProcessing && !selectedFile && (
        <div
          id="source-doc-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerPicker}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 md:p-5.5 text-center cursor-pointer transition-all bg-white/50 hover:bg-white/80 ${
            isDragging
              ? 'border-[#D63651] bg-red-50/60 ring-2 ring-[#D63651]/20'
              : 'border-stone-300 hover:border-stone-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 w-full max-w-sm mx-auto">
            <button
              id="upload-document-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerPicker();
              }}
              className="w-full sm:w-auto clay-btn-dark px-5 py-2.5 sm:py-2.5 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-sm min-h-[42px] sm:min-h-[44px]"
            >
              <Upload className="w-4 h-4 text-[#E6425E]" />
              <span>UPLOAD DOCUMENT</span>
            </button>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-stone-500 font-mono-code text-[11px] leading-tight">
              <span>or drop PDF / DOC / DOCX here</span>
              <span className="hidden sm:inline text-stone-300">•</span>
              <span className="text-stone-400">up to 10MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
