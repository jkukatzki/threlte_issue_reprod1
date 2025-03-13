import { Collider, Ray, RayColliderIntersection, RigidBody, type Vector3, type World } from "@dimforge/rapier3d-compat";
import { Vector3 as THREEVector3 } from "three";


export function compensateSlopeInMoveDirection(rayHit: RayColliderIntersection, moveDir: THREEVector3): THREEVector3 {

    const normal = rayHit.normal;
    const normal3 = new THREEVector3(normal.x, normal.y, normal.z);
    const moveDir3 = moveDir.clone();
    const moveDir3Normalized = moveDir3.normalize();

    const angle = normal3.angleTo(moveDir3Normalized);

    if (angle < Math.PI / 2) {
        const compensation = normal3.clone().multiplyScalar(moveDir3.dot(normal3)).negate();
        moveDir3.add(compensation);
    }

    return moveDir3;

}