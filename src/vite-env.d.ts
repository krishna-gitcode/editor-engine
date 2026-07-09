/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_OPENROUTER_DEFAULT_MODEL?: string;
  readonly VITE_OPENROUTER_DEFAULT_VISION_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
