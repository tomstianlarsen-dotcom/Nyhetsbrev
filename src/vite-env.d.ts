/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_GITHUB_TOKEN?: string;
  readonly VITE_GITHUB_OWNER?: string;
  readonly VITE_GITHUB_REPO?: string;
  readonly VITE_GITHUB_IMAGES_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

