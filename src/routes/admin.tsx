import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { isAdmin } from "@/lib/admin";
import { useSession } from "@/lib/useSession";
interface StoredClaim {
  id: string;
  email: string;
  name: string;
  role: string;
  clubTitle: string;
  city: string;
  placeId: string;
  discotecaId: string;
  proofUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Solicitudes — NightMap" }],
  }),
  component: AdminClaims,
});

const STATUS_LABEL: Record<StoredClaim["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

function AdminClaims() {
  const { session, ready } = useSession();
  const [claims, setClaims] = useState<StoredClaim[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    fetch("/api/reclamos", { headers: { authorization: `Bearer ${session.access_token}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!active || !body || typeof body !== "object" || !("reclamos" in body) || !Array.isArray(body.reclamos)) return;
        setClaims(body.reclamos.filter((row): row is StoredClaim => !!row && typeof row === "object" && "id" in row));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [session?.access_token, notice]);

  if (!ready) {
    return <div className="login-screen" aria-busy="true" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (!isAdmin(session.user.email)) {
    return <Navigate to="/" />;
  }

  const decide = async (claim: StoredClaim, status: "approved" | "rejected") => {
    setNotice("");
    const response = await fetch("/api/reclamos", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ id: claim.id, status }),
    });
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "";
    if (!response.ok) {
      setNotice(message || "No se ha podido resolver la solicitud.");
      return;
    }
    setNotice(status === "approved" ? `${claim.clubTitle} queda vinculada a ${claim.email}.` : "Solicitud rechazada.");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Administración
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold">Solicitudes de verificación</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Volver al mapa
          </Link>
        </div>
        {notice && <p className="mt-4 text-sm text-[#FFD700]">{notice}</p>}

        {claims.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Todavía no hay solicitudes.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {claims.map((claim) => (
              <li key={claim.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">{claim.clubTitle}</h2>
                    {claim.city && <p className="text-sm text-muted-foreground">{claim.city}</p>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      claim.status === "pending"
                        ? "bg-gold/15 text-gold"
                        : claim.status === "approved"
                          ? "bg-neon-cyan/15 text-neon-cyan"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[claim.status]}
                  </span>
                </div>
                <dl className="mt-3 grid gap-1 text-sm">
                  <div>
                    <dt className="inline text-muted-foreground">Nombre: </dt>
                    <dd className="inline">{claim.name}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Cargo: </dt>
                    <dd className="inline">{claim.role}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Email: </dt>
                    <dd className="inline">{claim.email}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Comprobación: </dt>
                    <dd className="inline">
                      <a
                        href={claim.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-cyan underline-offset-2 hover:underline"
                      >
                        {claim.proofUrl}
                      </a>
                    </dd>
                  </div>
                </dl>
                {claim.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(claim, "approved")}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(claim, "rejected")}
                      className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
