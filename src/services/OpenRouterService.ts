export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  type?: string;
  capabilities?: string[];
  isVision?: boolean;
}

export const FREE_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "openrouter/free",
    name: "Free Models Router",
    type: "Router / Fallback",
    capabilities: ["text", "vision", "tool-use", "structured-outputs"],
    description: "Automatically routes payloads to active free models based on context requirements.",
    isVision: true
  },
  {
    id: "meta-llama/llama-3.2-11b-vision-instruct:free",
    name: "Llama 3.2 11B Vision Instruct (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision", "ocr"],
    description: "Optimized for visual reasoning, document parsing, and OCR tasks.",
    isVision: true
  },
  {
    id: "google/gemma-3-4b-it:free",
    name: "Gemma 3 4B IT (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision"],
    description: "Lightweight, highly efficient model optimized for fast visual checkpoints.",
    isVision: true
  },
  {
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B IT (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision"],
    description: "Balanced performance for complex layout and chart analysis.",
    isVision: true
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B IT (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision", "reasoning"],
    description: "High-accuracy multimodal variant built for complex structural diagrams.",
    isVision: true
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B IT (Free)",
    type: "Reasoning / Text",
    capabilities: ["text", "deep-thinking", "math"],
    description: "Google's high-intelligence reasoning model with advanced instruction following.",
    isVision: false
  },
  {
    id: "qwen/qwen2.5-vl-32b-instruct:free",
    name: "Qwen 2.5 VL 32B Instruct (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision", "object-detection"],
    description: "Strong performance in document parsing, multi-image processing, and spatial grounding.",
    isVision: true
  },
  {
    id: "qwen/qwen2.5-vl-72b-instruct:free",
    name: "Qwen 2.5 VL 72B Instruct (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision", "object-detection"],
    description: "Flagship visual model with stellar understanding of dense charts, graphs, and UI screenshots.",
    isVision: true
  },
  {
    id: "moonshotai/kimi-vl-a3b-thinking:free",
    name: "Kimi VL A3B Thinking (Free)",
    type: "Vision / Reasoning",
    capabilities: ["text", "vision", "deep-thinking"],
    description: "Fuses multimodal perception with extended internal chain-of-thought logic.",
    isVision: true
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b:free",
    name: "Nemotron 3 Nano Omni 30B (Free)",
    type: "Vision / Multimodal",
    capabilities: ["text", "vision", "video"],
    description: "Omni-modal architecture natively supporting video and sequential frame reasoning.",
    isVision: true
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    type: "Reasoning / Text",
    capabilities: ["text", "deep-thinking", "math", "coding"],
    description: "Advanced reasoning model deploying extensive chain-of-thought processing for complex logic.",
    isVision: false
  },
  {
    id: "nvidia/nemotron-3-ultra:free",
    name: "Nemotron 3 Ultra (Free)",
    type: "Text / Orchestration",
    capabilities: ["text", "orchestration", "legal", "finance"],
    description: "High-capacity 1M context window model tailored for specialized multi-agent coordination.",
    isVision: false
  },
  {
    id: "nvidia/nemotron-3-super:free",
    name: "Nemotron 3 Super (Free)",
    type: "Text / General Purpose",
    capabilities: ["text", "analytics", "marketing"],
    description: "NVIDIA's versatile, broad-domain model tuned for low latency text extraction and writing.",
    isVision: false
  },
  {
    id: "cohere/north-mini-code:free",
    name: "North Mini Code (Free)",
    type: "Coding / Agentic",
    capabilities: ["text", "coding", "tool-use"],
    description: "Agentic mixture-of-experts model specifically engineered for software tasks and terminal loops.",
    isVision: false
  },
  {
    id: "poolside/laguna-m1:free",
    name: "Laguna M.1 (Free)",
    type: "Coding / Tech",
    capabilities: ["text", "coding", "agentic-workflows"],
    description: "Developer-centric software engineering agent model trained heavily on complex codebases.",
    isVision: false
  },
  {
    id: "poolside/laguna-xs-2.1:free",
    name: "Laguna XS 2.1 (Free)",
    type: "Coding / Fast",
    capabilities: ["text", "coding"],
    description: "Stripped-down, high-throughput code autocomplete and generation variant.",
    isVision: false
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1 24B Instruct (Free)",
    type: "Text / General Purpose",
    capabilities: ["text", "multilingual", "function-calling"],
    description: "Highly efficient, instruction-tuned multilingual text engine backing structured tool calls.",
    isVision: false
  }
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
    systemPrompt = 'You are a helpful, professional AI authoring assistant for GridLeaf Editor. Output clean, well-formatted text or markdown directly usable inside a document. IMPORTANT: For tables, output markdown tables. For mathematical formulas, wrap them exactly in <mathjax>...</mathjax> tags. For ABC sheet music notation, wrap it exactly in <abcjs>...</abcjs> tags. For code snippets, use fenced code blocks (```).'
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
          'X-Title': 'GridLeaf Editor Studio',
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
   * Stream text generation
   */
  public static async *streamText(
    apiKey: string,
    model: string,
    prompt: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const activeKey = (apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();
    if (!activeKey) {
      throw new Error('Please enter a valid OpenRouter API Key above or configure VITE_OPENROUTER_API_KEY in your .env file (Get a free key at openrouter.ai).');
    }

    const activeModel = model || import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';
    const activeSystemPrompt = systemPrompt || 'You are a helpful, professional AI authoring assistant for GridLeaf Editor. Output clean, well-formatted text or markdown directly usable inside a document.';

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GridLeaf Editor Studio',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: activeSystemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;
        throw new Error(`OpenRouter API Error (${response.status}): ${errMsg}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported or no body in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn('Failed to parse stream JSON chunk:', data);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('OpenRouter streamText error:', error);
      throw new Error(error.message || 'Failed to stream text from OpenRouter API.');
    }
  }

  /**
   * Summarize text
   */
  public static async summarizeText(
    apiKey: string,
    model: string,
    text: string
  ): Promise<string> {
    return this.generateText(
      apiKey,
      model,
      `Summarize the following text:\n\n${text}`,
      'You are a concise summarizer. Return ONLY a 2-3 sentence summary. No preamble.'
    );
  }

  /**
   * Expand text
   */
  public static async expandText(
    apiKey: string,
    model: string,
    text: string,
    targetLength?: string
  ): Promise<string> {
    return this.generateText(
      apiKey,
      model,
      `Expand this text to approximately ${targetLength || '2x'} its length:\n\n${text}`,
      'You are a professional writer. Expand the text while preserving meaning and tone. Return ONLY the expanded version.'
    );
  }

  /**
   * Rewrite text with a specific tone
   */
  public static async rewriteWithTone(
    apiKey: string,
    model: string,
    text: string,
    tone: string
  ): Promise<string> {
    return this.generateText(
      apiKey,
      model,
      `Rewrite in ${tone} tone:\n\n${text}`,
      `You are a professional rewriter. Rewrite the text in a ${tone} tone. Return ONLY the rewritten text.`
    );
  }

  /**
   * Perform OCR or image analysis using an OpenRouter Vision-capable model
   */
  public static async performOCR(
    apiKey: string,
    model: string,
    base64Image: string,
    ocrPrompt = 'Extract all text, tables, equations, and structural elements from this image accurately into clean Markdown format. Preserve exact text wording, headings, and lists. IMPORTANT: Do not interpret or solve formulas or music. Extract their exact syntactical representation. Enclose any mathematical equations in <mathjax>...</mathjax> tags and sheet music/ABC notation in <abcjs>...</abcjs> tags. Output tables as markdown tables.'
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

    const activeModel = model || import.meta.env.VITE_OPENROUTER_DEFAULT_VISION_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free';

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GridLeaf Editor Studio - Vision OCR',
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
