import { User } from "../models/User.js";

const demoUsers = [
  ["Aarav Sharma 1", "user1@brajmart.com", "employee", "Engineering", "Engineer II"],
  ["Priya Verma", "hr@demo.com", "hr", "People", "HR Partner"],
  ["Vikram Singh", "manager@demo.com", "team-manager", "Engineering", "Engineering Manager"],
  ["Megha Kapoor", "admin@demo.com", "super-admin", "Executive", "Platform Admin"],
  ["Kavya Bansal", "marketing@demo.com", "digital-marketing", "Digital Marketing", "Marketing Admin"],
];

export async function seedDemoUsers() {
  for (const [name, email, role, department, designation] of demoUsers) {
    const existing = await User.findOne({ email }).select("+passwordHash");
    if (existing) continue;

    const user = new User({
      name,
      email,
      role,
      companyId: "c1",
      department,
      designation,
      status: "active",
    });
    await user.setPassword("demo1234");
    await user.save();
  }
}
