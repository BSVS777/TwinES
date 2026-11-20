import { getContainer } from "@/infrastructure/container";
import { createVehicleHandlers } from "@/infrastructure/http/vehicle-handlers";

type Context = { params: Promise<{ id: string }> };

/** Setting a baseline replaces the stored one for that part, so PUT is the natural verb; POST is accepted too. */
async function setBaseline(request: Request, { params }: Context) {
  return createVehicleHandlers(getContainer()).setBaseline(request, (await params).id);
}

export { setBaseline as PUT, setBaseline as POST };
