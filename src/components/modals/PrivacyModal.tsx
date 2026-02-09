import React from "react";

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h2>
        <p className="text-sm text-muted-foreground italic">
          Last updated: February 2025
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Who we are</h3>
          <p className="text-muted-foreground">
            ZipRoute is operated from Ontario, Canada. Contact: privacy@ziproute.app
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">What we collect</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Account email</li>
            <li>Usage metrics (e.g., number of routes)</li>
            <li>Route inputs (addresses/coordinates)</li>
            <li>Technical logs (device, IP, timestamps)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Why we collect</h3>
          <p className="text-muted-foreground">
            Provide optimization, prevent abuse, improve reliability, billing, and support.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Third parties</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Mapbox (routing/maps)</li>
            <li>Stripe (payments)</li>
            <li>Supabase (auth/storage)</li>
            <li>Email provider (transactional email)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Retention</h3>
          <p className="text-muted-foreground">
            Account and billing records retained as required by law; route inputs may be purged or anonymized on a rolling basis.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Security</h3>
          <p className="text-muted-foreground">
            Encryption in transit; role-based access; least-privilege for service keys.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Your rights</h3>
          <p className="text-muted-foreground">
            Request access/correction/deletion where applicable (incl. PIPEDA considerations).
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">International transfers</h3>
          <p className="text-muted-foreground">
            Data may be processed in Canada/US.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">No sale of personal data</h3>
          <p className="text-muted-foreground">
            We do not sell your personal information.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-accent">Updates</h3>
          <p className="text-muted-foreground">
            We may update this policy; material changes will be announced in-app.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyModal;