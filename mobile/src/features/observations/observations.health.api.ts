import { authFetch } from "@/src/api/authFetch";
import type {
  ObservationFormData,
  HealthFormData,
  HealthItem,
  CreateHealthResponseApi,
} from "./observations.types";

/**
 * GET /trees/:treeId/health
 * Returns health records sorted: most recent first.
 */
export async function getTreeHealthApi(treeId: number): Promise<HealthItem[]> {
  return authFetch<HealthItem[]>(`/trees/${treeId}/health`, { method: "GET" });
}

/**
 * POST /trees/:treeId/health
 * Creates an observations row, a tree_health_history row, and N tree_health_issues rows.
 */
export async function createHealthApi(
  treeId: number,
  observation: ObservationFormData,
  health: HealthFormData,
): Promise<CreateHealthResponseApi> {
  return authFetch<CreateHealthResponseApi>(`/trees/${treeId}/health`, {
    method: "POST",
    body: {
      observation: {
        title:      observation.title      || undefined,
        noteText:   observation.noteText   || undefined,
        observedAt: observation.observedAt || undefined,
      },
      healthStatus: health.healthStatus || undefined,
      riskLevel:    health.riskLevel    || undefined,
      issues: health.issues
        .filter((i) => i.issueType || i.issueName)
        .map((i) => ({
          issueType:    i.issueType    || undefined,
          issueName:    i.issueName    || undefined,
          affectedPart: i.affectedPart || undefined,
          severity:     i.severity     || undefined,
        })),
    },
  });
}
