"""Entry point shared by the Blender MCP, the Text Editor and the command line (Decision 8)."""

import argparse
import importlib
import json
import sys
from pathlib import Path

# Reload order: dependencies before dependents.
MODULES = ("naming", "presets", "scene", "materials", "loft", "shell", "export")


def reload_all():
    """Reload every generator module so edits are picked up inside a live Blender session."""
    package = __package__ or "twines_gen"
    importlib.invalidate_caches()
    for name in MODULES:
        qualified = f"{package}.{name}"
        if qualified in sys.modules:
            importlib.reload(sys.modules[qualified])
        else:
            importlib.import_module(qualified)


def _parse(argv):
    parser = argparse.ArgumentParser(prog="generate.py")
    parser.add_argument("--target", default="all", help="a preset id (for example sedan-corolla) or 'all'")
    parser.add_argument("--out", required=True, help="folder for the raw exports (git-ignored)")
    return parser.parse_args(argv)


def main(argv):
    from . import export, naming, presets, scene, shell

    args = _parse(argv)
    targets = presets.available_ids() if args.target == "all" else [args.target]
    reports = {}
    for target in targets:
        preset = presets.load(target)
        blender_scene, collection = scene.prepare()
        shell.build(preset, blender_scene, collection)
        naming.assert_contract(collection, preset)
        path = export.export_glb(blender_scene, collection, Path(args.out) / f"{preset.id}.glb")
        reports[preset.id] = export.describe_glb(path)
        print(f"[twines-gen] {preset.id}: contract OK, exported {path}")
    print("[twines-gen] report " + json.dumps(reports, indent=2))
    return reports
