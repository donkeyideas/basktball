import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "BASKTBALL Terms of Service - Rules and guidelines for using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>TERMS OF SERVICE</h1>
        <p className="legal-updated">Last updated: March 5, 2026</p>

        <p className="legal-intro">
          Welcome to BASKTBALL. By accessing or using our website and mobile
          application (&quot;Services&quot;), you agree to be bound by these Terms of
          Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use our
          Services.
        </p>

        <h2>Acceptance of Terms</h2>
        <p>
          By creating an account or using BASKTBALL, you confirm that you are at
          least 13 years of age and agree to comply with these Terms. If you are
          under 18, you represent that you have your parent or guardian&apos;s
          permission to use the Services.
        </p>

        <h2>Account Registration</h2>
        <p>
          To access certain features, you must create an account. You agree to
          provide accurate, current, and complete information during registration
          and to update such information as necessary. You are responsible for
          safeguarding your password and for all activities that occur under your
          account.
        </p>

        <h2>User Content</h2>
        <p>
          You retain ownership of content you post on BASKTBALL, including takes,
          replies, and polls (&quot;User Content&quot;). By posting User Content, you grant
          BASKTBALL a non-exclusive, worldwide, royalty-free license to use,
          display, reproduce, and distribute your User Content in connection with
          operating and promoting the Services.
        </p>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Use automated systems (bots, scrapers) to access the Services without permission</li>
          <li>Interfere with or disrupt the Services or servers</li>
          <li>Attempt to gain unauthorized access to any part of the Services</li>
          <li>Use the Services for any commercial purpose without our prior written consent</li>
          <li>Post spam, advertisements, or unsolicited promotions</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>
          The BASKTBALL name, logo, and all related marks, designs, and content
          (excluding User Content) are the property of BASKTBALL and are
          protected by copyright, trademark, and other intellectual property
          laws. NBA, team names, and player names are trademarks of their
          respective owners. Basketball statistics are sourced from third-party
          providers and are used under their respective terms.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          Our Services may contain links to third-party websites or integrate
          with third-party services. We are not responsible for the content,
          privacy policies, or practices of any third-party services. Your use of
          such services is at your own risk.
        </p>

        <h2>Termination</h2>
        <p>
          We may suspend or terminate your account at any time, with or without
          cause, with or without notice. Upon termination, your right to use the
          Services will immediately cease. You may delete your account at any
          time through your account settings.
        </p>

        <h2>Disclaimers</h2>
        <p>
          The Services are provided &quot;as is&quot; and &quot;as available&quot; without warranties
          of any kind, either express or implied. We do not guarantee the
          accuracy, completeness, or timeliness of any statistics, scores, or
          other data displayed on the Services. We are not responsible for any
          decisions made based on information provided through the Services.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, BASKTBALL shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, or any loss of profits or revenues, whether incurred directly
          or indirectly, arising from your use of the Services.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of the State of Delaware, without regard to its conflict of law
          provisions.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify
          you of significant changes by posting a notice on the Services. Your
          continued use of the Services after such modifications constitutes
          acceptance of the updated Terms.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="legal-contact">legal@basktball.com</p>
      </div>
    </main>
  );
}
