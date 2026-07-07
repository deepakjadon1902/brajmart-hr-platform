import { User } from "../models/User.js";

const permanentAccounts = [
  [
    "BrajMart Employee",
    "employee@brajmart.com",
    "employee",
    "Operations",
    "Employee",
    "@Employee108#",
  ],
  ["BrajMart HR", "hr@brajmart.com", "hr", "People", "HR Administrator", "@RadheKrishna108#"],
  [
    "BrajMart Team Manager",
    "manager@brajmart.com",
    "team-manager",
    "Operations",
    "Team Manager",
    "@Govind108#",
  ],
  [
    "Anish BrajMart",
    "anish@brajmart.com",
    "super-admin",
    "Executive",
    "Super Administrator",
    "@HareKrishna108#",
  ],
  [
    "BrajMart Digital Marketing",
    "marketing@brajmart.com",
    "digital-marketing",
    "Marketing",
    "Digital Marketing",
    "@Marketing108#",
  ],
];

const obsoleteDemoEmails = [
  "marketing@demo.com",
  "admin@demo.com",
  "manager@demo.com",
  "hr@demo.com",
  "user1@brajmart.com",
];

export async function ensurePermanentAccounts() {
  await User.deleteMany({ email: { $in: obsoleteDemoEmails } });
  const fallbackPassword = `BrajMart@${new Date().getFullYear()}`;

  for (const [name, email, role, department, designation, password] of permanentAccounts) {
    const existing = await User.findOne({ email }).select("+passwordHash");
    if (existing) {
      existing.name = existing.name || name;
      existing.role = role;
      existing.department = existing.department || department;
      existing.designation = existing.designation || designation;
      existing.status = "active";
      if (!existing.passwordHash) await existing.setPassword(password);
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

  const usersWithoutPasswords = await User.find({
    $or: [{ passwordHash: { $exists: false } }, { passwordHash: "" }, { passwordHash: null }],
    status: { $ne: "inactive" },
  }).select("+passwordHash");

  for (const user of usersWithoutPasswords) {
    await user.setPassword(fallbackPassword);
    await user.save();
  }
}
