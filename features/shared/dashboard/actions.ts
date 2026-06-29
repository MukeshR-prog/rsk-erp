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

/**
 * Server action to fetch trading dashboard metrics.
 */
export async function getTradingDashboardAction() {
  try {
    const data = await DashboardService.getTradingMetrics();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getTradingDashboardAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve trading metrics.",
    };
  }
}

/**
 * Server action to fetch purchase dashboard metrics.
 */
export async function getPurchaseDashboardMetricsAction() {
  try {
    const data = await DashboardService.getPurchaseMetrics();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getPurchaseDashboardMetricsAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve purchase metrics.",
    };
  }
}
