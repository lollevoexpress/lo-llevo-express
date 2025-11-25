"use client";

import { useEffect, useState, useRef } from "react";
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
  // Datos entrega
  nombreReceptor?: string;
  rutReceptor?: string;
  motivoFalla?: string;
  // COD
  formaPagoCod?: FormaPagoCod;
  montoCobradoEfectivo?: number | null;
};

const STORAGE_KEY = "envios";

/**
 * Componente lector de QR usando la API nativa BarcodeDetector.
 * Muestra la cámara y cuando detecta un QR, llama a onResult(texto).
 */
function QRReader({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let activo = true;
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (!("BarcodeDetector" in window)) {
          alert(
            "Tu navegador no soporta lectura nativa de QR (BarcodeDetector). Prueba con Chrome en Android."
          );
          return;
        }

        // @ts-ignore
        const BarcodeDetectorCtor = window.BarcodeDetector as typeof BarcodeDetector;

        const detector = new BarcodeDetectorCtor({
          formats: ["qr_code"],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        async function scanLoop() {
          if (!activo || !videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const valor = barcodes[0].rawValue;
              onResult(valor);
              activo = false;
              if (stream) {
                stream.getTracks().forEach((t) => t.stop());
              }
              return;
            }
          } catch (e) {
            console.error("Error detectando QR", e);
          }

          requestAnimationFrame(scanLoop);
        }

        scanLoop();
      } catch (e) {
        console.error(e);
        alert("No se pudo acceder a la cámara.");
      }
    }

    startCamera();

    return () => {
      activo = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onResult]);

  return (
    <div
      style={{
        padding: 10,
        background: "#000",
        borderRadius: 6,
        textAlign: "center",
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: "100%",
          borderRadius: 6,
        }}
      />
      <p style={{ color: "white", marginTop: 6, fontSize: 13 }}>
        Apunta la cámara al código QR de la etiqueta…
      </p>
    </div>
  );
}

export default function RepartidorPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [envios, setEnvios] = useState<Envio[]>([]);

  const [envioSeleccionado, setEnvioSeleccionado] = useState<Envio | null>(
    null
  );
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [rutReceptor, setRutReceptor] = useState("");
  const [motivoFalla, setMotivoFalla] = useState("");

  // COD
  const [compradorPago, setCompradorPago] = useState<"SI" | "NO" | "">("");
  const [formaPagoCod, setFormaPagoCod] = useState<FormaPagoCod>("NINGUNO");
  const [montoEfectivo, setMontoEfectivo] = useState<string>("");

  // Mostrar / ocultar escáner
  const [mostrarQR, setMostrarQR] = useState(false);

  // Proteger por rol y cargar envíos desde localStorage
  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role === "REPARTIDOR" || role === "ADMIN") {
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

  // Guardar cambios en localStorage cada vez que cambian los envíos
  useEffect(() => {
    if (!allowed) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envios));
  }, [envios, allowed]);

  function handleLogout() {
    window.localStorage.removeItem("role");
    router.push("/login");
  }

  function seleccionarEnvio(envio: Envio) {
    setEnvioSeleccionado(envio);
    setNombreReceptor("");
    setRutReceptor("");
    setMotivoFalla("");
    setCompradorPago("");
    setFormaPagoCod("NINGUNO");
    setMontoEfectivo("");
  }

  function marcarEntregado() {
    if (!envioSeleccionado) return;

    if (!nombreReceptor || !rutReceptor) {
      alert("Debes indicar nombre y RUT de quien recibe.");
      return;
    }

    // Si es por cobrar, validar flujo de pago
    let nuevaFormaPago: FormaPagoCod = "NINGUNO";
    let montoEfvo: number | null = null;

    if (envioSeleccionado.porCobrar) {
      if (compradorPago === "") {
        alert("Debes indicar si el comprador pagó o no.");
        return;
      }

      if (compradorPago === "NO") {
        alert(
          "Si el comprador NO pagó, no puedes marcar ENTREGADO. Usa entrega FALLIDA."
        );
        return;
      }

      // compradorPago === "SI"
      if (formaPagoCod === "NINGUNO") {
        alert("Debes indicar si pagó con transferencia o efectivo.");
        return;
      }

      if (formaPagoCod === "EFECTIVO") {
        if (!montoEfectivo) {
          alert("Ingresa el monto recibido en efectivo.");
          return;
        }
        const montoNum = Number(montoEfectivo);
        if (isNaN(montoNum) || montoNum <= 0) {
          alert("Monto en efectivo inválido.");
          return;
        }
        montoEfvo = montoNum;
      }

      nuevaFormaPago = formaPagoCod;
    }

    const actualizados = envios.map((e) =>
      e.id === envioSeleccionado.id
        ? {
            ...e,
            estado: "ENTREGADO",
            nombreReceptor,
            rutReceptor,
            motivoFalla: undefined,
            formaPagoCod: nuevaFormaPago,
            montoCobradoEfectivo: montoEfvo,
          }
        : e
    );
    setEnvios(actualizados);
    setEnvioSeleccionado(null);
  }

  function marcarFallido() {
    if (!envioSeleccionado) return;

    if (!motivoFalla) {
      alert("Indica el motivo de la entrega fallida.");
      return;
    }

    const actualizados = envios.map((e) =>
      e.id === envioSeleccionado.id
        ? {
            ...e,
            estado: "FALLIDO",
            motivoFalla,
            nombreReceptor: undefined,
            rutReceptor: undefined,
            formaPagoCod: "NINGUNO",
            montoCobradoEfectivo: null,
          }
        : e
    );
    setEnvios(actualizados);
    setEnvioSeleccionado(null);
  }

  const enviosEnRuta = envios.filter((e) => e.estado === "EN_RUTA");
  const enviosTerminados = envios.filter(
    (e) => e.estado === "ENTREGADO" || e.estado === "FALLIDO"
  );

  if (!allowed) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        Verificando acceso...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 950 }}>
      <h1>Panel Repartidor</h1>
      <p>
        Estos son los envíos que el cliente creó. Puedes marcarlos como
        ENTREGADOS o FALLIDOS, y si es por cobrar registrar cómo pagó el
        comprador. También puedes escanear el QR de la etiqueta para
        seleccionar el envío automáticamente.
      </p>

      <div style={{ marginTop: 10, marginBottom: 20 }}>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 12px", fontSize: 14, marginRight: 10 }}
        >
          Cerrar sesión
        </button>
        <button
          onClick={() => setMostrarQR(true)}
          style={{ padding: "6px 12px", fontSize: 14 }}
        >
          Escanear QR
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Lista de envíos en ruta */}
        <div style={{ flex: 1 }}>
          <h2>Envíos en ruta</h2>
          {enviosEnRuta.length === 0 ? (
            <p style={{ fontSize: 14 }}>No hay envíos en ruta ahora mismo.</p>
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
                    cursor: "pointer",
                  }}
                  onClick={() => seleccionarEnvio(envio)}
                >
                  <div style={{ fontWeight: 600 }}>
                    {envio.codigo}{" "}
                    {envio.porCobrar && (
                      <span style={{ fontSize: 12, color: "#b45309" }}>
                        (POR COBRAR ${envio.monto})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {envio.nombre} – {envio.direccion}, {envio.comuna}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Tel: {envio.telefono}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Panel de acción sobre un envío */}
        <div style={{ flex: 1 }}>
          <h2>Acción sobre envío seleccionado</h2>
          {!envioSeleccionado ? (
            <p style={{ fontSize: 14 }}>
              Haz clic en un envío de la lista de la izquierda o escanea el QR
              de la etiqueta para seleccionarlo.
            </p>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: 12,
                background: "#f9fafb",
                fontSize: 14,
              }}
            >
              <p>
                <strong>{envioSeleccionado.codigo}</strong>
                <br />
                {envioSeleccionado.nombre}
                <br />
                {envioSeleccionado.direccion}, {envioSeleccionado.comuna}
              </p>
              {envioSeleccionado.porCobrar && (
                <p style={{ color: "#b45309" }}>
                  Envío por cobrar: ${envioSeleccionado.monto}
                </p>
              )}

              <hr style={{ margin: "10px 0" }} />

              <h3 style={{ fontSize: 15 }}>Marcar como ENTREGADO</h3>
              <label>
                Nombre quien recibe:
                <input
                  type="text"
                  value={nombreReceptor}
                  onChange={(e) => setNombreReceptor(e.target.value)}
                  style={{ width: "100%", padding: 6, marginTop: 2 }}
                />
              </label>
              <label>
                RUT quien recibe:
                <input
                  type="text"
                  value={rutReceptor}
                  onChange={(e) => setRutReceptor(e.target.value)}
                  style={{ width: "100%", padding: 6, marginTop: 2 }}
                />
              </label>

              {envioSeleccionado.porCobrar && (
                <>
                  <div style={{ marginTop: 8, marginBottom: 4 }}>
                    ¿El comprador pagó?
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCompradorPago("SI")}
                      style={{
                        padding: "4px 10px",
                        background:
                          compradorPago === "SI" ? "#16a34a" : "#e5e7eb",
                        color: compradorPago === "SI" ? "white" : "black",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Sí pagó
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompradorPago("NO")}
                      style={{
                        padding: "4px 10px",
                        background:
                          compradorPago === "NO" ? "#dc2626" : "#e5e7eb",
                        color: compradorPago === "NO" ? "white" : "black",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      No pagó
                    </button>
                  </div>

                  {compradorPago === "SI" && (
                    <>
                      <div style={{ marginBottom: 4 }}>
                        ¿Cómo pagó el comprador?
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setFormaPagoCod("TRANSFERENCIA_VENDEDOR")
                          }
                          style={{
                            padding: "4px 10px",
                            background:
                              formaPagoCod === "TRANSFERENCIA_VENDEDOR"
                                ? "#0ea5e9"
                                : "#e5e7eb",
                            color:
                              formaPagoCod === "TRANSFERENCIA_VENDEDOR"
                                ? "white"
                                : "black",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Transferencia al vendedor
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormaPagoCod("EFECTIVO")}
                          style={{
                            padding: "4px 10px",
                            background:
                              formaPagoCod === "EFECTIVO"
                                ? "#0ea5e9"
                                : "#e5e7eb",
                            color:
                              formaPagoCod === "EFECTIVO" ? "white" : "black",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Efectivo
                        </button>
                      </div>

                      {formaPagoCod === "EFECTIVO" && (
                        <label>
                          Monto recibido en efectivo:
                          <input
                            type="number"
                            value={montoEfectivo}
                            onChange={(e) => setMontoEfectivo(e.target.value)}
                            style={{
                              width: "100%",
                              padding: 6,
                              marginTop: 2,
                            }}
                            min={0}
                          />
                        </label>
                      )}
                    </>
                  )}
                </>
              )}

              <button
                onClick={marcarEntregado}
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  background: "#16a34a",
                  color: "white",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Confirmar ENTREGADO
              </button>

              <hr style={{ margin: "12px 0" }} />

              <h3 style={{ fontSize: 15 }}>Marcar como FALLIDO</h3>
              <label>
                Motivo de la falla:
                <input
                  type="text"
                  value={motivoFalla}
                  onChange={(e) => setMotivoFalla(e.target.value)}
                  style={{ width: "100%", padding: 6, marginTop: 2 }}
                />
              </label>

              <button
                onClick={marcarFallido}
                style={{
                  marginTop: 8,
                  padding: "6px 12px",
                  background: "#dc2626",
                  color: "white",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Registrar entrega FALLIDA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de entregados / fallidos */}
      <div style={{ marginTop: 30 }}>
        <h2>Envíos registrados (entregados / fallidos)</h2>
        {enviosTerminados.length === 0 ? (
          <p style={{ fontSize: 14 }}>Aún no has registrado entregas.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {enviosTerminados.map((envio) => (
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
                <div>
                  <strong>{envio.codigo}</strong> – {envio.nombre}
                </div>
                <div style={{ fontSize: 13 }}>
                  {envio.direccion}, {envio.comuna}
                </div>
                <div style={{ fontSize: 13 }}>
                  Estado:{" "}
                  {envio.estado === "ENTREGADO" ? "ENTREGADO" : "FALLIDO"}
                </div>
                {envio.estado === "ENTREGADO" && (
                  <>
                    <div style={{ fontSize: 13 }}>
                      Recibe: {envio.nombreReceptor} ({envio.rutReceptor})
                    </div>
                    {envio.porCobrar && (
                      <div style={{ fontSize: 13 }}>
                        Pago COD:{" "}
                        {envio.formaPagoCod === "EFECTIVO"
                          ? `EFECTIVO (${envio.montoCobradoEfectivo})`
                          : envio.formaPagoCod === "TRANSFERENCIA_VENDEDOR"
                          ? "TRANSFERENCIA AL VENDEDOR"
                          : "—"}
                      </div>
                    )}
                  </>
                )}
                {envio.estado === "FALLIDO" && (
                  <div style={{ fontSize: 13 }}>Motivo: {envio.motivoFalla}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* MODAL LECTOR QR */}
      {mostrarQR && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setMostrarQR(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 16,
              borderRadius: 8,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Escanear QR</h3>
            <p style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>
              Apunta al código QR de la etiqueta. Al detectar el código,
              se seleccionará automáticamente el envío.
            </p>

            <QRReader
              onResult={(codigo) => {
                const encontrado = envios.find((e) => e.codigo === codigo);
                if (!encontrado) {
                  alert("Envío no encontrado para el código: " + codigo);
                } else {
                  setEnvioSeleccionado(encontrado);
                  alert("Envío seleccionado: " + encontrado.codigo);
                }
                setMostrarQR(false);
              }}
            />

            <button
              onClick={() => setMostrarQR(false)}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                fontSize: 13,
                borderRadius: 4,
                border: "1px solid #6b7280",
                background: "white",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
