"use client";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
}

export function FAQ({ items, title = "Frequently Asked Questions" }: FAQProps) {
  return (
    <>
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />

      {/* Visible FAQ section */}
      <section
        className="section"
        style={{ marginTop: "60px" }}
      >
        <div className="section-title">{title}</div>
        <div
          style={{
            display: "grid",
            gap: "20px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "25px",
                background: "var(--border-subtle)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "var(--orange)",
                  marginBottom: "10px",
                }}
              >
                {item.question}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
