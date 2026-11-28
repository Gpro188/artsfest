"use client";

import {
  Shield,
  UserCircle,
  CheckCircle2,
  FileText,
  Trophy,
  Sparkles,
  CalendarDays,
  Clock,
  BarChart3,
  Palette,
  Radio,
  Printer,
  ClipboardList,
  Link2,
  ExternalLink,
  Image,
  AlertTriangle,
  Hand,
} from "lucide-react";

const iconMap: Record<string, any> = {
  "shield": Shield,
  "user-circle": UserCircle,
  "check-circle": CheckCircle2,
  "file-text": FileText,
  "trophy": Trophy,
  "sparkles": Sparkles,
  "calendar-days": CalendarDays,
  "clock": Clock,
  "bar-chart": BarChart3,
  "palette": Palette,
  "radio": Radio,
  "printer": Printer,
  "clipboard-list": ClipboardList,
  "link": Link2,
  "external-link": ExternalLink,
  "image": Image,
  "alert-triangle": AlertTriangle,
  "hand-wave": Hand,
};

export default function DashboardIcons({
  iconKey,
  size = 20,
  className,
}: {
  iconKey: string;
  size?: number;
  className?: string;
}) {
  const Icon = iconMap[iconKey];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={2} className={className} />;
}
