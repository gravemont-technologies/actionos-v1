import { useState } from "react";

type SupportQrToggleProps = {
  question?: string;
  description?: string;
  className?: string;
};

export function SupportQrToggle({
  question = "❤️ Love what we're building? Make it unstoppable—support us.",
  description = "Scan the QR code below with PayPal or your wallet app and back Gravemont Technologies instantly.",
  className,
}: SupportQrToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        textAlign: "center",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "0.75rem 1rem",
          background: "transparent",
          borderRadius: "999px",
          border: "2px solid rgba(251, 191, 36, 0.8)",
          color: "#fbbf24",
          fontWeight: 700,
          fontSize: "1.1rem",
          boxShadow: "0 0 15px rgba(251, 191, 36, 0.4)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          margin: "0 auto",
          textTransform: "none",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = "#f59e0b";
          event.currentTarget.style.color = "#f59e0b";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = "rgba(251, 191, 36, 0.8)";
          event.currentTarget.style.color = "#fbbf24";
        }}
      >
        <span>{question}</span>
        <span style={{ fontSize: "0.95rem" }}>{open ? "▾ Hide QR" : "▸ Show QR"}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(15, 23, 42, 0.6)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "#f9fafb",
              fontWeight: 500,
            }}
          >
            {description}
          </p>
          <img
            src="/fundmvp.jpeg"
            alt="Paypal QR code for Gravemont Technologies"
            style={{
              maxWidth: "280px",
              width: "100%",
              height: "auto",
              borderRadius: "12px",
              border: "3px solid rgba(255, 255, 255, 0.5)",
              background: "#ffffff",
            }}
          />
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#fbbf24" }}>
            Tap, scan, and send your contribution instantly.
          </p>
        </div>
      )}
    </div>
  );
}
