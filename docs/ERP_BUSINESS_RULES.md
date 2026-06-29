# RSK Enterprises ERP - Business Rules & Architecture Constraints

This document lists the absolute business rules and architecture constraints for the RSK Enterprises ERP. These rules must be adhered to in all current and future phases.

---

## 1. Financial Ledger Rules

* **Immutable Records**: Financial receipts and ledger entries (like payments) are strictly immutable. Once recorded, they cannot be edited or deleted.
* **Soft Cancellations Only**: Reversing a payment must be done by marking the record as `CANCELLED` and logging a cancellation audit reason. The cancelled record remains in history for compliance.
* **No Database Balance Cache**: No outstanding balance fields (like `outstandingBalance`) are stored on the `Contact` or `Supplier` tables. Balances must always be calculated dynamically at runtime from transaction logs:
  - **Supplier Outstanding** = `Opening Balance` + `Completed Purchases` - `Completed Supplier Payments`
  - **Customer Outstanding** = `Opening Balance` + `Completed Sales` - `Completed Customer Receipts`
* **Auto-Derived Invoicing Status**: Invoice payment status (`paymentStatus`) is derived dynamically from sum totals of active (`COMPLETED`) payments and must never be updated manually.
* **Prisma Transactions**: Every single database write, update, status change, or cancellation must be bundled inside a single Prisma transaction client context (`prisma.$transaction`) to maintain ACID properties.
* **Auditing Trail**: Every transaction is logged with the ID of the recording user (`createdById`, `updatedById`) and timestamps to prepare the system for multi-user security boundaries.

---

## 2. Inventory & Stock Rules

* **Centralized Mutator Service**: The `Product.currentStock` and `Product.averageCost` values must never be updated directly by custom page logic or actions.
* **Strict Stock Movements**: All inventory updates must be logged through the `InventoryService` (`features/inventory/inventory.service.ts`), which automatically writes a historical `StockMovement` entry and updates cached stock levels inside a database transaction.

---

## 3. Manufacturing & BOM Rules

* **Finished Good Association**: Every Bill of Materials (BOM) recipe must target a product classified as a `FINISHED_GOOD` and it must be active.
* **Raw Material Ingredients**: Constituent items in a BOM recipe must be classified as `RAW_MATERIAL` products, must be active, and must have quantities greater than zero.
* **No Self-Inclusion**: A recipe's target finished product cannot be included as an ingredient in its own recipe.
* **Unique Recipe Names**: Recipe names must be unique (case-insensitive) across the ERP system.
* **Soft-Disable Only**: To prevent breaking historical records of completed production batches, BOM recipes cannot be deleted; they can only be deactivated (`isActive = false`). Deactivated recipes are hidden from production batch planning drop-downs.
* **Centralized Database Transactions**: All creations, updates, and status toggles for recipes must execute inside a Prisma Transaction client.

