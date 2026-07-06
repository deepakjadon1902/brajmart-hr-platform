import { User } from "../models/User.js";

const permanentAccounts = [
  ["BrajMart HR", "hr@brajmart.com", "hr", "People", "HR Administrator", "@RadheKrishna108#"],
  [
    "Anish BrajMart",
    "anish@brajmart.com",
    "super-admin",
    "Executive",
    "Super Administrator",
    "@HareKrishna108#",
  ],
];

export async function ensurePermanentAccounts() {
  for (const [name, email, role, department, designation, password] of permanentAccounts) {
    const existing = await User.findOne({ email }).select("+passwordHash");
    if (existing) {
      existing.name = existing.name || name;
      existing.role = role;
      existing.department = existing.department || department;
      existing.designation = existing.designation || designation;
      existing.status = "active";
      await existing.setPassword(password);
      await existing.save();
      continue;
    }

    const user = new User({
      name,
      email,
      role,
      companyId: "c1",
      department,
      designation,
      status: "active",
    });
    await user.setPassword(password);
    await user.save();
  }
}
