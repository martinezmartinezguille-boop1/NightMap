import { createFileRoute } from "@tanstack/react-router";
import { isAdmin } from "@/lib/admin";
import { officialClubById } from "@/lib/clubPlans";
import { isManagerRole } from "@/lib/managerRole";
import { userFromRequest } from "@/server/sessionUser";
import { assignManager, stampManagerOnAccount } from "@/server/venueManagers";

export const Route = createFileRoute("/api/gerentes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user || !isAdmin(user.email)) {
          return Response.json({ error: "Solo el equipo de NightMap puede vincular una sala." }, { status: 403 });
        }

        const body: unknown = await request.json().catch(() => null);
        const email = body && typeof body === "object" && "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const discotecaId =
          body && typeof body === "object" && "discotecaId" in body && typeof body.discotecaId === "string" ? body.discotecaId : "";
        const role = body && typeof body === "object" && "role" in body && typeof body.role === "string" ? body.role : "";
        if (!email.includes("@") || !discotecaId || !isManagerRole(role)) {
          return Response.json({ error: "Faltan el correo, la sala o un cargo de gerente." }, { status: 400 });
        }
        const club = officialClubById(discotecaId);
        if (!club) return Response.json({ error: "Esa sala no está en la base oficial." }, { status: 404 });

        const saved = await assignManager({ email, discotecaId: club.id, role });
        if (!saved) {
          return Response.json({ error: "No se ha podido guardar el vínculo en la base de datos." }, { status: 503 });
        }
        await stampManagerOnAccount(saved);
        return Response.json({ email: saved.email, discotecaId: saved.discotecaId });
      },
    },
  },
});
