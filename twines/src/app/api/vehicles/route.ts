import { getContainer } from "@/infrastructure/container";
import { createVehicleHandlers } from "@/infrastructure/http/vehicle-handlers";

export function GET(request: Request) {
  return createVehicleHandlers(getContainer()).list(request);
}

export function POST(request: Request) {
  return createVehicleHandlers(getContainer()).register(request);
}
