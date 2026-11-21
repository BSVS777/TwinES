"""The dedicated ``twines-gen`` scene: the generator never touches any other scene or collection."""

import bpy

SCENE_NAME = "twines-gen"
COLLECTION_NAME = "twines-gen"


def prepare():
    """Return ``(scene, collection)``, emptied of the previous run's objects and ready to build into.

    Only objects linked to the ``twines-gen`` collection (and their own mesh data) are removed;
    everything else in the open Blender session is left alone.
    """
    scene = bpy.data.scenes.get(SCENE_NAME) or bpy.data.scenes.new(SCENE_NAME)
    collection = bpy.data.collections.get(COLLECTION_NAME) or bpy.data.collections.new(COLLECTION_NAME)
    if collection.name not in scene.collection.children:
        scene.collection.children.link(collection)
    clear(collection)
    view_layer = scene.view_layers[0]
    view_layer.update()  # a new scene has no layer collections until its view layer is synced
    view_layer.active_layer_collection = view_layer.layer_collection.children[collection.name]
    return scene, collection


def clear(collection):
    meshes = {o.data for o in collection.all_objects if o.type == "MESH"}
    for obj in list(collection.all_objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in meshes:
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)


def new_object(collection, name, data=None, parent=None):
    """Create an object linked only to ``collection``."""
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj
