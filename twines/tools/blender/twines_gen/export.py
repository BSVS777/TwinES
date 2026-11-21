"""GLB export with fixed settings, each keyword validated against the live exporter (Decision 9)."""

import json
import struct
from pathlib import Path

import bpy

# Fixed export settings. Every key must exist on the installed exporter; unknown keys fail loudly
# instead of being passed through, because the exporter's keywords change between Blender versions.
SETTINGS = {
    "export_format": "GLB",
    "export_yup": True,
    "export_apply": True,
    "use_active_scene": True,
    "use_active_collection": True,
    "use_selection": False,
    "export_cameras": False,
    "export_lights": False,
    "export_animations": False,
    "export_skins": False,
    "export_morph": False,
    "export_extras": False,
    "export_draco_mesh_compression_enable": False,
    "export_meshopt_compression_enable": False,
    "export_use_gltfpack": False,
    "export_normals": True,
    "export_texcoords": False,
    "export_materials": "EXPORT",
    "export_image_format": "NONE",
}


class ExportConfigError(RuntimeError):
    pass


def validated_settings():
    available = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    missing = sorted(set(SETTINGS) - available)
    if missing:
        raise ExportConfigError(
            f"the glTF exporter in Blender {bpy.app.version_string} has no keyword(s): {', '.join(missing)}"
        )
    return dict(SETTINGS)


def export_glb(scene, collection, path) -> Path:
    """Export only ``collection`` of ``scene`` to ``path`` without touching the user's active scene."""
    settings = validated_settings()
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    view_layer = scene.view_layers[0]
    view_layer.active_layer_collection = view_layer.layer_collection.children[collection.name]
    with bpy.context.temp_override(scene=scene, view_layer=view_layer):
        result = bpy.ops.export_scene.gltf(filepath=str(target), **settings)
    if "FINISHED" not in result:
        raise ExportConfigError(f"glTF export returned {result}")
    return target


def read_glb_json(path):
    """Return the JSON chunk of a GLB (header: magic, version, length; first chunk: length, type)."""
    data = Path(path).read_bytes()
    magic, _version, _length = struct.unpack_from("<4sII", data, 0)
    chunk_length, chunk_type = struct.unpack_from("<I4s", data, 12)
    if magic != b"glTF" or chunk_type != b"JSON":
        raise ExportConfigError(f"{path} is not a GLB with a JSON first chunk")
    return json.loads(data[20:20 + chunk_length])


def describe_glb(path) -> dict:
    """Raw triangle count, byte size, node names and extensions of an exported GLB."""
    doc = read_glb_json(path)
    triangles = 0
    for mesh in doc.get("meshes", []):
        for primitive in mesh["primitives"]:
            accessor = doc["accessors"][primitive["indices"]] if "indices" in primitive else None
            if primitive.get("mode", 4) == 4 and accessor:
                triangles += accessor["count"] // 3
    return {
        "bytes": Path(path).stat().st_size,
        "triangles": triangles,
        "nodes": [node["name"] for node in doc.get("nodes", [])],
        "materials": [m["name"] for m in doc.get("materials", [])],
        "extensionsUsed": doc.get("extensionsUsed", []),
    }
