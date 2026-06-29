# RSK Enterprises ERP - Business Rules & Architecture Constraints

This document lists the absolute business rules and architecture constraints for the RSK Enterprises ERP. These rules must be adhered to in all current and future phases.

---

## 1. Financial Ledger Rules

* **Immutable Records**: Financial receipts and ledger entries (like payments) are strictly immutable. Once recorded, they cannot be edited or deleted.
* **Soft Cancellations Only**: Reversing a payment must be done by marking the record as `CANCELLED` and logging a cancellation audit reason. The cancelled record remains in history for compliance.
* **No Database Balance Cache**: No outstanding balance fields (like `outstandingBalance`) are stored on the `Contact` or `Supplier` tables. Balances must always be calculated dynamically on runtime from transaction logs.
* **Auto-Derived Invoicing Status**: Invoice payment status (`paymentStatus`) is derived dynamically from sum totals of active (`COMPLETED`) payments and must never be updated manually.
* **Prisma Transactions**: Every single database write, update, status change, or cancellation must be bundled inside a single Prisma transaction client context (`prisma.$transaction`) to maintain ACID properties.
* **Auditing Trail**: Every transaction is logged with the ID of the recording user (`createdById`, `updatedById`) and timestamps to prepare the system for multi-user security boundaries.

---

## 2. Inventory & Stock Rules

* **Centralized Mutator Service**: The `Product.currentStock` and `Product.averageCost` values must never be updated directly by custom page logic or actions.
* **Strict Stock Movements**: All inventory updates must be logged through the `InventoryService` (`features/inventory/inventory.service.ts`), which automatically writes a historical `StockMovement` entry and updates cached stock levels inside a database transaction.
