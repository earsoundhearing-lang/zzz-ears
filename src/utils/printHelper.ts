import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { openWhatsAppWithReceipt } from './whatsappHelper';

/**
 * Utility helper to handle reliable printing, high-fidelity PDF generation,
 * direct PDF downloading, and sending PDF via WhatsApp.
 */

export interface ExportPdfOptions {
  elementId: string;
  filename: string;
  onStart?: () => void;
  onSuccess?: (filename: string) => void;
  onError?: (err: unknown) => void;
}

export interface SharePdfWhatsAppOptions {
  elementId: string;
  filename: string;
  phone: string;
  message: string;
  onStart?: () => void;
  onSuccess?: (result: { mode: 'web-share' | 'download-and-wa'; filename: string }) => void;
  onError?: (err: unknown) => void;
}

// Memoization cache for converted colors
const memoColorMap = new Map<string, string>();
const colorCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (colorCanvas) {
  colorCanvas.width = 1;
  colorCanvas.height = 1;
}
const colorCtx = colorCanvas ? colorCanvas.getContext('2d', { willReadFrequently: true }) : null;

export function oklchToRgb(colorStr: string): string {
  if (!colorStr) return 'rgb(35, 39, 122)';
  const trimmed = colorStr.trim();
  if (memoColorMap.has(trimmed)) {
    return memoColorMap.get(trimmed)!;
  }

  // Fallback defaults for common themes if canvas isn't available
  if (!colorCtx) {
    if (trimmed.includes('red')) return 'rgb(220, 38, 38)';
    if (trimmed.includes('blue')) return 'rgb(37, 99, 235)';
    if (trimmed.includes('slate') || trimmed.includes('gray')) return 'rgb(100, 116, 139)';
    return 'rgb(35, 39, 122)';
  }

  try {
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#000000';
    colorCtx.fillStyle = trimmed;
    colorCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
    const result = a === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    memoColorMap.set(trimmed, result);
    return result;
  } catch {
    return 'rgb(35, 39, 122)';
  }
}

// Convert any modern CSS color (like oklab, oklch, color-mix, color, lab, lch, hwb) to standard rgb/rgba using balanced-paren parser
export function sanitizeCssColors(input: string): string {
  if (!input || typeof input !== 'string') return input || '';
  if (
    !input.includes('oklch') &&
    !input.includes('oklab') &&
    !input.includes('color-mix') &&
    !input.includes('color(') &&
    !input.includes('lab(') &&
    !input.includes('lch(') &&
    !input.includes('hwb(')
  ) {
    return input;
  }

  const funcNames = ['oklab', 'oklch', 'color-mix', 'color', 'lab', 'lch', 'hwb'];
  let result = '';
  let i = 0;

  while (i < input.length) {
    let matchedFunc = '';
    for (const fn of funcNames) {
      if (input.startsWith(fn + '(', i)) {
        matchedFunc = fn;
        break;
      }
    }

    if (matchedFunc) {
      let depth = 0;
      let start = i;
      let end = -1;
      for (let j = i; j < input.length; j++) {
        if (input[j] === '(') depth++;
        else if (input[j] === ')') {
          depth--;
          if (depth === 0) {
            end = j + 1;
            break;
          }
        }
      }

      if (end !== -1) {
        const fullColorExpr = input.slice(start, end);
        const converted = oklchToRgb(fullColorExpr);
        result += converted;
        i = end;
        continue;
      }
    }

    result += input[i];
    i++;
  }

  return result;
}

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'fill',
  'stroke',
  'boxShadow',
  'textShadow',
  'background',
  'borderColor',
];

function createSafeComputedStyleProxy(decl: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(decl, {
    get(target, prop: string | symbol) {
      if (prop === 'getPropertyValue') {
        return (propertyName: string) => {
          const val = target.getPropertyValue(propertyName);
          return sanitizeCssColors(val);
        };
      }
      const val = Reflect.get(target, prop);
      if (typeof val === 'string') {
        return sanitizeCssColors(val);
      }
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  });
}

/**
 * Triggers native browser download for a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blobUrl = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = cleanFilename;
  downloadLink.target = '_blank';
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  
  downloadLink.click();

  setTimeout(() => {
    if (document.body.contains(downloadLink)) {
      document.body.removeChild(downloadLink);
    }
    URL.revokeObjectURL(blobUrl);
  }, 4000);
}

/**
 * Renders an HTML element to high-resolution A4 jsPDF Blob
 */
export async function createPdfBlobFromElement(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  // Preserve and temporarily patch window.getComputedStyle during html2canvas execution
  const originalGlobalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    const decl = originalGlobalGetComputedStyle.call(window, elt, pseudoElt);
    return createSafeComputedStyleProxy(decl);
  };

  let canvas: HTMLCanvasElement;
  try {
    // Capture element with html2canvas at high resolution with comprehensive color sanitization
    canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        // 1. Intercept getComputedStyle in the cloned window
        const clonedWin = clonedDoc.defaultView || window;
        if (clonedWin) {
          const originalClonedGetComputedStyle = clonedWin.getComputedStyle.bind(clonedWin);
          clonedWin.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
            const decl = originalClonedGetComputedStyle(elt, pseudoElt);
            return createSafeComputedStyleProxy(decl);
          };
        }

        // 2. Sanitize all <style> tags in the cloned document
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((style) => {
          if (style.textContent) {
            style.textContent = sanitizeCssColors(style.textContent);
          }
        });

        // 3. Sanitize inline styles, SVG attributes, and color properties on all cloned elements
        const allClonedElements = clonedDoc.querySelectorAll('*');
        allClonedElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            const cssText = htmlEl.style.cssText;
            if (cssText) {
              htmlEl.style.cssText = sanitizeCssColors(cssText);
            }
          }

          // Sanitize SVG specific attributes
          const svgEl = el as SVGElement;
          ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'].forEach((attr) => {
            const attrVal = svgEl.getAttribute && svgEl.getAttribute(attr);
            if (attrVal && typeof attrVal === 'string') {
              svgEl.setAttribute(attr, sanitizeCssColors(attrVal));
            }
          });
        });

        // 4. Format cloned container for clean A5 Landscape printing layout
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.overflow = 'visible';
          clonedEl.style.maxHeight = 'none';
          clonedEl.style.height = 'auto';
          clonedEl.style.width = '880px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.padding = '12px';
          clonedEl.style.backgroundColor = '#ffffff';
        }
      },
    });
  } finally {
    // Restore global getComputedStyle
    window.getComputedStyle = originalGlobalGetComputedStyle;
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = 210; // A5 Landscape width in mm
  const pageHeight = 148; // A5 Landscape height in mm
  const margin = 6; // 6mm margin
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  // Check if content fits in one page or needs height scaling
  if (contentHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
  } else {
    // Scale to fit one page nicely if slightly larger, or add pages
    const scaleFactor = (pageHeight - margin * 2) / contentHeight;
    if (scaleFactor > 0.8) {
      const scaledWidth = contentWidth * scaleFactor;
      const scaledHeight = contentHeight * scaleFactor;
      const xOffset = margin + (contentWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, margin, scaledWidth, scaledHeight);
    } else {
      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= pageHeight;
      }
    }
  }

  return pdf.output('blob');
}

/**
 * Downloads high resolution PDF file of an element directly to user device
 */
export async function downloadElementAsPdf({
  elementId,
  filename,
  onStart,
  onSuccess,
  onError,
}: ExportPdfOptions): Promise<boolean> {
  try {
    if (onStart) onStart();
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const blob = await createPdfBlobFromElement(elementId);
    triggerFileDownload(blob, cleanFilename);
    if (onSuccess) onSuccess(cleanFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (onError) onError(error);
    return false;
  }
}

/**
 * Shares or sends the generated PDF directly to WhatsApp
 * - Mobile / Web Share supported: Opens native share sheet with the actual PDF attached to WhatsApp!
 * - Desktop / PC: Automatically downloads the PDF and opens WhatsApp Web with the patient's phone and receipt details,
 *   ready for the user to attach or drag-and-drop the PDF.
 */
export async function sharePdfViaWhatsApp({
  elementId,
  filename,
  phone,
  message,
  onStart,
  onSuccess,
  onError,
}: SharePdfWhatsAppOptions): Promise<{ mode: 'web-share' | 'download-and-wa'; filename: string } | false> {
  try {
    if (onStart) onStart();
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const blob = await createPdfBlobFromElement(elementId);
    const file = new File([blob], cleanFilename, { type: 'application/pdf' });

    // 1. Try Native Web Share API with Files (Android, iOS Safari, supported OS)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: cleanFilename,
          text: message,
          files: [file],
        });
        const res = { mode: 'web-share' as const, filename: cleanFilename };
        if (onSuccess) onSuccess(res);
        return res;
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return false;
        }
        console.warn('Web Share API cancelled or not permitted, falling back to download + WhatsApp Web', shareErr);
      }
    }

    // 2. Desktop / WhatsApp Web fallback:
    // Auto-download the PDF file
    triggerFileDownload(blob, cleanFilename);

    // Open WhatsApp Web with the patient's phone & receipt message
    openWhatsAppWithReceipt(phone, message);

    const res = { mode: 'download-and-wa' as const, filename: cleanFilename };
    if (onSuccess) onSuccess(res);
    return res;
  } catch (err) {
    console.error('Error in sharePdfViaWhatsApp:', err);
    if (onError) onError(err);
    return false;
  }
}

export function printHtmlElement(elementId: string, docTitle: string = 'Dokumen Earsound'): boolean {
  try {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
      window.print();
      return true;
    }

    // Try opening a dedicated clean printable window
    try {
      let stylesHtml = '';
      const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleElements.forEach((el) => {
        stylesHtml += el.outerHTML;
      });

      const printWindow = window.open('', '_blank', 'width=850,height=900');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <meta charset="UTF-8">
              <title>${docTitle}</title>
              ${stylesHtml}
              <style>
                @page { size: A5 landscape; margin: 5mm 8mm; }
                body { 
                  background-color: #ffffff !important; 
                  color: #0f172a !important; 
                  margin: 0 auto; 
                  padding: 10px; 
                  max-width: 210mm;
                  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #${elementId} {
                  max-height: none !important;
                  overflow: visible !important;
                  width: 100% !important;
                  padding: 0 !important;
                }
              </style>
            </head>
            <body>
              <div id="${elementId}">
                ${targetElement.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return true;
      }
    } catch (popupErr) {
      console.warn('Popup print blocked or not supported, trying direct download & window.print', popupErr);
    }

    // Fallback directly to window.print
    window.print();
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    window.print();
    return false;
  }
}
