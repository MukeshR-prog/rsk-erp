# RSK Enterprises ERP - Phase 4.1: Bill of Materials (BOM) Specifications

This document defines the implementation specifications, business rules, service layout, and verification results for the Bill of Materials (BOM) module.

---

## 1. Architectural Design

The Bill of Materials (BOM) module forms the structural blueprint for the Manufacturing workspace. In alignment with RSK ERP's service-driven architecture, the module separates concerns cleanly between server actions and the domain service:

- **Validations (`features/manufacturing/bom/validations.ts`)**: Isolate data shapes and business rule checks within standard Zod schemas (`bomRecipeSchema` and `bomItemSchema`).
- **Domain Service (`features/manufacturing/bom/bom.service.ts`)**: Houses database transactions, product type checks, unique constraints verification, and mathematical summaries.
- **Server Actions (`features/manufacturing/bom/actions.ts`)**: Act as entry boundaries, handling user authentication session, executing validation parsers, invoking `BOMService` methods, and revalidating Next.js paths.
- **Page Views (`app/(app)/manufacturing/bom/...`)**: Renders layout elements, fetches initial data on mount, handles search query states, and renders modals.

---

## 2. Business Rules

### A. Recipe Header Rules
- **Name Uniqueness**: Every recipe name must be unique across the system (case-insensitive check).
- **Finished Output Constraint**: A recipe must target a product classified as a `FINISHED_GOOD` where `isActive = true`.

### B. Materials Specification Rules
- **Non-Empty Ingredients**: A recipe must contain at least one constituent raw material.
- **Finished-Raw Self-Inclusion Block**: A recipe's target finished good cannot be added as a raw material ingredient inside its own specification.
- **Ingredient Constraints**: Every constituent material must exist as a `RAW_MATERIAL` where `isActive = true` and `quantity > 0`.
- **Deduplication Check**: Duplicate ingredients within the same recipe are blocked. If any are passed, they are automatically merged by summing their quantities.

### C. Mutability & Lifecycle Rules
- **Disable Toggles**: To protect historical batch records that reference recipe codes, delete buttons perform a soft-disable only (`isActive = false`).
- **Production Validation**: In subsequent phases, only recipes with `isActive = true` are eligible for selection in manufacturing batch runs.

---

## 3. API Summary

### BOMService Methods
- `createRecipe(data, tx)`: Validates name uniqueness, finished output classification, and material ingredients, then registers header and item rows inside a Prisma transaction.
- `updateRecipe(id, data, tx)`: Performs standard validation, removes old item lists, updates header parameters, and inserts modified ingredient items inside a transaction.
- `disableRecipe(id, tx)`: Sets `isActive = false` on the target recipe header.
- `enableRecipe(id, tx)`: Sets `isActive = true` on the target recipe header.
- `getRecipes(filters, client)`: Returns paginated lists with search strings, active flags, and item counts.
- `getRecipeDetails(id, client)`: Retrieves complete recipe metadata and ingredient rows with UoM labels.

---

## 4. Verification Results

All E2E checks were successfully completed:
- **Finished Product Creation**: Logged `TEST-PROD-Finished Cup 150ml` with type `FINISHED_GOOD`.
- **Ingredients Creation**: Logged PE Paper Roll, Bottom Reel, and Packing Carton.
- **BOM Creation**: Saved standard recipe with a 2.5% loss allowance.
- **Update Checks**: Modified waste factor to 3.1% and updated raw quantities.
- **Disable Toggles**: Successfully soft-disabled the recipe.
- **Search & Filter Results**: Confirmed exact text query matches and active status filters.
- **Build Compilations**: Verified zero TypeScript errors (`npx tsc --noEmit`) and successful Next.js build compilation.
