import { OpenRouterService } from '../../services/OpenRouterService';

export async function generateCanvasLayout(
  description: string, apiKey: string, model: string
): Promise<any[]> {
  const prompt = `
    You are an advanced web page and document layout generator.
    Given this description: "${description}"

    Output a JSON array of Fabric.js objects (type, left, top, width, height, fill, text, fontSize).
    If the content contains any mathematical equations, scientific notation, or music notation, you MUST:
    - Use LaTeX or MathJax syntax inside the 'text' property for math/science.
    - Use ABC.js notation inside the 'text' property for music.
    
    CRITICAL: Only output a valid JSON array. No explanation. No markdown formatting.
  `;
  const json = await OpenRouterService.generateText(apiKey, model, prompt,
    'Output ONLY a valid JSON array of Fabric.js object specs containing layout coordinates and content (including MathJax/LaTeX/ABC.js if relevant). No markdown, no explanation.');
  
  try {
    // Attempt to strip any markdown code block formatting if present
    const cleanJson = json.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    throw new Error('Failed to parse AI layout response as JSON: ' + (err as Error).message);
  }
}
