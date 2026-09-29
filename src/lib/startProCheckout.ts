export async function startProCheckout(accessToken: string): Promise<string> {
  const response = await fetch("/api/suscripcion/checkout", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body: unknown = await response.json().catch(() => null);
  const url = body && typeof body === "object" && "url" in body && typeof body.url === "string" ? body.url : "";
  const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "";
  if (!response.ok || !url) throw new Error(message || "No se ha podido empezar el pago.");
  return url;
}
