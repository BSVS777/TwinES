"""Geometry helpers shared by the shell builders: smooth profile curves, lofted rings, boxes, cylinders.

Blender space: Z up, +X toward the front of the vehicle, Y lateral.
"""

import math

import bmesh
from mathutils import Matrix

ARC_SEGMENTS = 4
RING_POINTS = 4 * (ARC_SEGMENTS + 1)
# Index of the straight ring edge that starts at each side of the rounded cross-section.
TOP_EDGE = ARC_SEGMENTS
LEFT_EDGE = 2 * ARC_SEGMENTS + 1
BOTTOM_EDGE = 3 * ARC_SEGMENTS + 2
RIGHT_EDGE = RING_POINTS - 1


def curve(x, points):
    """Smoothstep interpolation through ``(x, value)`` control points sorted by ascending x; clamped outside."""
    if x <= points[0][0]:
        return points[0][1]
    for (x0, v0), (x1, v1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / (x1 - x0)
            return v0 + (v1 - v0) * t * t * (3 - 2 * t)
    return points[-1][1]


def ring(hw_bottom, hw_top, z0, z1, r_bottom, r_top):
    """Closed rounded-trapezoid cross-section as (y, z) points, starting at the top-right corner."""
    half_height = (z1 - z0) / 2
    rt = min(r_top, hw_top, half_height)
    rb = min(r_bottom, hw_bottom, half_height)
    corners = (
        (hw_top - rt, z1 - rt, rt, 0),
        (rt - hw_top, z1 - rt, rt, 90),
        (rb - hw_bottom, z0 + rb, rb, 180),
        (hw_bottom - rb, z0 + rb, rb, 270),
    )
    return [
        (cy + r * math.cos(math.radians(start + 90 * k / ARC_SEGMENTS)),
         cz + r * math.sin(math.radians(start + 90 * k / ARC_SEGMENTS)))
        for cy, cz, r, start in corners
        for k in range(ARC_SEGMENTS + 1)
    ]


def loft(bm, stations, face_class=None):
    """Bridge one ring per station into a closed solid.

    Each station is ``dict(x, hw_bottom, hw_top, z0, z1, r_bottom, r_top)`` ordered along X.
    ``face_class(station_index, ring_edge_index)`` sets each side face's material index.
    """
    rings = [
        [bm.verts.new((s["x"], y, z)) for y, z in ring(s["hw_bottom"], s["hw_top"], s["z0"], s["z1"], s["r_bottom"], s["r_top"])]
        for s in stations
    ]
    for s, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(RING_POINTS):
            face = bm.faces.new((a[i], a[(i + 1) % RING_POINTS], b[(i + 1) % RING_POINTS], b[i]))
            face.smooth = True
            face.material_index = face_class(s, i) if face_class else 0
    for cap in (rings[0], rings[-1][::-1]):
        bm.faces.new(cap).smooth = True
        for i in range(RING_POINTS):
            bm.edges.get((cap[i], cap[(i + 1) % RING_POINTS])).smooth = False  # crisp edge around each end cap
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])


def extract(bm, material_index):
    """Copy the faces with ``material_index`` into a new bmesh (all set to material index 0)."""
    bm.verts.index_update()
    out = bmesh.new()
    copies = {}
    for face in bm.faces:
        if face.material_index != material_index:
            continue
        for v in face.verts:
            if v.index not in copies:
                copies[v.index] = out.verts.new(v.co)
        out.faces.new([copies[v.index] for v in face.verts]).smooth = True
    return out


def box(bm, center, size):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(center) @ Matrix.Diagonal((*size, 1.0)))


def cylinder_y(bm, center, radius, depth, segments=36):
    """A cylinder whose axis is the lateral Y axis."""
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segments, radius1=radius, radius2=radius, depth=depth,
        matrix=Matrix.Translation(center) @ Matrix.Rotation(math.radians(90), 4, "X"),
    )
