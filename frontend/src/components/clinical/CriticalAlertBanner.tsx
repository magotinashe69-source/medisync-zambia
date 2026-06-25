import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Ban,
  Droplet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

export interface CriticalAlert {
  type: "allergy" | "anticoagulation" | "contraindication" | "other";
  /** e.g. "PENICILLIN ALLERGY" */
  title: string;
  /** e.g. "Anaphylaxis (severe) — 2015" */
  detail: string;
  /** e.g. "Avoid all penicillins" */
  action?: string;
}

interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  className?: string;
}

/** Per-type icon for each alert item. */
const ALERT_ICONS: Record<CriticalAlert["type"], LucideIcon> = {
  allergy: Ban,
  anticoagulation: Droplet,
  contraindication: AlertOctagon,
  other: AlertCircle,
};

/**
 * CriticalAlertBanner — highly visible banner for patient-safety alerts
 * (allergies, anticoagulation, contraindications) at the top of clinical
 * views. Renders nothing when there are no alerts.
 */
export function CriticalAlertBanner({
  alerts,
  className,
}: CriticalAlertBannerProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border-2 border-critical-500 bg-critical-50 p-4 shadow-lg md:p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <AlertTriangle
          size={24}
          className="text-critical-600"
          aria-hidden="true"
        />
        <h2 className="font-heading text-base font-bold text-critical-700 md:text-lg">
          CRITICAL — READ BEFORE PROCEEDING
        </h2>
      </div>

      {/* Alert items */}
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = ALERT_ICONS[alert.type];
          return (
            <div
              key={index}
              className="flex gap-3 rounded-lg border border-critical-100 bg-white p-4"
            >
              <Icon
                size={20}
                className="flex-shrink-0 text-critical-600"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-heading text-sm font-bold uppercase tracking-wide text-critical-800 md:text-base">
                  {alert.title}
                </p>
                <p className="mt-1 font-body text-sm font-medium text-gray-700">
                  {alert.detail}
                </p>
                {alert.action ? (
                  <p className="mt-2 font-body text-sm font-medium text-critical-700">
                    → {alert.action}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
