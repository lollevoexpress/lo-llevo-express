"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QrReader() {
  const [mensaje, setMensaje] = useState("Apunta el QR dentro del cuadro");
  const [codigoManual, setCodigoManual] = useState("");
  const [codigoFinal, setCodigoFinal] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 15,
        qrbox: { width: 280, height: 280 },
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setCodigoFinal(decodedText);
        setMensaje("QR detectado automáticamente ✅");
        // Si quieres detener la cámara al detectar:
        scanner.clear().catch((e) => console.error("clear error", e));
      },
      () => {
        // errores de lectura, los ignoramos
      }
    );

    scannerRef.current = scanner;

    return () => {
      try {
        scanner.clear();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  function usarCodigoManual() {
    if (!codigoManual.trim()) return;
    setCodigoFinal(codigoManual.trim());
    setMensaje("Código ingresado manualmente ✅");
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Escanear etiqueta</h1>
      <p style={{ fontSize: 14, marginBottom: 8 }}>
        1) Intenta escanear el QR con la cámara.<br />
        2) Si no funciona, usa Google Lens, copia el código y pégalo abajo.
      </p>

      {/* Lector con cámara */}
      <div
        id="qr-reader"
        style={{ width: "100%", maxWidth: 400, marginBottom: 16 }}
      />

      {/* Entrada manual */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: 12,
          marginTop: 8
        }}
      >
        <p style={{ fontSize: 14, marginBottom: 4 }}>
          Ingresar código manualmente:
        </p>
        <input
          value={codigoManual}
          onChange={(e) => setCodigoManual(e.target.value)}
          placeholder="Ej: LLE-1764031260112"
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #aaa",
            marginBottom: 8
          }}
        />
        <button
          onClick={usarCodigoManual}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#0284c7",
            color: "white",
            fontWeight: 600
          }}
        >
          Usar código
        </button>
      </div>

      {/* Resultado final */}
      <p style={{ marginTop: 16, fontSize: 15 }}>{mensaje}</p>
      {codigoFinal && (
        <p style={{ marginTop: 4, fontSize: 15 }}>
          <strong>Código:</strong> {codigoFinal}
        </p>
      )}
    </div>
  );
}
