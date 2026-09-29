const MANAGER_ROLES = ["gerente", "responsable", "manager", "dueno", "propietario", "director", "encargado"] as const;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isManagerRole(role: string): boolean {
  const text = normalize(role);
  return MANAGER_ROLES.some((part) => text.includes(part));
}
