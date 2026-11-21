"""Parametric sedan shell built from a preset (Blender space: Z up, +X front; the exporter writes Y up).

Pieces, all children of one ``shell`` root: ``shell-body`` (paint), ``shell-cabin`` (paint pillars and
roof), ``shell-glass``, ``shell-trim`` and ``shell-lights``. ``anchor-*`` empties come from the preset.
"""

import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

from . import loft, materials, naming, scene

PAINT, GLASS = 0, 1
PILLAR_B_HALF_WIDTH = 0.05
CABIN_SINK = 0.12  # how far the cabin base sits below the beltline, hidden inside the body


def _axles(d):
    half = d["length"] / 2
    return half - d["frontOverhang"], -half + d["rearOverhang"]


def _body_stations(d, p):
    half, hw = d["length"] / 2, d["width"] / 2
    top = [(-half, p["tailHeight"]), (-half + 0.4, p["deckHeight"]), (p["rearWindowBaseX"], p["deckHeight"]),
           (p["windshieldBaseX"], p["hoodHeight"]), (half - 0.5, p["hoodHeight"] - 0.11), (half, p["noseHeight"])]
    bottom = [(-half, 0.3), (-half + 0.35, d["groundClearance"]), (half - 0.35, d["groundClearance"]), (half, 0.32)]
    plan = [(-half, 0.74), (-half + 0.04, 0.83), (-half + 0.12, 0.91), (-half + 0.28, 0.97), (-half + 0.55, 1.0),
            (half - 0.55, 1.0), (half - 0.28, 0.97), (half - 0.12, 0.91), (half - 0.04, 0.82), (half, 0.72)]
    ends = (0.0, 0.03, 0.09, 0.18, 0.32)
    front = [half - e for e in ends]
    rear = [-half + e for e in reversed(ends)]
    middle = [front[-1] + (rear[0] - front[-1]) * i / 27 for i in range(1, 27)]
    return [
        {"x": x, "hw_bottom": hw * loft.curve(x, plan) * 0.93, "hw_top": hw * loft.curve(x, plan),
         "z0": loft.curve(x, bottom), "z1": loft.curve(x, top), "r_bottom": 0.05, "r_top": p["cornerRadius"]}
        for x in front + middle + rear
    ]


def _cabin_xs(p):
    front = [p["windshieldBaseX"] + (p["roofFrontX"] - p["windshieldBaseX"]) * i / 6 for i in range(7)]
    rear = [p["roofRearX"] + (p["rearWindowBaseX"] - p["roofRearX"]) * i / 5 for i in range(6)]
    span = p["roofFrontX"] - p["roofRearX"]
    roof = [p["roofRearX"] + span * i / 6 for i in range(1, 6)]
    pillar = [p["pillarBX"] + PILLAR_B_HALF_WIDTH, p["pillarBX"] - PILLAR_B_HALF_WIDTH]
    return sorted({round(x, 4) for x in front + rear + roof + pillar}, reverse=True)


def _cabin_stations(d, p, xs):
    base = d["width"] / 2 - 0.07
    roof_hw = base - p["tumblehome"]
    z0 = p["beltline"] - CABIN_SINK
    top = [(p["rearWindowBaseX"], p["deckHeight"] - 0.01), (p["roofRearX"], d["height"]),
           (p["roofFrontX"], d["height"]), (p["windshieldBaseX"], p["hoodHeight"] - 0.01)]
    width = [(p["rearWindowBaseX"], base - 0.12), (p["roofRearX"], roof_hw), (p["roofFrontX"], roof_hw),
             (p["windshieldBaseX"], base - 0.12)]
    return [
        {"x": x, "hw_bottom": base, "hw_top": loft.curve(x, width), "z0": z0, "z1": loft.curve(x, top),
         "r_bottom": 0.04, "r_top": p["roofCornerRadius"]}
        for x in xs
    ]


def _cabin_class(xs, p):
    """Glass on the windshield, the rear window and the side windows; paint on the roof and the pillars."""
    def face_class(s, edge):
        x = (xs[s] + xs[s + 1]) / 2
        on_roof = p["roofRearX"] <= x <= p["roofFrontX"]
        if edge == loft.TOP_EDGE:
            return PAINT if on_roof else GLASS
        is_side = edge in (loft.LEFT_EDGE, loft.RIGHT_EDGE)
        return GLASS if is_side and on_roof and abs(x - p["pillarBX"]) > PILLAR_B_HALF_WIDTH else PAINT
    return face_class


def _trim_and_lights(d):
    half, hw = d["length"] / 2, d["width"] / 2
    trim, lights = bmesh.new(), bmesh.new()
    loft.box(trim, (half - 0.015, 0, 0.5), (0.05, 0.9, 0.12))  # grille
    loft.box(trim, (half - 0.02, 0, 0.345), (0.06, 1.2, 0.05))  # front lip
    loft.box(trim, (-half + 0.02, 0, 0.36), (0.06, 1.15, 0.12))  # rear valance
    for side in (1, -1):
        loft.box(trim, (0, side * hw * 0.95, 0.22), (1.9, 0.05, 0.1))  # sill
        loft.box(lights, (half - 0.02, side * 0.46, 0.585), (0.06, 0.3, 0.07))  # headlamp
        loft.box(lights, (-half + 0.02, side * 0.52, 0.74), (0.06, 0.34, 0.07))  # tail lamp
    return trim, lights


def _make(collection, name, bm, role, parent):
    for face in bm.faces:
        face.material_index = 0
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(materials.get(role))
    return scene.new_object(collection, name, mesh, parent)


def _bake(blender_scene, obj):
    """Replace ``obj``'s mesh with its evaluated result and drop its modifiers."""
    view_layer = blender_scene.view_layers[0]
    with bpy.context.temp_override(scene=blender_scene, view_layer=view_layer):
        depsgraph = bpy.context.evaluated_depsgraph_get()
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph), depsgraph=depsgraph)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    bpy.data.meshes.remove(old)
    mesh.name = obj.name


def _cut_wheel_arches(blender_scene, collection, body, d, p):
    hw = d["width"] / 2
    cutter_bm = bmesh.new()
    for axle in _axles(d):
        for side in (1, -1):
            loft.cylinder_y(cutter_bm, (axle, side * (hw - 0.16), d["wheelRadius"]), d["wheelRadius"] + p["archClearance"], 0.52)
    for face in cutter_bm.faces:
        face.smooth = True
    mesh = bpy.data.meshes.new("detail-arch-cutter")
    cutter_bm.to_mesh(mesh)
    cutter_bm.free()
    cutter = scene.new_object(collection, "detail-arch-cutter", mesh)
    boolean = body.modifiers.new("arches", "BOOLEAN")
    boolean.operation, boolean.solver, boolean.object = "DIFFERENCE", "EXACT", cutter
    _bake(blender_scene, body)
    bpy.data.objects.remove(cutter, do_unlink=True)
    bpy.data.meshes.remove(mesh)


def _soften(obj):
    bevel = obj.modifiers.new("bevel", "BEVEL")
    bevel.width, bevel.segments, bevel.limit_method, bevel.angle_limit = 0.012, 2, "ANGLE", math.radians(30)
    obj.modifiers.new("weighted-normal", "WEIGHTED_NORMAL").keep_sharp = True


def _place_anchors(collection, preset):
    to_blender = Matrix.Rotation(math.radians(90), 4, "X")  # glTF Y-up space to Blender Z-up space
    # A transform written in glTF axes becomes C @ T @ C^-1 in Blender axes, so the exporter's own
    # Y-up conversion hands back exactly the preset transform.
    for assembly, transforms in preset.placements.items():
        for index, t in enumerate(transforms):
            anchor = scene.new_object(collection, naming.anchor_name(assembly, index))
            anchor.empty_display_type, anchor.empty_display_size = "ARROWS", 0.12
            local = Matrix.LocRotScale(Vector(t["position"]), Euler(t["rotation"], "XYZ"), Vector(t["scale"]))
            anchor.matrix_world = to_blender @ local @ to_blender.inverted()


def build(preset, blender_scene, collection):
    """Build the whole shell for ``preset`` inside ``collection``."""
    d, p = preset.dimensions, preset.profile
    root = scene.new_object(collection, naming.SHELL_ROOT)
    root.empty_display_type = "PLAIN_AXES"

    body_bm = bmesh.new()
    loft.loft(body_bm, _body_stations(d, p))
    body = _make(collection, "shell-body", body_bm, "paint", root)
    _cut_wheel_arches(blender_scene, collection, body, d, p)
    _soften(body)

    xs = _cabin_xs(p)
    cabin_bm = bmesh.new()
    loft.loft(cabin_bm, _cabin_stations(d, p, xs), _cabin_class(xs, p))
    cabin = _make(collection, "shell-cabin", loft.extract(cabin_bm, PAINT), "paint", root)
    _make(collection, "shell-glass", loft.extract(cabin_bm, GLASS), "glass", root)
    cabin_bm.free()
    _soften(cabin)

    trim_bm, lights_bm = _trim_and_lights(d)
    _make(collection, "shell-trim", trim_bm, "trim-dark", root)
    _make(collection, "shell-lights", lights_bm, "lens", root)
    _place_anchors(collection, preset)
