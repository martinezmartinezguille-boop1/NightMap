import { useState, type FormEvent } from "react";
import type { Place } from "../../types/place";
import { matchOfficialClub } from "@/lib/clubPlans";
import { isManagerRole } from "@/lib/managerRole";
import { useSession } from "@/lib/useSession";
import { submitClaim } from "@/lib/venueClaims";

interface ClaimVenueFormProps {
  club: Place;
}

function proofHref(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ClaimVenueForm({ club }: ClaimVenueFormProps) {
  const { session } = useSession();
  const accountEmail = session?.user.email?.trim().toLowerCase() ?? "";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [proof, setProof] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.access_token || !accountEmail) {
      setError("Inicia sesión con el correo de la sala antes de reclamarla.");
      return;
    }
    if (!isManagerRole(role)) {
      setError("El cargo tiene que ser gerente o responsable.");
      return;
    }
    const href = proofHref(proof);
    try {
      const url = new URL(href);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        setError("El enlace tiene que empezar por http o https.");
        return;
      }
    } catch {
      setError("Ese enlace no es válido. Prueba con la web o el Instagram del local.");
      return;
    }

    const official = matchOfficialClub(club);
    const response = await fetch("/api/reclamos", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        placeId: club.placeId,
        clubTitle: club.title,
        city: club.city ?? "",
        name: name.trim(),
        role: role.trim(),
        proofUrl: href,
        discotecaId: official?.id ?? "",
      }),
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "";
      setError(message || "No se ha enviado la solicitud.");
      return;
    }
    submitClaim({
      placeId: club.placeId,
      clubTitle: club.title,
      city: club.city ?? "",
      name: name.trim(),
      role: role.trim(),
      email: accountEmail,
      proofUrl: href,
    });
    setError(null);
    setSent(true);
  };

  if (sent) {
    return (
      <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-foreground">
        Hemos recibido tu solicitud. El equipo revisará la identidad antes de autorizar el local.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border bg-secondary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
      >
        Reclama este local
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-secondary/60 p-4">
      <div>
        <h3 className="font-display text-sm font-bold text-foreground">Reclama este local</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          El correo de la solicitud es el de tu cuenta. El cargo tiene que ser gerente o responsable.
        </p>
      </div>
      <label className="block text-xs font-semibold text-muted-foreground">
        Nombre
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full select-text rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Cargo
        <input
          required
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Gerente o responsable"
          className="mt-1 w-full select-text rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Email de contacto
        <input
          required
          type="email"
          readOnly
          value={accountEmail}
          className="mt-1 w-full select-text rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Enlace de comprobación
        <input
          required
          type="text"
          inputMode="url"
          value={proof}
          onChange={(event) => setProof(event.target.value)}
          placeholder="instagram.com/tulocal o web oficial"
          className="mt-1 w-full select-text rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Enviar solicitud
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
