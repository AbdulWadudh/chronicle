import { DICE } from "@chronicle/config";
import { IcosahedronGeometry, Quaternion, Vector3 } from "three";

export const DIE_RADIUS = 1;

export function createDieGeometry(): IcosahedronGeometry {
  const geometry = new IcosahedronGeometry(DIE_RADIUS, 0);
  geometry.computeVertexNormals();
  return geometry;
}

export function faceNormals(geometry: IcosahedronGeometry): Vector3[] {
  const positions = geometry.getAttribute("position");
  const normals: Vector3[] = [];
  for (let index = 0; index < positions.count; index += 3) {
    const a = new Vector3().fromBufferAttribute(positions, index);
    const b = new Vector3().fromBufferAttribute(positions, index + 1);
    const c = new Vector3().fromBufferAttribute(positions, index + 2);
    normals.push(a.add(b).add(c).divideScalar(3).normalize());
  }
  return normals;
}

export function quaternionForFace(normal: Vector3): Quaternion {
  const towardsCamera = new Vector3(0, 0, 1);
  return new Quaternion().setFromUnitVectors(normal.clone().normalize(), towardsCamera);
}

export function landingQuaternion(normals: readonly Vector3[], roll: number): Quaternion {
  const index = Math.min(Math.max(roll, DICE.criticalFailure), DICE.sides) - 1;
  const normal = normals[index] ?? normals[0];
  return normal === undefined ? new Quaternion() : quaternionForFace(normal);
}
