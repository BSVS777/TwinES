import { Prisma } from "@/generated/prisma/client";

/**
 * Returns the columns of a unique-constraint violation, or null for any other error.
 * With a driver adapter the columns live in `meta.driverAdapterError.cause.constraint.fields`.
 */
export function uniqueViolationFields(error: unknown): string[] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const meta = error.meta as
    | { driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } } }
    | undefined;
  return meta?.driverAdapterError?.cause?.constraint?.fields ?? [];
}

/** True when an update or delete matched no row (Prisma's P2025). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
