import type { Company, Employee, Payslip, User } from "@/types";

export type PayslipEmployee = Partial<Employee | User> & { id?: string };

type PayslipRow = {
  label: string;
  amount: number;
};

export function formatCurrency(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function titleMonth(value: string) {
  return value.trim().toUpperCase();
}

function employeeCode(employee?: PayslipEmployee, payslip?: Payslip) {
  return (
    payslip?.employeeNo ||
    (employee?.id ? `BM${String(employee.id).slice(-3).toUpperCase()}` : "BM")
  );
}

function numberToWords(value: number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const underHundred = (n: number) =>
    n < 20 ? ones[n] : [tens[Math.floor(n / 10)], ones[n % 10]].filter(Boolean).join(" ");
  const underThousand = (n: number) =>
    n < 100
      ? underHundred(n)
      : [ones[Math.floor(n / 100)], "Hundred", underHundred(n % 100)].filter(Boolean).join(" ");

  const whole = Math.round(value);
  if (whole <= 0) return "Zero Rupees Only";
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;
  return [
    crore ? `${underThousand(crore)} Crore` : "",
    lakh ? `${underThousand(lakh)} Lakh` : "",
    thousand ? `${underThousand(thousand)} Thousand` : "",
    rest ? underThousand(rest) : "",
    "Rupees Only",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildPayslipDefaults(employee?: PayslipEmployee): Payslip {
  const gross = Number(employee?.monthlyCtc ?? employee?.salary ?? 0);
  const basicPay = Number(employee?.baseSalary ?? Math.round(gross * 0.7));
  const houseRentAllowance = Math.max(0, gross - basicPay);
  return {
    id: "",
    employeeId: employee?.id,
    employeeName: employee?.name || "Employee",
    month: new Date().toLocaleString("en", { month: "long", year: "numeric" }),
    employeeNo: employeeCode(employee),
    designation: employee?.designation || "",
    department: employee?.department || "",
    dateOfJoining: employee?.joinDate || "",
    bankName: "",
    bankAccount: employee?.bankAccount || "",
    pan: "",
    paidDays: 30,
    lopDays: 0,
    basicPay,
    houseRentAllowance,
    overtimeBonus: 0,
    specialAllowance: 0,
    incomeTaxTds: 0,
    gross,
    deductions: 0,
    net: gross,
    status: "paid",
  };
}

export function normalizePayslip(payslip: Payslip, employee?: PayslipEmployee): Payslip {
  const basicPay = Number(payslip.basicPay ?? employee?.baseSalary ?? 0);
  const houseRentAllowance = Number(payslip.houseRentAllowance ?? 0);
  const overtimeBonus = Number(payslip.overtimeBonus ?? 0);
  const specialAllowance = Number(payslip.specialAllowance ?? 0);
  const incomeTaxTds = Number(payslip.incomeTaxTds ?? payslip.deductions ?? 0);
  const gross = Number(
    payslip.gross ?? basicPay + houseRentAllowance + overtimeBonus + specialAllowance,
  );
  const deductions = Number(payslip.deductions ?? incomeTaxTds);
  return {
    ...payslip,
    employeeName: payslip.employeeName || employee?.name || "Employee",
    employeeNo: employeeCode(employee, payslip),
    designation: payslip.designation || employee?.designation || "",
    department: payslip.department || employee?.department || "",
    dateOfJoining: payslip.dateOfJoining || employee?.joinDate || "",
    bankAccount: payslip.bankAccount || employee?.bankAccount || "",
    basicPay,
    houseRentAllowance,
    overtimeBonus,
    specialAllowance,
    incomeTaxTds,
    gross,
    deductions,
    net: Number(payslip.net ?? Math.max(0, gross - deductions)),
  };
}

function earningsRows(payslip: Payslip): PayslipRow[] {
  return [
    { label: "Basic Pay", amount: payslip.basicPay || 0 },
    { label: "House Rent Allowance", amount: payslip.houseRentAllowance || 0 },
    { label: "Overtime Bonus", amount: payslip.overtimeBonus || 0 },
    { label: "Special Allowance", amount: payslip.specialAllowance || 0 },
    { label: "Gross Earnings", amount: payslip.gross || 0 },
  ];
}

function deductionRows(payslip: Payslip): PayslipRow[] {
  return [
    { label: "Income Tax (TDS)", amount: payslip.incomeTaxTds || 0 },
    { label: "", amount: 0 },
    { label: "", amount: 0 },
    { label: "", amount: 0 },
    { label: "Total Deductions", amount: payslip.deductions || 0 },
  ];
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

function downloadBlob(content: BlobPart, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function payslipFilename(payslip: Payslip, extension: "pdf" | "doc") {
  return `payslip-${safeName(payslip.employeeName || "employee")}-${safeName(payslip.month)}.${extension}`;
}

export function downloadPayslipDoc(
  payslipInput: Payslip,
  employee?: PayslipEmployee,
  company?: Company,
) {
  const payslip = normalizePayslip(payslipInput, employee);
  const companyName = company?.name || "BRAJMART ECOMTECH LLP";
  const logo = company?.logo || "/logo.jpeg";
  const earnings = earningsRows(payslip);
  const deductions = deductionRows(payslip);
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
body{font-family:Arial,sans-serif;color:#111;margin:36px}
.slip{width:720px;margin:auto;border:1px solid #111;padding:22px}
.head{display:flex;align-items:flex-start;gap:16px;text-align:center}
.logo{width:72px;height:72px;object-fit:contain}
.company{flex:1;font-weight:700;font-size:20px}
.address{font-weight:400;font-size:12px;margin-top:6px}
.title{font-weight:700;text-align:center;margin:18px 0 4px;font-size:18px}
.month{text-align:center;font-weight:700;margin-bottom:18px}
.section{font-weight:700;background:#f0f0f0;border:1px solid #111;padding:6px;margin-top:10px}
table{width:100%;border-collapse:collapse;font-size:12px}
td,th{border:1px solid #111;padding:7px;vertical-align:middle}
th{background:#f0f0f0;text-align:left}
.amount{text-align:right;white-space:nowrap}
.net td{font-size:14px;font-weight:700}
.words{border:1px solid #111;border-top:0;padding:8px;font-size:12px}
</style>
</head>
<body>
<div class="slip">
  <div class="head">
    <img class="logo" src="${escapeHtml(logo)}" />
    <div class="company">${escapeHtml(companyName.toUpperCase())}<div class="address">721, Keshav Kunj, Near ISKCON Temple, Vrindavan, Uttar Pradesh 281121</div></div>
  </div>
  <div class="title">PAYSLIP</div>
  <div class="month">${escapeHtml(titleMonth(payslip.month))}</div>
  <div class="section">EMPLOYEE DETAILS</div>
  <table>
    <tr><td>Employee Name</td><td>${escapeHtml(payslip.employeeName)}</td><td>Employee No.</td><td>${escapeHtml(payslip.employeeNo)}</td></tr>
    <tr><td>Designation</td><td>${escapeHtml(payslip.designation)}</td><td>Department</td><td>${escapeHtml(payslip.department)}</td></tr>
    <tr><td>Date of Joining</td><td>${escapeHtml(payslip.dateOfJoining)}</td><td>Bank Name</td><td>${escapeHtml(payslip.bankName)}</td></tr>
    <tr><td>Paid Days</td><td>${escapeHtml((payslip.paidDays ?? 0).toFixed(1))}</td><td>Bank Account</td><td>${escapeHtml(payslip.bankAccount)}</td></tr>
    <tr><td>LOP Days</td><td>${escapeHtml((payslip.lopDays ?? 0).toFixed(1))}</td><td>PAN</td><td>${escapeHtml(payslip.pan)}</td></tr>
  </table>
  <div class="section">EMPLOYEE PAY SUMMARY</div>
  <table>
    <tr><th>EARNINGS</th><th>AMOUNT</th><th>DEDUCTIONS</th><th>AMOUNT</th></tr>
    ${earnings
      .map(
        (earning, index) =>
          `<tr><td>${escapeHtml(earning.label)}</td><td class="amount">${formatCurrency(earning.amount)}</td><td>${escapeHtml(
            deductions[index]?.label || "",
          )}</td><td class="amount">${deductions[index]?.label ? formatCurrency(deductions[index].amount) : ""}</td></tr>`,
      )
      .join("")}
    <tr class="net"><td colspan="2">NET MONTHLY SALARY</td><td colspan="2" class="amount">${formatCurrency(payslip.net)}</td></tr>
  </table>
  <div class="words">Amount in words: ${escapeHtml(numberToWords(payslip.net))}</div>
</div>
</body>
</html>`;
  downloadBlob(html, "application/msword", payslipFilename(payslip, "doc"));
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadPayslipPdf(
  payslipInput: Payslip,
  employee?: PayslipEmployee,
  company?: Company,
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const payslip = normalizePayslip(payslipInput, employee);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const companyName = company?.name || "BRAJMART ECOMTECH LLP";

  try {
    const logo = await imageToDataUrl(company?.logo || "/logo.jpeg");
    doc.addImage(logo, "JPEG", left, 34, 58, 58);
  } catch {
    doc.rect(left, 34, 58, 58);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(companyName.toUpperCase(), pageWidth / 2, 48, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "721, Keshav Kunj, Near ISKCON Temple, Vrindavan, Uttar Pradesh 281121",
    pageWidth / 2,
    66,
    {
      align: "center",
    },
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PAYSLIP", pageWidth / 2, 108, { align: "center" });
  doc.setFontSize(12);
  doc.text(titleMonth(payslip.month), pageWidth / 2, 128, { align: "center" });

  autoTable(doc, {
    startY: 154,
    head: [["EMPLOYEE DETAILS", "", "", ""]],
    body: [
      ["Employee Name", payslip.employeeName || "", "Employee No.", payslip.employeeNo || ""],
      ["Designation", payslip.designation || "", "Department", payslip.department || ""],
      ["Date of Joining", payslip.dateOfJoining || "", "Bank Name", payslip.bankName || ""],
      ["Paid Days", (payslip.paidDays ?? 0).toFixed(1), "Bank Account", payslip.bankAccount || ""],
      ["LOP Days", (payslip.lopDays ?? 0).toFixed(1), "PAN", payslip.pan || ""],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, lineColor: 20, lineWidth: 0.6 },
    headStyles: { fillColor: [232, 232, 232], textColor: 20, fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 0) data.cell.colSpan = 4;
      if (data.section === "head" && data.column.index > 0) data.cell.text = [];
      if (data.section === "body" && [0, 2].includes(data.column.index))
        data.cell.styles.fontStyle = "bold";
    },
    margin: { left, right: left },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 260;
  const earnings = earningsRows(payslip);
  const deductions = deductionRows(payslip);
  autoTable(doc, {
    startY: finalY + 16,
    head: [
      ["EMPLOYEE PAY SUMMARY", "", "", ""],
      ["EARNINGS", "AMOUNT", "DEDUCTIONS", "AMOUNT"],
    ],
    body: [
      ...earnings.map((earning, index) => [
        earning.label,
        formatCurrency(earning.amount),
        deductions[index]?.label || "",
        deductions[index]?.label ? formatCurrency(deductions[index].amount) : "",
      ]),
      ["NET MONTHLY SALARY", "", "", formatCurrency(payslip.net)],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, lineColor: 20, lineWidth: 0.6 },
    headStyles: { fillColor: [232, 232, 232], textColor: 20, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "head" && data.row.index === 0 && data.column.index === 0)
        data.cell.colSpan = 4;
      if (data.section === "head" && data.row.index === 0 && data.column.index > 0)
        data.cell.text = [];
      if (data.row.index === earnings.length) data.cell.styles.fontStyle = "bold";
    },
    margin: { left, right: left },
  });

  const payY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 430;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Amount in words: ${numberToWords(payslip.net)}`, left + 6, payY + 20);
  doc.save(payslipFilename(payslip, "pdf"));
}

export function PayslipTemplate({
  payslip: payslipInput,
  employee,
  company,
}: {
  payslip: Payslip;
  employee?: PayslipEmployee;
  company?: Company;
}) {
  const payslip = normalizePayslip(payslipInput, employee);
  const earnings = earningsRows(payslip);
  const deductions = deductionRows(payslip);
  return (
    <div className="mx-auto max-w-[760px] border border-slate-950 bg-white p-5 text-slate-950 shadow-sm">
      <div className="flex items-start gap-4 text-center">
        <img src={company?.logo || "/logo.jpeg"} alt="" className="h-16 w-16 object-contain" />
        <div className="flex-1">
          <div className="text-xl font-bold">
            {(company?.name || "BRAJMART ECOMTECH LLP").toUpperCase()}
          </div>
          <div className="mt-1 text-xs">
            721, Keshav Kunj, Near ISKCON Temple, Vrindavan, Uttar Pradesh 281121
          </div>
        </div>
      </div>
      <div className="mt-5 text-center text-lg font-bold">PAYSLIP</div>
      <div className="mb-4 text-center text-sm font-bold">{titleMonth(payslip.month)}</div>
      <div className="border border-slate-950 bg-slate-100 px-2 py-1 text-sm font-bold">
        EMPLOYEE DETAILS
      </div>
      <table className="w-full border-collapse text-xs">
        <tbody>
          <tr>
            <td className="border border-slate-950 p-2 font-medium">Employee Name</td>
            <td className="border border-slate-950 p-2">{payslip.employeeName}</td>
            <td className="border border-slate-950 p-2 font-medium">Employee No.</td>
            <td className="border border-slate-950 p-2">{payslip.employeeNo}</td>
          </tr>
          <tr>
            <td className="border border-slate-950 p-2 font-medium">Designation</td>
            <td className="border border-slate-950 p-2">{payslip.designation}</td>
            <td className="border border-slate-950 p-2 font-medium">Department</td>
            <td className="border border-slate-950 p-2">{payslip.department}</td>
          </tr>
          <tr>
            <td className="border border-slate-950 p-2 font-medium">Date of Joining</td>
            <td className="border border-slate-950 p-2">{payslip.dateOfJoining}</td>
            <td className="border border-slate-950 p-2 font-medium">Bank Name</td>
            <td className="border border-slate-950 p-2">{payslip.bankName}</td>
          </tr>
          <tr>
            <td className="border border-slate-950 p-2 font-medium">Paid Days</td>
            <td className="border border-slate-950 p-2">{(payslip.paidDays ?? 0).toFixed(1)}</td>
            <td className="border border-slate-950 p-2 font-medium">Bank Account</td>
            <td className="border border-slate-950 p-2">{payslip.bankAccount}</td>
          </tr>
          <tr>
            <td className="border border-slate-950 p-2 font-medium">LOP Days</td>
            <td className="border border-slate-950 p-2">{(payslip.lopDays ?? 0).toFixed(1)}</td>
            <td className="border border-slate-950 p-2 font-medium">PAN</td>
            <td className="border border-slate-950 p-2">{payslip.pan}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3 border border-slate-950 bg-slate-100 px-2 py-1 text-sm font-bold">
        EMPLOYEE PAY SUMMARY
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-slate-950 p-2 text-left">EARNINGS</th>
            <th className="border border-slate-950 p-2 text-right">AMOUNT</th>
            <th className="border border-slate-950 p-2 text-left">DEDUCTIONS</th>
            <th className="border border-slate-950 p-2 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning, index) => (
            <tr key={earning.label}>
              <td className="border border-slate-950 p-2">{earning.label}</td>
              <td className="border border-slate-950 p-2 text-right">
                {formatCurrency(earning.amount)}
              </td>
              <td className="border border-slate-950 p-2">{deductions[index]?.label}</td>
              <td className="border border-slate-950 p-2 text-right">
                {deductions[index]?.label ? formatCurrency(deductions[index].amount) : ""}
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border border-slate-950 p-2" colSpan={2}>
              NET MONTHLY SALARY
            </td>
            <td className="border border-slate-950 p-2 text-right" colSpan={2}>
              {formatCurrency(payslip.net)}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="border border-t-0 border-slate-950 p-2 text-xs">
        Amount in words: {numberToWords(payslip.net)}
      </div>
    </div>
  );
}
