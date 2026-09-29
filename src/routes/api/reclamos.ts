import { createFileRoute } from "@tanstack/react-router";
import { isAdmin } from "@/lib/admin";
import { officialClubById, officialClubByTitle } from "@/lib/clubPlans";
import { isManagerRole } from "@/lib/managerRole";
import { listClaims, recordsReady, saveClaim, type StoredClaim } from "@/server/proRecords";
import { userFromRequest } from "@/server/sessionUser";
import { assignManager, stampManagerOnAccount } from "@/server/venueManagers";

function textField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export const Route = createFileRoute("/api/reclamos")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user || !isAdmin(user.email)) {
          return Response.json({ error: "Solo el equipo de NightMap puede ver las solicitudes." }, { status: 403 });
        }
        return Response.json({ reclamos: await listClaims() });
      },
      POST: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user) return Response.json({ error: "Inicia sesión para reclamar la sala." }, { status: 401 });
        if (!recordsReady()) {
          return Response.json({ error: "Falta NIGHTMAP_LINK_SECRET en el servidor." }, { status: 503 });
        }

        const body: unknown = await request.json().catch(() => null);
        if (!body || typeof body !== "object") return Response.json({ error: "Faltan los datos de la sala." }, { status: 400 });
        const record = body as Record<string, unknown>;
        const status = textField(record, "status");
        if (status === "approved" || status === "rejected") {
          if (!isAdmin(user.email)) return Response.json({ error: "Solo el equipo de NightMap puede resolver solicitudes." }, { status: 403 });
          return decideClaim(textField(record, "id"), status);
        }

        const role = textField(record, "role");
        const clubTitle = textField(record, "clubTitle");
        const proofUrl = textField(record, "proofUrl");
        if (!clubTitle || !proofUrl || !isManagerRole(role)) {
          return Response.json({ error: "Indica un cargo de gerente o responsable y un enlace de comprobación." }, { status: 400 });
        }
        const requestedId = textField(record, "discotecaId");
        const byId = requestedId ? officialClubById(requestedId) : null;
        const byTitle = officialClubByTitle(clubTitle, textField(record, "city"));
        if (byId && byTitle && byId.id !== byTitle.id) {
          return Response.json({ error: "La sala no coincide con el catálogo." }, { status: 400 });
        }
        const claim: StoredClaim = {
          id: crypto.randomUUID(),
          email: user.email,
          name: textField(record, "name"),
          role,
          clubTitle,
          city: textField(record, "city"),
          placeId: textField(record, "placeId"),
          discotecaId: (byTitle ?? byId)?.id ?? "",
          proofUrl,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        const saved = await saveClaim(claim);
        if (!saved) return Response.json({ error: "No se ha guardado la solicitud." }, { status: 503 });
        return Response.json({ id: claim.id, discotecaId: claim.discotecaId });
      },
    },
  },
});

async function decideClaim(id: string, status: "approved" | "rejected"): Promise<Response> {
  const claim = (await listClaims()).find((item) => item.id === id);
  if (!claim) return Response.json({ error: "No está esa solicitud." }, { status: 404 });
  if (status === "rejected") {
    const saved = await saveClaim({ ...claim, status });
    if (!saved) return Response.json({ error: "No se ha guardado la decisión." }, { status: 503 });
    return Response.json({ id, status });
  }
  if (!isManagerRole(claim.role)) {
    return Response.json({ error: "El cargo tiene que ser gerente o responsable para vincular la sala." }, { status: 400 });
  }
  const club = (claim.discotecaId ? officialClubById(claim.discotecaId) : null) ?? officialClubByTitle(claim.clubTitle, claim.city);
  if (!club) {
    return Response.json({ error: "Esa sala no está en la base de NightMap Pro." }, { status: 404 });
  }
  const linked = await assignManager({ email: claim.email, discotecaId: club.id, role: claim.role });
  if (!linked) return Response.json({ error: "No se ha podido vincular la cuenta con la sala." }, { status: 503 });
  await stampManagerOnAccount(linked);
  const saved = await saveClaim({ ...claim, status: "approved", discotecaId: club.id });
  if (!saved) return Response.json({ error: "La sala quedó vinculada, pero no se ha actualizado la solicitud." }, { status: 500 });
  return Response.json({ id, status, discotecaId: club.id, email: claim.email });
}
