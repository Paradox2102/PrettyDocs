"""Split the Sketchfab "Xbox controller free" GLB into one named node per controller input.

The Sketchfab export merges the model into one mesh per material, so a button is not a part of its own. Each mesh
does fall apart into separate shells (connected triangles), and each input is a set of shells that this script picks
by material and by position. It writes a GLB with a node per input id ("ls", "rb", "a", ...) plus "body", each node
with extras.input set, in the site's frame: millimetres, +x right, +y toward the bumpers, +z out of the face.

Model: "Xbox controller free" by AT design studio (ANDRIANIAINAToky), CC Attribution,
https://sketchfab.com/3d-models/xbox-controller-free-913641c8ac254ca8bbc182d69487ff45

Run (numpy and scipy are not project dependencies):
  uv run --no-project --with numpy --with scipy python -I scripts/controllers/split_xbox_glb.py SRC.glb OUT.glb
then shrink OUT.glb with gltf-transform (see the README, Controls page).
"""
import json
import struct
import sys

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

WIDTH_MM = 153.0  # the Wolverine V2 is about 153 mm wide
FACE = {'a': 'Green', 'b': 'material', 'x': 'Blue', 'y': 'Yellow'}  # face button letter materials
DT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_glb(path):
    b = open(path, 'rb').read()
    magic, _, _ = struct.unpack_from('<4sII', b, 0)
    if magic != b'glTF':
        raise SystemExit(f'{path}: not a GLB file')
    n = struct.unpack_from('<I', b, 12)[0]
    g = json.loads(b[20:20 + n])
    bn = struct.unpack_from('<I', b, 20 + n)[0]
    return g, b[28 + n:28 + n + bn]


def accessor(g, binary, i):
    a = g['accessors'][i]
    bv = g['bufferViews'][a['bufferView']]
    dt = np.dtype(DT[a['componentType']])
    nc = NC[a['type']]
    stride = bv.get('byteStride', dt.itemsize * nc)
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    raw = np.frombuffer(binary, np.uint8, stride * (a['count'] - 1) + dt.itemsize * nc, start)
    out = np.lib.stride_tricks.as_strided(raw.view(dt), (a['count'], nc), (stride, dt.itemsize)).copy()
    return out if nc > 1 else out[:, 0]


def shells(pos, tris):
    """Label of each triangle's shell. Coincident vertices are welded first, so split normals do not split a shell."""
    _, weld = np.unique(np.round(pos, 4), axis=0, return_inverse=True)
    t = weld.ravel()[tris]
    e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]]])
    m = int(weld.max()) + 1
    _, lab = connected_components(coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(m, m)), directed=False)
    return lab[t[:, 0]]


def classify(material, c, face_centres):
    """The input id of one shell from its material and its centre c = (right, toward bumpers, out of face), raw units."""
    x, y, z = c
    if material in FACE.values():
        return next(k for k, v in FACE.items() if v == material)
    if material in ('Transparent', 'Front_button_inserts'):
        return min(face_centres, key=lambda k: (face_centres[k][0] - x) ** 2 + (face_centres[k][1] - y) ** 2)
    if material == 'Analogs_color':
        return 'ls' if x < 0 else 'rs'
    if material in ('white', 'Logo_black') or (material == 'Texte' and z > 2.1 and abs(x) > 0.8 and y > 1.5):
        return 'view' if x < -0.5 else 'menu' if x > 0.5 else 'xbox'
    if material == 'Direction':
        if y > 3.4 and abs(x) > 2.5:
            return ('lb' if x < 0 else 'rb') if z > 0.2 else ('lt' if x < 0 else 'rt')
        if -3.2 < x < -0.8 and -1.6 < y < 0.6 and z > 1.2:
            return 'dpad'
    return 'body'


def main(src, out):
    g, binary = read_glb(src)
    mats = g['materials']
    parts = {}  # input -> material index -> list of (pos, nrm, tris)
    found = []
    for ni in g['nodes'][2]['children']:
        for pr in g['meshes'][g['nodes'][ni]['mesh']]['primitives']:
            raw = accessor(g, binary, pr['attributes']['POSITION'])
            nrm = accessor(g, binary, pr['attributes']['NORMAL'])
            tris = accessor(g, binary, pr['indices']).reshape(-1, 3)
            # The source nodes hold a mirror; in the true shape the raw axes are (right, out of face, toward bumpers).
            pos = raw[:, [0, 2, 1]]
            nrm = nrm[:, [0, 2, 1]]
            tris = tris[:, [0, 2, 1]]  # the axis swap is a mirror too: keep the faces facing out
            lab = shells(pos, tris)
            for s in np.unique(lab):
                t = tris[lab == s]
                v = pos[np.unique(t)]
                found.append((mats[pr['material']]['name'], (v.min(0) + v.max(0)) / 2, pr['material'], pos, nrm, t))
    face_centres = {k: c for name, c, *_ in found for k, v in FACE.items() if name == v}
    for name, c, mi, pos, nrm, t in found:
        parts.setdefault(classify(name, c, face_centres), {}).setdefault(mi, []).append((pos, nrm, t))

    every = np.concatenate([p[0][np.unique(p[2])] for m in parts.values() for ps in m.values() for p in ps])
    lo, hi = every.min(0), every.max(0)
    centre = (lo + hi) / 2
    centre[2] = lo[2]  # the back of the controller sits on z = 0
    scale = WIDTH_MM / (hi[0] - lo[0])

    out_g = {'asset': {'version': '2.0', 'generator': 'split_xbox_glb.py'}, 'scene': 0, 'scenes': [{'nodes': []}],
             'nodes': [], 'meshes': [], 'accessors': [], 'bufferViews': [], 'buffers': [],
             'materials': mats, 'extensionsUsed': g.get('extensionsUsed', [])}
    blob = bytearray()

    def add(arr, target, kind):
        while len(blob) % 4:
            blob.append(0)
        data = np.ascontiguousarray(arr)
        out_g['bufferViews'].append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': data.nbytes, 'target': target})
        blob.extend(data.tobytes())
        acc = {'bufferView': len(out_g['bufferViews']) - 1, 'count': len(data),
               'componentType': 5126 if data.dtype == np.float32 else 5125, 'type': kind}
        if kind == 'VEC3':
            acc['min'] = data.min(0).tolist()
            acc['max'] = data.max(0).tolist()
        out_g['accessors'].append(acc)
        return len(out_g['accessors']) - 1

    for name in sorted(parts):
        prims = []
        for mi, pieces in sorted(parts[name].items()):
            ps, ns, ts, base = [], [], [], 0
            for pos, nrm, t in pieces:
                used = np.unique(t)
                remap = np.zeros(len(pos), np.uint32)
                remap[used] = np.arange(len(used), dtype=np.uint32) + base
                ps.append(((pos[used] - centre) * scale).astype(np.float32))
                ns.append(nrm[used].astype(np.float32))
                ts.append(remap[t].astype(np.uint32).ravel())
                base += len(used)
            prims.append({'attributes': {'POSITION': add(np.concatenate(ps), 34962, 'VEC3'),
                                         'NORMAL': add(np.concatenate(ns), 34962, 'VEC3')},
                          'indices': add(np.concatenate(ts), 34963, 'SCALAR'), 'material': mi})
        out_g['meshes'].append({'name': name, 'primitives': prims})
        node = {'name': name, 'mesh': len(out_g['meshes']) - 1}
        if name != 'body':
            node['extras'] = {'input': name}
        out_g['nodes'].append(node)
        out_g['scenes'][0]['nodes'].append(len(out_g['nodes']) - 1)
    out_g['buffers'].append({'byteLength': len(blob)})

    js = json.dumps(out_g, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    blob += b'\0' * (-len(blob) % 4)
    with open(out, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(blob)))
        f.write(struct.pack('<I4s', len(js), b'JSON') + js)
        f.write(struct.pack('<I4s', len(blob), b'BIN\0') + bytes(blob))
    for name in sorted(parts):
        n = sum(len(t) for ps in parts[name].values() for _, _, t in ps)
        print(f'{name:6} {n:7d} triangles')
    print(f'size {(hi - lo) * scale} mm')


if __name__ == '__main__':
    main(*sys.argv[1:3])
