import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";

interface ContactModalProps {
  onClose: () => void;
}

const categories = [
  { value: "bug", label: "🐛 Bug Report", description: "Something isn't working correctly" },
  { value: "billing", label: "💳 Billing", description: "Payment, invoices, or subscription issues" },
  { value: "bulk", label: "📦 Bulk / Enterprise", description: "High-volume routing needs" },
  { value: "api", label: "🔌 API Access", description: "Integrate ZippyRouter into your tools" },
  { value: "ultimate", label: "🏷️ White-label / Ultimate", description: "Custom branding & reselling" },
  { value: "feature", label: "💡 Feature Request", description: "Suggest a new feature" },
  { value: "partnership", label: "🤝 Partnership", description: "Business collaboration opportunities" },
  { value: "other", label: "❓ Other", description: "Anything else" },
];

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Message sent! ✉️",
        description: "We'll get back to you within 1–2 business days.",
      });
      onClose();
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Failed to send",
        description: "Please try again or email us directly at support@zippyrouter.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-5 py-2 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Get in touch</h2>
        <p className="text-sm text-muted-foreground">
          We typically reply within 1–2 business days at{" "}
          <a href="mailto:support@zippyrouter.com" className="text-accent hover:underline">
            support@zippyrouter.com
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Your name"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="your@email.com"
              maxLength={255}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-medium">What's this about? *</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span>{cat.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">— {cat.description}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-xs font-medium">Message *</Label>
          <Textarea
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            placeholder="Tell us how we can help…"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right">{formData.message.length}/2000</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send message
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactModal;
