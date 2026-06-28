# RSK Enterprises ERP - Database Connection & Verification Guide

This guide describes the procedures for verifying that Prisma Client and Supabase PostgreSQL are properly configured, connected, and in sync.

---

## 1. Environment Variables

Create or update your `.env` file in the root directory. Ensure the following variables are present:

* `DATABASE_URL`: Transactional connection string used by Prisma to execute queries (e.g. pooler connection string on port `5432` or port `6543`).
* `DIRECT_URL`: Direct connection string bypasser used by Prisma for schema migrations and synchronization (usually direct to database port `5432`).
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL API endpoint (e.g., `https://xxxxxx.supabase.co`).
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client anonymous API key.
* `SUPABASE_SERVICE_ROLE_KEY`: Service role API key for administrative queries.

### Verification of Values
To verify that these environment variables are loaded:
1. Run `node -e "console.log(process.env.DATABASE_URL)"` in terminal to confirm they load successfully.
2. Verify strings do not contain typos or mismatched special characters.

---

## 2. Prisma Verification Commands

Run the following commands in the project directory to verify the status of the database client:

### A. Schema Validation
```bash
npx prisma validate
```
* **Expected Output**: `The schema at prisma/schema.prisma is valid ✔`.

### B. Client Generation
```bash
npx prisma generate
```
* **Expected Output**: `✔ Generated Prisma Client (vX.X.X) to ./node_modules/@prisma/client`.

### C. Migration Status
```bash
npx prisma migrate status
```
* **Expected Output**: Shows database schema matches local migrations with no pending migrations to apply.

### D. Prisma Studio
To visually browse data locally:
```bash
npx prisma studio
```
* **Expected Output**: Starts a local server at `http://localhost:5555`. You should see list tables for `Profile`, `Contact`, `Product`, `Purchase`, `PurchaseItem`, `StockMovement`, etc.

---

## 3. Supabase Verification

* **Database Connection**: Confirm the Supabase project dashboard status is "Active".
* **Authentication**: Supabase Auth handles owner login session validation. Ensure users exist in the `auth.users` schema in Supabase.
* **Table Creation & Updates**: Verify that tables exist by checking the **Table Editor** on Supabase.
* **Prisma Synchronization**: Check that local schema modifications are pushed correctly using `npx prisma db push`.

---

## 4. Manual Database Verification

You can inspect catalogs and transactional logs manually via two portals:

### A. Prisma Studio (`http://localhost:5555`)
1. Click **Product** or **Contact** to inspect loaded master records.
2. Click **Purchase** to inspect registered purchase headers.
3. Click **StockMovement** to confirm that stock log increments have been logged correctly.

### B. Supabase SQL Editor
Run the following SQL check query to verify counts:
```sql
SELECT 'Products' AS TableName, COUNT(*) FROM "Product"
UNION ALL
SELECT 'Contacts', COUNT(*) FROM "Contact"
UNION ALL
SELECT 'Purchases', COUNT(*) FROM "Purchase"
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM "StockMovement";
```

---

## 5. Troubleshooting Guide

### A. `DATABASE_URL` / `DIRECT_URL` Connection Errors
* **Error**: `PrismaClientInitializationError: Can't reach database server...`
* **Fix**: Ensure your local internet allows connection to Supabase port `5432` / `6543`. If using Supabase Connection Pooler, make sure `DATABASE_URL` contains `?pgbouncer=true`.

### B. Outdated Prisma Client
* **Error**: `PrismaClientValidationError: Unknown field in model...`
* **Fix**: Run `npx prisma generate` to rebuild the locally cached database typings.

### C. Migration Mismatch
* **Error**: `Migration history is not in sync...`
* **Fix**: Run `npx prisma db push` to reconcile differences between schema and database without dropping transactional tables.

---

## 6. Developer Checklist

Follow this checklist at the start of every session:

* [ ] Environment variables (.env) verified and loaded
* [ ] Schema validates: `npx prisma validate`
* [ ] Client generated: `npx prisma generate`
* [ ] Database connection succeeds with `npx prisma db push`
* [ ] Master catalog records (Contacts, Products, Units) visible in Studio
* [ ] Transactional CRUD operations pass compilation checks
* [ ] TypeScript compilations pass: `npx tsc --noEmit`
