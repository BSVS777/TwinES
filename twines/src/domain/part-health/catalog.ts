export type PartId =
  | "engine-oil"
  | "oil-filter"
  | "air-filter"
  | "brake-pads"
  | "tires"
  | "battery"
  | "coolant"
  | "spark-plugs";

export interface CatalogPart {
  id: PartId;
  name: string;
  /** Null means the part is tracked by time only. */
  kmInterval: number | null;
  monthInterval: number;
}

/** Generic service intervals for the 8 tracked parts; not manufacturer data. */
export const MAINTENANCE_CATALOG: readonly CatalogPart[] = [
  { id: "engine-oil", name: "Engine oil", kmInterval: 5000, monthInterval: 6 },
  { id: "oil-filter", name: "Oil filter", kmInterval: 5000, monthInterval: 6 },
  { id: "air-filter", name: "Air filter", kmInterval: 15000, monthInterval: 12 },
  { id: "brake-pads", name: "Brake pads", kmInterval: 30000, monthInterval: 24 },
  { id: "tires", name: "Tires", kmInterval: 50000, monthInterval: 48 },
  { id: "battery", name: "Battery", kmInterval: null, monthInterval: 36 },
  { id: "coolant", name: "Coolant", kmInterval: 40000, monthInterval: 24 },
  { id: "spark-plugs", name: "Spark plugs", kmInterval: 30000, monthInterval: 36 },
];
