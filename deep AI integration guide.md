# DEEP AI INTEGRATION — editor-engine (GridLeaf Editor Studio)
# Repo: https://github.com/krishna-gitcode/editor-engine
# Stack: React 19 + TypeScript + Tiptap v2 + Fabric.js + Zustand + Framer Motion + Tailwind CSS + Vite

---

## CONTEXT — What Already Exists (DO NOT rewrite these, only extend them)

### Services (src/services/)
- OpenRouterService.ts — Has: generateText(), enhanceText(), checkSpellingGrammar(), performOCR()
  All are NON-STREAMING blocking fetch calls. Free models configured:
  Gemini 2.0 Flash Lite, NVIDIA Nemotron VL, Llama 3.3 70B, Mistral 7B, Gemini 1.5 Flash 8B
  API key from: import.meta.env.VITE_OPENROUTER_API_KEY
  Default model from: import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL
- PluginService.ts — Has: renderMathJax(), renderAbc()
- markdownToHtml.ts — Has: parseMarkdownToTipTap() — converts markdown string to Tiptap JSON nodes
- PdfService.ts — Has: PDF export logic

### Tiptap Extensions (src/features/document/)
All registered in DocumentPage.tsx's sharedExtensions array:
MathJaxExtension, AbcJsExtension, ChartExtension, IframeExtension,
CustomTable, CustomTableCell, CustomTableHeader, TableRow,
IndentExtension, ListStyleExtension, TextEffectExtension,
FontSizeExtension, LineHeightExtension, PageNumberExtension, ImageExtension

### Document Structure (src/features/document/DocumentPage.tsx)
- Three Tiptap editors: headerEditor, footerEditor, editor (body)
- Active editor tracked via: (window as any).__activeEditor
- Zone switching via: setActiveEditorGlobally(editor)
- Stores content in: useDocumentStore (Zustand) → updatePageContent(), updatePageSettings()
- PlusMenu rendered once per editor zone

### PlusMenu (src/features/document/PlusMenu.tsx)
Current menu items: Generate with AI (basic), Table, Image, Blockquote, Code Block
Current AI: calls OpenRouterService.generateText() (non-streaming, single prompt, full insert)
Uses Framer Motion for animations, Lucide icons

### Canvas (src/features/canvas/)
- CanvasLayer.tsx — Fabric.js canvas wrapper
- LayerPanel.tsx — Layer management UI
- ShapeTools.tsx — Rectangle, Circle, Triangle, Line, Polygon, Textbox tools
- TextPanel.tsx — Canvas text styling
- ImageStudioTab.tsx, ImageStudioPanel.tsx — Image tools
- canvasStore.ts — Zustand store for canvas state

### Global State (src/store/)
- editorStore.ts — activeTool, activeTab (SidebarTab), ribbonTab (RibbonTab), theme ('dark'|'light'), customFonts
  SidebarTab values: 'document'|'canva_studio'|'image_studio'|'shapes'|'text'|'layers'|'search'|'templates'
  RibbonTab values: 'home'|'insert'|'layout'|'table'|'plugins'
- documentStore.ts — pages[], activePageId, updatePageContent(), updatePageSettings()
- canvasStore.ts — canvas objects state
- workspaceStore.ts — workspace config

---

## TASK — Implement the Following 6 Deep AI Features

### FEATURE 1: SSE Streaming in OpenRouterService
FILE TO MODIFY: src/services/OpenRouterService.ts

Add a new async generator method `streamText()` to the OpenRouterService class:

```typescript
public static async *streamText(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  // 1. Resolve apiKey and model same as generateText() (fall back to env vars)
  // 2. POST to https://openrouter.ai/api/v1/chat/completions with stream: true
  // 3. Same headers as generateText() (Authorization, HTTP-Referer, X-Title)
  // 4. Read response.body as ReadableStream with getReader()
  // 5. Decode each chunk with TextDecoder
  // 6. Split by newlines, filter lines starting with 'data: '
  // 7. Skip '[DONE]' sentinel
  // 8. Parse JSON and yield delta.choices.delta.content (skip null/undefined)
  // 9. Wrap in try/catch — throw descriptive errors same style as generateText()
}
```

Also add these three new NON-STREAMING methods to OpenRouterService (same pattern as enhanceText):

**summarizeText(apiKey, model, text):**
System prompt: 'You are a concise summarizer. Return ONLY a 2-3 sentence summary. No preamble.'
User prompt: `Summarize the following text:\n\n${text}`

**expandText(apiKey, model, text, targetLength?):**
System prompt: 'You are a professional writer. Expand the text while preserving meaning and tone. Return ONLY the expanded version.'
User prompt: `Expand this text to approximately ${targetLength || '2x'} its length:\n\n${text}`

**rewriteWithTone(apiKey, model, text, tone):**
tone options: 'formal' | 'casual' | 'military' | 'poetic' | 'technical' | 'persuasive'
System prompt: `You are a professional rewriter. Rewrite the text in a ${tone} tone. Return ONLY the rewritten text.`
User prompt: `Rewrite in ${tone} tone:\n\n${text}`

---

### FEATURE 2: Zustand AI Store
FILE TO CREATE: src/store/aiStore.ts

Create a new Zustand store following the exact same pattern as editorStore.ts:

```typescript
import { create } from 'zustand';

interface AIStore {
  // Streaming state
  isStreaming: boolean;
  streamingText: string;        // accumulates streamed tokens for display
  
  // Config (persisted per session)
  selectedModel: string;         // default: from VITE_OPENROUTER_DEFAULT_MODEL or 'google/gemini-2.0-flash-lite-preview-02-05:free'
  apiKey: string;                // default: from VITE_OPENROUTER_API_KEY or ''
  
  // Ghost text (inline autocomplete)
  ghostText: string;
  ghostCursorPos: number;
  
  // AI Panel UI state
  isAIPanelOpen: boolean;
  aiPanelMode: 'generate' | 'rewrite' | 'chat' | 'canvas';
  lastAIError: string | null;

  // Actions
  setStreaming: (v: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  clearStreamingText: () => void;
  setModel: (m: string) => void;
  setApiKey: (k: string) => void;
  setGhostText: (text: string, cursorPos: number) => void;
  clearGhostText: () => void;
  setAIPanelOpen: (open: boolean) => void;
  setAIPanelMode: (mode: AIStore['aiPanelMode']) => void;
  setLastAIError: (err: string | null) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  // ... implement all state and actions
  // selectedModel and apiKey should read from import.meta.env at init time
}));
```

---

### FEATURE 3: Streaming AI in PlusMenu + Extended AI Commands
FILE TO MODIFY: src/features/document/PlusMenu.tsx

**3a. Replace the current handleGenerateAI() with a streaming version:**
- Import useAIStore from '../../store/aiStore'
- Import streamText from OpenRouterService
- Instead of `await generateText()` then bulk insert:
  1. Set isStreaming = true in aiStore
  2. Insert an empty paragraph at cursor with editor.chain().focus().insertContent('\n').run()
  3. Use `for await (const chunk of OpenRouterService.streamText(...))` loop
  4. Each chunk: call `editor.commands.insertContent(chunk)` — this streams tokens live into document
  5. On finish: set isStreaming = false, clearStreamingText()
  6. Show a pulsing cursor-like animation while streaming (use Framer Motion `animate={{ opacity: [1, 0, 1] }}`)

**3b. Add 5 new AI command items to the PlusMenu dropdown** (after the existing "Generate with AI" button, before the divider):

Add a second sub-section titled "AI Smart Blocks" with these items:
Each opens a small inline prompt input or uses selected text, then calls the appropriate OpenRouterService method.

1. **"AI Rewrite Tone"** (icon: Wand2 from lucide-react, color: text-violet-400)
   - Opens a tone selector dropdown: Formal / Casual / Military / Poetic / Technical / Persuasive
   - Gets selected text from: `editor.state.selection` → `editor.state.doc.textBetween(from, to)`
   - If no selection: shows error "Please select text first"
   - Calls rewriteWithTone() and replaces selection with result
   - Use editor.chain().focus().deleteSelection().insertContent(result).run()

2. **"Summarize Selection"** (icon: AlignLeft from lucide-react, color: text-sky-400)
   - Gets selected text, calls summarizeText()
   - Inserts summary as a new blockquote block after current paragraph
   - Use editor.chain().focus().insertContent({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: summary }] }] }).run()

3. **"AI ABC Music"** (icon: Music from lucide-react, color: text-amber-400)
   - Opens prompt input: "Describe music (e.g. 'simple C major scale', 'happy folk melody in G')"
   - System prompt: 'You are a music notation expert. Generate valid ABC notation only. Output ONLY the ABC notation starting with X:1, no explanation, no markdown.'
   - Calls generateText() with this system prompt
   - Wraps result in AbcJs node: use editor.chain().focus().insertContent('<abcjs>' + result + '</abcjs>').run()
   - Note: AbcJsExtension already handles rendering of <abcjs> tags

4. **"AI Chart Data"** (icon: BarChart2 from lucide-react, color: text-emerald-400)
   - Opens prompt input: "Describe chart (e.g. 'monthly sales Jan-Jun with values 45,60,55,80,75,90')"
   - System prompt: 'Output ONLY a JSON object with: { "type": "bar"|"line"|"pie", "labels": [...], "datasets": [{"label": "...", "data": [...]}] }. No explanation, no markdown.'
   - Calls generateText() and wraps in chart node using ChartExtension
   - Use editor.chain().focus().insertContent('<chart data="' + encodeURIComponent(result) + '"></chart>').run()

5. **"AI Webpage Block"** (icon: Globe from lucide-react, color: text-pink-400)
   - Opens prompt input: "Describe a web component (e.g. 'pricing card with 3 tiers, dark theme')"
   - System prompt: 'You are a web developer. Output ONLY a complete self-contained HTML block with inline CSS. Make it visually attractive with dark background, modern fonts, smooth hover effects. No explanation, no markdown, output only the HTML.'
   - Calls generateText()
   - Inserts via IframeExtension: editor.chain().focus().insertContent('<iframe src="' + encodeURIComponent(result) + '"></iframe>').run()
   - Note: IframeExtension already handles rendering

---

### FEATURE 4: AI Ghost Text Tiptap Extension
FILE TO CREATE: src/features/document/AIGhostTextExtension.ts

Create a Tiptap Extension that shows inline ghost text (like GitHub Copilot):

```typescript
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const AIGhostTextExtension = Extension.create({
  name: 'aiGhostText',
  // Debounce: 900ms after user stops typing
  // Get last 400 characters before cursor as context
  // Call OpenRouterService.generateText() with:
  //   system: 'You are an inline writing assistant. Complete the user\'s text naturally. 
  //            Output ONLY the continuation (10-30 words max). No explanation.'
  //   prompt: 'Continue this text: ...[last 400 chars]'
  // Render suggestion as a ProseMirror Decoration widget at cursor:
  //   <span class="ai-ghost-text" style="color: #94a3b8; opacity: 0.6; pointer-events: none;">{suggestion}</span>
  // Tab key: accept ghost text → editor.commands.insertContent(ghostText)
  // Any other key: clear ghost text decoration
  // Escape key: clear ghost text
  // Use useAIStore.getState().setGhostText() and clearGhostText() for state sync
  // Only trigger when: editor is focused, selection is empty (not a range), 
  //   last char typed is a space or period (don't trigger mid-word)
  // Add this CSS class to index.css: .ai-ghost-text { ... }
});
```

Register this extension in DocumentPage.tsx's sharedExtensions array (import and add AIGhostTextExtension).

Add this CSS to src/features/document/DocumentPage.css:
```css
.ai-ghost-text {
  color: #94a3b8;
  opacity: 0.55;
  font-style: italic;
  pointer-events: none;
  user-select: none;
}
```

---

### FEATURE 5: AI Floating Bubble Toolbar (Selection Toolbar)
FILE TO CREATE: src/features/document/AIBubbleToolbar.tsx
FILE TO MODIFY: src/features/document/DocumentPage.tsx

Create a floating toolbar that appears when user selects text in the editor.
Use Tiptap's BubbleMenu concept — but implement manually with Framer Motion since the project already uses it:

**AIBubbleToolbar.tsx:**
- Props: `editor: any`
- Show when: `editor.state.selection.from !== editor.state.selection.to` (has selection)
- Position: fixed, above selection using `editor.view.coordsAtPos(editor.state.selection.from)`
- Animated: Framer Motion `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- Dark glass style: `bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl`
- Buttons (all call OpenRouterService, replace selection with result):
  1. ✨ **Enhance** — calls enhanceText() — icon: Sparkles, color: emerald
  2. 📝 **Summarize** — calls summarizeText() — icon: AlignLeft, color: sky  
  3. 🔁 **Formal** — calls rewriteWithTone(text, 'formal') — icon: Briefcase, color: indigo
  4. 🎨 **Casual** — calls rewriteWithTone(text, 'casual') — icon: MessageCircle, color: violet
  5. ✅ **Fix Grammar** — calls checkSpellingGrammar() — icon: CheckCircle, color: green
  6. 📖 **Expand** — calls expandText() — icon: Maximize2, color: orange
- Loading state: show Loader2 spinner in place of clicked button's icon
- Error state: brief red flash with error message below toolbar (auto-dismiss 3s)
- All icons from lucide-react

In DocumentPage.tsx:
- Import AIBubbleToolbar
- Render inside the doc-body-zone div: `<AIBubbleToolbar editor={editor} />`
- Also render for header/footer if those zones have selection

---

### FEATURE 6: AI Canvas Layout Generator
FILE TO CREATE: src/features/canvas/AICanvasPanel.tsx
FILE TO MODIFY: src/features/canvas/CanvasLayer.tsx (add AI panel trigger button)

**AICanvasPanel.tsx:**
- A floating panel (right side of canvas, animated slide-in with Framer Motion)
- Triggered by a "✨ AI Generate Layout" button in CanvasLayer.tsx
- UI: Dark panel, title "AI Web Designer", prompt textarea
- Prompt input placeholder: "Describe a web component (e.g. 'hero section with dark background, title, subtitle, and a CTA button')"
- On submit: calls OpenRouterService.generateText() with this system prompt:
  ```
  You are a Fabric.js layout generator. Given a description, output ONLY a JSON array of Fabric.js objects.
  Each object must have: type (one of: 'rect', 'circle', 'textbox', 'line'), left, top, width, height, 
  fill (hex color), text (for textbox only), fontSize (for textbox only, number), 
  fontFamily (for textbox only), stroke (optional), strokeWidth (optional, number).
  Use realistic, visually appealing values. Dark theme preferred. Output ONLY valid JSON array.
  ```
- Parse response as JSON array
- For each object in array, add to Fabric.js canvas using the fabric instance from canvasStore or CanvasLayer's ref
- Show a "Generating..." state with pulsing animation
- Show parsed object count on success: "Added 6 objects to canvas"
- Error handling: show message if JSON parse fails or generation fails

**In CanvasLayer.tsx:**
- Add a small "✨ AI" button in the canvas toolbar area
- onClick: toggle a local state `showAIPanel` 
- Render `<AICanvasPanel fabricRef={canvasRef} onClose={() => setShowAIPanel(false)} />` when open
- Pass the fabric canvas instance via ref

---

## INTEGRATION & CONSISTENCY RULES

1. **ALL new files** must use TypeScript with proper interfaces — no `any` unless matching existing patterns (the codebase uses `any` for editor refs, maintain that consistency)
2. **Icons**: import only from 'lucide-react' (already installed) — no new icon libraries
3. **Animations**: use Framer Motion (already installed) — `motion.div`, `AnimatePresence` for show/hide
4. **Styles**: Tailwind utility classes only — match the existing dark theme: `slate-900`, `slate-800`, `slate-700`, `emerald-400`, etc. No new CSS files unless extending existing ones
5. **Store access**: Use `useAIStore` hook in React components; use `useAIStore.getState()` in non-React code (extensions, services)
6. **Error handling**: All AI calls must handle errors gracefully — show inline error messages, never crash the editor
7. **API key**: always fall back to `import.meta.env.VITE_OPENROUTER_API_KEY` then empty string — same pattern as existing code
8. **No new npm packages** — use only what's in package.json. Tiptap PM utilities (Plugin, PluginKey, Decoration, DecorationSet) are available via '@tiptap/pm/state' and '@tiptap/pm/view' which is already installed

---

## FILE CHANGE SUMMARY

| Action | File Path |
|--------|-----------|
| MODIFY | src/services/OpenRouterService.ts |
| CREATE | src/store/aiStore.ts |
| MODIFY | src/features/document/PlusMenu.tsx |
| CREATE | src/features/document/AIGhostTextExtension.ts |
| MODIFY | src/features/document/DocumentPage.tsx |
| MODIFY | src/features/document/DocumentPage.css |
| CREATE | src/features/document/AIBubbleToolbar.tsx |
| CREATE | src/features/canvas/AICanvasPanel.tsx |
| MODIFY | src/features/canvas/CanvasLayer.tsx |

---

## DEFINITION OF DONE

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] Streaming tokens appear word-by-word in Tiptap body editor when using PlusMenu AI Generate
- [ ] Selecting text and clicking "Enhance" in AIBubbleToolbar replaces selection with AI result
- [ ] Tab key accepts ghost text inline suggestion
- [ ] /AI ABC Music inserts a rendered AbcJs block
- [ ] /AI Chart Data inserts a rendered Chart block
- [ ] /AI Webpage Block inserts an Iframe block with generated HTML
- [ ] AICanvasPanel generates and renders Fabric.js objects onto the canvas
- [ ] No runtime errors in browser console
- [ ] All features work with the free OpenRouter models already configured
```