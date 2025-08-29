/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_STYLE_URL: string
  readonly VITE_MAP_TOKEN: string
  readonly VITE_API_BASE_URL: string
  readonly SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
