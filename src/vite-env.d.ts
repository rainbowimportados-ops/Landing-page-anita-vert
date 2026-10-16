/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GA4_ID?: string
  readonly VITE_GADS_ID?: string
  readonly VITE_GADS_LABEL_LEAD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
