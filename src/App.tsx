import React from 'react';
import Editor from './pages/Editor';
import './App.css';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col font-sans"
         style={{ background: 'var(--ee-bg)', color: 'var(--ee-text-primary)' }}>
      <Editor />
    </div>
  );
}
