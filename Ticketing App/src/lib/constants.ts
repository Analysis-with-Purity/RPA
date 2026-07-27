import {
  CircleDotIcon,
  CircleCheckIcon,
  CircleUserIcon,
  ClockIcon,
  LoaderIcon,
  XCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  EqualIcon,
  AlertTriangleIcon,
} from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/lib/types";

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; badgeVariant: "default" | "secondary" | "success" | "warning" | "outline"; icon: typeof CircleDotIcon }
> = {
  submitted: { label: "Submitted", badgeVariant: "secondary", icon: CircleDotIcon },
  assigned: { label: "Assigned", badgeVariant: "outline", icon: CircleUserIcon },
  in_progress: { label: "In Progress", badgeVariant: "default", icon: LoaderIcon },
  awaiting_customer: { label: "Awaiting You", badgeVariant: "warning", icon: ClockIcon },
  resolved: { label: "Resolved", badgeVariant: "success", icon: CircleCheckIcon },
  closed: { label: "Closed", badgeVariant: "secondary", icon: XCircleIcon },
};

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; badgeVariant: "outline" | "secondary" | "warning" | "destructive"; icon: typeof ArrowDownIcon }
> = {
  low: { label: "Low", badgeVariant: "outline", icon: ArrowDownIcon },
  medium: { label: "Medium", badgeVariant: "secondary", icon: EqualIcon },
  high: { label: "High", badgeVariant: "warning", icon: ArrowUpIcon },
  urgent: { label: "Urgent", badgeVariant: "destructive", icon: AlertTriangleIcon },
};

export const TICKET_STEPPER_STEPS: { status: TicketStatus; label: string }[] = [
  { status: "submitted", label: "Submitted" },
  { status: "assigned", label: "Assigned" },
  { status: "in_progress", label: "In Progress" },
  { status: "awaiting_customer", label: "Awaiting You" },
  { status: "resolved", label: "Resolved" },
  { status: "closed", label: "Closed" },
];
