import { getContainer } from "@/infrastructure/container";
import { createTechnicianHandlers } from "@/infrastructure/http/technician-handlers";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  return createTechnicianHandlers(getContainer()).recordService(request, (await params).id);
}
