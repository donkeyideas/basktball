import Link from "next/link";
import { Header, Footer } from "@/components";

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: "6rem",
            color: "var(--orange)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "1.5rem",
            color: "var(--text-primary)",
            marginTop: "0.5rem",
            fontWeight: 600,
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "1rem",
            maxWidth: "400px",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            backgroundColor: "var(--orange)",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: "var(--font-barlow)",
          }}
        >
          Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
