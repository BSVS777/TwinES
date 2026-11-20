import { getContainer } from "@/infrastructure/container";
import { createAuthHandlers } from "@/infrastructure/http/auth-handlers";

export function POST(request: Request) {
  return createAuthHandlers(getContainer()).signUp(request);
}
