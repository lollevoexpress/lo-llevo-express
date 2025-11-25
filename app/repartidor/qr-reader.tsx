"use client";

import { useEffect, useRef, useState } from "react";

export default function QrReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resultado, setResultado] = useState("Escaneando...");
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    // VERCEL FIX: evitar ejecutar en server
    if (typeof window === "undefined") return;

    // Revisar si el navegador soporta BarcodeDetector
    const soportado =
      "BarcodeDetector" in window &&
      typeof window.BarcodeDetector === "function";

    if (!soportado) {
      setResultado("BarcodeDetector no soportado en este dispositivo.");
      return;
    }

    iniciar();
  }, []);

  async function iniciar() {
    try {
      setActivo(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      leerQR();
    } catch (error) {
      console.error(error);
      setResultado("Error al acceder a la cámara.");
    }
  }

  async function leerQR() {
    // @ts-ignore
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    async function loop() {
      if (!activo || !videoRef.current) return;

      try {
        const resultados = await detector.detect(videoRef.current);

        if (resultados.length > 0) {
          setResultado("QR detectado: " + resultados[0].rawValue);
          setActivo(false);
          return;
        }
      } catch (e) {
        console.error("Error detectando:", e);
      }

      requestAnimationFrame(loop);
    }

    loop();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Lector QR</h1>

      <video
        ref={videoRef}
        autoPlay
        style={{ width: "100%", border: "2px solid black", borderRadius: 10 }}
      />

      <p style={{ marginTop: 20, fontSize: 18 }}>{resultado}</p>
    </div>
  );
}
