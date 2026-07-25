import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, List, ChevronRight, Loader2, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';

interface OutlineItem {
    id: string;
    level: number;
    text: string;
    pos: number; // -1 for AI-generated items
}

interface AIOutlinePanelProps {
    editor?: any;
}

function extractHeadingsFromEditor(editor: any): OutlineItem[] {
    if (!editor) return [];
    const items: OutlineItem[] = [];
    let counter = 0;
    editor.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
            items.push({ id: `h-${counter++}`, level: node.attrs.level ?? 1, text: node.textContent || `Untitled Heading ${counter}`, pos });
        }
    });
    return items;
}

const LEVEL_STYLES: Record<number, { size: string; weight: string; opacity: string }> = {
    1: { size: 'text-[13px]', weight: 'font-semibold', opacity: 'opacity-100' },
    2: { size: 'text-[12px]', weight: 'font-medium', opacity: 'opacity-90' },
    3: { size: 'text-[11px]', weight: 'font-normal', opacity: 'opacity-80' },
    4: { size: 'text-[11px]', weight: 'font-normal', opacity: 'opacity-70' },
    5: { size: 'text-[10px]', weight: 'font-normal', opacity: 'opacity-60' },
    6: { size: 'text-[10px]', weight: 'font-normal', opacity: 'opacity-50' },
};

async function generateAIOutline(topic: string, signal: AbortSignal, onChunk: (text: string) => void): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const systemPrompt = `You are an expert document architect. Output a hierarchical outline using markdown heading syntax (# H1, ## H2, ### H3). Output ONLY heading lines, no other text.`;
    const userPrompt = `Generate a comprehensive document outline for: "${topic}"`;

    if (!apiKey) {
        const mock = [`# ${topic}`, `## Introduction`, `### Background & Context`, `### Scope and Objectives`, `## Core Concepts`, `### Key Definitions`, `## Detailed Analysis`, `### Section One`, `### Section Two`, `## Implementation Guide`, `### Step-by-Step Process`, `### Best Practices`, `## Conclusion`, `### Summary`, `### Next Steps`];
        for (const line of mock) {
            if (signal.aborted) return;
            await new Promise((r) => setTimeout(r, 60));
            onChunk(line + '\n');
        }
        return;
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': window.location.origin, 'X-Title': 'Editor Engine AI Outline' },
        body: JSON.stringify({ model: 'openrouter/free', stream: true, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }),
    });
    if (!res.ok || !res.body) throw new Error(`API error ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
        const { done, value } = await reader.read();
        if (done || signal.aborted) break;
        for (const line of decoder.decode(value).split('\n').filter((l) => l.startsWith('data: '))) {
            const json = line.replace('data: ', '').trim();
            if (json === '[DONE]') return;
            try { const delta = JSON.parse(json)?.choices?.[0]?.delta?.content; if (delta) onChunk(delta); } catch { }
        }
    }
}

function parseMarkdownOutline(raw: string): OutlineItem[] {
    return raw.split('\n').reduce<OutlineItem[]>((acc, line, i) => {
        const m = line.match(/^(#{1,6})\s+(.+)/);
        if (m) acc.push({ id: `ai-${i}`, level: m[1].length, text: m[2].trim(), pos: -1 });
        return acc;
    }, []);
}

function insertOutlineIntoEditor(editor: any, items: OutlineItem[]) {
    if (!editor) return;
    editor.chain().focus().clearContent().insertContent(items.map((i) => ({ type: 'heading', attrs: { level: i.level }, content: [{ type: 'text', text: i.text }] }))).run();
}

export const AIOutlinePanel: React.FC<AIOutlinePanelProps> = ({ editor }) => {
    const [liveItems, setLiveItems] = useState<OutlineItem[]>([]);
    const [aiItems, setAiItems] = useState<OutlineItem[]>([]);
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeView, setActiveView] = useState<'live' | 'ai'>('live');
    const abortRef = React.useRef<AbortController | null>(null);

    const refreshLive = useCallback(() => setLiveItems(extractHeadingsFromEditor(editor)), [editor]);
    useEffect(() => {
        refreshLive();
        if (!editor) return;
        editor.on('update', refreshLive);
        return () => editor.off('update', refreshLive);
    }, [editor, refreshLive]);

    const scrollToHeading = (item: OutlineItem) => {
        if (!editor || item.pos < 0) return;
        editor.chain().focus().setTextSelection(item.pos + 1).run();
        (editor.view.domAtPos(item.pos + 1)?.node as HTMLElement | null)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true); setError(null); setAiItems([]); setActiveView('ai');
        let acc = '';
        try {
            await generateAIOutline(topic, controller.signal, (chunk) => { acc += chunk; setAiItems(parseMarkdownOutline(acc)); });
        } catch (e: any) {
            if (e?.name !== 'AbortError') setError(e?.message || 'Generation failed');
        } finally { setLoading(false); }
    };

    const handleCopy = () => {
        const text = (activeView === 'ai' ? aiItems : liveItems).map((i) => `${'#'.repeat(i.level)} ${i.text}`).join('\n');
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    };

    const displayItems = activeView === 'ai' ? aiItems : liveItems;

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--ee-text-primary)', background: 'var(--ee-surface-1)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--ee-border)' }}>
                <div className="flex items-center gap-2">
                    <List className="w-4 h-4" style={{ color: 'var(--ee-text-muted)' }} />
                    <span className="text-[13px] font-semibold">Document Outline</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleCopy} title="Copy as Markdown" className="p-1.5 rounded" style={{ color: 'var(--ee-text-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ee-surface-3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={refreshLive} title="Refresh" className="p-1.5 rounded" style={{ color: 'var(--ee-text-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ee-surface-3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex gap-1 px-3 pt-2.5 pb-1.5 flex-shrink-0 border-b" style={{ borderColor: 'var(--ee-border)' }}>
                {(['live', 'ai'] as const).map((v) => (
                    <button key={v} onClick={() => setActiveView(v)} className="flex-1 py-1 rounded text-[11px] font-medium transition-colors"
                        style={{ background: activeView === v ? 'var(--ee-accent)' : 'var(--ee-surface-2)', color: activeView === v ? '#fff' : 'var(--ee-text-muted)' }}>
                        {v === 'live' ? '📄 Live' : '✨ AI Generate'}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {activeView === 'ai' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex-shrink-0 overflow-hidden">
                        <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2">
                            <textarea rows={2} placeholder="Enter document topic or title…" value={topic} onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
                                className="w-full text-xs rounded px-2.5 py-2 resize-none border outline-none"
                                style={{ background: 'var(--ee-surface-2)', borderColor: 'var(--ee-border)', color: 'var(--ee-text-primary)' }} />
                            <div className="flex gap-2">
                                <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold disabled:opacity-40"
                                    style={{ background: 'var(--ee-accent)', color: '#fff' }}>
                                    {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</> : <><Sparkles className="w-3 h-3" /> Generate (Ctrl+Enter)</>}
                                </button>
                                {aiItems.length > 0 && !loading && (
                                    <button onClick={() => { insertOutlineIntoEditor(editor, aiItems); setActiveView('live'); }}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border"
                                        style={{ borderColor: 'var(--ee-border)', color: 'var(--ee-text-primary)', background: 'var(--ee-surface-2)' }}>
                                        Insert
                                    </button>
                                )}
                            </div>
                            {error && (
                                <div className="flex items-center gap-1.5 text-[11px] rounded px-2.5 py-1.5" style={{ background: 'color-mix(in oklch, #f87171 12%, transparent)', color: '#f87171' }}>
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-2 py-2">
                {displayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
                        <List className="w-8 h-8" style={{ color: 'var(--ee-text-faint)' }} />
                        <p className="text-[11px] text-center max-w-[180px]" style={{ color: 'var(--ee-text-muted)' }}>
                            {activeView === 'live' ? 'No headings found. Add H1–H6 headings to your document.' : 'Enter a topic above and click Generate.'}
                        </p>
                    </div>
                ) : (
                    <motion.ul variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025 } } }} initial="hidden" animate="show" className="flex flex-col gap-0.5">
                        {displayItems.map((item) => {
                            const s = LEVEL_STYLES[item.level] ?? LEVEL_STYLES[6];
                            return (
                                <motion.li key={item.id} variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.18 } } }}>
                                    <button onClick={() => scrollToHeading(item)}
                                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded transition-colors group ${s.size} ${s.weight} ${s.opacity}`}
                                        style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ee-surface-2)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                        <ChevronRight className={`flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${item.level === 1 ? 'w-3.5 h-3.5' : 'w-3 h-3'}`} />
                                        <span className="truncate leading-snug">{item.text}</span>
                                        {item.level === 1 && <span className="ml-auto flex-shrink-0 text-[9px] px-1 rounded" style={{ background: 'var(--ee-surface-3)', color: 'var(--ee-text-muted)' }}>H1</span>}
                                    </button>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                )}
            </div>

            {displayItems.length > 0 && (
                <div className="flex-shrink-0 px-4 py-2 border-t text-[10px]" style={{ borderColor: 'var(--ee-border)', color: 'var(--ee-text-faint)' }}>
                    {displayItems.length} heading{displayItems.length !== 1 ? 's' : ''}{activeView === 'ai' && loading && ' · streaming…'}
                </div>
            )}
        </div>
    );
};