import { createClient } from "@supabase/supabase-js";

export interface SessionUser {
  id: string;
  email: string;
  appMetadata: Record<string, unknown>;
}

function envValue(name: string): string {
  const fromProcess = process.env[name];
  if (typeof fromProcess === "string" && fromProcess) return fromProcess;
  const vite = import.meta.env as unknown as Record<string, string | boolean | undefined>;
  const fromVite = vite[name];
  return typeof fromVite === "string" ? fromVite : "";
}

export async function userFromRequest(request: Request): Promise<SessionUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token || token.split(".").length !== 3) return null;

  const url = envValue("SUPABASE_URL") || envValue("VITE_SUPABASE_URL");
  const key =
    envValue("SUPABASE_PUBLISHABLE_KEY") ||
    envValue("SUPABASE_ANON_KEY") ||
    envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    envValue("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase() ?? "";
  if (error || !data.user || !email) return null;
  const metadata = data.user.app_metadata;
  return {
    id: data.user.id,
    email,
    appMetadata: metadata && typeof metadata === "object" ? metadata : {},
  };
}
