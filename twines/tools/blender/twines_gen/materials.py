"""Brand PBR materials by role. Names are roles, never brands (Decision 9).

Only features the locally served runtime supports are used: no clear-coat, no transmission, and the
glass is plain alpha blending.
"""

import bpy

MARK = "twines_gen"

# role: (base color RGBA, metallic, roughness, alpha, emission strength)
ROLES = {
    "paint": ((0.46, 0.55, 0.72, 1.0), 0.45, 0.32, 1.0, 0.0),
    "glass": ((0.06, 0.09, 0.13, 1.0), 0.0, 0.08, 0.38, 0.0),
    "trim-dark": ((0.035, 0.04, 0.05, 1.0), 0.2, 0.5, 1.0, 0.0),
    "rubber": ((0.02, 0.02, 0.022, 1.0), 0.0, 0.85, 1.0, 0.0),
    "metal-cast": ((0.62, 0.65, 0.7, 1.0), 1.0, 0.38, 1.0, 0.0),
    "plastic-black": ((0.05, 0.05, 0.055, 1.0), 0.0, 0.6, 1.0, 0.0),
    "lens": ((0.95, 0.9, 0.75, 1.0), 0.0, 0.15, 1.0, 1.0),
}


def _principled(material):
    if material.node_tree is None:
        material.use_nodes = True
    return next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def get(role):
    """Return the material for ``role``, creating it once and reusing it afterwards."""
    base_color, metallic, roughness, alpha, emission = ROLES[role]
    material = bpy.data.materials.get(role)
    if material is None:
        material = bpy.data.materials.new(role)
        material[MARK] = True
    elif not material.get(MARK):
        raise RuntimeError(f"material '{role}' already exists in this file and is not generator-owned; rename it")
    material.diffuse_color = base_color  # viewport solid mode ignores the node tree
    bsdf = _principled(material)
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Alpha"].default_value = alpha
    bsdf.inputs["Emission Color"].default_value = base_color
    bsdf.inputs["Emission Strength"].default_value = emission
    material.use_backface_culling = alpha >= 1.0  # glass stays double-sided so far-side glass tints the view
    if alpha < 1.0:
        material.surface_render_method = "BLENDED"
    return material
