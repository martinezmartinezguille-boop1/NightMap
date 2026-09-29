const DEFAULT_SITE = "https://nightmap.es";

function readEnv(name: string): string {
  const fromProcess = process.env[name];
  if (typeof fromProcess === "string" && fromProcess.trim()) return fromProcess.trim();
  const vite = import.meta.env as unknown as Record<string, string | boolean | undefined> | undefined;
  const fromVite = vite?.[name];
  return typeof fromVite === "string" ? fromVite.trim() : "";
}

function configuredSite(): string {
  return readEnv("NEXT_PUBLIC_SITE_URL") || readEnv("VITE_SITE_URL") || readEnv("SITE_URL");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function siteOrigin(): string {
  const configured = configuredSite().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") {
    try {
      const url = new URL(window.location.origin);
      if (isLocalHost(url.hostname)) return url.origin;
    } catch {
      return DEFAULT_SITE;
    }
  }
  return DEFAULT_SITE;
}

export function siteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalized}`;
}

export function leaveVercelHost(): void {
  if (typeof window === "undefined") return;
  if (!window.location.hostname.endsWith(".vercel.app")) return;
  const next = new URL(`${window.location.pathname}${window.location.search}${window.location.hash}`, siteOrigin());
  window.location.replace(next.toString());
}
