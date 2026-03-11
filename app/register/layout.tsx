import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create a free BASKTBALL account. Access basketball analytics, fantasy tools, live game chats, community forums, and more.",
  keywords: [
    "register",
    "sign up",
    "create account",
    "BASKTBALL",
    "basketball analytics",
  ],
  openGraph: {
    title: "Register | BASKTBALL",
    description:
      "Create a free BASKTBALL account for basketball analytics, fantasy tools, and community forums.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Register for BASKTBALL",
  description:
    "Create a free account to access basketball analytics, fantasy tools, live game chats, and community forums.",
  url: "https://basktball.com/register",
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
