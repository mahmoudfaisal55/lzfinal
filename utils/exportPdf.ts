import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BlockMetric {
  top: number;
  bottom: number;
  isHeading: boolean;
}

/**
 * Exports a rendered RTL Arabic HTML report element to a multi-page A4 PDF
 * with smart block-boundary pagination so Arabic text lines and cards are never cut mid-line.
 */
export async function exportReportToPdf(
  element: HTMLElement,
  studentName?: string
): Promise<void> {
  // Trigger PdfReportTemplate to stamp the exact current date right before PDF capture
  window.dispatchEvent(new CustomEvent('bowsalti:prepare-pdf'));
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

  // Ensure web fonts (Rubik Arabic) finish loading before canvas rasterization
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 794,
    onclone: (clonedDoc) => {
      const wrapper = clonedDoc.getElementById('bowsalti-pdf-wrapper');
      if (wrapper) {
        wrapper.className = 'block w-[794px] h-auto overflow-visible bg-white';
      }
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const marginXMm = 10;
  const marginTopMm = 10;
  const marginBottomMm = 12;

  const contentWidthMm = pageWidthMm - marginXMm * 2;
  const contentHeightMm = pageHeightMm - marginTopMm - marginBottomMm;

  const pxPerMm = canvas.width / contentWidthMm;
  const maxPageSliceHeightPx = Math.floor(contentHeightMm * pxPerMm);

  // Measure safe break points between [data-pdf-block="true"] elements and the running page header
  const containerRect = element.getBoundingClientRect();
  const domScale = canvas.height / Math.max(1, containerRect.height);

  const headerNode = element.querySelector<HTMLElement>('[data-pdf-page-header="true"]');
  const headerBottomPx = headerNode
    ? Math.min(
        canvas.height,
        Math.ceil((headerNode.getBoundingClientRect().bottom - containerRect.top) * domScale) + 2
      )
    : 0;
  const headerHeightMm = headerBottomPx / pxPerMm;
  const subsequentHeaderGapMm = headerBottomPx > 0 ? 4 : 0;
  const subsequentPageSliceHeightPx = Math.max(
    Math.floor(maxPageSliceHeightPx * 0.5),
    Math.floor((contentHeightMm - headerHeightMm - subsequentHeaderGapMm) * pxPerMm)
  );

  let headerImgData: string | null = null;
  if (headerBottomPx > 0) {
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = canvas.width;
    headerCanvas.height = headerBottomPx;
    const headerCtx = headerCanvas.getContext('2d');
    if (headerCtx) {
      headerCtx.fillStyle = '#ffffff';
      headerCtx.fillRect(0, 0, headerCanvas.width, headerCanvas.height);
      headerCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        headerBottomPx,
        0,
        0,
        canvas.width,
        headerBottomPx
      );
      headerImgData = headerCanvas.toDataURL('image/jpeg', 0.95);
    }
  }

  const blockNodes = Array.from(
    element.querySelectorAll<HTMLElement>('[data-pdf-block="true"]')
  );

  const blocks: BlockMetric[] = blockNodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return {
      top: Math.max(0, Math.floor((rect.top - containerRect.top) * domScale)),
      bottom: Math.min(
        canvas.height,
        Math.ceil((rect.bottom - containerRect.top) * domScale)
      ),
      isHeading: node.getAttribute('data-pdf-heading') === 'true',
    };
  });

  // Compute slice ranges [startY, endY] in canvas pixels
  const slices: Array<{ startY: number; endY: number }> = [];
  let currentY = 0;

  while (currentY < canvas.height - 4) {
    const pageBudgetPx =
      slices.length === 0 ? maxPageSliceHeightPx : subsequentPageSliceHeightPx;
    const limitY = currentY + pageBudgetPx;

    if (limitY >= canvas.height - 4) {
      slices.push({ startY: currentY, endY: canvas.height });
      break;
    }

    // Find all blocks that end at or before limitY and advance past currentY
    let candidateIndex = -1;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].bottom <= limitY && blocks[i].bottom > currentY + 40) {
        candidateIndex = i;
      }
    }

    // Avoid stranding a section heading alone at the very bottom of a page
    while (
      candidateIndex > 0 &&
      blocks[candidateIndex].isHeading &&
      blocks[candidateIndex - 1].bottom > currentY + 40
    ) {
      candidateIndex--;
    }

    let nextBreakY = limitY;
    if (candidateIndex !== -1) {
      // Break cleanly in the whitespace right after the chosen block
      const nextBlock = blocks[candidateIndex + 1];
      nextBreakY = nextBlock
        ? Math.min(limitY, Math.floor((blocks[candidateIndex].bottom + nextBlock.top) / 2))
        : blocks[candidateIndex].bottom;
    }

    if (nextBreakY <= currentY) {
      nextBreakY = Math.min(canvas.height, limitY);
    }

    slices.push({ startY: currentY, endY: nextBreakY });
    currentY = nextBreakY;
  }

  // Render each slice onto its own A4 page
  slices.forEach((slice, pageIdx) => {
    if (pageIdx > 0) {
      pdf.addPage();
    }

    if (pageIdx > 0 && headerImgData) {
      pdf.addImage(
        headerImgData,
        'JPEG',
        marginXMm,
        marginTopMm,
        contentWidthMm,
        headerHeightMm,
        undefined,
        'FAST'
      );
    }

    const sliceHeightPx = slice.endY - slice.startY;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;

    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        slice.startY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );
    }

    const sliceHeightMm = sliceHeightPx / pxPerMm;
    const sliceTopMm =
      pageIdx > 0 && headerImgData
        ? marginTopMm + headerHeightMm + subsequentHeaderGapMm
        : marginTopMm;
    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(
      imgData,
      'JPEG',
      marginXMm,
      sliceTopMm,
      contentWidthMm,
      sliceHeightMm,
      undefined,
      'FAST'
    );

    // Subtle page indicator in ASCII at bottom center
    if (slices.length > 1) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `My Compass Report  •  ${pageIdx + 1} / ${slices.length}`,
        pageWidthMm / 2,
        pageHeightMm - 5,
        { align: 'center' }
      );
    }
  });

  const sanitizedName = (studentName || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-');

  const filename = sanitizedName
    ? `بوصلتي-التقرير-المهني-${sanitizedName}.pdf`
    : 'بوصلتي-التقرير-المهني.pdf';

  pdf.save(filename);
}
