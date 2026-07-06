import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store";
import { setLanguage, setBranding } from "@/store/slices/themeSlice";
import type { Language } from "@/store/slices/themeSlice";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function Settings() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme);
  const { i18n } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Preferences, language and branding." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold">Appearance</h3>
          <div className="mt-4">
            <Label>Language</Label>
            <Select
              value={theme.language}
              onValueChange={(v) => {
                dispatch(setLanguage(v as Language));
                i18n.changeLanguage(v);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">Branding</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Branding saved");
            }}
          >
            <div>
              <Label>Company name</Label>
              <Input
                defaultValue={theme.branding.companyName}
                onChange={(e) => dispatch(setBranding({ companyName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Primary color</Label>
              <Input
                type="color"
                defaultValue={theme.branding.primaryColor}
                onChange={(e) => dispatch(setBranding({ primaryColor: e.target.value }))}
                className="mt-1 h-10 w-24 p-1"
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
