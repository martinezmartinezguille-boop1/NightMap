import { type FormEvent, useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/siteUrl";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

function authError(message: string, mode: AuthMode): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (text.includes("email not confirmed")) return "Confirma el correo antes de entrar.";
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "Ya hay una cuenta con ese correo. Inicia sesión.";
  }
  if (text.includes("password") && (text.includes("6") || text.includes("least") || text.includes("short"))) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
    return "El acceso con Google no está activado en el proyecto.";
  }
  if (text.includes("invalid") && text.includes("email")) return "Ese correo no es válido.";
  return mode === "signup"
    ? "No se ha podido crear la cuenta. Inténtalo de nuevo."
    : "No se ha podido iniciar sesión. Inténtalo de nuevo.";
}

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "email" | null>(null);
  const isSignup = mode === "signup";

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const fail = (authErrorValue: AuthError) => {
    setNotice(null);
    setError(authError(authErrorValue.message, mode));
    setPending(null);
  };

  const signInWithGoogle = async () => {
    setError(null);
    setNotice(null);
    setPending("google");
    const { error: authErrorValue } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: siteUrl("/") },
    });
    if (authErrorValue) fail(authErrorValue);
  };

  const signInWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending("email");
    const { error: authErrorValue } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authErrorValue) fail(authErrorValue);
  };

  const signUpWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending("email");
    const { data, error: authErrorValue } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: siteUrl("/") },
    });
    if (authErrorValue) {
      fail(authErrorValue);
      return;
    }
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      setError("Ya hay una cuenta con ese correo. Inicia sesión.");
      setPending(null);
      return;
    }
    if (!data.session) {
      setNotice("Revisa tu correo y confirma la cuenta. Cuando lo hagas, entra desde Iniciar sesión.");
      setPending(null);
      return;
    }
    setPending(null);
  };

  return (
    <div
      className="login-screen"
      style={{
        backgroundImage: "url('/login-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="login-scrim" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <p className="login-brand">NightMap</p>
        <div className="login-tabs" role="tablist" aria-label="Acceso">
          <button
            type="button"
            role="tab"
            id="login-tab"
            aria-selected={!isSignup}
            aria-controls="login-panel"
            onClick={() => switchMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            id="signup-tab"
            aria-selected={isSignup}
            aria-controls="login-panel"
            onClick={() => switchMode("signup")}
          >
            Registrarse
          </button>
        </div>

        <div id="login-panel" role="tabpanel" aria-labelledby={isSignup ? "signup-tab" : "login-tab"}>
          <h1 id="login-title" className="login-title">
            {isSignup ? "Crea tu cuenta" : "Entra en el mapa"}
          </h1>
          <p className="login-copy">
            {isSignup
              ? "Regístrate con Google o con tu correo."
              : "El mapa se abre cuando entras con tu cuenta."}
          </p>

          <button type="button" className="login-google" onClick={signInWithGoogle} disabled={pending !== null}>
            <GoogleMark />
            {pending === "google"
              ? "Abriendo Google…"
              : isSignup
                ? "Registrarse con Google"
                : "Continuar con Google"}
          </button>

          <div className="login-divider" role="separator">
            <span>o con correo</span>
          </div>

          <form className="login-form" onSubmit={isSignup ? signUpWithPassword : signInWithPassword}>
            <label className="login-field">
              <span>Correo</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span>Contraseña</span>
              <input
                type="password"
                name="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isSignup ? 6 : undefined}
                required
              />
            </label>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="login-notice" role="status">
                {notice}
              </p>
            )}
            <button type="submit" className="login-submit" disabled={pending !== null}>
              {pending === "email" ? (isSignup ? "Creando cuenta…" : "Entrando…") : isSignup ? "Crear cuenta" : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72A5.4 5.4 0 0 1 3.7 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.02-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
