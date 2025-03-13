import type { RayColliderIntersection, RigidBody, Vector as VectorType } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';


export function jump(rB : RigidBody) {
    rB.applyImpulse(new Vector3(0, 2, 0), true);
}

export function move(direction: Vector3, deltaTime: number, sprint: boolean, crouch: boolean, downRayHit: RayColliderIntersection | null): Vector3 {

    if (downRayHit) {
        const projected = direction.clone().projectOnPlane(new Vector3(downRayHit.normal.x, downRayHit.normal.y, downRayHit.normal.z));
        
        // Check to avoid division by zero in case the projected vector is of zero length.
        if (projected.lengthSq() > 0) {
            // Set the length of the projected vector to the original wishDirection's length.
            projected.setLength(direction.length());
        } else {
            // If the projection resulted in a zero vector, you might want to handle it differently.
            console.warn('The projected movement vector is zero.');
        }
        direction.copy(projected);
    }
    
    let final = direction.multiplyScalar(deltaTime * (sprint ? 1.5 : (crouch ? 0.67 : 1)));
    //rB.applyImpulseAtPoint(final, point, true);
    

    return final;

}

// SOURCE ENGINE LIKE AIR ACCELERATE

export function airAccelerate(currentVel: Vector3, wishDir: Vector3, wishSpeed: number, airAccelerate: number, maxAirWishSpeed: number, deltaTime: number) {
    let addSpeed: number;
    let accelSpeed: number;
    let currentSpeed: number;

    if (wishSpeed > maxAirWishSpeed)
    {
        wishSpeed = maxAirWishSpeed;
    }
    
     currentSpeed = currentVel.dot(wishDir);
    
     addSpeed = wishSpeed - currentSpeed;
    
     if (addSpeed <= 0.0)
        return;
    
     accelSpeed = airAccelerate * deltaTime * wishSpeed;
    
     if (accelSpeed > addSpeed)
     {
     accelSpeed = addSpeed;
     }
    
     currentVel.add(wishDir.multiplyScalar(accelSpeed));
}