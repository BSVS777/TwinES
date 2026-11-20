import type { PartId } from "@/domain/part-health/catalog";
import { STATUS_LABEL, type PartRow } from "./part-rows";
import styles from "./VehicleDiagram2D.module.css";

interface VehicleDiagram2DProps {
  parts: readonly PartRow[];
  selectedPartId: PartId | null;
  onSelect: (partId: PartId) => void;
}

interface Tile {
  x: number;
  y: number;
  text: string;
}

const TILE_WIDTH = 70;
const TILE_HEIGHT = 36;

/** The six under-the-hood parts are tiles in a callout; wheels are drawn on the vehicle itself. */
const ENGINE_BAY: Partial<Record<PartId, Tile>> = {
  "engine-oil": { x: 389, y: 12, text: "Engine oil" },
  "oil-filter": { x: 465, y: 12, text: "Oil filter" },
  "air-filter": { x: 541, y: 12, text: "Air filter" },
  "spark-plugs": { x: 389, y: 52, text: "Spark plugs" },
  coolant: { x: 465, y: 52, text: "Coolant" },
  battery: { x: 541, y: 52, text: "Battery" },
};

const REAR_WHEEL = { cx: 140, cy: 240 };
const FRONT_WHEEL = { cx: 490, cy: 240 };

function Zone({ part, selected, onSelect }: { part: PartRow; selected: boolean; onSelect: () => void }) {
  const tile = ENGINE_BAY[part.partId];
  return (
    <g
      className={styles.zone}
      role="button"
      tabIndex={0}
      aria-label={`${part.name}: ${STATUS_LABEL[part.status]}`}
      aria-pressed={selected}
      data-status={part.status}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <title>{`${part.name}: ${STATUS_LABEL[part.status]}`}</title>
      {tile && (
        <>
          <rect className={styles.shape} x={tile.x} y={tile.y} width={TILE_WIDTH} height={TILE_HEIGHT} rx={6} />
          <text className={styles.tileText} x={tile.x + TILE_WIDTH / 2} y={tile.y + TILE_HEIGHT / 2 + 4} textAnchor="middle" aria-hidden="true">
            {tile.text}
          </text>
        </>
      )}
      {part.partId === "tires" &&
        [REAR_WHEEL, FRONT_WHEEL].map((wheel) => (
          <g key={wheel.cx}>
            <circle className={styles.ring} cx={wheel.cx} cy={wheel.cy} r={31} />
            {selected && <circle className={styles.halo} cx={wheel.cx} cy={wheel.cy} r={41} />}
          </g>
        ))}
      {part.partId === "brake-pads" && (
        <circle className={styles.shape} cx={FRONT_WHEEL.cx} cy={FRONT_WHEEL.cy} r={16} />
      )}
    </g>
  );
}

/**
 * Generic side view with one clickable zone per tracked part, filled by its status color. Used
 * when WebGL is unavailable (VIEW-06) and shares its selection with the parts list (VIEW-05).
 */
export function VehicleDiagram2D({ parts, selectedPartId, onSelect }: VehicleDiagram2DProps) {
  return (
    <svg className={styles.diagram} viewBox="0 0 640 300" role="group" aria-label="Vehicle diagram">
      <path
        className={styles.body}
        d="M30 240 L30 190 Q30 176 50 172 L170 160 L215 112 Q222 104 236 104 L380 104 Q394 104 402 112 L440 158 L570 168 Q610 174 610 200 L610 240 Z"
      />
      <rect className={styles.callout} x={380} y={4} width={240} height={92} rx={8} />
      <line className={styles.leader} x1={520} y1={96} x2={520} y2={166} />
      <circle className={styles.wheel} {...REAR_WHEEL} r={38} />
      <circle className={styles.wheel} {...FRONT_WHEEL} r={38} />
      {parts.map((part) => (
        <Zone key={part.partId} part={part} selected={part.partId === selectedPartId} onSelect={() => onSelect(part.partId)} />
      ))}
      <text className={styles.caption} x={REAR_WHEEL.cx} y={196} textAnchor="middle" aria-hidden="true">
        Tires
      </text>
      <text className={styles.caption} x={FRONT_WHEEL.cx} y={196} textAnchor="middle" aria-hidden="true">
        Brake pads
      </text>
    </svg>
  );
}
