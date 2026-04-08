"use client";

import * as React from "react";
import { useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecipientSelector, RecipientOption } from "../../release/RecipientSelector";
import {
  ItemAccessLevel,
  ITEM_ACCESS_LABELS,
  ExplicitPermissionGrant,
  ItemPermissionsSavePayload,
} from "@/types/itemPermissions";
import { Link2, Lock, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useApi } from "@/app/hooks/useApi";
import type { ItemPermissionsApiResult } from "@/types/itemPermissions";
import type { CdeWorkflowMode } from "@/types/explorer";

function initialsFromLabel(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase() || "?";
}

function AccessSelect({
  value,
  onChange,
  disabled,
  triggerClassName,
}: {
  value: ItemAccessLevel;
  onChange: (v: ItemAccessLevel) => void;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ItemAccessLevel)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-[140px] shrink-0 text-xs font-medium border-muted bg-muted/40",
          triggerClassName,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.values(ItemAccessLevel) as ItemAccessLevel[]).map((level) => (
          <SelectItem key={level} value={level}>
            {ITEM_ACCESS_LABELS[level]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Preview row inherited from parent (folder modal / file summary). */
const INHERITED_PREVIEW: { id: string; label: string; access: ItemAccessLevel } = {
  id: "all-project-members",
  label: "All project members",
  access: ItemAccessLevel.FULL,
};

export interface ItemPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "folder" | "file";
  projectId: string;
  itemId: string;
  itemName: string;
  /** Optional hook after a successful API save (e.g. invalidate queries). */
  onSave?: (payload: ItemPermissionsSavePayload) => void | Promise<void>;
  /** NORMAL: show Drive-style (Editor/Viewer) hint */
  workflowMode?: CdeWorkflowMode;
}

export function ItemPermissionsDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  itemId,
  itemName,
  onSave,
  workflowMode = "NORMAL",
}: ItemPermissionsDialogProps) {
  const { get, put } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [defaultAccess, setDefaultAccess] = React.useState<ItemAccessLevel>(
    ItemAccessLevel.FULL,
  );
  const [inheritFromParent, setInheritFromParent] = React.useState(true);
  const [explicitGrants, setExplicitGrants] = React.useState<ExplicitPermissionGrant[]>(
    [],
  );

  useEffect(() => {
    if (!open || !projectId || !itemId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await get(
          `/permissions/item/${projectId}/${mode}/${itemId}`,
        );
        if (cancelled) return;
        if (res?.success && res.result) {
          const data = res.result as ItemPermissionsApiResult;
          setDefaultAccess(data.defaultAccess as ItemAccessLevel);
          setInheritFromParent(data.inheritFromParent);
          setExplicitGrants(
            (data.explicitGrants ?? []).map((g) => ({
              recipient: {
                id: g.recipient.id,
                label: g.recipient.label,
                type: g.recipient.type,
                email: g.recipient.email,
              },
              access: g.access as ItemAccessLevel,
            })),
          );
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load permissions";
        toast.error(msg);
        setDefaultAccess(ItemAccessLevel.FULL);
        setInheritFromParent(true);
        setExplicitGrants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // useApi returns new function refs each render; omit get/put from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, itemId, mode]);

  const recipientInitial = useMemo(
    () => explicitGrants.map((g) => g.recipient),
    [explicitGrants],
  );

  const handleRecipientsChange = useCallback(
    (_ids: string[], options?: RecipientOption[]) => {
      const opts = options ?? [];
      setExplicitGrants((prev) =>
        opts.map((opt) => {
          const old = prev.find((g) => g.recipient.id === opt.id);
          return old ?? { recipient: opt, access: ItemAccessLevel.FULL };
        }),
      );
    },
    [],
  );

  const updateGrantAccess = (recipientId: string, access: ItemAccessLevel) => {
    setExplicitGrants((prev) =>
      prev.map((g) => (g.recipient.id === recipientId ? { ...g, access } : g)),
    );
  };

  const removeGrant = (recipientId: string) => {
    setExplicitGrants((prev) => prev.filter((g) => g.recipient.id !== recipientId));
  };

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleSave = async () => {
    const payload: ItemPermissionsSavePayload = {
      mode,
      itemId,
      defaultAccess,
      inheritFromParent: mode === "folder" ? inheritFromParent : false,
      explicitGrants,
    };
    setSaving(true);
    try {
      await put(`/permissions/item/${projectId}/${mode}/${itemId}`, {
        defaultAccess: payload.defaultAccess,
        inheritFromParent: payload.inheritFromParent,
        explicitGrants: payload.explicitGrants.map((g) => ({
          recipient: {
            id: g.recipient.id,
            type: g.recipient.type,
            label: g.recipient.label,
            email: g.recipient.email,
          },
          access: g.access,
        })),
      });
      await onSave?.(payload);
      toast.success("Permissions saved");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save permissions";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "folder" ? "Folder permissions" : "File permissions";
  const defaultRowDisabled = mode === "folder" && inheritFromParent;

  const selectorKey = explicitGrants.map((g) => g.recipient.id).join("-") || "empty";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 space-y-1 shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-normal space-y-1">
            <span className="block">{itemName}</span>
            {workflowMode === "NORMAL" && (
              <span className="block text-xs pt-1">
                Full access ≈ Editor, Read only ≈ Viewer, No access = blocked.
                Inherited from parent when enabled below.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {mode === "folder" && (
            <div className="flex items-center justify-between gap-4">
              <Label
                className={cn(
                  "text-sm font-normal shrink",
                  defaultRowDisabled && "text-muted-foreground",
                )}
              >
                Default access for project members
              </Label>
              <AccessSelect
                value={defaultAccess}
                onChange={setDefaultAccess}
                disabled={defaultRowDisabled}
                triggerClassName={defaultRowDisabled ? "opacity-60" : undefined}
              />
            </div>
          )}

          <div className="space-y-2">
            <RecipientSelector
              key={selectorKey}
              projectId={projectId}
              initialOptions={recipientInitial}
              onChange={handleRecipientsChange}
              renderSelectedChips={false}
              addButtonPlaceholder="Add people or groups"
              disabled={loading}
            />
          </div>

          {mode === "folder" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">With Access</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="inherit-parent"
                    checked={inheritFromParent}
                    onCheckedChange={(v) => setInheritFromParent(v === true)}
                  />
                  <label
                    htmlFor="inherit-parent"
                    className="text-sm font-normal cursor-pointer select-none"
                  >
                    Inherit from parent folder
                  </label>
                </div>
              </div>

              <div className="rounded-md border border-border bg-background">
                {explicitGrants.length > 0 && (
                  <div className="divide-y divide-border">
                    {explicitGrants.map((g) => (
                      <div
                        key={g.recipient.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {initialsFromLabel(g.recipient.label)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{g.recipient.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <AccessSelect
                            value={g.access}
                            onChange={(v) => updateGrantAccess(g.recipient.id, v)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => removeGrant(g.recipient.id)}
                            aria-label="Remove"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {inheritFromParent && (
                  <div
                    className={cn(
                      "px-3 py-3 space-y-2",
                      explicitGrants.length > 0 && "border-t border-border",
                    )}
                  >
                    <p className="text-xs text-muted-foreground">
                      Inherited from parent folder
                    </p>
                    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-muted">
                            {initialsFromLabel(INHERITED_PREVIEW.label)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {INHERITED_PREVIEW.label}
                        </span>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0">
                        {ITEM_ACCESS_LABELS[INHERITED_PREVIEW.access]}
                      </span>
                    </div>
                  </div>
                )}

                {!inheritFromParent && explicitGrants.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No permissions set on this folder. Add people or choose default access
                    above.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
                <span className="text-sm font-medium">With Access</span>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                  disabled={explicitGrants.length === 0}
                  onClick={() => setExplicitGrants([])}
                >
                  Remove all
                </button>
              </div>

              <div className="min-h-[100px]">
                {explicitGrants.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No permissions set on this file
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {explicitGrants.map((g) => (
                      <div
                        key={g.recipient.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {initialsFromLabel(g.recipient.label)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{g.recipient.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <AccessSelect
                            value={g.access}
                            onChange={(v) => updateGrantAccess(g.recipient.id, v)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => removeGrant(g.recipient.id)}
                            aria-label="Remove"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="px-3 py-3 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Inherited from parent folder</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">All project members</span>
                  </div>
                  <AccessSelect value={defaultAccess} onChange={setDefaultAccess} />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2 px-6 py-4 shrink-0 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 font-normal"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
