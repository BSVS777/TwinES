# TwinES vehicle asset generator

A Blender script that builds the stylized vehicle shells (and, later, the system assemblies) from small JSON presets and exports them as GLB. The raw exports stay local; the optimized GLBs that the app serves are produced by the Node pipeline from a later change step.

- **Blender version**: pinned to **5.2.x** (developed and checked on 5.2.3 LTS). Other versions may work, but the export keywords are validated against the installed exporter and the script fails loudly when one is missing.
- **Conventions**: 1 unit = 1 m, the front of the vehicle at +X, Blender builds Z-up and the exporter writes Y-up. Node names follow the contract in `twines_gen/naming.py` (`shell`, `shell-<piece>`, `anchor-<assembly>-<n>`, `asm-<assembly>`, `part-<partId>`, `detail-<name>`). No manufacturer or model name may appear in any node, mesh or material name.
- **Safety**: everything is built inside a dedicated scene and collection called `twines-gen`. The script never touches other scenes or collections, so it is safe in a Blender session with open work. A material named after a role (`paint`, `glass`, ...) that already exists and was not created by the generator makes the run stop with a clear error.

## Layout

```
generate.py            entry point for the command line and the Text Editor
twines_gen/            the generator package (run, scene, naming, materials, presets, loft, shell, export)
presets/<id>.json      one preset per shell; also read by the app manifest
out/                   raw exports (git-ignored)
```

## Run it

### Command line (reference run)

From the `twines/` folder:

```
blender --background --factory-startup --python tools/blender/generate.py -- --target sedan-corolla --out tools/blender/out
```

`--target` is a preset id or `all`. `--factory-startup` removes user add-ons and preferences so runs are deterministic. On success the run prints `contract OK` per target and a JSON report with the raw triangle count, byte size, node names, materials and glTF extensions of each GLB.

### Blender MCP or any live session

Replace the placeholder with the absolute path of your checkout:

```python
import sys
sys.path.insert(0, r"<absolute path to the repository>/twines/tools/blender")
import twines_gen.run as run
run.reload_all()  # picks up edits made since the last run
run.main(["--target", "sedan-corolla", "--out", r"<absolute path to the repository>/twines/tools/blender/out"])
```

To look at the result, switch the window to the `twines-gen` scene (`bpy.context.window.scene = bpy.data.scenes["twines-gen"]`); the generator itself never changes the active scene.

### Text Editor

1. Open a new text block in Blender's Text Editor and paste the snippet from the previous section with your absolute paths.
2. Press Run Script. (`generate.py` itself reads its arguments after `--`, which only exists on the command line.)

## Add a preset

1. Copy `presets/sedan-corolla.json` to `presets/<id>.json` and set `id` to the same text as the file name.
2. Edit `bodyType`, `dimensions`, `profile`, `cargo` and `placements` (transforms are written in glTF axes: Y up, front at +X, rotation as Euler XYZ in radians).
3. Run the generator with `--target <id>`. The `assert_contract` guard stops the run when a name is wrong, a `.001` suffix appears or an anchor does not match the preset.

## Sign-off and screenshot checklist

- [ ] The run printed `contract OK` and the report shows no extension in `extensionsUsed` outside the allow-list.
- [ ] Triangles at most 100,000 and the GLB at most 2.5 MB (the contract check enforces this once the optimized files land).
- [ ] Viewport screenshots from the front three-quarter, side, top and rear, on the `twines-gen` scene.
- [ ] The shell reads as stylized-premium and the body type is recognizable.
- [ ] No manufacturer or model name in any node, mesh or material name.
