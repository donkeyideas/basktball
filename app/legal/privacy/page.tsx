import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "BASKTBALL Privacy Policy - How we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>PRIVACY POLICY</h1>
        <p className="legal-updated">Last updated: March 5, 2026</p>

        <p className="legal-intro">
          Your privacy matters to us. This Privacy Policy explains how BASKTBALL
          (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your personal
          information when you use our website and mobile application.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an
          account, including your name, email address, and username. We also
          collect information automatically when you use our services, including:
        </p>
        <ul>
          <li>Account information (name, email, username, password)</li>
          <li>Profile information (avatar, bio, favorite teams and players)</li>
          <li>Device information (model, operating system, unique identifiers)</li>
          <li>Usage data (features accessed, interactions, time spent)</li>
          <li>Location data (if you grant permission, for localized content)</li>
          <li>Content you create (takes, replies, polls, profile information)</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the BASKTBALL experience</li>
          <li>Personalize content, including scores, stats, and news based on your favorite teams</li>
          <li>Send push notifications for game alerts, social activity, and updates you have opted into</li>
          <li>Analyze usage patterns to improve performance and features</li>
          <li>Detect, prevent, and address technical issues and abuse</li>
          <li>Communicate with you about updates, security alerts, and support</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>
          We do not sell your personal information to third parties. We may share
          your information in the following limited circumstances:
        </p>
        <ul>
          <li>With service providers who assist us in operating our services (hosting, analytics, push notifications)</li>
          <li>With other users (public profile information, takes, and interactions)</li>
          <li>When required by law or to respond to legal process</li>
          <li>To protect the rights, safety, and property of BASKTBALL, our users, or the public</li>
          <li>With your consent or at your direction</li>
        </ul>

        <h2>Cookies and Tracking</h2>
        <p>
          Our website uses cookies and similar technologies to enhance your
          experience, analyze usage, and assist in our marketing efforts. You can
          control cookie preferences through your browser settings. Our mobile
          application does not use cookies but may use device identifiers for
          analytics purposes.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is
          active or as needed to provide you services. If you request account
          deletion, we will delete your personal data within 30 days, except
          where we are required to retain it for legal or regulatory purposes.
        </p>

        <h2>Security</h2>
        <p>
          We implement industry-standard security measures to protect your
          personal information from unauthorized access, alteration, disclosure,
          or destruction. This includes encryption of data in transit via HTTPS,
          secure authentication, and access controls. However, no method of
          electronic transmission or storage is 100% secure, and we cannot
          guarantee absolute security.
        </p>

        <h2>Your Rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
          <li><strong>Opt-out:</strong> Manage notification preferences and data collection settings</li>
        </ul>

        <h2>Children&apos;s Privacy</h2>
        <p>
          BASKTBALL is not intended for children under the age of 13. We do not
          knowingly collect personal information from children under 13. If we
          become aware that we have collected personal information from a child
          under 13, we will take steps to delete such information.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the &quot;Last updated&quot; date. Your continued use of our services
          after changes are posted constitutes acceptance of the updated policy.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy or our
          data practices, please contact us at:
        </p>
        <p className="legal-contact">privacy@basktball.com</p>
      </div>
    </main>
  );
}
