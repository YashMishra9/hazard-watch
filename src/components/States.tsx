import { AlertTriangle, Inbox, Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="animate-spin" size={18} />{label}</div>;
}

export function EmptyState({ title, body, icon: Icon = Inbox, action }: { title: string; body: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Icon className="mb-3 text-slate-400" size={28} />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <AlertTriangle className="mx-auto mb-2 text-rose-600" size={24} />
      <p className="font-medium text-rose-900">Couldn’t load hazard data</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800">Try again</button>}
    </div>
  );
}

export function Panel({ title, action, children, id }: { title: string; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
        <section id={id} className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}
