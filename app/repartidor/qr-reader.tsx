"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QrReader() {
  const [resultado, setResultado] = useState("Escaneando...");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250
      },
      false
    );

    qrScanner.render(
      (decodedText: string) => {
        setResultado("QR detectado: " + decodedText);
        qrScanner.clear();
      },
      (error: any) => {
        // errores de lectura ignorados
      }
    );

    scannerRef.current = qrScanner;

    return () => {
      try {
        scannerRef.current?.clear();
      } catch (_) {}
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Lector QR Universal</h1>

      <div id="qr-reader" style={{ width: "100%" }} />

      <p style={{ marginTop: 20, fontSize: 18 }}>{resultado}</p>
    </div>
  );
}
