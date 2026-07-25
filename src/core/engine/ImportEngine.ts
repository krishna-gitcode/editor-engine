import * as mammoth from 'mammoth';

export class ImportEngine {
  /**
   * Imports a DOCX file and injects its contents into the Tiptap editor.
   * Replaces the current content.
   */
  public static async importDOCX(file: File, editor: any): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      const html = result.value; 
      
      if (editor) {
        editor.commands.setContent(html, true);
      }
      
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX Import Messages:', result.messages);
      }
    } catch (error) {
      console.error('Error importing DOCX:', error);
      throw error;
    }
  }
}
