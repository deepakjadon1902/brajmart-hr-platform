import { Bell, Globe, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { setLanguage } from "@/store/slices/themeSlice";
import { logout } from "@/store/slices/authSlice";
import { setActive } from "@/store/slices/companySlice";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/common/BrandLogo";

export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const theme = useAppSelector((s) => s.theme);
  const company = useAppSelector((s) => s.company);
  const { t, i18n } = useTranslation();

  const onLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/5 bg-white/90 px-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        className="md:flex"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <BrandLogo compact className="h-9 w-9 rounded-full p-1 md:hidden" />

      <div className="relative hidden max-w-md flex-1 lg:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="border-black/5 bg-muted/70 pl-9 shadow-none"
          placeholder="Search employees, leaves, assets..."
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user?.role === "super-admin" && (
          <Select value={company.activeId} onValueChange={(v) => dispatch(setActive(v))}>
            <SelectTrigger className="hidden h-9 w-48 border-black/5 bg-muted/70 shadow-none md:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {company.list.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Language">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["en", "hi"] as const).map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => {
                  dispatch(setLanguage(l));
                  i18n.changeLanguage(l);
                }}
              >
                {l === "en" ? "English" : "Hindi"} {theme.language === l && "Selected"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-black/5 bg-white py-1 pl-1 pr-3 shadow-soft transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs leading-tight sm:block">
                <div className="font-semibold">{user?.name}</div>
                <div className="text-muted-foreground">{user?.designation}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
