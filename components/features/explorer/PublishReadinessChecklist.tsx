"use client";

import { Check, X, Loader2 } from "lucide-react";
import type { FilePublishReadiness } from "@/types/explorer";

interface Props {
  data: FilePublishReadiness | undefined;
  isLoading: boolean;
  isError?: boolean;
  /** In the modal: omit the outer "Automatic checklist" frame; keep rows only */
  variant?: "card" | "modal";
}

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {ok ? (
        <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
      ) : (
        <X className="size-4 text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} />
      )}
      <span className={ok ? "text-slate-800 leading-snug" : "text-red-800 leading-snug"}>
        {label}
      </span>
    </div>
  );
}

export default function PublishReadinessChecklist({
  data,
  isLoading,
  isError,
  variant = "card",
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
        <Loader2 className="size-4 animate-spin shrink-0" />
        Checking publish requirements…
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-xs text-red-600">
        Could not load the checklist. Please try again.
      </p>
    );
  }
  if (!data) return null;

  if (!data.eligibleContext) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 leading-relaxed">
        {data.contextMessage ?? "The checklist cannot be shown for this file."}
      </div>
    );
  }

  const todosOk = data.openTodosCount === 0;
  const topicsOk =
    data.linkedTopicsTotal === 0 ||
    data.linkedTopicsResolved === data.linkedTopicsTotal;
  const versionOk =
    data.currentVersionIsLatestInShared &&
    data.sharedRevisionEligibleForPublish;

  let versionDetail = `The current file version (v${data.sharedCurrentVersion}) is the latest in Shared.`;
  if (!data.currentVersionIsLatestInShared) {
    versionDetail +=
      " Version data may be out of sync — refresh or contact an administrator.";
  } else if (!data.sharedRevisionEligibleForPublish) {
    versionDetail +=
      " This revision was already published; upload a new revision to Shared first.";
  }

  const rows = (
    <>
      {!data.isProjectAdmin && (
        <p className="text-[11px] text-amber-900 leading-snug pb-1">
          Only project administrators can publish.
        </p>
      )}
      <Row
        ok={todosOk}
        label={`No open todos (open todos: ${data.openTodosCount}).`}
      />
      <Row
        ok={topicsOk}
        label={`All linked topics are resolved (resolved: ${data.linkedTopicsResolved}/${data.linkedTopicsTotal}).`}
      />
      <Row ok={versionOk} label={versionDetail} />
    </>
  );

  if (variant === "modal") {
    return <div className="space-y-2.5">{rows}</div>;
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50/90 p-3 space-y-2.5">
      <div className="text-xs font-semibold text-slate-800 flex items-center justify-between gap-2">
        <span>Automatic checklist</span>
        {!data.isProjectAdmin && (
          <span className="font-normal text-amber-800">Admin only</span>
        )}
      </div>
      {rows}
    </div>
  );
}
