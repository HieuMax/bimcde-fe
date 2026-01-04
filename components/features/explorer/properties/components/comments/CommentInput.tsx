import { SendHorizonal, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export default function CommentInput({
  value,
  onChange,
  onSend,
  isSending,
}: Props) {
  return (
    <div className="p-3 border-t border-border bg-background shrink-0">
      <div className="flex items-center gap-2 px-1 relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          placeholder="Add a comment..."
          className="flex-1 bg-slate-50 border-transparent focus-visible:ring-1 focus-visible:border-blue-500 pr-10 rounded-[14px]"
        />
        <Button
          size="icon"
          variant="ghost"
          disabled={!value.trim() || isSending}
          onClick={onSend}
          className="absolute right-2 text-blue-600 hover:text-blue-700 hover:bg-transparent disabled:text-slate-300 h-8 w-8"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizonal className="h-5 w-5 fill-current" />
          )}
        </Button>
      </div>
    </div>
  );
}
