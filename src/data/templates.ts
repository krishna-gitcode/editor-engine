export const TEMPLATES = [
  {
    name: 'Corporate Invoice Template',
    desc: 'Pre-formatted invoice table with theme',
    html: `<h1 style="color: #6366f1;">INVOICE #2026-001</h1><p><strong>Date:</strong> July 10, 2026<br/><strong>Client:</strong> Sarkari Musician App</p><table data-theme="modern-dark"><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody><tr><td>Core Plugin Architecture & UI</td><td>1</td><td>$1,200.00</td><td>$1,200.00</td></tr><tr><td>Image Studio & Canvas Hybrid Engine</td><td>1</td><td>$850.00</td><td>$850.00</td></tr></tbody></table><p style="text-align: right;"><strong>Total Amount Due: $2,050.00</strong></p>`,
    header: 'INVOICE STATEMENT',
    footer: 'Thank you for your business!',
  },
  {
    name: 'Academic Resume / CV',
    desc: 'Multi-column clean minimal layout',
    html: `<h1>Krishna Kumar</h1><p>Senior Full-Stack & AI Systems Architect • New Delhi / Remote • krish@example.com</p><hr/><h2>Professional Summary</h2><p>Experienced software engineer specializing in high-performance hybrid document engines, real-time vector graphics (Fabric.js), and rich-text editing (TipTap).</p><h2>Technical Skills</h2><ul><li><strong>Frontend:</strong> React 19, TypeScript, Vite 6, Tailwind CSS</li><li><strong>Engines:</strong> TipTap (ProseMirror), Fabric.js, MathJax, ABCjs</li></ul>`,
    header: 'Curriculum Vitae',
    footer: 'References available upon request',
  },
  {
    name: 'Sarkari Mock Test Paper',
    desc: '2-column question layout with headers',
    html: `<h2 style="text-align: center;">SARKARI MUSICIAN - GENERAL STUDIES MOCK TEST #4</h2><p style="text-align: center;"><em>Time Allowed: 60 Minutes | Max Marks: 100 | Negative Marking: -0.25</em></p><hr/><p><strong>Q1. Which of the following constitutional amendments is known as the 'Mini-Constitution' of India?</strong></p><ul><li>(A) 42nd Amendment Act, 1976</li><li>(B) 44th Amendment Act, 1978</li><li>(C) 73rd Amendment Act, 1992</li><li>(D) 86th Amendment Act, 2002</li></ul><p><strong>Q2. Identify the correct time signature for the standard Indian classical notation rhythm 'Teental':</strong></p><p><em>[Insert ABCjs Sheet Music from Plugins Tab above for audio verification]</em></p>`,
    header: 'Sarkari Musician Mock Examination',
    footer: 'All rights reserved • Sarkari Musician Core',
  },
  {
    name: 'Modern Certificate of Merit',
    desc: 'Landscape A4 vector badge layout',
    html: `<div style="text-align: center; padding: 40px;"><h1 style="font-size: 36px; color: #6366f1; margin-bottom: 10px;">CERTIFICATE OF EXCELLENCE</h1><p style="font-size: 18px; color: #64748b;">This certificate is proudly presented to</p><h2 style="font-size: 30px; margin: 20px 0; border-bottom: 2px solid #cbd5e1; display: inline-block; padding-bottom: 5px;">Outstanding Contributor</h2><p style="font-size: 16px; max-width: 600px; margin: 0 auto;">In recognition of exceptional dedication, architectural mastery, and successful restoration of the Editor Engine vector and document hybrid system.</p></div>`,
    header: '',
    footer: 'Issued July 2026',
    orientation: 'landscape' as const,
  },
];
