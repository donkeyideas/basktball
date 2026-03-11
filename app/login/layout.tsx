import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to BASKTBALL to access personalized basketball analytics, fantasy tools, community forums, and more.",
  keywords: [
    "sign in",
    "login",
    "BASKTBALL account",
  ],
  openGraph: {
    title: "Sign In | BASKTBALL",
    description: "Sign in to your BASKTBALL account.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sign In to BASKTBALL",
  description:
    "Sign in to access personalized basketball analytics, fantasy tools, and community forums.",
  url: "https://basktball.com/login",
  isPartOf: { "@type": "WebSite", name: "BASKTBALL", url: "https://basktball.com" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
