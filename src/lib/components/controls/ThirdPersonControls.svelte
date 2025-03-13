<script lang="ts">
    import { Camera, Vector3, Quaternion, Object3D, MathUtils, Euler } from 'three'
    import { useParent, useTask } from '@threlte/core'
    import { useRapier } from '@threlte/rapier'
    import { Ray } from '@dimforge/rapier3d-compat';
    import type { RigidBody } from '@dimforge/rapier3d-compat';
    import { playerControlStates } from '$lib/states/player_control.svelte';
      import { gameState } from '$lib/states/game_state.svelte';
  
      class RayLike {
    private originState: [x: number, y: number, z: number] = $state([0, 0, 0]);
    private directionState: [x: number, y: number, z: number] = $state([0, 0, 0]);
    private hitpointState: [x: number, y: number, z: number] = $state([0, 0, 0]);
    
    get origin() {return this.originState};
    set origin(val) {this.originState = val};
    get direction() {return this.directionState};
    set direction(val) {this.directionState = val};
    get hitpoint() {return this.hitpointState};
    set hitpoint(val) {this.hitpointState = val};

}

    interface Props {
      object: Object3D;
      rigidBody: RigidBody,
      verticalOffset: number,
      depthOffset?: number,
      yawOrbitSize: number,
      pitchOrbitSize: number
    }
  
    let { object, rigidBody, verticalOffset = 0.6, yawOrbitSize = 0.0, pitchOrbitSize = 0.0, depthOffset = -0.30}: Props = $props();
  
    const camera = useParent()
  
    const isCamera = (p: any): p is Camera => {
      return p.isCamera
    }
  
    let adjustedYawOrbitSizeSmoothed = yawOrbitSize;
    let adjustedPitchOrbitSizeSmoothed = pitchOrbitSize;
  
    if (!isCamera($camera)) {
      throw new Error('Parent missing: <PointerLockControls> need to be a child of a <Camera>')
    }
    let maxYawOrbitZoom = 0.5;
    let zoomedYawOrbitSize = $derived(yawOrbitSize + (playerControlStates.viewportZoom > maxYawOrbitZoom ? maxYawOrbitZoom : playerControlStates.viewportZoom));
    let zoomedPitchOrbitSize = $derived(pitchOrbitSize + playerControlStates.viewportZoom);
    
  
  function objectToCamOcclusionCheckRay(yawOrbitSize: number, yawOrbitSizeWithRaySpreadOffset: number, pitchOrbitSize: number, pitchRayY: number, pitchRayZ: number) {
    const objectOrigin = vectorFromObject({x: yawOrbitSize / 2, y: verticalOffset, z: depthOffset / 2});
    const ray = new Ray(objectOrigin, vectorFromObject({x: yawOrbitSizeWithRaySpreadOffset, y: verticalOffset + pitchRayY * zoomedPitchOrbitSize, z: 0 + pitchRayZ * zoomedPitchOrbitSize}).sub(objectOrigin).normalize());
    const rayHit = world.castRay(ray, (zoomedYawOrbitSize ** 2 + zoomedPitchOrbitSize ** 2) ** (1/2), true, undefined, undefined, undefined, rigidBody);
    let newYawOrbitSize = zoomedYawOrbitSize;
    let newPitchOrbitSize = zoomedPitchOrbitSize;
    let timeOfImpact = (zoomedYawOrbitSize ** 2 + zoomedPitchOrbitSize ** 2) ** (1/2);
    if (rayHit != null && rayHit.timeOfImpact < (zoomedPitchOrbitSize ** 2 + zoomedYawOrbitSize ** 2) ** (1/2) + 0.1) {
      timeOfImpact = rayHit.timeOfImpact;
      newPitchOrbitSize = rayHit.timeOfImpact * zoomedPitchOrbitSize * 0.81 / (zoomedPitchOrbitSize ** 2 + zoomedYawOrbitSize ** 2) ** (1/2);
      if (newPitchOrbitSize < maxYawOrbitZoom) {
        newYawOrbitSize = rayHit.timeOfImpact * zoomedYawOrbitSize  * 0.81 / (zoomedPitchOrbitSize ** 2 + zoomedYawOrbitSize ** 2) ** (1/2);
      }
    }
    return {objectOrigin, ray, timeOfImpact, newYawOrbitSize, newPitchOrbitSize, isHit: rayHit != null};
  }
  
  let { world } = useRapier();
  let offsetLast = new Vector3(0, 0, 0);
    // This is basically your update function
    useTask((delta) => {
      // the object's position is bound to the prop
      if (!object) return
      
      // camera is bound to object reference so we set rotation to that first
      const objectRotation = new Quaternion().setFromAxisAngle(new Vector3(0, -1, 0), playerControlStates.viewX);
      object.setRotationFromQuaternion(objectRotation);
  
      let sphereRayY;
      let sphereRayZ;
      // bind mouse y to look direction bound to half circle aligned to normal of orbit circle to player
      // cap it when looking directly down or up
      if (playerControlStates.viewY <= -Math.PI/2) {
        sphereRayY = -1;
        sphereRayZ = 0;
      } else if (playerControlStates.viewY >= Math.PI/2) {
        sphereRayY = 1
        sphereRayZ = 0;
      } else {
        sphereRayY = Math.cos(-playerControlStates.viewY + Math.PI/2);
        sphereRayZ = Math.sin(-playerControlStates.viewY + Math.PI/2);
      }
      let adjustedYawOrbitSize = zoomedYawOrbitSize;
      let adjustedPitchOrbitSize = zoomedPitchOrbitSize;
      let toCameraRays: RayLike[] = [new RayLike(), new RayLike(), new RayLike(), new RayLike()];
      let isObstructed = false;
      if (playerControlStates.viewportZoom > 0.05) {
        for (let i = 0; i < 4; i++) {
          let pitchOrbitRay = objectToCamOcclusionCheckRay(adjustedYawOrbitSize, adjustedYawOrbitSize * (0.8 + (i/3) * 1.5), adjustedPitchOrbitSize, Math.cos(-playerControlStates.viewY + (-0.5 + i/3) + Math.PI/2 ),
          Math.sin(-playerControlStates.viewY + (i/3) + Math.PI/2) + depthOffset);
          adjustedYawOrbitSize = pitchOrbitRay.newYawOrbitSize < adjustedYawOrbitSize ? pitchOrbitRay.newYawOrbitSize : adjustedYawOrbitSize;
          adjustedPitchOrbitSize = pitchOrbitRay.newPitchOrbitSize < adjustedPitchOrbitSize ? pitchOrbitRay.newPitchOrbitSize : adjustedPitchOrbitSize;
          if (pitchOrbitRay.isHit) {
            isObstructed = true;
          }
  
  
          let rO: [number, number, number] = [pitchOrbitRay.objectOrigin.x,pitchOrbitRay.objectOrigin.y, pitchOrbitRay.objectOrigin.z];
          let rDir: [number, number, number] = [pitchOrbitRay.ray.dir.x,pitchOrbitRay.ray.dir.y, pitchOrbitRay.ray.dir.z];
          let debugHelp = new RayLike();
          debugHelp.origin = rO;
          debugHelp.direction = rDir;
          debugHelp.hitpoint = getHitpointFromRay(rO, rDir, pitchOrbitRay.timeOfImpact);
          toCameraRays[i] = debugHelp;
        
        }
      }
      
      gameState.thirdPersonCameraIsObstructed = isObstructed;
  
      
  
      adjustedYawOrbitSizeSmoothed = MathUtils.lerp(adjustedYawOrbitSizeSmoothed, adjustedYawOrbitSize, delta * 5);
      adjustedPitchOrbitSizeSmoothed = MathUtils.lerp(adjustedPitchOrbitSizeSmoothed, adjustedPitchOrbitSize, delta * 5);
      const finalYawOS = adjustedYawOrbitSizeSmoothed * 0.85
      const finalPitchOS = adjustedPitchOrbitSizeSmoothed * 0.85;
      let offset = vectorFromObject({x: 0, y: verticalOffset - (playerControlStates.crouch ? 0.4 : 0), z: depthOffset});
      const cameraQuaternion = objectRotation.multiply(new Quaternion().setFromUnitVectors(new Vector3(0,0,1), {x:0, y: sphereRayY, z: sphereRayZ}));
      if (playerControlStates.viewportZoom > 0.05) {
        offset = vectorFromObject({x: finalYawOS, y: verticalOffset - (playerControlStates.crouch ? 0.4 : 0) + sphereRayY * finalPitchOS, z: depthOffset + sphereRayZ * finalPitchOS});
      }
      
      // then finally set the camera
      offsetLast.copy(offset);
      $camera.position.copy(offset);
      $camera.setRotationFromQuaternion(cameraQuaternion);
  

        
    });
  
    
  
    function vectorFromObject(vec: { x: number; y: number; z: number }) {
      const { x, y, z } = vec
      const ideal = new Vector3(x, y, z)
      ideal.applyQuaternion(object.quaternion)
      ideal.add(new Vector3(object.position.x, object.position.y, object.position.z))
      return ideal
    }
  
    function getHitpointFromRay(origin: [number, number, number], dir: [number, number, number], toi: number): [number, number, number] {
      return [
        origin[0] + toi * dir[0],
        origin[1] + toi * dir[1],
        origin[2] + toi * dir[2]
      ]
    }
  
    
  </script>