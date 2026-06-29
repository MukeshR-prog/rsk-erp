export interface BOMRecipeFilters {
  search?: string;
  isActive?: boolean;
  finishedProductId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface BOMRecipeListItem {
  id: string;
  name: string;
  finishedProductId: string;
  finishedProductName: string;
  finishedProductCode: string;
  itemCount: number;
  wasteFactorPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
