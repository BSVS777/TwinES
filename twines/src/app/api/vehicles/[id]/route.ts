import { getContainer } from "@/infrastructure/container";
import { createVehicleHandlers } from "@/infrastructure/http/vehicle-handlers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  return createVehicleHandlers(getContainer()).get(request, (await params).id);
}

export async function PATCH(request: Request, { params }: Context) {
  return createVehicleHandlers(getContainer()).update(request, (await params).id);
}

export async function DELETE(request: Request, { params }: Context) {
  return createVehicleHandlers(getContainer()).remove(request, (await params).id);
}
