import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateProject, useCustomers } from "../hooks/useProjects";

const inputClass = "min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-neutral-600";

export function NewProjectPage() {
  const { data: customers, isLoading, error: customersError, refetch } = useCustomers();
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedRevenue, setEstimatedRevenue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!projectName.trim() || !customerId) {
      setError("A project name and customer are required.");
      return;
    }
    if (!estimatedRevenue || !Number.isFinite(Number(estimatedRevenue)) || Number(estimatedRevenue) <= 0) {
      setError("Estimated revenue must be greater than 0 — it can't be left blank or zero.");
      return;
    }
    try {
      const created = await createProject.mutateAsync({
        projectName: projectName.trim(),
        customerId,
        nextAction: nextAction.trim() || undefined,
        dueDate: dueDate || undefined,
        description: description.trim() || undefined,
        estimatedRevenue: Number(estimatedRevenue),
        currency,
      });
      navigate(`/projects/${created.id}`, { replace: true });
    } catch (err) {
      const response = err as { response?: { data?: { error?: string } } };
      setError(response.response?.data?.error || "Could not create the project. Please review the fields and retry.");
    }
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-4xl px-4 py-5 sm:px-8 sm:py-6">
      <Link to="/projects" className="mb-4 inline-flex text-xs font-medium text-neutral-500 hover:text-indigo-600">
        ← Back to Projects
      </Link>
      <header className="mb-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">New Project (RFQ)</h1>
            <p className="mt-1 text-sm text-neutral-500">Create a customer request for quotation. The supplier and purchase cost can be added later by Procurement.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">RFQ</span>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Request Details</h2>
          <p className="mt-1 text-xs text-neutral-400">Required fields are marked with an asterisk.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-project-name" className={labelClass}>Project Name *</label>
            <input id="new-project-name" required maxLength={160} value={projectName} onChange={e=>setProjectName(e.target.value)}
              placeholder="e.g. Acme Office Furniture Batch 4" className={inputClass}/>
          </div>
          <div>
            <label htmlFor="new-project-customer" className={labelClass}>Customer *</label>
            <select id="new-project-customer" required value={customerId} onChange={e=>setCustomerId(e.target.value)}
              disabled={isLoading || !!customersError || !customers?.length} className={inputClass}>
              <option value="">Select a customer...</option>
              {customers?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {customersError && <button type="button" onClick={()=>refetch()} className="mt-1 text-xs font-medium text-red-700 underline">Could not load customers. Retry</button>}
            {!isLoading && !customersError && !customers?.length && <p className="mt-1 text-xs text-amber-700">No customers yet. <Link to="/customers" className="font-semibold underline">Add a customer</Link> first.</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="new-project-description" className={labelClass}>Description / Details</label>
            <textarea id="new-project-description" rows={3} value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Products, quantities, delivery requirements…" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          </div>
          <div>
            <label htmlFor="new-project-revenue" className={labelClass}>Est. Revenue (rough ask) *</label>
            <input id="new-project-revenue" required type="number" min="0.01" step="0.01" value={estimatedRevenue}
              onChange={e=>setEstimatedRevenue(e.target.value)} placeholder="0.00" className={inputClass}/>
          </div>
          <div>
            <label htmlFor="new-project-currency" className={labelClass}>Currency</label>
            <select id="new-project-currency" value={currency} onChange={e=>setCurrency(e.target.value)} className={inputClass}>
              <option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="LBP">LBP — Lebanese Pound</option>
            </select>
          </div>
          <div>
            <label htmlFor="new-project-next-action" className={labelClass}>Next Action</label>
            <input id="new-project-next-action" value={nextAction} onChange={e=>setNextAction(e.target.value)}
              placeholder="e.g. Request supplier quotation" className={inputClass}/>
          </div>
          <div>
            <label htmlFor="new-project-due" className={labelClass}>Due Date</label>
            <input id="new-project-due" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className={inputClass}/>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center">
          <Link to="/projects" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 px-5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</Link>
          <button type="submit" disabled={createProject.isPending || isLoading || !customers?.length}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {createProject.isPending?"Creating...":"Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
