import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the BASKTBALL team. Send us feedback, report issues, or ask questions about our basketball analytics platform.",
  keywords: [
    "contact",
    "feedback",
    "support",
    "basketball analytics",
    "BASKTBALL",
  ],
  openGraph: {
    title: "Contact Us | BASKTBALL",
    description:
      "Get in touch with the BASKTBALL team for feedback, support, or questions.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact BASKTBALL",
  description:
    "Get in touch with the BASKTBALL team for feedback, support, or questions about basketball analytics.",
  url: "https://basktball.com/contact",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@id": "https://basktball.com/#organization",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Contact", item: "https://basktball.com/contact" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
