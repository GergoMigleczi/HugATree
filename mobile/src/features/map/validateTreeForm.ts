import type { ObservationFormData } from "../observations/observations.types";

export function validateTreeForm(formData: ObservationFormData): string | null {
  if (!formData.title.trim()) return "Title is required — go to the Note tab.";
  if (!formData.details.heightM) return "Height (m) is required — go to the Details tab.";
  if (!formData.details.trunkDiameterCm) return "Trunk diameter (cm) is required — go to the Details tab.";
  if (!formData.details.canopyDiameterM) return "Canopy diameter (m) is required — go to the Details tab.";
  return null;
}
