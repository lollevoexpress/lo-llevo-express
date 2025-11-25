"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resultado, setResultado] = useState<string>("Esperando...");
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("SSR: no ejecutar scanner");
      return;
    }

    // Verificar compatibilidad
    const BarcodeDetectorAvailable =
      "BarcodeDetector" in window &&
      typeof window.BarcodeDetector === "function";

    if (!BarcodeDetectorAvailable) {
      setResultado("BarcodeDetector no soportado en este navegador.");
      return;
    }

    iniciarCamara();
  }, []);

  async function iniciarCamara() {
    try {
      setActivo(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      comenzarScan();
    } catch (err) {
      setResultado("Error al acceder a la cámara");
      console.error(err);
    }
  }

  async function comenzarScan() {
    if (!("BarcodeDetector" in window)) {
      setResultado("BarcodeDetector no está disponible");
      return;
    }

    // @ts-ignore
    const detector = new window.BarcodeDetector({
      formats: ["qr_code"],
    });

    async function scanLoop() {
      if (!activo || !videoRef.current) return;

      try {
        const barcodes = await detector.detect(videoRef.current);

        if (barcodes.length > 0) {
          setResultado("QR detectado: " + barcodes[0].rawValue);
          setActivo(false);
          return;
        }
      } catch (err) {
        console.error("Error detectando QR:", err);
      }

      requestAnimationFrame(scanLoop);
    }

    scanLoop();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Escanear QR</h1>

      <video
        ref={videoRef}
        autoPlay
        style={{ width: "100%", border: "2px solid #000", borderRadius: 10 }}
      />

      <p style={{ marginTop: 20, fontSize: 18 }}>{resultado}</p>
    </div>
  );
}
