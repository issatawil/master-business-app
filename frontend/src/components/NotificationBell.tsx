import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useDismissedOverdueProjectIds, useDismissOverdueNotification } from "../hooks/useNotifications";
import { useProjects } from "../hooks/useProjects";
import { formatDate } from "../lib/format";
import { BellIcon } from "./icons";

type AlertKind = "Overdue" | "Shipment blocked" | "Low margin" | "Missing next action";
interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  dueDate: string | null;
  kind: AlertKind;
  dismissOnView: boolean;
}

const styles: Record<AlertKind, string> = {
  "Overdue": "bg-red-50 text-red-700",
  "Shipment blocked": "bg-red-50 text-red-700",
  "Low margin": "bg-amber-50 text-amber-800",
  "Missing next action": "bg-neutral-100 text-neutral-700",
};

export function NotificationBell({
  onNavigate,
  buttonClassName = "text-neutral-400 hover:bg-white/5 hover:text-white",
  align = "left",
}: {
  onNavigate?: () => void;
  buttonClassName?: string;
  align?: "left" | "right";
}) {
  const { data: projects } = useProjects({ refetchInterval: 60_000 });
  const { data: dismissedIds } = useDismissedOverdueProjectIds();
  const dismissOverdue = useDismissOverdueNotification();
  const [open, setOpen] = useState(false);
  const popupId = useId();
  const dismissed = new Set(dismissedIds ?? []);

  // Needs-attention flags arrive already filtered by server-side RBAC.
  // Never infer low-margin/cost or customer-balance status in the browser.
  const alerts: Alert[] = [];
  for (const project of projects ?? []) {
    const base = { projectId: project.id, projectName: project.projectName, dueDate: project.dueDate };
    if (project.needsAttention.overdue && !dismissed.has(project.id))
      alerts.push({ ...base, id: project.id + ":overdue", kind: "Overdue", dismissOnView: true });
    if (project.needsAttention.blockedShipment)
      alerts.push({ ...base, id: project.id + ":hold", kind: "Shipment blocked", dismissOnView: false });
    if (project.needsAttention.lowMargin)
      alerts.push({ ...base, id: project.id + ":margin", kind: "Low margin", dismissOnView: false });
    if (project.needsAttention.missingNextAction)
      alerts.push({ ...base, id: project.id + ":action", kind: "Missing next action", dismissOnView: false });
  }
  const priority: Record<AlertKind, number> = {
    "Shipment blocked": 0, "Overdue": 1, "Low margin": 2, "Missing next action": 3,
  };
  alerts.sort((a,b)=>priority[a.kind]-priority[b.kind] || a.projectName.localeCompare(b.projectName));
  const count = alerts.length;

  function handleSelect(alert: Alert) {
    setOpen(false);
    onNavigate?.();
    // Only overdue notifications have persisted dismissals in the backend.
    // All other alerts stay visible until the underlying business issue is fixed.
    if (alert.dismissOnView) dismissOverdue.mutate(alert.projectId);
  }

  return (
    <div className="relative">
      <button type="button" onClick={()=>setOpen(v=>!v)}
        aria-label="Notifications" aria-expanded={open} aria-controls={open?popupId:undefined}
        className={`relative rounded-lg p-2 transition ${buttonClassName}`}>
        <BellIcon className="h-5 w-5" />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {count>9?"9+":count}
          </span>
        )}
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" onClick={()=>setOpen(false)} aria-label="Close notifications" />
          <div id={popupId} role="dialog" aria-label="Notifications"
            className={`absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl ${align==="right"?"right-0":"left-0"}`}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Notifications ({count})</h2>
              <button type="button" onClick={()=>setOpen(false)} className="rounded px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100">Close</button>
            </div>
            <div className="max-h-[min(24rem,65vh)] overflow-y-auto">
              {count===0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Nothing needs attention. You're all caught up.</p>
              ) : alerts.slice(0,30).map(alert=>(
                <Link key={alert.id} to={`/projects/${alert.projectId}`} onClick={()=>handleSelect(alert)}
                  className="block border-b border-neutral-100 px-4 py-3 transition last:border-b-0 hover:bg-neutral-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-neutral-900">{alert.projectName}</p>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${styles[alert.kind]}`}>{alert.kind}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {alert.kind === "Overdue" ? `Due ${formatDate(alert.dueDate)}` :
                      alert.kind === "Missing next action" ? "Set a next action in project details" :
                      alert.kind === "Shipment blocked" ? "Review the shipment hold in project details" :
                      "Review this project's margin"}
                  </p>
                </Link>
              ))}
            </div>
            {count>0 && <p className="border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400">
              Other alerts disappear when the underlying issue is resolved.
            </p>}
          </div>
        </>
      )}
    </div>
  );
}
