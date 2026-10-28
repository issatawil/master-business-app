import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { AskAIBox } from "../components/AskAIBox";
import { DueDate } from "../components/DueDate";
import { ErrorState } from "../components/ErrorState";
import { DownloadIcon, InboxIcon } from "../components/icons";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../lib/auth-context";
import { formatCurrency, formatDate } from "../lib/format";
import { csvCell } from "../lib/csv";
import type { ProjectStatus, ProjectSummary } from "../lib/types";

type StatusFilter = ProjectStatus | "ALL";
const STATUS_OPTIONS: StatusFilter[] = ["ALL", "RFQ", "QUOTED", "ORDERED", "SHIPPING", "CLOSED"];

function exportProjectsCsv(projects: ProjectSummary[]) {
  // Export only the fields the role-filtered API actually returned.
  const header = ["Project", "Customer", "Status", "Owner", "Due Date", "Value", "Currency"];
  const rows = projects.map(p => {
    const value = p.financial?.estimatedRevenue ?? p.financial?.estimatedCost;
    return [
      p.projectName, p.customer?.name ?? "", p.status, p.owner?.name ?? "",
      formatDate(p.dueDate), value == null ? "" : String(value),
      value == null ? "" : p.financial?.currency ?? "",
    ];
  });
  const csv = [header, ...rows].map(r => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `projects-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ProjectMobileCard({ project: p }: { project: ProjectSummary }) {
  const f = p.financial;
  const value = f?.estimatedRevenue ?? f?.estimatedCost;
  const attention = p.needsAttention;
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/projects/${p.id}`} className="block truncate text-sm font-semibold text-neutral-900 hover:text-indigo-600">
            {p.projectName}
          </Link>
          <p className="mt-1 truncate text-xs text-neutral-500">{p.customer?.name ?? "No customer"} · {p.owner?.name ?? "Unassigned"}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {attention.overdue && <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700">Overdue</span>}
        {attention.blockedShipment && <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700">Payment hold</span>}
        {attention.lowMargin && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">Low margin</span>}
        {attention.missingNextAction && <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700">No next action</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Due date</p>
          <div className="mt-1 text-xs text-neutral-700"><DueDate date={p.dueDate} overdue={attention.overdue}/></div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Project value</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900">
            {value == null ? "—" : formatCurrency(value, f?.currency)}
          </p>
        </div>
      </div>
      <Link to={`/projects/${p.id}`} className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
        View project details
      </Link>
    </article>
  );
}

export function ProjectsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useProjects();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const projects = data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter(p =>
      (status === "ALL" || p.status === status) &&
      (!q ||
        p.projectName.toLowerCase().includes(q) ||
        (p.customer?.name ?? "").toLowerCase().includes(q) ||
        (p.owner?.name ?? "").toLowerCase().includes(q))
    );
  }, [projects, search, status]);
  const canCreate = user?.role === "ADMIN" || user?.role === "SALES";

  return (
    <div className="animate-fade-in w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        title="Projects"
        subtitle="Manage customer requests, quotations, orders, shipping, and closed projects"
        actions={
          <>
            <button type="button" disabled={filtered.length === 0}
              onClick={() => {
                if (window.confirm("Export visible business data to CSV? Keep the downloaded file secure."))
                  exportProjectsCsv(filtered);
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50">
              <DownloadIcon className="h-4 w-4"/> Export
            </button>
            {canCreate && <Link to="/projects/new" className="inline-flex min-h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">+ New Project</Link>}
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search projects or customers</span>
            <input aria-label="Search projects or customers" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search projects or customers..."
              className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          </label>
          <select aria-label="Filter projects by status" value={status} onChange={e=>setStatus(e.target.value as StatusFilter)}
            className="min-h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-indigo-500">
            {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s==="ALL"?"All Statuses":s}</option>)}
          </select>
        </div>
      </PageHeader>

      <AskAIBox title="Ask AI about your projects" placeholder="e.g. Which projects are overdue?" />
      {error && <ErrorState message="Failed to load projects." onRetry={()=>refetch()}/>}
      {isLoading && <p role="status" className="rounded-lg bg-white p-6 text-sm text-neutral-500">Loading projects…</p>}
      {!isLoading && !error && (
        <>
          <p className="mb-3 text-xs font-medium text-neutral-500">{filtered.length} of {projects.length} projects</p>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-10 text-center">
              <InboxIcon className="h-7 w-7 text-neutral-300"/>
              <p className="text-sm font-medium text-neutral-700">No projects match your filters.</p>
              <button type="button" onClick={()=>{setSearch("");setStatus("ALL");}} className="text-sm font-medium text-indigo-600 hover:underline">Clear filters</button>
            </div>
          )}
          {filtered.length > 0 && (
            <>
              <div className="grid gap-3 md:hidden" data-testid="projects-mobile-list">
                {filtered.map(p=><ProjectMobileCard key={p.id} project={p}/>)}
              </div>
              <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[740px] text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th scope="col" className="px-4 py-3">Project</th>
                        <th scope="col" className="px-4 py-3">Customer</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3">Owner</th>
                        <th scope="col" className="px-4 py-3">Due</th>
                        <th scope="col" className="px-4 py-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p=>(
                        <tr key={p.id} className="border-t border-neutral-100 transition hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            <Link to={`/projects/${p.id}`} className="font-semibold text-neutral-900 hover:text-indigo-700 hover:underline">{p.projectName}</Link>
                            <p className="mt-1 font-mono text-[11px] text-neutral-400">{p.id.slice(-8).toUpperCase()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-neutral-600">
                              {p.customer?.name&&<Avatar name={p.customer.name}/>}
                              {p.customer?.name??"—"}
                            </div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                          <td className="px-4 py-3 text-neutral-600">{p.owner?.name??"—"}</td>
                          <td className="px-4 py-3 text-neutral-600"><DueDate date={p.dueDate} overdue={p.needsAttention.overdue}/></td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-700">
                            {p.financial?.estimatedRevenue!=null||p.financial?.estimatedCost!=null
                              ? formatCurrency(p.financial?.estimatedRevenue??p.financial?.estimatedCost,p.financial?.currency)
                              :"—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
