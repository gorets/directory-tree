/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NANGO_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
