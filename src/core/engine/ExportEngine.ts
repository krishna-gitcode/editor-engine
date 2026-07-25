import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useDocumentStore } from '../../store/documentStore';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

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

  public static exportToMarkdown(htmlContent: string, fileName: string = 'document.md') {
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    const markdown = turndownService.turndown(htmlContent);
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataStr;
    link.click();
  }

  public static async exportToDOCX(htmlContent: string, fileName: string = 'document.docx') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const children: any[] = [];
    
    Array.from(tempDiv.childNodes).forEach((node: ChildNode) => {
      const nodeName = node.nodeName.toUpperCase();
      const text = node.textContent || '';
      
      if (nodeName === 'P') {
        children.push(new Paragraph({ children: [new TextRun(text)] }));
      } else if (nodeName === 'H1') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
      } else if (nodeName === 'H2') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
      } else if (nodeName === 'H3') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
      } else if (nodeName === 'H4') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_4 }));
      } else if (nodeName === 'H5') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_5 }));
      } else if (nodeName === 'H6') {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_6 }));
      } else if (nodeName === 'BLOCKQUOTE') {
        children.push(new Paragraph({ text, indent: { left: 720 } }));
      } else if (nodeName === 'UL' || nodeName === 'OL') {
        Array.from(node.childNodes).forEach((liNode: ChildNode) => {
          if (liNode.nodeName.toUpperCase() === 'LI') {
            children.push(new Paragraph({ text: liNode.textContent || '', bullet: { level: 0 } }));
          }
        });
      } else if (text.trim() !== '') {
        children.push(new Paragraph({ children: [new TextRun(text)] }));
      }
    });
    
    if (children.length === 0) {
      children.push(new Paragraph({ text: "Empty document" }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
}
