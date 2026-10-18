/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_CAMPUS_DOMAIN?: string;
  readonly VITE_UNIVERSITY_DOMAIN?: string;
  readonly VITE_DEFAULT_CAMPUS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
