# Phase 3.4 - Customer Payments Documentation

This document explains the technical implementation of the Customer Payments (Receipts) workflow, the underlying business rules, calculations, and database integrations.

---

## 1. Business Rules & Logic

1. **Database Schema**: No new tables are created. We reuse the existing `Payment` model and database schema.
2. **Customer Receipts**: Customer payments are registered in the `Payment` table with `paymentType = "CUSTOMER_RECEIPT"`.
3. **Ledger Calculations**: Customer outstanding is calculated dynamically at runtime:
   `Outstanding = Contact.openingBalance + Completed Sales - Completed Customer Receipts`
   All cancelled sales and cancelled receipts are ignored in calculations.
4. **Sale Payment Status**: When a payment is created or cancelled, the parent sale invoice's payment status (`paymentStatus`) is updated automatically:
   - `UNPAID` if total paid is 0.
   - `PARTIALLY_PAID` if total paid is between 0 and grandTotal.
   - `PAID` if total paid is greater than or equal to grandTotal (with 0.01 tolerance).
5. **Transactions wrapper**: All payment creations and cancellations occur within an atomic Prisma transaction wrapper.

---

## 2. Shared Components & Code Structure

- **Actions**: `features/trading/payments/actions.ts` orchestrates both supplier payments and customer receipts.
- **Service**: `features/trading/payments/payment.service.ts` encapsulates all calculations and database writes.
- **PaymentForm**: `components/erp/payments/PaymentForm.tsx` is dual-mode, supporting both `mode="SUPPLIER"` and `mode="CUSTOMER"`.
- **PaymentHistoryTable**: `components/erp/payments/PaymentHistoryTable.tsx` displays transaction lists generically.
- **PaymentSummaryCard**: `components/erp/payments/PaymentSummaryCard.tsx` renders statistics generic to both sales and purchases.
