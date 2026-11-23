/** Services a visitor can book a consultation for. Shared by the booking form and its API. */
export const SERVICES = [
  { id: "styling", label: "Professional styling" },
  { id: "consulting", label: "Business consulting" },
  { id: "design-studio", label: "Design Studio" },
  { id: "app", label: "The Bee app" },
  { id: "other", label: "Something else" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export function isServiceId(value: unknown): value is ServiceId {
  return SERVICES.some((service) => service.id === value);
}

export function serviceLabel(id: ServiceId) {
  return SERVICES.find((service) => service.id === id)?.label ?? id;
}
