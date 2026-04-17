"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileWarning, Copy, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApi } from "@/app/hooks/useApi";
import { explorerService } from "@/services/explorer.service";
import type { IFile } from "@/types/explorer";

// IMPORT RECIPIENT SELECTOR
import { RecipientSelector, RecipientOption } from "../../release/RecipientSelector";

/* ===================== TYPES ===================== */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { _id: string; name: string; mimeType?: string } | null;
  /** Pre-select a fixed version (e.g. opened from version history). */
  initialPinnedVersion?: number | null;
}

type ShareType = "SPECIFIC" | "INTERNAL_LINK" | "PUBLIC_LINK";
type AccessLevel = "VIEW" | "DOWNLOAD";

/* ===================== COMPONENT ===================== */
export default function ShareFileDialog({
  open,
  onOpenChange,
  file,
  initialPinnedVersion,
}: Props) {
  const params = useParams();
  const projectId = params?.projectId as string;
  const api = useApi();

  /* --- STATE --- */
  const [shareType, setShareType] = useState<ShareType>("PUBLIC_LINK");
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([]);
  const [customEmails, setCustomEmails] = useState(""); 
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("VIEW");
  const [showLatest, setShowLatest] = useState(true);
  const [pinVersionSelect, setPinVersionSelect] = useState<number | null>(null);
  const [metaFile, setMetaFile] = useState<IFile | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Check Folder
  const isFolder = file && (!file.mimeType || file.mimeType === "folder");

  const versionOptions =
    metaFile?.versions && metaFile.versions.length > 0
      ? [...metaFile.versions].sort((a, b) => Number(b.version) - Number(a.version))
      : [];

  /* --- RESET ON OPEN --- */
  useEffect(() => {
    if (open) {
      setShareLink(null);
      setShareType("PUBLIC_LINK");
      setAccessLevel("VIEW");
      setSelectedRecipients([]); 
      setCustomEmails(""); // 👈 Reset email nhập tay
      setNote("");
      setExpiresAt("");
      const pin =
        initialPinnedVersion != null &&
        Number.isFinite(Number(initialPinnedVersion))
          ? Number(initialPinnedVersion)
          : null;
      if (pin != null) {
        setShowLatest(false);
        setPinVersionSelect(pin);
      } else {
        setShowLatest(true);
        setPinVersionSelect(null);
      }
    }
  }, [open, file?._id, initialPinnedVersion]);

  useEffect(() => {
    if (!open || !file?._id || isFolder) {
      setMetaFile(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    explorerService
      .getFileDetail(file._id)
      .then((d) => {
        if (!cancelled) setMetaFile(d as IFile);
      })
      .catch(() => {
        if (!cancelled) {
          setMetaFile(null);
          toast.error("Could not load file versions for sharing.");
        }
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, file?._id, isFolder]);

  const handleClose = () => {
    setShareLink(null);
    onOpenChange(false);
  };

  /* --- MUTATION (GỌI API) --- */
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (isFolder) throw new Error("Không hỗ trợ chia sẻ thư mục.");
      
      // Xử lý chuỗi email nhập tay (loại bỏ khoảng trắng và email rỗng)
      const parsedCustomEmails = customEmails
        .split(",")
        .map(e => e.trim())
        .filter(e => e.includes("@"));

      // Gộp email từ RecipientSelector và email nhập tay
      const finalRecipients = shareType === "SPECIFIC" 
        ? [
            ...(selectedRecipients.map(r => r.email).filter(Boolean) as string[]),
            ...parsedCustomEmails
          ]
        : parsedCustomEmails; // Cho phép gửi email thông báo kể cả khi chọn PUBLIC_LINK

      if (shareType === "SPECIFIC" && finalRecipients.length === 0) {
        throw new Error("Chế độ 'Người cụ thể' yêu cầu phải chọn hoặc nhập ít nhất một email hợp lệ.");
      }

      // Gọi API
      const res = await api.post<{
        fileId: string | undefined;
        projectId: string;
        type: ShareType;
        recipients: string[];
        note: string;
        expiresAt: Date | null;
        accessLevel: AccessLevel;
        showLatestVersion: boolean;
        pinnedVersion?: number;
      }>("/share", {
        fileId: file?._id,
        projectId,
        type: shareType,
        recipients: finalRecipients,
        note,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        accessLevel,
        showLatestVersion: showLatest,
        pinnedVersion: showLatest
          ? undefined
          : pinVersionSelect != null
            ? pinVersionSelect
            : metaFile?.currentVersion != null
              ? Number(metaFile.currentVersion)
              : undefined,
      });
      return res;
    },
    onSuccess: (data: any) => {
      const token = data.token || data.shareToken || data?.share?.token;
      if (!token) {
        toast.error("Server error: token not received.");
        return;
      }

      const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || window.location.origin;
      const link = `${clientUrl}/share/${token}`;
      setShareLink(link);
      
      if (shareType === "SPECIFIC" || customEmails.trim().length > 0) {
        toast.success(`Link created and email sent successfully!`);
      } else {
        toast.success("Link created successfully!");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Error when performing sharing");   
    }
  });

  // Nút submit hợp lệ khi: có file + không phải folder + (nếu là Specific thì phải chọn người hoặc nhập email)
  const canSubmit =
    !!file &&
    !isFolder &&
    (shareType !== "SPECIFIC" ||
      selectedRecipients.length > 0 ||
      customEmails.trim().length > 0) &&
    (showLatest || (!metaLoading && !!metaFile));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 bg-white gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Share Data</DialogTitle>
          <DialogDescription className="truncate">{file?.name}</DialogDescription>
        </DialogHeader>

        {isFolder ? (
           <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3 items-center">
              <FileWarning className="text-amber-600 h-6 w-6" />
              <div>
                 <p className="font-medium text-amber-800">Unable to share folder</p>
                 <p className="text-xs text-amber-600">Please select the specific file.</p>
              </div>
           </div>
        ) : (
          
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Share with</Label>
              <Select value={shareType} onValueChange={(v: any) => setShareType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPECIFIC">
                    Specific members of the project
                  </SelectItem>
                  <SelectItem value="INTERNAL_LINK">
                    Signed in users with the link
                  </SelectItem>
                  <SelectItem value="PUBLIC_LINK">
                    Any users with the link
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 👇 CHỈ HIỂN THỊ KHI CHỌN CHẾ ĐỘ SPECIFIC */}
            {shareType === "SPECIFIC" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">
                    Select Project Members
                  </Label>
                  <div className="border rounded-md p-1 bg-slate-50 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                      <RecipientSelector
                        projectId={projectId}
                        initialOptions={selectedRecipients}
                        onChange={(ids, options) =>
                          setSelectedRecipients(options ?? [])
                        }
                      />
                  </div>
                </div>
              </div>
            )}

            {(shareType === "SPECIFIC" || shareType === "INTERNAL_LINK") && (
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Note</Label>
                <Textarea
                  className="h-20 resize-none"
                  placeholder="Add a message"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}

            {(shareType === "INTERNAL_LINK" || shareType === "PUBLIC_LINK") && (
              <>
                {/* 👇 TÙY CHỌN: CHO PHÉP NHẬP EMAIL ĐỂ GỬI LINK CẢ Ở CHẾ ĐỘ PUBLIC */}
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label className="text-xs text-slate-500">Send link to emails (optional)</Label>
                  <Input
                    placeholder="example1@gmail.com, example2@yahoo.com"
                    value={customEmails}
                    onChange={e => setCustomEmails(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">
                      Link expires on (in UTC)
                    </Label>
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Access</Label>
                    <Select
                      value={accessLevel}
                      onValueChange={(v: any) => setAccessLevel(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEW">View only</SelectItem>
                        <SelectItem value="DOWNLOAD">View & download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {!isFolder && (
              <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50/80 p-3">
                <Label className="text-xs text-slate-500">Recipients see</Label>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="share-show-latest"
                    checked={showLatest}
                    onCheckedChange={(c) => {
                      const next = c === true;
                      setShowLatest(next);
                      if (
                        !next &&
                        metaFile?.currentVersion != null &&
                        pinVersionSelect == null
                      ) {
                        const init =
                          initialPinnedVersion != null &&
                          Number.isFinite(Number(initialPinnedVersion))
                            ? Number(initialPinnedVersion)
                            : Number(metaFile.currentVersion);
                        setPinVersionSelect(init);
                      }
                    }}
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="share-show-latest"
                      className="text-sm cursor-pointer font-medium leading-snug"
                    >
                      Always the latest version
                    </Label>
                    <p className="text-xs text-muted-foreground leading-snug">
                      If unchecked, the link stays on one revision even if you upload
                      new versions later.
                    </p>
                  </div>
                </div>
                {!showLatest && versionOptions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-slate-500">Locked revision</Label>
                    <Select
                      value={String(
                        pinVersionSelect ??
                          versionOptions[0]?.version ??
                          "",
                      )}
                      onValueChange={(v) => setPinVersionSelect(Number(v))}
                      disabled={metaLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={metaLoading ? "Loading…" : "Pick version"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {versionOptions.map((v) => (
                          <SelectItem key={v.version} value={String(v.version)}>
                            Version {v.version}
                            {Number(metaFile?.currentVersion) === Number(v.version)
                              ? " (current)"
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!showLatest && metaLoading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    Loading revisions…
                  </p>
                )}
              </div>
            )}

          </div>
        )}

        {/* FOOTER */}
        <div className="p-4 border-t bg-slate-50">
           {shareLink ? (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                 <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <Check size={16}/> Sharing success!
                 </div>
                 <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="bg-white font-mono text-xs" />
                    <Button size="icon" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Copied!"); }}>
                       <Copy size={16}/>
                    </Button>
                 </div>
                 <Button variant="outline" className="w-full" onClick={handleClose}>Close</Button>
              </div>
           ) : (
              <div className="flex justify-end gap-2">
                 {isFolder ? (
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                 ) : (
                    <>
                       <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                       <Button onClick={() => shareMutation.mutate()} disabled={!canSubmit || shareMutation.isPending}>
                          {shareMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : (
                              (shareType === "SPECIFIC" || customEmails.trim().length > 0) ? "Create Link & Send Email" : "Create Share Link"
                          )}
                       </Button>
                    </>
                 )}
              </div>
           )}
        </div>

      </DialogContent>
    </Dialog>
  );
}