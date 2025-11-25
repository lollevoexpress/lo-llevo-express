"use client";

import { useEffect, useRef } from "react";

export default function QRReader({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        scanLoop();
      } catch (e) {
        alert("No se pudo acceder a la cámara.");
        console.error(e);
      }
    }

    async function scanLoop() {
      if (!active) return;

      try {
        const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
        const detections = await barcodeDetector.detect(videoRef.current!);

        if (detections.length > 0) {
          const qrText = detections[0].rawValue;
          onResult(qrText);

          active = false;
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
          }
          return;
        }
      } catch (_) {}

      requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      active = false;
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
      <p style={{ color: "white", marginTop: 6 }}>Apunta al QR…</p>
    </div>
  );
}
