"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin(role: "ADMIN" | "CLIENTE" | "REPARTIDOR") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("role", role);
    }

    if (role === "ADMIN") {
      router.push("/admin");
    } else if (role === "CLIENTE") {
      router.push("/cliente");
    } else {
      router.push("/repartidor");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Login Lo Llevo Express</h1>
      <p>Elige cómo quieres entrar (por ahora modo demo sin contraseña):</p>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button
          onClick={() => handleLogin("ADMIN")}
          style={{ padding: "8px 16px" }}
        >
          Entrar como ADMIN
        </button>

        <button
          onClick={() => handleLogin("CLIENTE")}
          style={{ padding: "8px 16px" }}
        >
          Entrar como CLIENTE
        </button>

        <button
          onClick={() => handleLogin("REPARTIDOR")}
          style={{ padding: "8px 16px" }}
        >
          Entrar como REPARTIDOR
        </button>
      </div>
    </div>
  );
}
