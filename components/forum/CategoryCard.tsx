import Link from "next/link";

interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    threadCount: number;
    postCount: number;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/forum/${category.slug}`}
      style={{
        display: "block",
        background: "var(--dark-gray)",
        borderRadius: "8px",
        border: "1px solid #2a2a2a",
        padding: "20px",
        textDecoration: "none",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = category.color || "#FF6B35";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2a2a";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div style={{
          width: 6,
          height: 28,
          borderRadius: "3px",
          background: category.color || "#FF6B35",
          flexShrink: 0,
        }} />
        <h3 style={{
          fontFamily: "var(--font-anton)",
          fontSize: "18px",
          color: "var(--white)",
          margin: 0,
          letterSpacing: "0.5px",
        }}>
          {category.name}
        </h3>
      </div>
      {category.description && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 12px 0", lineHeight: "1.4" }}>
          {category.description}
        </p>
      )}
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-faint)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: category.color || "#FF6B35", fontWeight: "700" }}>{category.threadCount}</span> threads
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: category.color || "#FF6B35", fontWeight: "700" }}>{category.postCount}</span> posts
        </span>
      </div>
    </Link>
  );
}
