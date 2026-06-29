"use server";

import { DashboardService } from "./dashboard.service";

/**
 * Server action to fetch manufacturing metrics.
 */
export async function getManufacturingDashboardAction() {
  try {
    const data = await DashboardService.getManufacturingMetrics();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getManufacturingDashboardAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve manufacturing metrics.",
    };
  }
}
