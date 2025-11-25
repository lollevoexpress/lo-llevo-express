"use client";

import { useEffect, useState, FormEvent } from "react";
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

export default function ClientePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [telefono, setTelefono] = useState("");
  const [porCobrar, setPorCobrar] = useState(false);
  const [monto, setMonto] = useState<string>("");

  // Lista de envíos compartida (localStorage)
  const [envios, setEnvios] = useState<Envio[]>([]);

  // Estado para la etiqueta con QR (modal interno)
  const [envioEtiqueta, setEnvioEtiqueta] = useState<Envio | null>(null);

  // Proteger por rol y cargar envíos desde localStorage
  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role === "CLIENTE" || role === "ADMIN") {
      setAllowed(true);
    } else {
      router.push("/login");
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Envio[] = JSON.parse(raw);
        setEnvios(parsed);
      } catch (e) {
        console.error("Error al leer envíos de localStorage", e);
      }
    }
  }, [router]);

  // Cada vez que cambian los envíos, guardar en localStorage
  useEffect(() => {
    if (!allowed) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envios));
  }, [envios, allowed]);

  function handleLogout() {
    window.localStorage.removeItem("role");
    router.push("/login");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!nombre || !direccion || !comuna || !telefono) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    let montoNumber: number | null = null;
    if (porCobrar) {
      if (!monto) {
        alert("Ingresa el monto a cobrar.");
        return;
      }
      montoNumber = Number(monto);
      if (isNaN(montoNumber) || montoNumber <= 0) {
        alert("El monto a cobrar debe ser un número válido mayor a 0.");
        return;
      }
    }

    const newId = Date.now();
    const codigo = `LLE-${newId}`;

    const nuevoEnvio: Envio = {
      id: newId,
      codigo,
      nombre,
      direccion,
      comuna,
      telefono,
      porCobrar,
      monto: montoNumber,
      estado: "EN_RUTA", // por ahora entra directo "en ruta"
      formaPagoCod: "NINGUNO",
      montoCobradoEfectivo: null,
    };

    setEnvios((prev) => [nuevoEnvio, ...prev]);

    // Limpiar formulario
    setNombre("");
    setDireccion("");
    setComuna("");
    setTelefono("");
    setPorCobrar(false);
    setMonto("");
  }

  // Abrir etiqueta dentro de la página
  function verEtiqueta(envio: Envio) {
    setEnvioEtiqueta(envio);
  }

  // Cerrar etiqueta
  function cerrarEtiqueta() {
    setEnvioEtiqueta(null);
  }

  if (!allowed) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        Verificando acceso...
      </div>
    );
  }

  // Construir URL del QR cuando haya envío seleccionado
  const qrUrl =
    envioEtiqueta &&
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      envioEtiqueta.codigo
    )}`;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 800 }}>
      <h1>Panel Cliente / Vendedor</h1>
      <p>
        Aquí puedes crear envíos. Se guardan en el navegador para que el
        repartidor los vea y registre la entrega. Cada envío tiene su
        etiqueta con código y QR.
      </p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 10,
          marginBottom: 20,
          padding: "6px 12px",
          fontSize: 14,
        }}
      >
        Cerrar sesión
      </button>

      <h2 style={{ marginTop: 20, marginBottom: 10 }}>Nuevo envío</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#f9fafb",
        }}
      >
        <label>
          Nombre destinatario*:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 2 }}
          />
        </label>

        <label>
          Dirección*:
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 2 }}
          />
        </label>

        <label>
          Comuna*:
          <input
            type="text"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 2 }}
          />
        </label>

        <label>
          Teléfono*:
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 2 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={porCobrar}
            onChange={(e) => setPorCobrar(e.target.checked)}
          />
          ¿Es envío por cobrar?
        </label>

        {porCobrar && (
          <label>
            Monto a cobrar:
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              style={{ width: "100%", padding: 6, marginTop: 2 }}
              min={0}
            />
          </label>
        )}

        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: "8px 16px",
            background: "#0ea5e9",
            color: "white",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
          }}
        >
          Guardar envío
        </button>
      </form>

      <h2 style={{ marginTop: 24, marginBottom: 8 }}>Envíos creados</h2>
      {envios.length === 0 ? (
        <p style={{ fontSize: 14 }}>Aún no has creado envíos.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {envios.map((envio) => (
            <li
              key={envio.id}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{envio.nombre}</strong>{" "}
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    ({envio.telefono})
                  </span>
                  <div style={{ fontSize: 14 }}>
                    {envio.direccion}, {envio.comuna}
                  </div>
                  {envio.porCobrar ? (
                    <div style={{ fontSize: 13, color: "#b45309" }}>
                      Por cobrar: ${envio.monto}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#16a34a" }}>
                      Envío normal (no por cobrar)
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: 12 }}>
                  <div>Cód: {envio.codigo}</div>
                  <div>Estado: {envio.estado}</div>
                  <button
                    onClick={() => verEtiqueta(envio)}
                    style={{
                      marginTop: 6,
                      padding: "4px 8px",
                      fontSize: 12,
                      borderRadius: 4,
                      border: "1px solid #0ea5e9",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Ver etiqueta con QR
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* MODAL de etiqueta con QR */}
      {envioEtiqueta && qrUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={cerrarEtiqueta}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              width: 420,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>Etiqueta {envioEtiqueta.codigo}</h3>
              <button
                onClick={cerrarEtiqueta}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Lo Llevo Express
                  </div>
                  <div style={{ fontSize: 13, color: "#4b5563" }}>
                    Envío para: <strong>{envioEtiqueta.nombre}</strong>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    {envioEtiqueta.direccion}
                    <br />
                    {envioEtiqueta.comuna}
                    <br />
                    Tel: {envioEtiqueta.telefono}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                      color: "#6b7280",
                    }}
                  >
                    Código interno: {envioEtiqueta.codigo}
                  </div>
                  {envioEtiqueta.porCobrar && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "#b45309",
                        fontWeight: 600,
                      }}
                    >
                      ENVÍO POR COBRAR: ${envioEtiqueta.monto}
                    </div>
                  )}
                </div>
                <div>
                  <img src={qrUrl} alt={`QR ${envioEtiqueta.codigo}`} />
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                Escanea el QR para registrar la entrega en el sistema.
              </div>
            </div>

            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  borderRadius: 4,
                  border: "1px solid #6b7280",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Imprimir etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
