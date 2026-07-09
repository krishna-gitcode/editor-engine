import React, { useEffect, useRef } from 'react';
import { EditorSDK } from './EditorSDK';
import type { EditorInitOptions } from './types';

interface EditorEmbedProps extends Omit<EditorInitOptions, 'container'> {
  editorUrl?: string;
  className?: string;
}

export const EditorEmbed: React.FC<EditorEmbedProps> = ({
  editorUrl = 'http://localhost:5173',
  className = 'w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-800',
  ...initOptions
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<EditorSDK | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      sdkRef.current = new EditorSDK({
        ...initOptions,
        container: containerRef.current,
      });
      sdkRef.current.mount(editorUrl);
    }
    return () => {
      sdkRef.current?.destroy();
    };
  }, [editorUrl]);

  return <div ref={containerRef} className={className} />;
};
