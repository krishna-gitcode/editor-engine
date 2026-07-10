import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useDocumentStore } from '../../store/documentStore';

export class ExportEngine {
  public static async exportToPNG(containerElement: HTMLElement, fileName: string = 'document.png') {
    const canvas = await html2canvas(containerElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  public static async exportToPDF(containerElement: HTMLElement, fileName: string = 'document.pdf') {
    const pages = useDocumentStore.getState().pages;
    const firstPage = pages[0] || { orientation: 'portrait', pageSize: 'A4' };
    const formatVal = firstPage.pageSize === 'Custom'
      ? [firstPage.customWidth || 800, firstPage.customHeight || 1000]
      : firstPage.pageSize.toLowerCase();
    const pdf = new jsPDF({
      orientation: firstPage.orientation,
      unit: 'pt',
      format: formatVal as any,
    });

    const canvas = await html2canvas(containerElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  }

  public static exportToJSON() {
    const state = useDocumentStore.getState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.pages, null, 2));
    const link = document.createElement('a');
    link.download = `document-template-${Date.now()}.json`;
    link.href = dataStr;
    link.click();
  }
}
