import { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function NewsArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
