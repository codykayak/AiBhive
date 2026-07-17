import type { ResumeDocument } from './types';
import { buildResumePdfHtml } from './buildResumeHtml';

function slugifyName(doc: ResumeDocument): string {
  const name = `${doc.firstName}-${doc.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return name.replace(/^-+|-+$/g, '') || 'resume';
}

async function renderResumePageElement(doc: ResumeDocument): Promise<{ element: HTMLElement; cleanup: () => void }> {
  const html = buildResumePdfHtml(doc);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '8.5in';
  iframe.style.height = '11in';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('Could not render resume template.'));
    iframe.srcdoc = html;
  });

  const page = iframe.contentDocument?.querySelector('.page');
  if (!page || !(page instanceof HTMLElement)) {
    iframe.remove();
    throw new Error('Could not render resume template.');
  }

  return {
    element: page,
    cleanup: () => iframe.remove(),
  };
}

/** Download resume as PDF via print-ready HTML (browser Save as PDF). */
export async function downloadResumePdfViaPrint(doc: ResumeDocument): Promise<void> {
  const { cleanup } = await renderResumePageElement(doc);
  const html = buildResumePdfHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.src = url;
  document.body.appendChild(frame);

  await new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    frame.src = url;
  });

  const win = frame.contentWindow;
  if (!win) {
    cleanup();
    URL.revokeObjectURL(url);
    frame.remove();
    throw new Error('Could not open print dialog.');
  }

  const cleanupAll = () => {
    cleanup();
    URL.revokeObjectURL(url);
    frame.remove();
  };

  win.onafterprint = cleanupAll;
  win.focus();
  win.print();
  window.setTimeout(cleanupAll, 60_000);
}

/** Render the resume template to a downloadable PDF file. */
export async function downloadResumePdf(doc: ResumeDocument): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }, { element, cleanup }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    renderResumePageElement(doc),
  ]);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    } else {
      let position = 0;
      let remaining = imgHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        remaining -= pageHeight;
        position -= pageHeight;
        if (remaining > 0) pdf.addPage();
      }
    }

    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`${slugifyName(doc)}-resume-${stamp}.pdf`);
  } finally {
    cleanup();
  }
}
