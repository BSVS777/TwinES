import type { CalendarDate } from "@/domain/shared/calendar-date";
import type { PartBaseline } from "@/domain/part-health/health-estimator";

export type Role = "owner" | "technician";
export type BodyType = "sedan" | "hatchback" | "suv" | "pickup";

export interface Clock {
  /** Current calendar date in America/Costa_Rica. */
  today(): CalendarDate;
  now(): Date;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface SessionTokens {
  /** A fresh, unguessable session token. The caller stores it in the cookie. */
  generate(): string;
  /** One-way digest of a token. Only this digest is ever persisted. */
  hash(token: string): string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UserRepository {
  /** Throws `Conflict` when the email is already registered. */
  create(input: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export interface NewSession {
  /** SHA-256 hex digest of the session token; the raw token is never stored. */
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

export interface SessionStore {
  create(session: NewSession): Promise<void>;
  /** Returns the session owner, or null when the session is unknown or expired at `now`. */
  findUserByTokenHash(tokenHash: string, now: Date): Promise<User | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export interface LoginThrottle {
  /** Normalized (lowercase) email; kept even when no account exists for it. */
  email: string;
  failedCount: number;
  lockedUntil: Date | null;
}

export interface LoginThrottleStore {
  find(email: string): Promise<LoginThrottle | null>;
  /** Creates or replaces the record for `throttle.email`. */
  save(throttle: LoginThrottle): Promise<void>;
  /** Removes the record; a no-op when none exists. */
  reset(email: string): Promise<void>;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  currentMileageKm: number;
  purchaseDate: CalendarDate;
  monthlyMileageKm: number;
  baselines: PartBaseline[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewVehicle {
  ownerId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  currentMileageKm: number;
  purchaseDate: CalendarDate;
  monthlyMileageKm: number;
  /** Initial baselines, persisted together with the vehicle. */
  baselines?: PartBaseline[];
}

/** Editable details; ownership and baselines change through their own operations. */
export type VehicleChanges = Partial<Omit<NewVehicle, "ownerId" | "baselines">>;

export interface VehicleRepository {
  /** Throws `Conflict` when the plate is already registered. */
  create(input: NewVehicle): Promise<Vehicle>;
  /** Returns null both when the vehicle is missing and when it belongs to someone else. */
  findByIdForOwner(id: string, ownerId: string): Promise<Vehicle | null>;
  findById(id: string): Promise<Vehicle | null>;
  /** Exact match on the stored (uppercase) plate. */
  findByPlate(plate: string): Promise<Vehicle | null>;
  listByOwner(ownerId: string): Promise<Vehicle[]>;
  /** Throws `Conflict` when the new plate is taken. */
  update(id: string, changes: VehicleChanges): Promise<Vehicle>;
  /** Removes the vehicle and its baselines. */
  delete(id: string): Promise<void>;
  upsertBaseline(vehicleId: string, baseline: PartBaseline): Promise<void>;
}
