/** Cuenta que puede ver y resolver las solicitudes de verificación. */
const ADMIN_EMAIL = "martinezmartinezguille@gmail.com";

export function isAdmin(email: string | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
