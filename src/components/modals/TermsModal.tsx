import React from "react";

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h2>
        <p className="text-sm text-muted-foreground italic">
          Last updated: February 2025
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Acceptance</h3>
          <p className="text-muted-foreground">
            By using ZipRoute you agree to these Terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Service</h3>
          <p className="text-muted-foreground">
            Provides route optimization; no guarantee of uninterrupted availability or perfect accuracy.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Fair Use</h3>
          <p className="text-muted-foreground">
            Reasonable, non-abusive use; automated scraping or misuse prohibited.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Subscriptions & Billing</h3>
          <p className="text-muted-foreground">
            Stripe handles payments; auto-renew monthly/annually until canceled.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Cancellation</h3>
          <p className="text-muted-foreground">
            Cancel anytime to stop future renewals; access remains until period end.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Refunds</h3>
          <p className="text-muted-foreground">
            First-time annual Pro purchases eligible for 7-day refund if no routes were generated post-upgrade. Otherwise, refunds are at our discretion.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Data</h3>
          <p className="text-muted-foreground">
            Handled per Privacy Policy.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Liability</h3>
          <p className="text-muted-foreground">
            No indirect/consequential damages; liability limited to amounts paid in the last 12 months.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Governing Law</h3>
          <p className="text-muted-foreground">
            Ontario, Canada.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Contact</h3>
          <p className="text-muted-foreground">
            legal@ziproute.app
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsModal;