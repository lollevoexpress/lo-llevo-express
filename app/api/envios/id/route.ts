import { NextRequest, NextResponse } from "next/server";

// IMPORTANTE:
// Este archivo asume que el array "envios" está en el mismo módulo que app/api/envios/route.ts.
// Para hacerlo simple en StackBlitz, copiamos la misma definición acá y luego tú puedes
// extraerla a un archivo compartido si quieres refinar.

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

// TRUCO:
//
// Como en este ejemplo simple no tenemos una base de datos real,
// NO podemos compartir el array fácilmente entre archivos sin crear
// un módulo común. Para no complicarte, vamos a simular que el "estado"
// se maneja aquí también.
//
// Si quieres que realmente compartan el mismo array, habría que mover
// la definición de `envios` a un archivo aparte y que ambos lo importen.
//
// Por simplicidad DE MOMENTO, vamos a suponer que más adelante esto se
// reemplaza por una base de datos real (Supabase, etc.) y aquí solo
// te muestro la forma del PATCH.

let envios: Envio[] = [];

// PATCH /api/envios/[id] → actualizar estado de un envío
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const idNumber = Number(context.params.id);
  const body = await req.json();
  const { estado, nombreReceptor, rutReceptor, motivoFalla } = body;

  const envioIndex = envios.findIndex((e) => e.id === idNumber);

  if (envioIndex === -1) {
    return NextResponse.json(
      { error: "Envío no encontrado (en demo simple)" },
      { status: 404 }
    );
  }

  if (estado === "ENTREGADO") {
    if (!nombreReceptor || !rutReceptor) {
      return NextResponse.json(
        { error: "Faltan datos de receptor" },
        { status: 400 }
      );
    }
    envios[envioIndex] = {
      ...envios[envioIndex],
      estado: "ENTREGADO",
      nombreReceptor,
      rutReceptor,
      motivoFalla: undefined,
    };
  } else if (estado === "FALLIDO") {
    if (!motivoFalla) {
      return NextResponse.json(
        { error: "Falta motivo de falla" },
        { status: 400 }
      );
    }
    envios[envioIndex] = {
      ...envios[envioIndex],
      estado: "FALLIDO",
      motivoFalla,
      nombreReceptor: undefined,
      rutReceptor: undefined,
    };
  } else {
    return NextResponse.json(
      { error: "Estado inválido" },
      { status: 400 }
    );
  }

  return NextResponse.json({ envio: envios[envioIndex] });
}
