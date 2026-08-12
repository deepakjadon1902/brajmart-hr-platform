import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSelector, useAppDispatch } from "@/store";
import { updateProfileThunk } from "@/store/slices/authSlice";
import { upsertCurrentEmployee } from "@/store/slices/workspaceSlice";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  employeeNo: z.string().max(40).optional().or(z.literal("")),
  department: z.string().max(100).optional().or(z.literal("")),
  designation: z.string().max(80).optional().or(z.literal("")),
  joinDate: z.string().optional().or(z.literal("")),
  bankName: z.string().max(120).optional().or(z.literal("")),
  bankAccount: z.string().max(80).optional().or(z.literal("")),
  pan: z.string().max(20).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof schema>;

function dateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export default function Profile() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone || "",
      employeeNo: user?.employeeNo || "",
      department: user?.department || "",
      designation: user?.designation || "",
      joinDate: dateInputValue(user?.joinDate),
      bankName: user?.bankName || "",
      bankAccount: user?.bankAccount || "",
      pan: user?.pan || "",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your personal information." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 text-center shadow-soft">
          <Avatar className="mx-auto h-24 w-24">
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-semibold">{user?.name}</h3>
          <p className="text-sm text-muted-foreground">{user?.designation}</p>
          <p className="text-xs text-muted-foreground">{user?.department}</p>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            Change photo
          </Button>
        </Card>

        <Card className="p-6 lg:col-span-2 shadow-soft">
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (v) => {
              if (!user?.id) return;
              try {
                const updated = await dispatch(
                  updateProfileThunk({ userId: user.id, profile: v }),
                ).unwrap();
                dispatch(upsertCurrentEmployee({ ...updated, status: "active" }));
                toast.success("Profile updated");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to update profile");
              }
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input {...register("name")} className="mt-1" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input {...register("email")} className="mt-1" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...register("phone")} className="mt-1" />
              </div>
              <div>
                <Label>Employee No.</Label>
                <Input {...register("employeeNo")} className="mt-1" />
              </div>
              <div>
                <Label>Department</Label>
                <Input {...register("department")} className="mt-1" />
              </div>
              <div>
                <Label>Designation</Label>
                <Input {...register("designation")} className="mt-1" />
              </div>
              <div>
                <Label>Date of Joining</Label>
                <Input type="date" {...register("joinDate")} className="mt-1" />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input {...register("bankName")} className="mt-1" />
              </div>
              <div>
                <Label>Bank Account</Label>
                <Input {...register("bankAccount")} className="mt-1" />
              </div>
              <div>
                <Label>PAN</Label>
                <Input {...register("pan")} className="mt-1 uppercase" />
              </div>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
