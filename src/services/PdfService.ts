export interface PdfPageImage {
  pageNumber: number;
  totalPages: number;
  dataUrl: string; // base64 PNG data URL
}

export class PdfService {
  /**
   * Converts all pages of a PDF ArrayBuffer into PNG data URLs.
   * Requires window.pdfjsLib to be loaded via CDN (index.html).
   * @param arrayBuffer  Raw PDF bytes from FileReader
   * @param scale        Render scale (1.5 = ~110 DPI, 2.0 = ~145 DPI — good for OCR)
   * @param maxPages     Safety cap to avoid freezing the browser
   */
  public static async pdfToImages(
    arrayBuffer: ArrayBuffer,
    scale = 2.0,
    maxPages = 20
  ): Promise<PdfPageImage[]> {
    // Lazy-load PDF.js from CDN on first use
    let pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib || !(window as any).__pdfjsReady) {
      const loader = (window as any).__loadPdfJs;
      if (typeof loader !== 'function') {
        throw new Error('PDF.js loader is not available. Please refresh the page and try again.');
      }
      pdfjsLib = await loader();
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = Math.min(pdf.numPages, maxPages);
    const results: PdfPageImage[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Offscreen canvas — never inserted into the DOM
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport }).promise;

      results.push({
        pageNumber: pageNum,
        totalPages,
        dataUrl: canvas.toDataURL('image/png', 0.92),
      });

      // Free resources immediately
      page.cleanup();
    }

    return results;
  }

  /**
   * Read a File object and return its ArrayBuffer.
   */
  public static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsArrayBuffer(file);
    });
  }
}
