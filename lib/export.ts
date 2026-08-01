import dayjs from "dayjs";

/**
 * Universal CSV Exporter helper that handles escaping, UTF-8 BOM, and browser triggering.
 */
export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = "\uFEFF" + rows.map((row) => row.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * PDF Document Generator helper that opens a print/PDF preview dialog.
 */
export function generatePDFDocument(title: string, subtitle: string, htmlContent: string) {
  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (!printWindow) {
    alert("Please allow pop-ups to generate PDF reports.");
    return;
  }

  const documentHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>      <style>
        @media print {
          @page { margin: 15mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          font-size: 12px;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .report-title {
          font-size: 16px;
          font-weight: 700;
          color: #059669;
          margin-top: 4px;
        }
        .meta-info {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-rose { background: #ffe4e6; color: #9f1239; }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          background: #f8fafc;
        }
        .kpi-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; }
        .kpi-value { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 24px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 800;
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          border-bottom: 2px solid #cbd5e1;
          text-transform: uppercase;
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }
        tr:nth-child(even) td { background: #f8fafc; }
        .text-right { text-align: right; }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        .action-bar {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }
        .btn-print {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div className="action-bar no-print">
        <button class="btn-print" onclick="window.print()">📥 Print / Save as PDF</button>
      </div>

      <div class="header-bar">
        <div>
          <div class="company-name">RSK ENTERPRISES ERP</div>
          <div class="report-title">${title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${subtitle}</div>
        </div>
        <div class="meta-info">
          <div><strong>Date Generated:</strong> ${dayjs().format("DD MMM YYYY, hh:mm A")}</div>
          <div><strong>Report System:</strong> RSK Enterprise ERP</div>
        </div>
      </div>

      ${htmlContent}

      <div class="footer">
        <div>Authorized System Generated Report • RSK ERP</div>
        <div>Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(documentHTML);
  printWindow.document.close();
}

/**
 * Export Trading Dashboard summary to CSV.
 */
export function exportTradingDashboardSummary(
  metrics: any,
  recentPurchases: any[],
  recentPayments: any[],
  dateRangeText: string = "All Time"
) {
  const rows: (string | number)[][] = [
    ["RSK ENTERPRISES ERP - TRADING DASHBOARD REPORT"],
    ["Generated On", dayjs().format("YYYY-MM-DD HH:mm:ss")],
    ["Filtered Period", dateRangeText],
    [],
    ["SUMMARY METRICS"],
    ["Metric", "Value (INR)"],
    ["Sales (Period / Today)", metrics.todaySales],
    ["Purchases (Period / Today)", metrics.todayPurchases],
    ["Collections Cleared", metrics.todayCollections],
    ["Payments Cleared", metrics.todayPayments],
    ["Customer Outstanding", metrics.customerOutstanding],
    ["Supplier Outstanding", metrics.supplierOutstanding],
    ["Current Stock Value", metrics.currentStockValue],
    ["Low Stock Warnings Count", metrics.lowStockCount],
    [],
    ["RECENT PURCHASE INVOICES"],
    ["Invoice No", "Supplier Name", "Date", "Grand Total (INR)", "Payment Status"],
    ...recentPurchases.map((p) => [
      p.number || p.purchaseNumber || "",
      p.supplierName || p.supplier?.name || "",
      dayjs(p.date || p.purchaseDate).format("YYYY-MM-DD"),
      p.grandTotal || 0,
      p.paymentStatus || "",
    ]),
    [],
    ["RECENT PAYMENTS & RECEIPTS"],
    ["Payment No", "Contact Name", "Date", "Amount (INR)", "Status"],
    ...recentPayments.map((p) => [
      p.number || p.paymentNumber || "",
      p.supplierName || p.contact?.name || "",
      dayjs(p.date || p.paymentDate).format("YYYY-MM-DD"),
      p.amount || 0,
      p.status || "",
    ]),
  ];

  const sanitizedPeriod = dateRangeText.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  downloadCSV(`Trading_Dashboard_Report_${sanitizedPeriod}_${dayjs().format("YYYYMMDD")}.csv`, rows);
}

/**
 * Export Trading Dashboard summary to PDF.
 */
export function exportTradingDashboardPDF(
  metrics: any,
  recentPurchases: any[],
  recentPayments: any[],
  dateRangeText: string = "All Time"
) {
  const html = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Sales (${dateRangeText})</div>
        <div class="kpi-value">₹${Number(metrics.todaySales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Purchases (${dateRangeText})</div>
        <div class="kpi-value">₹${Number(metrics.todayPurchases || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Customer Outstanding</div>
        <div class="kpi-value" style="color: #d97706;">₹${Number(metrics.customerOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Supplier Outstanding</div>
        <div class="kpi-value" style="color: #9333ea;">₹${Number(metrics.supplierOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <h3 style="margin-top: 24px; font-size: 14px; font-weight: 800;">Recent Purchase Invoices</h3>
    <table>
      <thead>
        <tr>
          <th>Invoice No</th>
          <th>Supplier Name</th>
          <th>Date</th>
          <th class="text-right">Grand Total (INR)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${recentPurchases.map(p => `
          <tr>
            <td><strong>${p.number || p.purchaseNumber}</strong></td>
            <td>${p.supplierName || p.supplier?.name || "N/A"}</td>
            <td>${dayjs(p.date || p.purchaseDate).format("DD MMM YYYY")}</td>
            <td class="text-right">₹${Number(p.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-green' : 'badge-amber'}">${p.paymentStatus}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h3 style="margin-top: 24px; font-size: 14px; font-weight: 800;">Recent Payments & Receipts</h3>
    <table>
      <thead>
        <tr>
          <th>Payment No</th>
          <th>Party Name</th>
          <th>Date</th>
          <th class="text-right">Amount (INR)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${recentPayments.map(p => `
          <tr>
            <td><strong>${p.number || p.paymentNumber}</strong></td>
            <td>${p.supplierName || p.contact?.name || "N/A"}</td>
            <td>${dayjs(p.date || p.paymentDate).format("DD MMM YYYY")}</td>
            <td class="text-right" style="color: #059669; font-weight: 800;">₹${Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${p.status === 'COMPLETED' ? 'badge-green' : 'badge-rose'}">${p.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  generatePDFDocument("Trading Dashboard Report", `Period: ${dateRangeText}`, html);
}

/**
 * Export Purchase Invoices register to CSV.
 */
export function exportPurchasesToCSV(purchases: any[], filterTitle: string = "All") {
  const rows: (string | number)[][] = [
    ["RSK ENTERPRISES ERP - PURCHASE INVOICES REGISTER"],
    ["Generated On", dayjs().format("YYYY-MM-DD HH:mm:ss")],
    ["Filter Context", filterTitle],
    [],
    ["Purchase No", "Supplier Invoice No", "Supplier Name", "Date", "Subtotal (INR)", "Discount", "Transport", "Grand Total (INR)", "Invoice Status", "Payment Status"],
    ...purchases.map((p) => [
      p.purchaseNumber || "",
      p.supplierInvoiceNumber || "",
      p.supplierName || p.supplier?.name || "",
      dayjs(p.purchaseDate).format("YYYY-MM-DD"),
      p.subtotal || 0,
      p.discount || 0,
      p.transportCharges || 0,
      p.grandTotal || 0,
      p.status || "",
      p.paymentStatus || "",
    ]),
  ];

  downloadCSV(`Purchase_Invoices_${dayjs().format("YYYYMMDD_HHmm")}.csv`, rows);
}

/**
 * Export Purchase Invoices register to PDF.
 */
export function exportPurchasesToPDF(purchases: any[], filterTitle: string = "All") {
  const html = `
    <table>
      <thead>
        <tr>
          <th>Purchase No</th>
          <th>Supplier Invoice</th>
          <th>Supplier Name</th>
          <th>Date</th>
          <th class="text-right">Grand Total (INR)</th>
          <th>Status</th>
          <th>Payment</th>
        </tr>
      </thead>
      <tbody>
        ${purchases.map(p => `
          <tr>
            <td><strong>${p.purchaseNumber}</strong></td>
            <td>${p.supplierInvoiceNumber || "-"}</td>
            <td>${p.supplierName || p.supplier?.name || "N/A"}</td>
            <td>${dayjs(p.purchaseDate).format("DD MMM YYYY")}</td>
            <td class="text-right">₹${Number(p.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${p.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}">${p.status}</span></td>
            <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-green' : 'badge-amber'}">${p.paymentStatus}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  generatePDFDocument("Purchase Invoices Register", `Filter: ${filterTitle}`, html);
}

/**
 * Export Single Purchase Invoice to PDF.
 */
export function exportPurchaseInvoicePDF(purchase: any) {
  const html = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
      <div><strong>Invoice Number:</strong> ${purchase.purchaseNumber}</div>
      <div><strong>Supplier Invoice No:</strong> ${purchase.supplierInvoiceNumber || "-"}</div>
      <div><strong>Supplier Name:</strong> ${purchase.supplier?.name || "-"}</div>
      <div><strong>Date:</strong> ${dayjs(purchase.purchaseDate).format("DD MMMM YYYY")}</div>
      <div><strong>Status:</strong> <span class="badge badge-green">${purchase.status}</span></div>
      <div><strong>Payment Status:</strong> <span class="badge badge-amber">${purchase.paymentStatus}</span></div>
    </div>

    <h3 style="font-size: 14px; font-weight: 800;">Items Purchased</h3>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Purchase Rate (INR)</th>
          <th class="text-right">Discount (INR)</th>
          <th class="text-right">Line Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${(purchase.items || []).map((it: any) => `
          <tr>
            <td><strong>${it.product?.name || 'Item'}</strong></td>
            <td class="text-right">${it.quantity}</td>
            <td class="text-right">₹${Number(it.purchaseRate || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(it.discount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(it.lineTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <div style="width: 280px; background: #f1f5f9; padding: 16px; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Subtotal:</span> <strong>₹${Number(purchase.subtotal || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Discount:</span> <strong>₹${Number(purchase.discount || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Transport Charges:</span> <strong>₹${Number(purchase.transportCharges || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; border-top: 2px solid #cbd5e1; padding-top: 8px; font-size: 14px; color: #059669; font-weight: 900;"><span>Grand Total:</span> <span>₹${Number(purchase.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
  `;

  generatePDFDocument(`Purchase Invoice ${purchase.purchaseNumber}`, `Supplier: ${purchase.supplier?.name || "-"}`, html);
}

/**
 * Export Sales Invoices register to CSV.
 */
export function exportSalesToCSV(sales: any[], filterTitle: string = "All") {
  const rows: (string | number)[][] = [
    ["RSK ENTERPRISES ERP - SALES INVOICES REGISTER"],
    ["Generated On", dayjs().format("YYYY-MM-DD HH:mm:ss")],
    ["Filter Context", filterTitle],
    [],
    ["Sale Invoice No", "Customer Name", "Reference", "Date", "Subtotal (INR)", "Discount", "Transport", "Grand Total (INR)", "Invoice Status", "Payment Status"],
    ...sales.map((s) => [
      s.saleNumber || "",
      s.customerName || s.customer?.name || "",
      s.reference || "",
      dayjs(s.saleDate).format("YYYY-MM-DD"),
      s.subtotal || 0,
      s.discount || 0,
      s.transportCharges || 0,
      s.grandTotal || 0,
      s.status || "",
      s.paymentStatus || "",
    ]),
  ];

  downloadCSV(`Sales_Invoices_${dayjs().format("YYYYMMDD_HHmm")}.csv`, rows);
}

/**
 * Export Sales Invoices register to PDF.
 */
export function exportSalesToPDF(sales: any[], filterTitle: string = "All") {
  const html = `
    <table>
      <thead>
        <tr>
          <th>Sale Invoice No</th>
          <th>Customer Name</th>
          <th>Reference</th>
          <th>Date</th>
          <th class="text-right">Grand Total (INR)</th>
          <th>Status</th>
          <th>Payment</th>
        </tr>
      </thead>
      <tbody>
        ${sales.map(s => `
          <tr>
            <td><strong>${s.saleNumber}</strong></td>
            <td>${s.customerName || s.customer?.name || "N/A"}</td>
            <td>${s.reference || "-"}</td>
            <td>${dayjs(s.saleDate).format("DD MMM YYYY")}</td>
            <td class="text-right">₹${Number(s.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${s.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}">${s.status}</span></td>
            <td><span class="badge ${s.paymentStatus === 'PAID' ? 'badge-green' : 'badge-amber'}">${s.paymentStatus}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  generatePDFDocument("Sales Invoices Register", `Filter: ${filterTitle}`, html);
}

/**
 * Export Single Sale Invoice to PDF.
 */
export function exportSaleInvoicePDF(sale: any) {
  const html = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
      <div><strong>Sale Invoice No:</strong> ${sale.saleNumber}</div>
      <div><strong>Customer Name:</strong> ${sale.customer?.name || "-"}</div>
      <div><strong>Reference:</strong> ${sale.reference || "-"}</div>
      <div><strong>Invoice Date:</strong> ${dayjs(sale.saleDate).format("DD MMMM YYYY")}</div>
      <div><strong>Status:</strong> <span class="badge badge-green">${sale.status}</span></div>
      <div><strong>Payment Status:</strong> <span class="badge badge-amber">${sale.paymentStatus}</span></div>
    </div>

    <h3 style="font-size: 14px; font-weight: 800;">Items Dispatched / Sold</h3>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Selling Rate (INR)</th>
          <th class="text-right">Discount (INR)</th>
          <th class="text-right">Line Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${(sale.items || []).map((it: any) => `
          <tr>
            <td><strong>${it.productName || it.product?.name || 'Item'}</strong></td>
            <td class="text-right">${it.quantity}</td>
            <td class="text-right">₹${Number(it.sellingRate || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(it.discount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(it.lineTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <div style="width: 280px; background: #f1f5f9; padding: 16px; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Subtotal:</span> <strong>₹${Number(sale.subtotal || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Discount:</span> <strong>₹${Number(sale.discount || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Transport Charges:</span> <strong>₹${Number(sale.transportCharges || 0).toLocaleString("en-IN")}</strong></div>
        <div style="display: flex; justify-content: space-between; border-top: 2px solid #cbd5e1; padding-top: 8px; font-size: 14px; color: #059669; font-weight: 900;"><span>Grand Total:</span> <span>₹${Number(sale.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
  `;

  generatePDFDocument(`Sale Invoice ${sale.saleNumber}`, `Customer: ${sale.customer?.name || "-"}`, html);
}

/**
 * Export Payments & Receipts register to CSV.
 */
export function exportPaymentsToCSV(payments: any[], filterTitle: string = "All") {
  const rows: (string | number)[][] = [
    ["RSK ENTERPRISES ERP - PAYMENTS & RECEIPTS REGISTER"],
    ["Generated On", dayjs().format("YYYY-MM-DD HH:mm:ss")],
    ["Filter Context", filterTitle],
    [],
    ["Payment No", "Contact / Party Name", "Type", "Method", "Date", "Amount (INR)", "Reference No", "Status"],
    ...payments.map((p) => [
      p.paymentNumber || "",
      p.contactName || p.contact?.name || "",
      p.paymentType || "",
      p.paymentMethod || "",
      dayjs(p.paymentDate).format("YYYY-MM-DD"),
      p.amount || 0,
      p.referenceNumber || "",
      p.status || "",
    ]),
  ];

  downloadCSV(`Payments_Register_${dayjs().format("YYYYMMDD_HHmm")}.csv`, rows);
}

/**
 * Export Payments & Receipts register to PDF.
 */
export function exportPaymentsToPDF(payments: any[], filterTitle: string = "All") {
  const html = `
    <table>
      <thead>
        <tr>
          <th>Payment No</th>
          <th>Party / Contact</th>
          <th>Type</th>
          <th>Method</th>
          <th>Date</th>
          <th class="text-right">Amount (INR)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${payments.map(p => `
          <tr>
            <td><strong>${p.paymentNumber}</strong></td>
            <td>${p.contactName || p.contact?.name || "N/A"}</td>
            <td>${p.paymentType}</td>
            <td>${p.paymentMethod}</td>
            <td>${dayjs(p.paymentDate).format("DD MMM YYYY")}</td>
            <td class="text-right" style="color: #059669; font-weight: 800;">₹${Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${p.status === 'COMPLETED' ? 'badge-green' : 'badge-rose'}">${p.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  generatePDFDocument("Payments & Receipts Register", `Filter: ${filterTitle}`, html);
}

/**
 * Export Profit & Loss Financial Report to PDF.
 */
export function exportReportsToPDF(reportData: any, activeTab: string = "monthly") {
  const html = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Sales Revenue</div>
        <div class="kpi-value" style="color: #059669;">₹${Number(reportData.summary.totalSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Purchase Cost</div>
        <div class="kpi-value" style="color: #ea580c;">₹${Number(reportData.summary.totalPurchases || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Gross Profit</div>
        <div class="kpi-value" style="color: #2563eb;">₹${Number(reportData.summary.grossProfit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Net Profit</div>
        <div class="kpi-value" style="color: #7c3aed;">₹${Number(reportData.summary.netProfit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <h3 style="margin-top: 24px; font-size: 14px; font-weight: 800;">Periodic Financial Breakdown (${activeTab.toUpperCase()})</h3>
    <table>
      <thead>
        <tr>
          <th>Period Label</th>
          <th class="text-right">Sales Revenue (INR)</th>
          <th class="text-right">Purchase Cost (INR)</th>
          <th class="text-right">Net Profit (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${(reportData.chartData || []).map((row: any) => `
          <tr>
            <td><strong>${row.label}</strong></td>
            <td class="text-right">₹${Number(row.sales || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(row.purchases || 0).toLocaleString("en-IN")}</td>
            <td class="text-right" style="font-weight: 800; color: ${row.netProfit >= 0 ? '#059669' : '#dc2626'}">₹${Number(row.netProfit || 0).toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  generatePDFDocument("Profit & Loss Financial Report", `View Mode: ${activeTab.toUpperCase()}`, html);
}
