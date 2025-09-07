import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQModalProps {
  onClose: () => void;
}

const FAQModal: React.FC<FAQModalProps> = ({ onClose }) => {
  const faqs = [
    {
      question: "What does ZipRoute do?",
      answer: "It reorders your stops to minimize total travel time (TSP-style optimization), then hands off directions to your maps app."
    },
    {
      question: "Is it really free up to 9 stops?",
      answer: "Yes. No card needed. After 1–2 uses we'll ask you to create a free account so you can save preferences and we can prevent abuse."
    },
    {
      question: "What do I get with Pro?",
      answer: "Unlimited stops, the ability to lock a specific stop position (e.g., fixed end), priority support, and early access to AI address import."
    },
    {
      question: "Can I lock my final destination?",
      answer: "Yes—Pro lets you \"pin\" a stop to the last (or nth) position before optimization."
    },
    {
      question: "How accurate are the routes?",
      answer: "We use Mapbox data and heuristics optimized for small multi-stop days. Live traffic isn't guaranteed; always check final directions in your maps app."
    },
    {
      question: "Do you support CSV import or teams?",
      answer: "Coming soon with Ultimate. Join the waitlist in Pricing."
    },
    {
      question: "Will my data be private?",
      answer: "We don't sell personal data. See the Privacy Policy for details on what we store and why."
    },
    {
      question: "How do billing and cancellations work?",
      answer: "Billing is via Stripe. Subscriptions auto-renew; you can cancel anytime to stop future renewals."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 7-day refund window for first-time Pro annual purchases if no routes were generated after upgrading. See Terms of Service for details."
    },
    {
      question: "Where can I get help?",
      answer: "Use Contact in the footer or email support@yourdomain.com."
    }
  ];

  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Frequently asked questions</h2>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-semibold">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQModal;