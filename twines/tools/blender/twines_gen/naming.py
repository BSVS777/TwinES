"""Node-name contract (Decision 9) and the guard that runs before every export.

This module is deliberately free of ``bpy`` imports: it only reads ``name``, ``parent``, ``data`` and
``matrix_world`` from the objects it is given, so the rules stay easy to read and to test.
"""

import re

SHELL_ROOT = "shell"
SHELL_PIECE_PREFIX = "shell-"
ANCHOR_PREFIX = "anchor-"
ASSEMBLY_PREFIX = "asm-"
PART_PREFIX = "part-"
DETAIL_PREFIX = "detail-"

_SLUG = r"[a-z0-9]+(?:-[a-z0-9]+)*"
ALLOWED_NAME = re.compile(
    rf"^(?:{SHELL_ROOT}|shell-{_SLUG}|anchor-{_SLUG}-\d+|asm-{_SLUG}|part-{_SLUG}|detail-{_SLUG})$"
)
IMPORT_SUFFIX = re.compile(r"\.\d{3,}$")

# Whole-word tokens that must never appear in an object, mesh or material name (ASSET-29).
FORBIDDEN_TOKENS = frozenset(
    "toyota corolla camry honda civic fit nissan sentra kia rio hyundai tucson hilux "
    "ford chevrolet volkswagen mazda subaru bmw audi mercedes tesla".split()
)

POSITION_TOLERANCE = 1e-3


class ContractError(Exception):
    """Raised with every violation found, one per line."""


def anchor_name(assembly: str, index: int) -> str:
    return f"{ANCHOR_PREFIX}{assembly}-{index}"


def gltf_to_blender(vector):
    """Convert a Y-up glTF-space vector (front at +X) to the Z-up Blender space the generator builds in."""
    x, y, z = vector
    return (x, -z, y)


def expected_anchors(preset) -> dict:
    """Map every anchor node name the preset requires to its glTF-space position."""
    return {
        anchor_name(assembly, index): tuple(transform["position"])
        for assembly, transforms in preset.placements.items()
        for index, transform in enumerate(transforms)
    }


def _tokens(name: str):
    return re.split(r"[^a-z0-9]+", name.lower())


def _check_names(objects, problems):
    seen = set()
    for obj in objects:
        names = [("object", obj.name)]
        if getattr(obj, "data", None) is not None:
            names.append(("mesh", obj.data.name))
            names += [("material", slot.material.name) for slot in obj.material_slots if slot.material]
        for kind, name in names:
            if IMPORT_SUFFIX.search(name):
                problems.append(f"{kind} '{name}' carries an import or export suffix")
            if FORBIDDEN_TOKENS.intersection(_tokens(name)):
                problems.append(f"{kind} '{name}' contains a manufacturer or model name")
        if obj.name in seen:
            problems.append(f"object name '{obj.name}' is duplicated")
        seen.add(obj.name)
        if not ALLOWED_NAME.match(obj.name):
            problems.append(f"object name '{obj.name}' matches no allowed form")


def _check_anchors(objects, preset, problems):
    expected = expected_anchors(preset)
    found = {o.name: o for o in objects if o.name.startswith(ANCHOR_PREFIX)}
    for name in sorted(expected.keys() - found.keys()):
        problems.append(f"missing anchor '{name}'")
    for name in sorted(found.keys() - expected.keys()):
        problems.append(f"unexpected anchor '{name}'")
    for name in sorted(expected.keys() & found.keys()):
        want = gltf_to_blender(expected[name])
        got = tuple(found[name].matrix_world.translation)
        if max(abs(a - b) for a, b in zip(want, got)) > POSITION_TOLERANCE:
            problems.append(f"anchor '{name}' is at {got}, the preset places it at {want}")


def assert_contract(collection, preset) -> None:
    """Fail loudly unless ``collection`` satisfies the shell node contract for ``preset``."""
    objects = list(collection.all_objects)
    problems = []
    roots = [o for o in objects if o.name == SHELL_ROOT and o.parent is None]
    if len(roots) != 1:
        problems.append(f"expected exactly one '{SHELL_ROOT}' root, found {len(roots)}")
    _check_names(objects, problems)
    _check_anchors(objects, preset, problems)
    if problems:
        raise ContractError(f"node contract violated in '{collection.name}':\n  " + "\n  ".join(problems))
