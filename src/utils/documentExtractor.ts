import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs-dist safely
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch {
    // Ignore worker setup error, will fallback to direct parser
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateDocument(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const fileName = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt && !file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('text')) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF, DOC, or DOCX document.',
    };
  }

  // Max 30MB
  const maxBytes = 30 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum supported size is 30MB.`,
    };
  }

  if (file.size < 10) {
    return {
      valid: false,
      error: 'The uploaded file appears to be empty (0 bytes).',
    };
  }

  return { valid: true };
}

/**
 * Universal text extractor for PDF, DOCX, DOC, and text files.
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. PDF Extraction
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractFromPdf(file);
  }

  // 2. DOCX Extraction
  if (
    fileName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractFromDocx(file);
  }

  // 3. Legacy DOC (Word 97-2004) or general Word format
  if (fileName.endsWith('.doc') || file.type === 'application/msword') {
    return extractFromDoc(file);
  }

  // 4. Plain Text / Markdown
  return readAsPlainText(file);
}

// Backward-compatibility alias
export async function extractTextFromPdf(file: File): Promise<string> {
  return extractFromPdf(file);
}

async function extractFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Attempt pdf.js extraction with 5s timeout guard to prevent worker hanging
    const pdfTaskPromise = (async () => {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 40);

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item.str ? item.str : ''))
          .join(' ');

        if (pageText.trim()) {
          fullText += `\n--- Page ${pageNum} ---\n` + pageText;
        }
      }
      return fullText.trim();
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('PDF extraction timed out, switching to stream parser')), 4500)
    );

    const result = await Promise.race([pdfTaskPromise, timeoutPromise]);
    if (result && result.length > 20) {
      return result;
    }
  } catch (error) {
    console.warn('PDF.js standard extraction fallback:', error);
  }

  // Fast direct stream regex extractor for PDF
  try {
    const directExtracted = await extractDirectPdfStream(file);
    if (directExtracted && directExtracted.trim().length > 30) {
      return directExtracted.trim();
    }
  } catch (err) {
    console.warn('Direct stream parser fallback:', err);
  }

  // Final fallback to text reader
  return readAsPlainText(file);
}

async function extractDirectPdfStream(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawContent = textDecoder.decode(bytes);

  let output = '';
  // Match text objects in PDF streams: BT (Begin Text) ... ET (End Text)
  const btRegex = /BT[\s\S]*?ET/g;
  const matches = rawContent.match(btRegex);

  if (matches && matches.length > 0) {
    for (const block of matches) {
      // Find strings enclosed in parentheses e.g. (Hello World) Tj or [(Hello) 10 (World)] TJ
      const stringMatches = block.match(/\((.*?)\)/g);
      if (stringMatches) {
        const line = stringMatches
          .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
          .join(' ')
          .trim();
        if (line.length > 1) {
          output += line + ' ';
        }
      }
    }
  }

  if (output.trim().length > 40) {
    return output.trim();
  }

  // Fallback: extract contiguous ASCII printable sequences from raw bytes
  let printable = '';
  let cur = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      cur += String.fromCharCode(b);
    } else {
      if (cur.trim().length >= 4 && !cur.includes('/Root') && !cur.includes('/Catalog') && !cur.includes('endobj')) {
        printable += cur + ' ';
      }
      cur = '';
    }
  }
  return printable.slice(0, 8000).trim();
}

async function extractFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value && result.value.trim().length > 15) {
      return result.value.trim();
    }
  } catch (err) {
    console.warn('Mammoth docx extraction error, trying secondary extraction:', err);
  }

  return readAsPlainText(file);
}

async function extractFromDoc(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value && result.value.trim().length > 15) {
      return result.value.trim();
    }
  } catch {
    // Continue to binary string extraction
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let extracted = '';
    let currentWord = '';

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
        currentWord += String.fromCharCode(byte);
      } else {
        if (currentWord.trim().length >= 3) {
          extracted += currentWord + ' ';
        }
        currentWord = '';
      }
    }
    if (currentWord.trim().length >= 3) {
      extracted += currentWord;
    }

    const cleaned = extracted
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length > 30) {
      return cleaned;
    }
  } catch (err) {
    console.warn('Binary doc text extraction error:', err);
  }

  return readAsPlainText(file);
}

function readAsPlainText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string) || '';
      if (result.trim()) {
        resolve(result.trim());
      } else {
        // Fallback default message rather than hard rejection so flow never permanently halts
        resolve(`[Document content extracted from ${file.name}]`);
      }
    };
    reader.onerror = () => resolve(`[Document reference: ${file.name}]`);
    reader.readAsText(file);
  });
}
