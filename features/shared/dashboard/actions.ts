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
export async function getPurchaseDashboardMetricsAction(startDate?: string, endDate?: string) {
  try {
    const data = await DashboardService.getPurchaseMetrics(startDate, endDate);
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

/**
 * Server action to fetch P&L report metrics.
 */
export async function getProfitLossMetricsAction(filter: string) {
  try {
    const data = await DashboardService.getProfitLossMetrics(filter);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getProfitLossMetricsAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve Profit & Loss report metrics.",
    };
  }
}

/**
 * Server action to fetch manufacturing reports.
 */
export async function getManufacturingReportsAction(filter: string) {
  try {
    const data = await DashboardService.getManufacturingReports(filter);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getManufacturingReportsAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve manufacturing reports.",
    };
  }
}
