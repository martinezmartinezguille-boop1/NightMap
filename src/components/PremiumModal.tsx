import { X, Crown, Zap, Percent, Bell, Ticket } from "lucide-react";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

const BENEFITS = [
  { icon: Ticket, title: "Entradas anticipadas", text: "Acceso a preventas 48h antes que nadie." },
  { icon: Percent, title: "Hasta -30% en entradas", text: "Descuentos exclusivos en todos los clubs." },
  { icon: Zap, title: "Acceso sin colas", text: "Entra por la puerta VIP en clubs seleccionados." },
  { icon: Bell, title: "Alertas secretas", text: "Avisos de fiestas privadas y guest lists." },
];

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-fade-up overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-[0_0_60px_color-mix(in_oklab,var(--gold)_25%,transparent)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-gold/20 via-card to-primary/20 p-6 pb-8">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full bg-background/60 p-1.5 text-foreground hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="h-7 w-7 text-gold" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">
              NightMap VIP
            </span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
            Vive la noche <span className="text-gold">sin límites</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            La membresía premium para los que nunca se pierden una fiesta.
          </p>
        </div>

        <div className="space-y-3 p-6">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
              <div className="rounded-md bg-gold/15 p-2">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}

          <button className="mt-2 w-full rounded-xl bg-gradient-to-r from-gold to-primary px-4 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:scale-[1.02]">
            Suscribirme · 9,99€/mes
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Cancela cuando quieras. Primer mes con 50% de descuento.
          </p>
        </div>
      </div>
    </div>
  );
}
