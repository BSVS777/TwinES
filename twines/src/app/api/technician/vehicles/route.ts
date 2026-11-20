import { getContainer } from "@/infrastructure/container";
import { createTechnicianHandlers } from "@/infrastructure/http/technician-handlers";

export function GET(request: Request) {
  return createTechnicianHandlers(getContainer()).findByPlate(request);
}
