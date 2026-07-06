import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store";
import { setLanguage } from "@/store/slices/themeSlice";
import type { Language } from "@/store/slices/themeSlice";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
export default function P() {
  const d = useAppDispatch();
  const t = useAppSelector((s) => s.theme);
  const { i18n } = useTranslation();
  const langs: { c: Language; n: string }[] = [
    { c: "en", n: "English" },
    { c: "hi", n: "हिन्दी" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Localization" subtitle="Manage platform languages." />
      <Card className="p-6 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2">
          {langs.map((l) => (
            <Button
              key={l.c}
              variant={t.language === l.c ? "default" : "outline"}
              onClick={() => {
                d(setLanguage(l.c));
                i18n.changeLanguage(l.c);
              }}
            >
              {l.n}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
