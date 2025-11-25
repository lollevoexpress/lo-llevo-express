import { NextRequest, NextResponse } from "next/server";

// "Base de datos" en memoria (dentro del servidor)
type EstadoEnvio = "EN_RUTA" | "ENTREGADO" | "FALLIDO";

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
};

let envios: Envio[] = [];

// GET /api/envios → devuelve todos los envíos
export async function GET() {
  return NextResponse.json({ envios });
}

// POST /api/envios → crear nuevo envío (desde el cliente/vendedor)
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    nombre,
    direccion,
    comuna,
    telefono,
    porCobrar,
    monto,
  } = body;

  if (!nombre || !direccion || !comuna || !telefono) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  let montoNumber: number | null = null;
  if (porCobrar) {
    if (monto == null) {
      return NextResponse.json(
        { error: "Falta el monto a cobrar" },
        { status: 400 }
      );
    }
    montoNumber = Number(monto);
    if (isNaN(montoNumber) || montoNumber <= 0) {
      return NextResponse.json(
        { error: "Monto por cobrar inválido" },
        { status: 400 }
      );
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
    porCobrar: Boolean(porCobrar),
    monto: montoNumber,
    estado: "EN_RUTA", // por ahora entran directo como "en ruta" para el demo
  };

  envios.unshift(nuevoEnvio);

  return NextResponse.json({ envio: nuevoEnvio }, { status: 201 });
}
