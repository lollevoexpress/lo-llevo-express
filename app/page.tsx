export default function HomePage() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Lo Llevo Express 🚚💙</h1>
      <p>Sistema logístico interno</p>

      <p style={{ marginTop: 20 }}>
        Primero entra por el login para elegir tu rol:
      </p>

      <a
        href="/login"
        style={{
          display: "inline-block",
          marginTop: 10,
          padding: "8px 16px",
          background: "#0ea5e9",
          color: "white",
          borderRadius: 4,
          textDecoration: "none",
        }}
      >
        Ir al login
      </a>
    </div>
  );
}
