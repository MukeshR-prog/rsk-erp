# Phase 3.2 - Supplier Payments Documentation

This document explains the technical implementation of the Supplier Payments workflow, the underlying business rules, calculations, and database integrations.

---

## 1. Core Business Rules

* **Dynamic Outstanding Calculations**: No outstanding balances are persisted in the database. Outstanding supplier balance is calculated dynamically on runtime:
  `Outstanding = Opening Balance + Completed Purchases Grand Total - Completed Supplier Payments`
* **Auto-Sequenced Receipt Numbering**: Payments are serialized using the format `PAY-YYYY-XXXXXX` (e.g., `PAY-2026-000001`) with sequence numbers resetting annually.
* **Auto-Derived Invoicing Payment Status**: Purchase invoice status updates automatically inside a secure database transaction block based on the sum of completed payments:
  * Paid Sum = 0 → `UNPAID`
  * 0 < Paid Sum < Invoice Grand Total → `PARTIALLY_PAID`
  * Paid Sum >= Invoice Grand Total → `PAID`
* **Immutability of Financial Records**: Payment history records cannot be deleted. If a payment is reversed, it is soft-cancelled (marked `CANCELLED` status) and the cancellation reason is audited.
* **Database Consistency**: All write, cancellation, and recalculation processes execute inside a single Prisma Transaction block.

---

## 2. Dynamic Calculation Workflow

All outstanding calculations reside in `features/trading/payments/ledger.service.ts` to prevent duplication:

```
                  ┌──────────────────────────────┐
                  │   Supplier Balance Query     │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │    Contact.openingBalance     │
                 └───────────────┬───────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                                       │
┌────────────▼─────────────┐           ┌─────────────▼─────────────┐
│  + Sum(Purchase Total)   │           │    - Sum(Payment Paid)    │
│  WHERE status=COMPLETED  │           │  WHERE status=COMPLETED   │
└──────────────────────────┘           └───────────────────────────┘
```

---

## 3. Database Relationships

The `Payment` model references `Contact`, `Purchase`, and `Sale` tables to support both supplier disbursements and future customer receipts:

* `Payment.contactId` ➔ `Contact.id` (1-to-many relationship)
* `Payment.purchaseId` ➔ `Purchase.id` (Optional 1-to-many relationship)
* `Payment.saleId` ➔ `Sale.id` (Optional 1-to-many relationship)

---

## 4. Revalidation Paths
After recording or cancelling a payment, the server revalidates:
* `/trading/payments` (payments registry logs)
* `/trading/payments/[id]` (detailed receipt view)
* `/trading/purchases/[id]` (connected purchase invoice)
* `/trading/purchases` (purchases list view)
* `/trading` (main dashboard KPIs and widgets)
