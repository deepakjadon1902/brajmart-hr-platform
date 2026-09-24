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

function splitMonth(value: string) {
  const parts = titleMonth(value).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { month: parts[0] || "", year: "" };
  return { month: parts.slice(0, -1).join(" "), year: parts[parts.length - 1] };
}

function employeeCode(employee?: PayslipEmployee, payslip?: Payslip) {
  return (
    payslip?.employeeNo ||
    (employee?.id ? `BM${String(employee.id).slice(-3).toUpperCase()}` : "BM")
  );
}

function formatEmployeeDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN");
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
    dateOfJoining: formatEmployeeDate(employee?.joinDate),
    bankName: employee?.bankName || "",
    bankAccount: employee?.bankAccount || "",
    pan: employee?.pan || "",
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
    dateOfJoining: payslip.dateOfJoining || formatEmployeeDate(employee?.joinDate),
    bankName: payslip.bankName || employee?.bankName || "",
    bankAccount: payslip.bankAccount || employee?.bankAccount || "",
    pan: payslip.pan || employee?.pan || "",
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
    { label: "Income Tax TDS", amount: payslip.incomeTaxTds || 0 },
    { label: "", amount: 0 },
    { label: "", amount: 0 },
    { label: "", amount: 0 },
    { label: "Total Deductions", amount: payslip.deductions || 0 },
  ];
}

function safeName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

export function payslipFilename(payslip: Payslip) {
  return `payslip-${safeName(payslip.employeeName || "employee")}-${safeName(payslip.month)}.pdf`;
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
  const { default: jsPDF } = await import("jspdf");
  const payslip = normalizePayslip(payslipInput, employee);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const right = pageWidth - left;
  const brand = [36, 74, 116] as const;
  const accent = [54, 90, 124] as const;
  const text = [34, 34, 34] as const;
  const muted = [75, 85, 99] as const;
  const labelFill = [243, 246, 249] as const;
  const rule = [217, 226, 236] as const;
  const companyName = company?.name || "BRAJMART ECOMTECH LLP";
  const period = splitMonth(payslip.month);
  const details = [
    ["Employee Name", payslip.employeeName || "", "Employee No.", payslip.employeeNo || ""],
    ["Designation", payslip.designation || "", "Department", payslip.department || ""],
    ["Date of Joining", payslip.dateOfJoining || "", "Bank Name", payslip.bankName || ""],
    ["Paid Days", (payslip.paidDays ?? 0).toFixed(1), "Bank Account", payslip.bankAccount || ""],
    ["LOP Days", (payslip.lopDays ?? 0).toFixed(1), "PAN", payslip.pan || ""],
  ];
  const earnings = earningsRows(payslip);
  const deductions = deductionRows(payslip);

  const setColor = (color: readonly number[]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const label = (value: string, x: number, y: number, width: number, height: number) => {
    doc.setFillColor(...labelFill);
    doc.rect(x, y, width, height, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(accent);
    doc.text(value, x + 4, y + height / 2 + 3);
  };
  const value = (
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    align = "left",
  ) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(text);
    doc.text(content, align === "right" ? x + width - 4 : x + 4, y + height / 2 + 3, {
      align: align as "left" | "right",
      maxWidth: width - 8,
    });
  };
  const row = (items: string[], y: number, widths: number[], aligns: string[] = []) => {
    let x = left;
    items.forEach((item, index) => {
      const width = widths[index];
      if (index % 2 === 0) label(item, x, y, width, 18);
      else value(item, x, y, width, 18, aligns[index] || "left");
      doc.setDrawColor(...rule);
      doc.rect(x, y, width, 18);
      x += width;
    });
  };

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor([107, 114, 128]);
  doc.text(
    "This is a system-generated document and does not require a signature.",
    pageWidth / 2,
    pageHeight - 38,
    {
      align: "center",
    },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(brand);
  const companyParts = companyName.toUpperCase().split(" ");
  doc.text(companyParts.slice(0, -1).join(" ") || companyName.toUpperCase(), left, 52);
  doc.text(companyParts.at(-1) || "", left, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(muted);
  doc.text("B, Keshav Kunj, Near ISKCON Temple, Vrindavan, Uttar", left, 96);
  doc.text("Pradesh 281121", left, 107);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(brand);
  doc.text("PAYSLIP", right, 52, { align: "right" });
  doc.setFontSize(12);
  setColor(accent);
  doc.text([period.month, period.year].filter(Boolean).join(" "), right, 80, { align: "right" });
  doc.setFillColor(...brand);
  doc.rect(left, 110, right - left, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setColor(brand);
  doc.text("EMPLOYEE DETAILS", left, 143);
  const detailWidths = [98, 160, 98, 160];
  details.forEach((item, index) => row(item, 153 + index * 19, detailWidths));

  const summaryTop = 276;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setColor(brand);
  doc.text("EMPLOYEE PAY SUMMARY", left, summaryTop);
  const summaryWidths = [190, 110, 160, 56];
  const tableTop = summaryTop + 11;
  row(["EARNINGS", "AMOUNT", "DEDUCTIONS", "AMOUNT"], tableTop, summaryWidths, [
    "left",
    "right",
    "left",
    "right",
  ]);
  earnings.forEach((earning, index) => {
    const deduction = deductions[index];
    const y = tableTop + 18 + index * 19;
    value(earning.label, left, y, summaryWidths[0], 18);
    value(
      formatCurrency(earning.amount),
      left + summaryWidths[0],
      y,
      summaryWidths[1],
      18,
      "right",
    );
    value(
      deduction?.label || "",
      left + summaryWidths[0] + summaryWidths[1],
      y,
      summaryWidths[2],
      18,
    );
    value(
      deduction?.label ? formatCurrency(deduction.amount) : "",
      left + summaryWidths[0] + summaryWidths[1] + summaryWidths[2],
      y,
      summaryWidths[3],
      18,
      "right",
    );
    let x = left;
    summaryWidths.forEach((width) => {
      doc.setDrawColor(...rule);
      doc.rect(x, y, width, 18);
      x += width;
    });
  });

  const netY = tableTop + 18 + earnings.length * 19;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(brand);
  doc.text("NET MONTHLY SALARY", left + 4, netY + 12);
  doc.text(formatCurrency(payslip.net), right - 4, netY + 12, { align: "right" });
  doc.setDrawColor(...rule);
  doc.rect(left, netY, right - left, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(text);
  doc.text(`Amount in words: ${numberToWords(payslip.net)}`, left + 4, netY + 41, {
    maxWidth: right - left - 8,
  });
  doc.save(payslipFilename(payslip));
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
  const period = splitMonth(payslip.month);
  const details = [
    ["Employee Name", payslip.employeeName, "Employee No.", payslip.employeeNo],
    ["Designation", payslip.designation, "Department", payslip.department],
    ["Date of Joining", payslip.dateOfJoining, "Bank Name", payslip.bankName],
    ["Paid Days", (payslip.paidDays ?? 0).toFixed(1), "Bank Account", payslip.bankAccount],
    ["LOP Days", (payslip.lopDays ?? 0).toFixed(1), "PAN", payslip.pan],
  ];
  return (
    <div className="mx-auto max-w-[760px] bg-white p-8 text-slate-900 shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-2xl font-bold leading-tight text-[#244a74]">
            {(company?.name || "BRAJMART ECOMTECH LLP").toUpperCase()}
          </div>
          <div className="mt-3 max-w-[280px] text-xs leading-5 text-slate-600">
            B, Keshav Kunj, Near ISKCON Temple, Vrindavan, Uttar Pradesh 281121
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#244a74]">PAYSLIP</div>
          <div className="mt-5 text-base font-bold text-[#425d7b]">
            {[period.month, period.year].filter(Boolean).join(" ")}
          </div>
        </div>
      </div>
      <div className="mt-6 h-0.5 bg-[#244a74]" />

      <div className="mt-8 text-sm font-bold text-[#244a74]">EMPLOYEE DETAILS</div>
      <table className="mt-3 w-full border-collapse text-xs">
        <tbody>
          {details.map((item) => (
            <tr key={`${item[0]}-${item[2]}`}>
              <td className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 font-bold text-[#365a7c]">
                {item[0]}
              </td>
              <td className="border border-[#d9e2ec] px-2 py-1.5">{item[1]}</td>
              <td className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 font-bold text-[#365a7c]">
                {item[2]}
              </td>
              <td className="border border-[#d9e2ec] px-2 py-1.5">{item[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-sm font-bold text-[#244a74]">EMPLOYEE PAY SUMMARY</div>
      <table className="mt-3 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 text-left text-[#365a7c]">
              EARNINGS
            </th>
            <th className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 text-right text-[#365a7c]">
              AMOUNT
            </th>
            <th className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 text-left text-[#365a7c]">
              DEDUCTIONS
            </th>
            <th className="border border-[#d9e2ec] bg-[#f3f6f9] px-2 py-1.5 text-right text-[#365a7c]">
              AMOUNT
            </th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning, index) => (
            <tr key={earning.label}>
              <td className="border border-[#d9e2ec] px-2 py-1.5">{earning.label}</td>
              <td className="border border-[#d9e2ec] px-2 py-1.5 text-right">
                {formatCurrency(earning.amount)}
              </td>
              <td className="border border-[#d9e2ec] px-2 py-1.5">{deductions[index]?.label}</td>
              <td className="border border-[#d9e2ec] px-2 py-1.5 text-right">
                {deductions[index]?.label ? formatCurrency(deductions[index].amount) : ""}
              </td>
            </tr>
          ))}
          <tr className="font-bold text-[#244a74]">
            <td className="border border-[#d9e2ec] px-2 py-2" colSpan={3}>
              NET MONTHLY SALARY
            </td>
            <td className="border border-[#d9e2ec] px-2 py-2 text-right">
              {formatCurrency(payslip.net)}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-5 text-xs">Amount in words: {numberToWords(payslip.net)}</div>
      <div className="mt-24 text-center text-[11px] text-slate-500">
        This is a system-generated document and does not require a signature.
      </div>
    </div>
  );
}
