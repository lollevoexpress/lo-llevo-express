"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EstadoEnvio = "EN_RUTA" | "ENTREGADO" | "FALLIDO";
type FormaPagoCod = "NINGUNO" | "EFECTIVO" | "TRANSFERENCIA_VENDEDOR";

type Envio = {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  comuna: string;
  telefono: string;
  porCobrar: boolean;
  monto: number | null;
  estado: EstadoEnvio;
  nombreReceptor?: string;
  rutReceptor?: string;
  motivoFalla?: string;
  formaPagoCod?: FormaPagoCod;
  montoCobradoEfectivo?: number | null;
};

const STORAGE_KEY = "envios";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [envios, setEnvios] = useState<Envio[]>([]);

  // Cargar envíos desde localStorage
  function cargarDesdeStorage() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Envio[] = JSON.parse(raw);
        setEnvios(parsed);
      } catch (e) {
        console.error("Error al leer envíos de localStorage", e);
        alert("Error al leer envíos guardados.");
      }
    } else {
      setEnvios([]);
    }
  }

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role === "ADMIN") {
      setAllowed(true);
      cargarDesdeStorage();
    } else {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    window.localStorage.removeItem("role");
    router.push("/login");
  }

  function recargar() {
    cargarDesdeStorage();
  }

  if (!allowed) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        Verificando acceso...
      </div>
    );
  }

  const enviosEnRuta = envios.filter((e) => e.estado === "EN_RUTA");
  const enviosEntregados = envios.filter((e) => e.estado === "ENTREGADO");
  const enviosFallidos = envios.filter((e) => e.estado === "FALLIDO");

  const totalEnvios = envios.length;

  const totalPorCobrar = envios.reduce((sum, e) => {
    if (e.porCobrar && e.monto) return sum + e.monto;
    return sum;
  }, 0);

  const totalCobradoEfectivo = envios.reduce((sum, e) => {
    if (
      e.estado === "ENTREGADO" &&
      e.porCobrar &&
      e.formaPagoCod === "EFECTIVO" &&
      e.montoCobradoEfectivo
    ) {
      return sum + e.montoCobradoEfectivo;
    }
    return sum;
  }, 0);

  const totalCobradoTransferencias = envios.reduce((sum, e) => {
    if (
      e.estado === "ENTREGADO" &&
      e.porCobrar &&
      e.formaPagoCod === "TRANSFERENCIA_VENDEDOR" &&
      e.monto
    ) {
      return sum + e.monto;
    }
    return sum;
  }, 0);

  const totalPorCobrarPendiente = envios.reduce((sum, e) => {
    if (e.porCobrar && e.monto && e.estado !== "ENTREGADO") {
      return sum + e.monto;
    }
    return sum;
  }, 0);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 1100 }}>
      <h1>Panel Administrador</h1>
      <p>
        Vista general de envíos, estados y resumen económico básico (solo
        demo, datos guardados en este navegador).
      </p>

      <div style={{ marginTop: 10, marginBottom: 20 }}>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 12px", fontSize: 14, marginRight: 10 }}
        >
          Cerrar sesión
        </button>
        <button
          onClick={recargar}
          style={{ padding: "6px 12px", fontSize: 14 }}
        >
          Recargar datos
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: "1 1 200px",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total envíos</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{totalEnvios}</div>
        </div>

        <div
          style={{
            flex: "1 1 200px",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fefce8",
          }}
        >
          <div style={{ fontSize: 12, color: "#854d0e" }}>
            Total por cobrar (bruto)
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            ${totalPorCobrar}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 200px",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ecfdf3",
          }}
        >
          <div style={{ fontSize: 12, color: "#166534" }}>
            Cobrado en efectivo
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            ${totalCobradoEfectivo}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 200px",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#eff6ff",
          }}
        >
          <div style={{ fontSize: 12, color: "#1d4ed8" }}>
            Cobrado por transferencias al vendedor
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            ${totalCobradoTransferencias}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 200px",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #fee2e2",
            background: "#fef2f2",
          }}
        >
          <div style={{ fontSize: 12, color: "#b91c1c" }}>
            Por cobrar aún pendiente
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            ${totalPorCobrarPendiente}
          </div>
        </div>
      </div>

      {/* Listas por estado */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* EN RUTA */}
        <div style={{ flex: 1 }}>
          <h2>En ruta</h2>
          {enviosEnRuta.length === 0 ? (
            <p style={{ fontSize: 14 }}>No hay envíos en ruta.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {enviosEnRuta.map((envio) => (
                <li
                  key={envio.id}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>{envio.codigo}</strong> – {envio.nombre}
                  </div>
                  <div>
                    {envio.direccion}, {envio.comuna}
                  </div>
                  <div>Tel: {envio.telefono}</div>
                  {envio.porCobrar && (
                    <div style={{ color: "#b45309" }}>
                      Por cobrar: ${envio.monto}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ENTREGADOS */}
        <div style={{ flex: 1 }}>
          <h2>Entregados</h2>
          {enviosEntregados.length === 0 ? (
            <p style={{ fontSize: 14 }}>No hay envíos entregados aún.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {enviosEntregados.map((envio) => (
                <li
                  key={envio.id}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>{envio.codigo}</strong> – {envio.nombre}
                  </div>
                  <div>
                    {envio.direccion}, {envio.comuna}
                  </div>
                  <div>
                    Recibe: {envio.nombreReceptor} ({envio.rutReceptor})
                  </div>
                  {envio.porCobrar && (
                    <div>
                      Por cobrar: ${envio.monto}{" "}
                      <br />
                      Pago COD:{" "}
                      {envio.formaPagoCod === "EFECTIVO"
                        ? `EFECTIVO (${envio.montoCobradoEfectivo})`
                        : envio.formaPagoCod === "TRANSFERENCIA_VENDEDOR"
                        ? "TRANSFERENCIA AL VENDEDOR"
                        : "—"}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* FALLIDOS */}
        <div style={{ flex: 1 }}>
          <h2>Fallidos</h2>
          {enviosFallidos.length === 0 ? (
            <p style={{ fontSize: 14 }}>No hay envíos fallidos.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {enviosFallidos.map((envio) => (
                <li
                  key={envio.id}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>{envio.codigo}</strong> – {envio.nombre}
                  </div>
                  <div>
                    {envio.direccion}, {envio.comuna}
                  </div>
                  <div>Motivo: {envio.motivoFalla}</div>
                  {envio.porCobrar && envio.monto && (
                    <div style={{ color: "#b45309" }}>
                      Este envío por cobrar quedó fallido (monto: ${envio.monto})
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
