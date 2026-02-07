/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_EMAIL_PROVIDER: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_SENDGRID_API_KEY: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_FROM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
