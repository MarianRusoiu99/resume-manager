import {
  User,
  Sparkles,
  FileText,
  Mail,
  Palette,
  LayoutDashboard,
  Settings,
  LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface RouteConfig {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
  parent?: string; // For breadcrumbs
  isNav?: boolean; // Show in sidebar
}

export const NAV_CONFIG: RouteConfig[] = [
  {
    title: "Dashboard",
    url: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    isNav: true,
  },
  {
    title: "Profile",
    url: ROUTES.PROFILES,
    icon: User,
    isNav: true,
  },
  {
    title: "Generate",
    url: ROUTES.GENERATE,
    icon: Sparkles,
    isNav: true,
  },
  {
    title: "Resumes",
    url: ROUTES.RESUMES,
    icon: FileText,
    isNav: true,
  },
  {
    title: "Cover Letters",
    url: ROUTES.COVER_LETTERS,
    icon: Mail,
    isNav: true,
  },
  {
    title: "Templates",
    url: ROUTES.TEMPLATES,
    icon: Palette,
    isNav: true,
  },
  {
    title: "Settings",
    url: ROUTES.SETTINGS,
    icon: Settings,
    isNav: true,
  },
];

export const ALL_ROUTES_CONFIG: RouteConfig[] = [
  ...NAV_CONFIG,
  {
    title: "Edit Resume",
    url: "/resumes/[id]/edit",
    icon: FileText,
    parent: ROUTES.RESUMES,
  },
  {
    title: "View Resume",
    url: "/resumes/[id]",
    icon: FileText,
    parent: ROUTES.RESUMES,
  },
  {
    title: "Edit Profile",
    url: "/profile/[id]",
    icon: User,
    parent: ROUTES.PROFILES,
  },
  {
    title: "API Keys",
    url: ROUTES.SETTINGS_API_KEYS,
    icon: Settings,
    parent: ROUTES.SETTINGS,
  },
  {
    title: "AI Models",
    url: ROUTES.SETTINGS_AI_MODELS,
    icon: Settings,
    parent: ROUTES.SETTINGS,
  },
];

export function getRouteConfig(pathname: string): RouteConfig | undefined {
  // First try exact match
  const exact = ALL_ROUTES_CONFIG.find(r => r.url === pathname);
  if (exact) return exact;

  // Then try dynamic route matching (very simple version)
  return ALL_ROUTES_CONFIG.find(r => {
    if (!r.url.includes('[')) return false;
    const regex = new RegExp('^' + r.url.replace(/\[.*?\]/g, '[^/]+') + '$');
    return regex.test(pathname);
  });
}
