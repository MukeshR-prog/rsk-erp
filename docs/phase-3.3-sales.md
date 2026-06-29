# Phase 3.3 - Sales Management Documentation

This document describes the design architecture, service patterns, and verification procedures for the Sales Management module of RSK Enterprises ERP.

---

## 1. Domain Directory Structure

The Sales domain is isolated inside the `trading` features namespace:

```
features/trading/sales/
├── actions.ts              # Server Actions (API boundary and transaction wrappers)
├── types.ts                # TypeScript interfaces and filtration shapes
├── validations.ts          # Zod validation schemas
├── sale.service.ts         # Core Domain Logic & Business Rules Service
└── saleNumber.service.ts   # Sequence wrapper for unique SAL prefix codes
```

---

## 2. Business Rules & Rules Enforcement

### Rule 1: Dynamic Customer Outstanding Calculation
Customer outstanding is **never cached or persisted** in database tables. It is calculated dynamically at runtime using the formula:
$$\text{Customer Outstanding} = \text{Opening Balance} + \sum(\text{Completed Sales}) - \sum(\text{Completed Customer Receipts})$$
This rule is implemented in `LedgerService.getCustomerOutstanding()`.

### Rule 2: Strict Inventory Control (Sufficient Stock Check)
Every Completed sale must decrease inventory stock levels.
- Decreases stock by invoking `InventoryService.decreaseStock()`.
- Prior to saving, the service verifies `currentStock` availability. If any product line requests more stock than currently available, the transaction is rejected with an `Error`.
- During invoice revisions (Edit Sale), the system runs a **compensation rollback**: it temporarily restores the original items' stock, validates the new quantities, and then registers the new stock reductions. This prevents stock from temporarily dipping below zero or causing anomalies.

### Rule 3: Database Transactions (ACID)
All database writes (creates, updates, cancels) execute inside a Prisma Transaction (`prisma.$transaction(async (tx) => { ... })`). This guarantees atomicity: if inventory reduction fails, the invoice creation rolls back automatically.

### Rule 4: Serial Numbers Generation
Uses the centralized `NumberGeneratorService` to generate unique sequential numbers with the prefix `SAL` matching the current calendar year, formatted as: `SAL-YYYY-000001`.

---

## 3. API & Entry Points

### Server Actions
- `createSaleAction(data)`: Validates inputs via Zod, starts a transaction, generates serials, validates stock, creates header + lines, deducts stock, and revalidates cache path.
- `editSaleAction(id, data)`: Edits sale, compensates stock, updates lines, and checks new stock.
- `cancelSaleAction(id, reason)`: Performs soft cancellation by setting status to `CANCELLED` and restoring stock.

---

## 4. UI Components Layer

- [SaleForm.tsx](file:///d:/Next%20Js/rsk-erp/components/erp/sales/SaleForm.tsx): The unified drawer form supporting creation and revisions, reactive totals calculation, duplicate row merging, and stock lookups.
- [SaleItemsTable.tsx](file:///d:/Next%20Js/rsk-erp/components/erp/sales/SaleItemsTable.tsx): Table of products sold with line items breakdown.
- [SaleSummaryCard.tsx](file:///d:/Next%20Js/rsk-erp/components/erp/sales/SaleSummaryCard.tsx): Displays invoice payment summary (Subtotal, Discount, Transport, Paid, Due).
- [SaleStatusBadge.tsx](file:///d:/Next%20Js/rsk-erp/components/erp/sales/SaleStatusBadge.tsx): Status colored visual badges.
