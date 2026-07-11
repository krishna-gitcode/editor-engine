# Editor Engine: 28-Point Master Actionable Implementation Plan

This document provides a comprehensive, architectural, and code-level actionable plan for all **28 enhancement requests** for the **Editor Engine** (`sarkari-musician-core / editor engine`). 

By bridging our **TipTap (ProseMirror)** rich-text document layer with the **Fabric.js** 2D vector canvas engine and enhancing our AI/OCR pipelines, this roadmap resolves all synchronization gaps, UX friction points, and feature expansions.

---

## Executive Summary & Phased Roadmap Overview

To ensure rapid delivery, architectural stability, and minimal regression, the 28 items are organized into **6 Logical Implementation Phases**:

| Phase | Category | Covered Points | Goal |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Workspace Layout & Chrome UI** | `#1, #2, #23` | Bottom-sticky page navigation, collapsible sidebar tabs, and right inspector panel toggle. |
| **Phase 2** | **Hybrid Canvas & Layer Synchronization** | `#5, #6, #11, #12` | Seamless text/shape creation across modes and unifying TipTap DOM nodes with Fabric's layer tree. |
| **Phase 3** | **Rich-Text Formatting & Document Structure** | `#4, #13, #14, #27, #28` | Bullet lists, indent synchronization, editable header/footer, drag-and-drop page numbering, and color palettes. |
| **Phase 4** | **Table, Iframe & Interactive Manipulations** | `#8, #9, #10` | Dynamic resizing, rotation, and positioning handles for tables, rows/columns, and embedded iframes. |
| **Phase 5** | **AI, OCR, Math, Music & Assets Intelligence** | `#3, #7, #15, #16, #17, #18, #19, #20, #21, #22` | AI markdown/table formatting, MathJax expansion, interactive ABCjs music builder, OCR math detection, Web image search, Google Fonts search, AI charts, and Canva vector library. |
| **Phase 6** | **Preview, Print & Multi-Quality PDF Export** | `#24, #25, #26` | Multi-mode preview viewport, document-only printing CSS, and multi-tier quality settings for PDF generation. |

---

## Phase 1: Workspace Layout & Chrome UI

### 1. Change the position of Document Pages from Left Sidebar to bottom sticked (`#1`)
* **Current State:** Document pages (`pages` array from `useDocumentStore`) are rendered inside `LeftSidebar.tsx` under `activeTab === 'document'`.
* **Root Cause & Architectural Shift:** Having pages in the sidebar consumes horizontal screen real estate needed for tools and graphic assets. Moving it to a sticky bottom bar mirrors industry-standard document layouts (e.g., Google Docs / Canva slide strip).
* **Actionable Steps:**
  1. **Create `BottomPageStrip.tsx` (`src/ui/panels/BottomPageStrip.tsx`):**
     * Render a horizontal flex strip fixed to the bottom of the center workspace (`WorkspaceCanvas.tsx` container or `Editor.tsx`).
     * Display page thumbnail cards (or page badges `Page 1`, `Page 2` with orientation/size subtitle) using `flex overflow-x-auto gap-3 px-4 py-2 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md z-30`.
     * Include an `+ Add Page` button fixed at the right end of the strip.
  2. **Refactor `LeftSidebar.tsx`:** Remove the `activeTab === 'document'` drawer content and remove or repurpose the `document` (`Pages`) tab item from `TABS`.

### 2. On click on sidebar tab show/hide of panel (`#2`)
* **Current State:** Clicking a sidebar tab (`setActiveTab(tab.id)`) sets `activeTab` to `tab.id`. Clicking the already-active tab keeps the drawer open.
* **Root Cause:** `LeftSidebar.tsx` lacks toggle logic when `activeTab === tab.id`.
* **Actionable Steps:**
  1. **Update `LeftSidebar.tsx` Icon Click Handler:**
     ```tsx
     onClick={() => {
       if (activeTab === tab.id) {
         setActiveTab(null); // Close the drawer
       } else {
         setActiveTab(tab.id); // Open drawer for tab.id
       }
     }}
     ```
  2. **Drawer Conditional Rendering:** Wrap the expanded drawer container (`w-72 bg-slate-900...`) inside `{activeTab !== null && (<div className="w-72...">...</div>)}` so the drawer collapses cleanly to `0px` width when no tab is selected.

### 3. Option to show and hide the Document Inspector panel (`#23`)
* **Current State:** `RightSidebar.tsx` (`w-80 bg-slate-900 border-l...`) is permanently rendered in `Editor.tsx`.
* **Actionable Steps:**
  1. **Add State to `editorStore.ts`:** Add `showRightSidebar: boolean` (default `true`) and `toggleRightSidebar: () => void`.
  2. **Update `MainMenuBar.tsx`:** Add an Inspector toggle button (with a `Sliders` or `PanelRightClose` icon) on the right side of the top navbar.
  3. **Update `Editor.tsx`:** Conditionally render `RightSidebar` or apply `w-0 overflow-hidden opacity-0 pointer-events-none` transition class when `!showRightSidebar`.

---

## Phase 2: Hybrid Canvas & Layer Synchronization

### 4. In Hybrid Canvas mode, unable to edit/write text (`#5`)
* **Current State:** In `WorkspaceCanvas.tsx`, when `isCanvasMode === true`, the vector overlay `<div className="absolute inset-0 z-10 pointer-events-auto">` covers `DocumentPage` (`z-0`), intercepting all mouse clicks and keyboard focus.
* **Root Cause:** `pointer-events: auto` on the top Fabric canvas blocks pass-through clicks to the TipTap rich-text DOM underneath unless the user explicitly double-clicks or triggers tool pass-through.
* **Actionable Steps:**
  1. **Implement Intelligent Pointer Pass-Through in `WorkspaceCanvas.tsx` & `CanvasLayer.tsx`:**
     * When `isCanvasMode` is active but the user's active tool is `select` and no vector object is hit (or when double-clicking), programmatically forward the focus or set `pointer-events-none` on the transparent background of Fabric.js using `canvas.selection = false` or dynamically setting canvas wrapper CSS pointer-events based on active tool.
  2. **Unified Interaction Mode Switcher:** Provide a quick-toggle in the floating toolbar (`Alt+T` / `Alt+V`) or smart double-click bridge: double-clicking an empty space on the Fabric canvas focuses the TipTap editor at the nearest character coordinate (`editor.commands.focus(pos)`).

### 5. In Document Studio Mode, Unable to insert shape, image, math, notation (`#6`)
* **Current State:** When `isCanvasMode === false`, `LeftSidebar` shapes (`ShapeTools`), images (`ImageStudioTab`), and modal insertions check `engine` (Fabric.js), which is disabled or hidden.
* **Root Cause:** Insertion logic assumes Fabric vector canvas is the only target.
* **Actionable Steps:**
  1. **Dual-Target Insertion Bridge (`src/services/insertionBridge.ts`):**
     * Create a centralized insertion dispatcher `insertObject(type, payload, engine, editor, isCanvasMode)`.
     * **If `isCanvasMode === true`:** Insert as a Fabric.js `fabric.Rect`, `fabric.Image`, or `fabric.Group` on the vector canvas.
     * **If `isCanvasMode === false`:** Insert into TipTap using Node Views / Extensions (`editor.chain().focus().insertContent({ type: 'image', attrs: { src: payload.url } }).run()`, or custom `MathNodeView` / `ShapeNodeView`).

### 6. Inserted tables are not available in layers (`#11`) & Written Text also not available in layers (`#12`)
* **Current State:** `LayerPanel.tsx` loops through `engine.getObjects()` (`Fabric.js` objects only). TipTap DOM elements (like `<p>`, `<h1>`, `<table>`) exist in the underlying HTML tree (`DocumentPage.tsx`) and are invisible to `LayerPanel`.
* **Root Cause:** Lack of a unified Layer Tree interface that merges Document DOM blocks with Canvas Vector objects.
* **Actionable Steps:**
  1. **Create Unified Layer Tree Hook (`useUnifiedLayers.ts`):**
     * Query both `engine.getObjects()` (with types: `rect`, `circle`, `image`, `path`) AND `editor.state.doc.content` (extracting top-level blocks with unique IDs or node index: `Heading 1`, `Paragraph`, `Table (3x4)`, `Math Block`).
  2. **Refactor `LayerPanel.tsx`:**
     * Render two grouped sections or a unified timeline: **"Document Content Layers"** (TipTap nodes) and **"Canvas Overlay Layers"** (Fabric objects).
     * Clicking a TipTap layer item calls `editor.chain().focus().setNodeSelection(nodePos).run()` to highlight/scroll to the text block or table.
     * Clicking a Fabric layer item calls `engine.setActiveObject(obj); engine.renderAll();`.

---

## Phase 3: Rich-Text Formatting & Document Structure

### 7. The bullets are not working (`#4`)
* **Current State:** In `Toolbar.tsx`, clicking `list-ul` executes `editor.chain().focus().toggleBulletList().run()`. However, CSS styling or extension configuration inside `DocumentPage.tsx` (`StarterKit` / `BulletList`) may lack proper HTML markers or CSS reset override.
* **Root Cause:** Tailwind's `@tailwindcss/typography` or global `index.css` / `App.css` strips list style types (`list-style-type: none`) on `ul`/`ol` inside `.ProseMirror`.
* **Actionable Steps:**
  1. **Fix `DocumentPage.css` / `index.css`:**
     ```css
     .ProseMirror ul {
       list-style-type: disc !important;
       padding-left: 1.5rem !important;
       margin-top: 0.5rem !important;
       margin-bottom: 0.5rem !important;
     }
     .ProseMirror ol {
       list-style-type: decimal !important;
       padding-left: 1.5rem !important;
       margin-top: 0.5rem !important;
       margin-bottom: 0.5rem !important;
     }
     .ProseMirror li {
       display: list-item !important;
     }
     ```
  2. **Verify Extension Loading:** Ensure `StarterKit.configure({ bulletList: true, orderedList: true, listItem: true })` is active in `DocumentPage.tsx`.

### 8. While increasing index of a paragraph, bullets are also to be increased along with (`#27`)
* **Current State:** Increasing indentation (`sinkListItem` or custom indent command) either only indents `<p>` without nesting `<li>`, or breaks the bullet nesting hierarchy.
* **Actionable Steps:**
  1. **Bind Indent/Outdent to Smart List Handlers in `Toolbar.tsx`:**
     ```tsx
     const handleIndent = () => {
       if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
         editor.chain().focus().sinkListItem('listItem').run();
       } else {
         // Apply paragraph margin/indent attribute
         editor.chain().focus().setNodeAttribute('paragraph', 'indent', (currentIndent || 0) + 20).run();
       }
     };
     ```
  2. **Add Keymap Shortcuts:** Bind `Tab` to `sinkListItem('listItem')` and `Shift+Tab` to `liftListItem('listItem')` inside the TipTap configuration.

### 9. Make Header/Footer Editable as the body is (`#13`) & Drag-and-drop page number (`#14`)
* **Current State:** Header/footer (`updatePageSettings(activePageId, { header, footer })`) are static text strings rendered in `DocumentPage.tsx` margins without rich-text capabilities or draggable positioning.
* **Actionable Steps:**
  1. **Convert Header/Footer to Mini TipTap Editors or Fabric Objects (`src/features/document/HeaderFooterEditor.tsx`):**
     * Render a dedicated top margin zone (`height: 60px`) and bottom margin zone (`height: 60px`) inside each `DocumentPage`.
     * Allow users to double-click into header/footer zones to activate rich-text editing (bold, italic, font family).
  2. **Draggable Page Number Token (`#14`):**
     * Insert a special `{PAGE_NUMBER}` node token inside the header/footer container or as an absolute-positioned draggable widget.
     * Use simple drag boundaries (`onMouseDown` + `onMouseMove` relative to page dimensions) or store `pageNumberPosition: { x: number, y: number, align: 'left' | 'center' | 'right' }` in `pageSettings`, allowing full drag-and-drop relocation across the margins.

### 10. For Text Color and highlight color, also include recommended and frequently used colors (`#28`)
* **Current State:** Color pickers in `Toolbar.tsx` use a basic `<input type="color" />`.
* **Actionable Steps:**
  1. **Build `ColorPickerDropdown.tsx` (`src/ui/components/ColorPickerDropdown.tsx`):**
     * Include **Recommended / Brand Palette**: `#6366f1` (Indigo), `#ec4899` (Pink), `#10b981` (Emerald), `#f59e0b` (Amber), `#3b82f6` (Blue), `#ef4444` (Red), `#1e293b` (Dark Slate).
     * Include **Frequently / Recently Used Colors**: Persist the last 8 chosen color hex strings in `localStorage` (`editor_recent_colors`).
     * Include custom `<input type="color" />` at the bottom for arbitrary hex selection.

---

## Phase 4: Table, Iframe & Interactive Manipulations

### 11. Table's Dimension/Position/rotation (`#8`) & Table column/row dimensions dynamically adjustment (`#9`) — [COMPLETED - Verified]
* **Current State & Fix Applied:**
  * Created custom `TableComponent.tsx` (React NodeView) with **Interactive Mouse Drag Stretching Handles** (4 corners + right/bottom edges) and an **Interactive Rotation Twist Handle** (circular top anchor) allowing direct resizing and twisting by mouse.
  * Eliminated duplicated hover controls by keeping only one unified hover panel in `TableComponent.tsx` (with options for Drag Table, Align Left/Center/Right, Width Presets, Rotation +15°/Reset, + Row, + Col, Merge Cells, Split Cell, and Delete Table) and removing `TableHoverMenu` from `DocumentPage.tsx`.
  * Updated `LayerPanel.tsx` using `activeEditor.state.doc.descendants` and listening to `activeEditorChanged` so every table node is now listed, selectable, and scrollable in the "Document Layers" list (`#11`).
  * Created `updateTableAttributes` and `updateActiveCellAttributes` custom commands (`CustomTable.ts`) ensuring reliable attribute syncing (`width`, `height`, `rotation`, `alignment`, `backgroundColor`) across cells and table containers without fragmentation.

### 12. Inserted iframe position/dimensions adjustment dynamically not available (`#10`) — [COMPLETED - Verified]
* **Current State & Fix Applied:**
  * Implemented `IframeComponent.tsx` NodeView (`IframeExtension.ts`) with 4 corner drag-stretching handles, an alignment toolbar (`Embed: Align Left/Center/Right`), quick width presets (`Small/Medium/Large/Full`), and a `Drag Embed` drag-and-drop handle.
  * Added `handleDrop` directly to `DocumentPage.tsx`'s `editorProps` (`application/x-tiptap-node-drag`) so tables and iframes can be seamlessly relocated by dragging their grip handles and dropping anywhere on the page.

---

## Phase 5: AI, OCR, Math, Music & Assets Intelligence

### 13. Make the AI generated text inserted with formatting (`#3`)
* **Current State:** When OpenRouter AI (`PluginModals.tsx`) returns generated text, inserting it via `editor.commands.insertContent(response)` or `engine.add(...)` often inserts plain unparsed string or raw markdown syntax (`**bold**`, `| Col 1 | Col 2 |`).
* **Root Cause:** The insertion pipeline passes raw string directly without running a Markdown-to-HTML parser before feeding into TipTap.
* **Actionable Steps:**
  1. **Implement Markdown Parser Pipeline (`src/services/markdownToHtml.ts`):**
     * Use lightweight regex or `marked` / `showdown` to parse Markdown into valid HTML (`<table>`, `<strong>`, `<em>`, `<ul>`, `<li>`, `<h1>`-`<h6>`).
  2. **Update AI Insertion Handler (`PluginModals.tsx`):**
     ```tsx
     const handleInsertAiResult = (markdownText: string) => {
       const parsedHtml = parseMarkdownToHtml(markdownText);
       if (editor) {
         editor.chain().focus().insertContent(parsedHtml).run();
       } else if (engine) {
         // Convert HTML/text into formatted Fabric Textbox
         engine.addFormattedTextFromMarkdown(markdownText);
       }
     };
     ```

### 14. Notation and Math preview not available (`#7`) & Less Math symbols/options (`#15`)
* **Current State:** `PluginModals.tsx` has a basic `'mathjax'` modal that converts LaTeX (`x^2 + y^2 = z^2`) into SVG/Image, but lacks live real-time preview during typing and has limited symbol picker buttons.
* **Actionable Steps:**
  1. **Live Math Preview Panel inside Modal:**
     * In `PluginModals.tsx` (`activeModal === 'mathjax'`), split the view into two columns: Left textarea (`LaTeX Input`) and Right panel (`Real-Time Rendered Preview` via MathJax / KaTeX auto-rendering on `onChange`).
  2. **Comprehensive Symbol Palette Tabs (`#15`):**
     * Add categorised symbol buttons above the input textarea:
       * **Basic / Algebra:** `√x`, `x²`, `x_n`, `±`, `÷`, `×`, `≈`, `≠`
       * **Calculus & Operators:** `∫`, `∬`, `∮`, `∑`, `∏`, `lim`, `d/dx`, `∂`
       * **Trigonometry & Functions:** `sin(θ)`, `cos(θ)`, `tan(θ)`, `log_b(x)`, `ln(x)`
       * **Matrices & Brackets:** `\begin{pmatrix} a & b \\ c & d \end{pmatrix}`, `\cases{...}`, `[ ... ]`
       * **Greek Symbols:** `α`, `β`, `γ`, `δ`, `θ`, `λ`, `μ`, `π`, `σ`, `φ`, `ω`

### 15. Music Notation Builder: dynamic/manual with instrument audio playback (`#16`)
* **Current State:** `activeModal === 'abcjs'` renders static sheet music using ABC notation string without interactive visual playback instruments.
* **Actionable Steps:**
  1. **Enhance `AbcjsModal` (`src/ui/modals/PluginModals.tsx`):**
     * Integrate `abcjs.synth.getMidiFile` and `abcjs.renderSynth` / `abcjs.TimingCallbacks` to enable audio synth playback directly in the modal and when embedded in the document.
     * Add an **Instrument Selector Dropdown**: Acoustic Grand Piano, Violin, Flute, Acoustic Guitar, Trumpet, Sitar (`midiProgram` IDs).
     * Add **Play / Pause / Stop** controls with real-time note cursor highlighting (`abcjs` visual timing callbacks moving a red playhead bar across notes).

### 16. OCR insertion into Math/Notation block (`#17`)
* **Current State:** OCR (`PluginModals` -> `openrouter` vision OCR) dumps extracted text as standard paragraph text. If the document has equations, they get scrambled into plain text.
* **Actionable Steps:**
  1. **Enhance System Prompt for Vision Model (`OpenRouter OCR`):**
     ```text
     "Analyze the image and extract all text accurately. If you detect mathematical equations or musical ABC notations, wrap equations inside <mathjax>LATEX_HERE</mathjax> tags and sheet music inside <abcjs>ABC_HERE</abcjs> tags. Do not output raw unparsed formulas outside these tags."
     ```
  2. **Post-Processing Parser (`src/services/ocrProcessor.ts`):**
     * Parse the OCR response string: extract `<mathjax>...</mathjax>` blocks and automatically instantiate custom `MathNodeView` instances in TipTap; extract `<abcjs>...</abcjs>` blocks and instantiate `MusicNodeView` instances.

### 17. While object is selected and enhance instructions are passed to AI, show result (`#18`) & Chart Data + UI via AI (`#19`)
* **Actionable Steps:**
  1. **Selected Object AI Enhancement (`#18`):**
     * Add a floating **AI Enhance Button** (`Sparkles` icon) directly on the selection bounding box of any active Fabric object (`activeObject`) or TipTap text selection.
     * When clicked, open a prompt popover (`"Make this text more concise"`, `"Translate to Hindi"`, `"Change table theme to professional blue"`).
     * Show a **Diff / Preview Popover** (`[Accept Changes] | [Discard]`) before overwriting the selected object's content.
  2. **AI Chart Generation (`#19`):**
     * Add a **Chart Builder via AI** option in `PluginModals` or `LeftSidebar` (`Templates/Charts`).
     * User inputs prompt (`"Bar chart comparing quarterly revenue 2024 vs 2025"`). AI generates structured JSON (`{ type: 'bar', labels: [...], datasets: [...] }`).
     * Render dynamically using Chart.js or ECharts inside a custom `ChartNodeView` (Document Studio) or as a rendered high-res vector/canvas group (Canvas Mode).

### 18. Google Fonts search (`#20`) & Functional Web Stock Image Search (`#21`) & Canva Studio vectors (`#22`)
* **Actionable Steps:**
  1. **Google Fonts Search & Live Preview (`FontManagerPanel.tsx`):**
     * Add a search bar (`<input placeholder="Search 1,500+ Google Fonts..." />`) filtering a comprehensive curated list of Google Fonts (`Inter`, `Roboto`, `Montserrat`, `Playfair Display`, `Outfit`, `Poppins`, `Fira Code`, `Noto Sans Devanagari`, etc.).
     * On select, dynamically inject `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=FONT_NAME&display=swap" />` into document `<head>` and apply `fontFamily` style to active selection.
  2. **Web Stock Image Search Functional (`WebImageSearch.tsx`):**
     * Connect the search bar to Unsplash / Pexels / Pixabay public API endpoints (or a clean proxy/fallback mock image library with 100+ categorized high-res stock photos: Education, Music, Corporate, Science, Nature).
     * On click or drag-and-drop, invoke `insertionBridge.insertObject('image', { url: photo.urls.regular })`.
  3. **Expand & Fix Canva Studio Vector Elements (`CanvaStudioPanel.tsx`):**
     * Populate categories (**Badges, Arrows, Educational Icons, Musical Symbols, Speech Bubbles, Geometric Badges**) with valid, scalable SVG path data (`fabric.Path.fromSVGString`).
     * Ensure clicking any vector badge instantly adds it with `fill`, `stroke`, `scale`, and selectable bounding box onto the canvas.

---

## Phase 6: Preview, Print & Multi-Quality PDF Export

### 19. Add preview option for PDF mode, Document Mode, and Infinite Web Page mode (`#24`)
* **Current State:** The editor only shows the standard paginated container (`WorkspaceCanvas`).
* **Actionable Steps:**
  1. **Build `PreviewModal.tsx` (`src/ui/modals/PreviewModal.tsx`):**
     * Add a `Preview` button (`Eye` icon) in `MainMenuBar.tsx`.
     * **Mode Switcher Tabs inside Preview:**
       * **Document Mode:** Clean paginated view without gridlines, rulers, or selection borders.
       * **PDF Mode:** Accurate letter/A4 print-boundary simulator showing exact page break cuts and headers/footers.
       * **Infinite Web Page Mode:** Continuous vertical scroll (`height: auto`, `box-shadow: none`, no page breaks), rendering all pages seamlessly into one fluid web article.

### 20. Print document option printing entire webpage instead of document pages (`#25`)
* **Current State:** Pressing `window.print()` or clicking `Print` prints the entire browser window (`LeftSidebar`, `MainMenuBar`, `RightSidebar`, rulers, dark background).
* **Root Cause:** Lack of dedicated `@media print` CSS isolating the `.workspace-page` / `DocumentPage` DOM containers.
* **Actionable Steps:**
  1. **Add Dedicated Print Styles (`src/index.css` / `src/App.css`):**
     ```css
     @media print {
       /* Hide all UI Chrome, sidebars, rulers, and modals */
       header, nav, aside, .left-sidebar, .right-sidebar, .main-menu-bar, .ruler, .floating-menu, .context-menu {
         display: none !important;
       }
       
       /* Reset body and container styles for clean white sheet printing */
       body, html, #root, .editor-container, .workspace-canvas {
         background: #ffffff !important;
         color: #000000 !important;
         width: 100% !important;
         height: 100% !important;
         margin: 0 !important;
         padding: 0 !important;
         overflow: visible !important;
       }

       /* Ensure each DocumentPage takes exactly 1 physical page */
       .document-page-card {
         box-shadow: none !important;
         border: none !important;
         margin: 0 !important;
         page-break-after: always !important;
         break-after: page !important;
         width: 100% !important;
       }
     }
     ```

### 21. Multi-Quality PDF Export Options (`#26`)
* **Current State:** PDF export (`MainMenuBar.tsx` -> `html2pdf.js` or `jsPDF`) exports at a single default DPI/compression level.
* **Actionable Steps:**
  1. **Create `PdfExportDialog.tsx` (`src/ui/modals/PdfExportDialog.tsx`):**
     * Present options when user clicks `Export -> PDF`:
       * **Original Quality (Lossless / Print-Ready):** Scale factor `3.0` (`~300 DPI`), JPEG/PNG quality `1.0`, full vector embedding.
       * **High Quality (Recommended):** Scale factor `2.0` (`~200 DPI`), JPEG quality `0.90`.
       * **Standard Quality (Web & Email):** Scale factor `1.5` (`~150 DPI`), JPEG quality `0.75`.
       * **Compressed Quality (Fast Sharing):** Scale factor `1.0` (`~96 DPI`), JPEG quality `0.60`, aggressive downsampling for compact file size (< 1MB).
  2. **Connect to Exporter Service (`src/services/pdfService.ts`):**
     * Configure `html2canvas` options (`scale: selectedQuality.scale`, `useCORS: true`) and `jsPDF` compression options (`compress: true`) dynamically based on the chosen tier.

---

## Verification & Execution Matrix

| Checklist Item | Component/File | Status / Target |
| :--- | :--- | :--- |
| [x] Create `BottomPageStrip.tsx` & attach to bottom of `Editor.tsx` | `src/ui/panels/BottomPageStrip.tsx` | Phase 1 (Completed) |
| [x] Update `LeftSidebar.tsx` icon click toggle & collapse width to `0px` | `src/ui/panels/LeftSidebar.tsx` | Phase 1 (Completed) |
| [x] Add Inspector Panel toggle button to `MainMenuBar.tsx` & `showRightSidebar` state | `src/ui/toolbar/MainMenuBar.tsx` | Phase 1 (Completed) |
| [ ] Fix TipTap `pointer-events-auto` pass-through in `WorkspaceCanvas.tsx` | `src/features/workspace/WorkspaceCanvas.tsx` | Phase 2 |
| [ ] Create centralized `insertionBridge.ts` supporting dual TipTap + Fabric targets | `src/services/insertionBridge.ts` | Phase 2 |
| [ ] Build unified `useUnifiedLayers.ts` merging DOM headings/tables with Fabric objects | `src/features/canvas/LayerPanel.tsx` | Phase 2 |
| [ ] Add CSS overrides (`list-style-type: disc !important`) for TipTap bullets | `src/features/document/DocumentPage.css` | Phase 3 |
| [ ] Bind Tab/Shift+Tab & indent buttons to `sinkListItem`/`liftListItem` | `src/features/document/Toolbar.tsx` | Phase 3 |
| [ ] Convert Page Header/Footer to rich-text zones with `{PAGE_NUMBER}` drag token | `src/features/document/HeaderFooterEditor.tsx` | Phase 3 |
| [ ] Implement `ColorPickerDropdown.tsx` with Recommended & Recent palette memory | `src/ui/components/ColorPickerDropdown.tsx` | Phase 3 |
| [ ] Enable `@tiptap/extension-table` resize handles & rotation container | `src/features/document/DocumentPage.tsx` | Phase 4 |
| [ ] Build custom `IframeNodeView.tsx` with 4-corner drag resize & float toolbar | `src/features/document/nodeviews/IframeNodeView.tsx` | Phase 4 |
| [x] Integrate Markdown-to-HTML parser (`marked` / regex) into AI insertion flow | `src/services/markdownToHtml.ts` + `src/ui/modals/PluginModals.tsx` | Phase 5 (Completed) |
| [x] Expand MathJax symbol buttons (Algebra, Calculus, Greek, Matrices) & Live preview | `src/ui/modals/PluginModals.tsx` | Phase 5 (Completed) |
| [x] Integrate `abcjs.synth` MIDI audio player with instrument dropdown inside modal | `src/ui/modals/PluginModals.tsx` | Phase 5 (Completed) |
| [x] Add `<mathjax>` & `<abcjs>` tag extraction into OCR prompt & post-parser | `src/services/markdownToHtml.ts` (parseOcrOutput) | Phase 5 (Completed) |
| [x] AI Chart Builder via OpenRouter (bar/line/pie JSON → chart node) | `src/ui/modals/PluginModals.tsx` (chart modal) | Phase 5 (Completed) |
| [x] Add Google Fonts live search injection & Web Stock Photo query endpoints | `src/ui/panels/FontManagerPanel.tsx` + `WebImageSearch.tsx` | Phase 5 (Completed) |
| [x] Populate `CanvaStudioPanel.tsx` with scalable vector SVG badges & icons | `src/ui/panels/CanvaStudioPanel.tsx` | Phase 5 (Completed) |
| [ ] Build `PreviewModal.tsx` with Document, PDF, and Infinite Web Page tabs | `src/ui/modals/PreviewModal.tsx` | Phase 6 |
| [ ] Inject `@media print` CSS isolating `.document-page-card` and hiding UI | `src/index.css` | Phase 6 |
| [ ] Create `PdfExportDialog.tsx` supporting Original, High, Standard, and Compressed tiers | `src/ui/modals/PdfExportDialog.tsx` | Phase 6 |

---
*Generated by Antigravity AI for Sarkari Musician Core Editor Engine.*
