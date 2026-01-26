
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { X, Loader2, FileWarning, Copy, Check, Mail } from "lucide-react";
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
import { httpClient } from "@/lib/http-client";

/* ===================== TYPES ===================== */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { _id: string; name: string; mimeType?: string } | null;
}

type ShareType = "SPECIFIC" | "INTERNAL_LINK" | "PUBLIC_LINK";
type AccessLevel = "VIEW" | "DOWNLOAD";
type Recipient = { _id?: string; email: string };

/* ===================== COMPONENT ===================== */
export default function ShareFileDialog({ open, onOpenChange, file }: Props) {
  const params = useParams();
  const projectId = params?.projectId as string;

  /* --- STATE --- */
  const [shareType, setShareType] = useState<ShareType>("PUBLIC_LINK");
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("VIEW");
  const [showLatest, setShowLatest] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Check Folder
  const isFolder = file && (!file.mimeType || file.mimeType === "folder");

  /* --- RESET ON OPEN --- */
  useEffect(() => {
    if (open) {
      setShareLink(null);
      setShareType("PUBLIC_LINK");
      setAccessLevel("VIEW");
      setRecipients([]);
      setEmailInput("");
      setNote("");
      setExpiresAt("");
    }
  }, [open, file]);

  /* --- EMAIL HANDLERS --- */
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Hàm thêm email vào danh sách
  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    
    if (!isValidEmail(email)) {
      toast.error("Địa chỉ email không hợp lệ");
      return;
    }
    
    // Kiểm tra trùng
    if (!recipients.some(r => r.email === email)) {
      setRecipients([...recipients, { email }]);
      setEmailInput(""); // Reset ô nhập sau khi thêm thành công
    } else {
      setEmailInput(""); // Nếu trùng cũng xóa đi cho gọn
    }
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };

  const handleClose = () => {
    setShareLink(null);
    onOpenChange(false);
  };

  /* --- MUTATION (GỌI API) --- */
  const shareMutation = useMutation({
    mutationFn: async () => {
      // 1. Validate
      if (isFolder) throw new Error("Không hỗ trợ chia sẻ thư mục.");
      
      // Nếu chọn chế độ "Specific" -> Bắt buộc phải có ít nhất 1 email
      if (shareType === "SPECIFIC" && recipients.length === 0) {
        throw new Error("Chế độ 'Người cụ thể' yêu cầu phải nhập ít nhất một email.");
      }

      // 2. Gọi API
      // Backend sẽ tự động: Tạo Token + Gửi Mail (nếu mảng recipients có dữ liệu)
      const res = await httpClient.post<{ token?: string, shareToken?: string }>("/share", {
        fileId: file?._id,
        projectId,
        type: shareType,
        recipients: recipients.map(r => r.email), 
        note,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        accessLevel,
        showLatestVersion: showLatest,
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      const token = data.token || data.shareToken || data?.share?.token;
      if (!token) {
        toast.error("Lỗi server: Không nhận được token.");
        return;
      }
      const origin = window.location.origin;

      // Tạo đường dẫn
      // const link = `${origin}/projects/${projectId}/viewer/${file?._id}?shareToken=${token}`;
      const link = `${origin}/share/${token}`;
      setShareLink(link);
      
      // Hiển thị thông báo phù hợp
      if (recipients.length > 0) {
        toast.success(`Đã tạo Link và gửi Email thành công cho ${recipients.length} người!`);
      } else {
        toast.success("Tạo Link thành công!");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi khi thực hiện chia sẻ");
    }
  });

  // Logic enable nút submit
  // Cho phép submit nếu: Có file + Không phải Folder + (Nếu là Specific thì phải có người nhận)
  const canSubmit = !!file && !isFolder && (shareType !== "SPECIFIC" || recipients.length > 0);

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
                 <p className="font-medium text-amber-800">Không thể chia sẻ Thư mục</p>
                 <p className="text-xs text-amber-600">Vui lòng chọn File cụ thể.</p>
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

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">
                People {shareType === "SPECIFIC" && <span className="text-red-500">*</span>}
              </Label>

              <div className="border rounded-md p-2 bg-slate-50 min-h-[46px] transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                <div className="flex flex-wrap gap-2 mb-1">
                  {recipients.map(r => (
                    <span
                      key={r.email}
                      className="bg-white border text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"
                    >
                      <Mail size={10} className="text-slate-400" />
                      {r.email}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-red-500 ml-1"
                        onClick={() => handleRemoveEmail(r.email)}
                      />
                    </span>
                  ))}

                  <input
                    className="flex-1 bg-transparent text-sm outline-none min-w-[150px] h-6"
                    placeholder="Please enter valid email address"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

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
              <div className="grid grid-cols-2 gap-4">
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
            )}

            {(shareType === "INTERNAL_LINK" || shareType === "PUBLIC_LINK") && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={showLatest}
                  onCheckedChange={c => setShowLatest(c as boolean)}
                />
                <Label className="text-sm cursor-pointer">
                  Show latest version
                </Label>
              </div>
            )}

            {shareType === "SPECIFIC" && (
              <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                Note: Any access restrictions placed on the files are removed when the files are shared.
              </div>
            )}
          </div>

        )}

        {/* FOOTER */}
        <div className="p-4 border-t bg-slate-50">
           {shareLink ? (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                 <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <Check size={16}/> Chia sẻ thành công!
                 </div>
                 <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="bg-white font-mono text-xs" />
                    <Button size="icon" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Đã copy!"); }}>
                       <Copy size={16}/>
                    </Button>
                 </div>
                 <Button variant="outline" className="w-full" onClick={handleClose}>Đóng</Button>
              </div>
           ) : (
              <div className="flex justify-end gap-2">
                 {isFolder ? (
                    <Button variant="outline" onClick={handleClose}>Đóng</Button>
                 ) : (
                    <>
                       <Button variant="ghost" onClick={handleClose}>Hủy</Button>
                       <Button onClick={() => shareMutation.mutate()} disabled={!canSubmit || shareMutation.isPending}>
                          {shareMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : (
                              recipients.length > 0 ? "Tạo Link & Gửi Mail" : "Tạo Link Share"
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
