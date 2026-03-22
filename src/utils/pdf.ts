import * as pdfjsLib from 'pdfjs-dist';

// Use the CDN worker to avoid bundling the large worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Render every page of a PDF file to data URLs.
 * @param file  The PDF File object
 * @param scale Render scale (1.5 gives ~96dpi on typical A4)
 * @param onProgress Called with (currentPage, totalPages) as each page renders
 */
export async function pdfToDataUrls(
  file: File,
  scale = 1.5,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const dataUrls: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    dataUrls.push(canvas.toDataURL('image/jpeg', 0.88));
  }

  return dataUrls;
}
