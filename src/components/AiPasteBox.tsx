import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { Bookmark } from "@/hooks/useBookmarks";

interface AiPasteBoxProps {
  bookmarks: Bookmark[];
  onAddressesExtracted: (start: string, destinations: string[]) => void;
}

export function AiPasteBox({ bookmarks, onAddressesExtracted }: AiPasteBoxProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-addresses", {
        body: {
          text,
          bookmarks: bookmarks.map((b) => ({ nickname: b.nickname, address: b.address })),
        },
      });

      if (error) throw error;

      const addresses = data?.addresses as Array<{
        address: string;
        label: string;
        is_start: boolean;
      }>;

      if (!addresses || addresses.length === 0) {
        toast.error("No addresses found in the text. Try pasting a message with specific locations.");
        return;
      }

      const startAddr = addresses.find((a) => a.is_start);
      const dests = addresses.filter((a) => !a.is_start);

      // If no explicit start, use first address as start
      const finalStart = startAddr?.address || dests.shift()?.address || "";
      const finalDests = (startAddr ? dests : dests).map((a) => a.address);

      if (!finalStart && finalDests.length === 0) {
        toast.error("Could not extract usable addresses.");
        return;
      }

      onAddressesExtracted(finalStart, finalDests);
      toast.success(`Extracted ${(finalDests.length + (finalStart ? 1 : 0))} addresses!`);
      setText("");
      setOpen(false);
    } catch (e: any) {
      console.error("AI extract error:", e);
      if (e?.message?.includes("429") || e?.status === 429) {
        toast.error("Rate limit hit. Please wait a moment and try again.");
      } else if (e?.message?.includes("402") || e?.status === 402) {
        toast.error("AI credits exhausted.");
      } else {
        toast.error("Failed to extract addresses. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full min-h-[44px] border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4 text-accent" />
        Paste email or text to auto-fill stops
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-muted/20 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          AI Address Extractor
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setOpen(false); setText(""); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Textarea
        placeholder={"Paste your email, text message, or notes here...\n\nExample: \"Pick up from the warehouse, then deliver to 123 Main St, 456 Oak Ave, and the office\""}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[100px] text-sm resize-none"
        disabled={loading}
      />
      <Button
        className="w-full min-h-[44px] btn-hero"
        disabled={!text.trim() || loading}
        onClick={handleExtract}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting addresses...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Extract & Fill Stops
          </>
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        AI will identify addresses and match them against your bookmarks
      </p>
    </div>
  );
}
