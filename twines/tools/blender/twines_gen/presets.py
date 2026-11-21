"""JSON preset loader and validation. The same files are read by the Node manifest (Decision 11)."""

import json
from dataclasses import dataclass
from pathlib import Path

PRESETS_DIR = Path(__file__).resolve().parent.parent / "presets"
BODY_TYPES = ("sedan", "hatchback", "suv", "pickup")
SOURCE_KINDS = ("parametric", "kenney")
CARGO_FEATURES = ("trunk",)  # "hatch" and "bed" arrive with the remaining shells
DIMENSIONS = (
    "length", "width", "height", "wheelbase", "track", "frontOverhang", "rearOverhang",
    "groundClearance", "wheelRadius", "wheelWidth",
)
PROFILE = (
    "noseHeight", "hoodHeight", "beltline", "deckHeight", "tailHeight", "windshieldBaseX",
    "roofFrontX", "roofRearX", "rearWindowBaseX", "pillarBX", "tumblehome", "cornerRadius",
    "roofCornerRadius", "archClearance",
)


class PresetError(ValueError):
    pass


@dataclass(frozen=True)
class Preset:
    id: str
    body_type: str
    source_kind: str
    dimensions: dict
    profile: dict
    cargo: str
    placements: dict


def _numbers(data, keys, section):
    missing = [key for key in keys if not isinstance(data.get(key), (int, float))]
    if missing:
        raise PresetError(f"preset '{section}' is missing numeric keys: {', '.join(missing)}")
    return {key: float(data[key]) for key in keys}


def _vector(value, where):
    if not (isinstance(value, list) and len(value) == 3 and all(isinstance(c, (int, float)) for c in value)):
        raise PresetError(f"{where} must be a 3-vector of numbers")
    return tuple(float(c) for c in value)


def _placements(raw):
    result = {}
    for assembly, transforms in raw.items():
        result[assembly] = [
            {key: _vector(t.get(key), f"placements.{assembly}[{i}].{key}") for key in ("position", "rotation", "scale")}
            for i, t in enumerate(transforms)
        ]
    return result


def parse(data) -> Preset:
    if data.get("bodyType") not in BODY_TYPES:
        raise PresetError(f"bodyType must be one of {BODY_TYPES}")
    source_kind = data.get("source", {}).get("kind")
    if source_kind not in SOURCE_KINDS:
        raise PresetError(f"source.kind must be one of {SOURCE_KINDS}")
    if data.get("cargo") not in CARGO_FEATURES:
        raise PresetError(f"cargo must be one of {CARGO_FEATURES}")
    return Preset(
        id=data["id"],
        body_type=data["bodyType"],
        source_kind=source_kind,
        dimensions=_numbers(data.get("dimensions", {}), DIMENSIONS, "dimensions"),
        profile=_numbers(data.get("profile", {}), PROFILE, "profile"),
        cargo=data["cargo"],
        placements=_placements(data.get("placements", {})),
    )


def available_ids():
    return sorted(path.stem for path in PRESETS_DIR.glob("*.json"))


def load(preset_id: str) -> Preset:
    path = PRESETS_DIR / f"{preset_id}.json"
    if not path.is_file():
        raise PresetError(f"no preset '{preset_id}' in {PRESETS_DIR} (available: {', '.join(available_ids())})")
    preset = parse(json.loads(path.read_text(encoding="utf-8")))
    if preset.id != preset_id:
        raise PresetError(f"preset id '{preset.id}' does not equal its file name '{preset_id}'")
    return preset
