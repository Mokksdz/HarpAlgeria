"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#FAFAF8",
          color: "#1a1a1a",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#666", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Nous sommes désolés, quelque chose s&apos;est mal passé.
            Veuillez réessayer ou revenir à la page d&apos;accueil.
          </p>
          {process.env.NODE_ENV !== "production" && error?.message && (
            <pre
              style={{
                background: "#f5f5f5",
                padding: "1rem",
                borderRadius: 8,
                fontSize: "0.75rem",
                textAlign: "left",
                overflow: "auto",
                marginBottom: "1.5rem",
                color: "#dc2626",
              }}
            >
              {error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: 12,
                border: "none",
                backgroundColor: "#5D4E37",
                color: "white",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Réessayer
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: 12,
                border: "1px solid #ddd",
                backgroundColor: "white",
                color: "#333",
                fontWeight: 500,
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
