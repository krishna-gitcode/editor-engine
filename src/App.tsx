import React from 'react';
import Editor from './pages/Editor';
import './App.css';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      <Editor />
    </div>
  );
}
