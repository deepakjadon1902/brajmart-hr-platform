import { useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store";
import { createHoliday, deleteHoliday, updateHoliday } from "@/store/slices/workspaceSlice";
import { todayInIndia } from "@/utils/date";
import type { Holiday } from "@/types";
import { toast } from "sonner";

type HolidayForm = Pick<Holiday, "name" | "date" | "type">;

const blankHoliday = (): HolidayForm => ({ name: "", date: todayInIndia(), type: "company" });

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function Holidays() {
  const dispatch = useAppDispatch();
  const holidays = useAppSelector((state) => state.workspace.holidays);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<HolidayForm>(blankHoliday);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedHolidays = [...holidays].sort(
    (first, second) => first.date.localeCompare(second.date) || first.name.localeCompare(second.name),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(blankHoliday());
    setFormOpen(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditing(holiday);
    setForm({ name: holiday.name, date: holiday.date, type: holiday.type });
    setFormOpen(true);
  };

  const saveHoliday = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      date: form.date,
      type: form.type,
    };
    if (!payload.name || !payload.date) {
      toast.error("Enter a holiday name and date");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateHoliday({ id: editing.id, ...payload })).unwrap();
        toast.success(`${payload.name} updated`);
      } else {
        await dispatch(createHoliday(payload)).unwrap();
        toast.success(`${payload.name} added to the holiday calendar`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to save holiday"));
    } finally {
      setSaving(false);
    }
  };

  const removeHoliday = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await dispatch(deleteHoliday(deleting.id)).unwrap();
      toast.success(`${deleting.name} removed from the holiday calendar`);
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to delete holiday"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Management"
        subtitle="Manage company holidays shared with employees in this workspace."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add holiday
          </Button>
        }
      />

      <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span>Holiday changes are shared with employee portals for this company.</span>
      </div>

      <DataTable
        data={sortedHolidays}
        searchKeys={["name", "date", "type"]}
        emptyMessage="No holidays yet. Add a holiday to publish it to employee calendars."
        columns={[
          { key: "name", header: "Holiday" },
          { key: "date", header: "Date", render: (holiday) => formatDate(holiday.date) },
          { key: "type", header: "Category", render: (holiday) => <StatusBadge status={holiday.type} /> },
          {
            key: "id",
            header: "Actions",
            render: (holiday) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Edit ${holiday.name}`}
                  onClick={() => openEdit(holiday)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Delete ${holiday.name}`}
                  onClick={() => setDeleting(holiday)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit holiday" : "Add holiday"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveHoliday}>
            <div>
              <Label htmlFor="holiday-name">Holiday name</Label>
              <Input
                id="holiday-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="For example, Independence Day"
                minLength={2}
                maxLength={120}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="holiday-date">Date</Label>
              <Input
                id="holiday-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.type}
                onValueChange={(type) =>
                  setForm((current) => ({ ...current, type: type as Holiday["type"] }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add holiday"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be removed from the company calendar and employee portals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void removeHoliday();
              }}
            >
              {saving ? "Deleting..." : "Delete holiday"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
