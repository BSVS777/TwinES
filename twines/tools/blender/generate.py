"""Blender entry point: ``blender --background --factory-startup --python tools/blender/generate.py -- <args>``."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from twines_gen import run  # noqa: E402

run.main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
