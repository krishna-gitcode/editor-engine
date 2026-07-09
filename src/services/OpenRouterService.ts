export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  isVision?: boolean;
}

export const FREE_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    name: 'Gemini 2.0 Flash Lite (Free)',
    description: 'Fast, high-quality general text generation and reasoning.',
    isVision: true,
  },
  {
    id: 'qwen/qwen-2-vl-72b-instruct:free',
    name: 'Qwen 2 VL 72B Vision & OCR (Free)',
    description: 'Powerful vision model optimized for accurate document OCR, tables, and handwriting.',
    isVision: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    description: 'Meta state-of-the-art 70B parameter reasoning and creative writing model.',
    isVision: false,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    description: 'Ultra-fast general drafting and grammar polishing.',
    isVision: false,
  },
  {
    id: 'google/gemini-flash-1.5-8b:free',
    name: 'Gemini 1.5 Flash 8B (Free)',
    description: 'Low-latency multi-turn drafting assistant.',
    isVision: true,
  },
];

export class OpenRouterService {
  private static API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Generate text or markdown content using OpenRouter API
   */
  public static async generateText(
    apiKey: string,
    model: string,
    prompt: string,
    systemPrompt = 'You are a helpful, professional AI authoring assistant for Sarkari Musician App and Editor Engine. Output clean, well-formatted text or markdown directly usable inside a document.'
  ): Promise<string> {
    const activeKey = (apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();
    if (!activeKey) {
      throw new Error('Please enter a valid OpenRouter API Key above or configure VITE_OPENROUTER_API_KEY in your .env file (Get a free key at openrouter.ai).');
    }

    const activeModel = model || import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Editor Engine Studio',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;
        throw new Error(`OpenRouter API Error (${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from AI model.');
      }
      return content;
    } catch (error: any) {
      console.error('OpenRouter generateText error:', error);
      throw new Error(error.message || 'Failed to generate text from OpenRouter API.');
    }
  }

  /**
   * Enhance existing text (rewrite/improve while preserving meaning)
   */
  public static async enhanceText(
    apiKey: string,
    model: string,
    selectedText: string,
    instruction = 'Enhance and improve the following text for clarity, flow, and professionalism. Return only the improved text, no explanations.'
  ): Promise<string> {
    const prompt = `${instruction}\n\nText to enhance:\n${selectedText}`;
    return this.generateText(
      apiKey,
      model,
      prompt,
      'You are a professional writing assistant. Improve the given text and return ONLY the rewritten version, with no extra commentary or preamble.'
    );
  }

  /**
   * Check and fix spelling and grammar errors in the provided text
   */
  public static async checkSpellingGrammar(
    apiKey: string,
    model: string,
    text: string
  ): Promise<string> {
    const prompt = `Fix all spelling and grammar errors in the following text. Return ONLY the corrected text. Do NOT add explanations, comments, or changes in meaning.\n\nText:\n${text}`;
    return this.generateText(
      apiKey,
      model,
      prompt,
      'You are a professional proofreader. Fix spelling and grammar errors only. Return ONLY the corrected text without any explanations.'
    );
  }

  /**
   * Perform OCR or image analysis using an OpenRouter Vision-capable model
   */
  public static async performOCR(
    apiKey: string,
    model: string,
    base64Image: string,
    ocrPrompt = 'Extract all text, tables, equations, and structural elements from this image accurately into clean Markdown format. Preserve exact text wording, headings, and lists.'
  ): Promise<string> {
    const activeKey = (apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();
    if (!activeKey) {
      throw new Error('Please enter a valid OpenRouter API Key above or configure VITE_OPENROUTER_API_KEY in your .env file (Get a free key at openrouter.ai).');
    }

    // Ensure base64 string has prefix if not already
    let imageUrl = base64Image;
    if (!imageUrl.startsWith('data:image/')) {
      imageUrl = `data:image/png;base64,${base64Image}`;
    }

    const activeModel = model || import.meta.env.VITE_OPENROUTER_DEFAULT_VISION_MODEL || 'qwen/qwen-2-vl-72b-instruct:free';

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Editor Engine Studio - Vision OCR',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: ocrPrompt },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.2, // low temp for accurate OCR
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;
        throw new Error(`OpenRouter OCR API Error (${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty OCR response from Vision AI model.');
      }
      return content;
    } catch (error: any) {
      console.error('OpenRouter performOCR error:', error);
      throw new Error(error.message || 'Failed to perform OCR extraction using OpenRouter Vision model.');
    }
  }
}
