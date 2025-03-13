<script lang="ts">
    import { Euler, Vector3, Group, Quaternion, type AnimationAction, LoopOnce, MathUtils, RGBA_ASTC_10x10_Format, Object3D, Mesh} from 'three'
    import { type CurrentWritable } from '@threlte/core';
    import { T, useTask, useThrelte } from '@threlte/core'
    import { RigidBody, useRapier, usePhysicsTask } from '@threlte/rapier'
    import {type RigidBody as RigidBodyType, Collider as ColliderRapier, ColliderDesc, Capsule as CapsuleRapier, Ray} from '@dimforge/rapier3d-compat';
    import ThirdPersonControls from '../controls/ThirdPersonControls.svelte'
    import { jump, move } from './CharacterPhysicsManipulation';
    import CharacterKeyboardInput from '../input/CharacterKeyboardInput.svelte';
    import { playerControlStates } from '../../states/player_control.svelte';
    import CharacterMouseInput from '../input/CharacterMouseInput.svelte';
    import { gameState } from '$lib/states/game_state.svelte';
    import { createDitherMaterial } from '$lib/shading/shaders/ScreenDoorShader';
    import { setWeightsAndTimescales, characterAnimation, alignVelocityWorldToObjectLocal } from './CharacterAnimation.svelte';
    import { airAccelerate } from './CharacterPhysicsManipulation';
      import { Tween } from 'svelte/motion';
      import { useHeadset, useTeleport, useXR } from '@threlte/xr';
      import { compensateSlopeInMoveDirection } from './CharacterEnvironmentInfluence.svelte';
      
    interface Props {
      model: Object3D,
      actions: CurrentWritable<Partial<Record<string, AnimationAction>>>
    }
  
    let { model, actions }: Props = $props();
  
    let { ditherMat } = createDitherMaterial();
  
    let { camera } = useThrelte();
  
    $effect(() => {
      const armature = model.getObjectByName('Armature');
      const objectBody: Mesh = armature?.getObjectByName('player_body_mesh') as Mesh;
      const meshBody: Mesh = objectBody.children[0] as Mesh;
      const meshHat: Mesh = armature?.getObjectByName('hat') as Mesh;
      if (meshBody && meshHat) {
        meshBody.material = ditherMat
        meshHat.material = ditherMat;
      } 
  
      if ($actions['throw']) {
        $actions['throw'].setLoop(LoopOnce, 1);
        console.log('throw action', $actions['throw']);
      }
    });
  
    $effect(() => {
      ditherMat.uniforms.opacity.value = new Vector3().fromArray(gameState.playerPosition.target).add({x: 0, y: 1, z: 0}).distanceTo($camera.position)
    });
  
  
    const teleport = useTeleport();
  
    const initialPos = {x: 0, y: 5, z: 0};
    let initalPosSet = false;
  
    let radius = 0.3
  
    let capsule: Group | undefined = $state();
    
    const { world } = useRapier();
  
    const { isPresenting } = useXR();
    const headset = useHeadset();
  
  
    let rigidBody: RigidBodyType | undefined = $state();
    let collider: ColliderRapier | undefined;
    let height = $derived(0.5 / (playerControlStates.crouch ? 2 : 1));
    let colliderSizeArgs: [number, number] = $derived([height, radius]);
  
    $effect(() => {
      // reconstruct collider if args change when crouching etc.
      if (colliderSizeArgs) {
        const capsuleShape = new CapsuleRapier(colliderSizeArgs[0], colliderSizeArgs[1]);
        const colliderDesc = new ColliderDesc(capsuleShape);
        const translation = new Vector3(0, height, 0);
        colliderDesc.setTranslation(translation.x, translation.y, translation.z);
        colliderDesc.setSensor(true);
        if (collider) {
          world.removeCollider(collider, true);
        }
        collider = world.createCollider(colliderDesc, rigidBody);
      }
    })
    
    $effect(() => {
      if (playerControlStates.jumpRequest && rigidBody && notGroundedTimeout < 0.1) {
        jumpRequestFulfilled = false;
        $actions['jump']?.stop();
        $actions['jump']?.setEffectiveWeight(3);
        $actions['jump']?.play();
      }
    });
  
    $effect(() => {
      if (actions) {
       enableAllActions();
       characterAnimation.actions = actions;
      }
    });
  
    const playerAnims = ['walk', 'crouch_walk_forward', 'walk_sideways', 'crouch_walk_sideways', 'idle', 'crouch_idle', 'jump', 'falling'];
  
    function disableAllActions() {
      for (let i = 0; i < playerAnims.length; i++) {
        $actions[playerAnims[i]]?.stop();
      }
    }
  
    function enableAllActions() {
      for (let i = 0; i < playerAnims.length; i++) {
        $actions[playerAnims[i]]?.play();
      }
    }
  
    function fadeInAllActions() {
      for (let i = 0; i < playerAnims.length; i++) {
        $actions[playerAnims[i]]?.fadeIn(0.5);
      }
    }
  
    $effect(() => {
      if (gameState.playerControlOverwrite) {
        disableAllActions();
      } else {
        fadeInAllActions();
        setTimeout(enableAllActions, 500);
      }
    })
  
    let computedGravityForce = $state([0, 0, 0]);
  
    // CHARACTER CONTROLLER SETUP
    const characterControllerOffset = 0.05;
    
    let characterController = world.createCharacterController(characterControllerOffset);
    characterController.setMaxSlopeClimbAngle(40 * Math.PI / 180);
    // Automatically slide down on slopes smaller than 30 degrees.
    characterController.setMinSlopeSlideAngle(90 * Math.PI / 180);
    characterController.setUp({ x: 0.0, y: 1.0, z: 0.0});
  
    const tempVector = new Vector3();
    const tempEuler = new Euler();
    const tempQuat = new Quaternion();
    const rotation180Y = new Quaternion().setFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI);
  
    let currentVel: [number, number, number] = $state([0, 0, 0]);
    let playerRot: [number, number, number] = $state([0,0,0]);
    const jumpStrength = 0.075;
  
    // wait a certain amount of time before setting grounded boolean to false
    let notGroundedTimeout = 0;
    let jumpRequestFulfilled: boolean = $state(false);
  
    let linvelSmoothed: Tween<[number, number, number]> = new Tween([0,0,0]);
  
  
    usePhysicsTask((delta) => {
      if (!rigidBody || !capsule || !collider || !model || gameState.playerControlOverwrite) {
        if (gameState.playerControlOverwrite) {
          gameState.playerPosition.target = gameState.playerControlOverwrite;
          return
        }
        return;
      }
  
      // cast ray down for grounded check and getting normal of ground to compensate for sliding
      const downRayOrigin = rigidBody.translation();;
      downRayOrigin.y -= 0.2;
      const downRay = new Ray(downRayOrigin, {x: 0, y: -1 , z: 0});
      const downRayHit = world.castRayAndGetNormal(downRay, 0.35, true, undefined, undefined, undefined, rigidBody);
      if (downRayHit == null || downRayHit.timeOfImpact > 0.3) {
        notGroundedTimeout += delta;
      } else {
        notGroundedTimeout = 0;
      }
     
      const linVel = rigidBody.linvel();
      const linVelScale = new Vector3(linVel.x, 0, linVel.z).length();
      // get desired move direction
      const wishVec = tempVector.fromArray([playerControlStates.right - playerControlStates.left, 0, playerControlStates.backward - playerControlStates.forward]);
      // limit wishVec to 1
      const wishVecLimited = new Vector3();
      if (wishVec.length() > 1) {
        wishVecLimited.copy(wishVec).normalize();
      } else {
        wishVecLimited.copy(wishVec);
      }
      if (downRayHit != null) {
        wishVecLimited.copy(compensateSlopeInMoveDirection(downRayHit, wishVecLimited));
      }
      linvelSmoothed.set([linVel.x, linVel.y, linVel.z]);
      let animInfl = alignVelocityWorldToObjectLocal(wishVecLimited, linvelSmoothed, capsule.quaternion);
      // sort rotate and multiply by speed
      wishVecLimited.applyEuler(new Euler().copy(capsule.rotation));
      
      //limit strength player is able to move when already moving at high speed
      let desiredUserMovement = move(wishVecLimited, delta * 2.2, (notGroundedTimeout < 0.1 ? playerControlStates.sprint : false), playerControlStates.crouch, downRayHit);
     
      if (playerControlStates.jumpRequest && characterController.computedGrounded()) {
          jumpRequestFulfilled = false;
          desiredUserMovement.y = jumpStrength;
      }
  
      const computedMoveTranslation = new Vector3();

  
      if (notGroundedTimeout > 0.1) {
        
        if (!jumpRequestFulfilled) {
          jumpRequestFulfilled = true;
          playerControlStates.jumpRequest = false;
        }
        
        const gravityDownScale = 0.0435;
        const deltaSqrd = delta * delta;
        computedGravityForce[0] += world.gravity.x * deltaSqrd * gravityDownScale;
        computedGravityForce[1] += world.gravity.y * deltaSqrd * gravityDownScale;
        computedGravityForce[2] += world.gravity.z * deltaSqrd * gravityDownScale;
        currentVel[0] += computedGravityForce[0];
        currentVel[1] += computedGravityForce[1];
        currentVel[2] += computedGravityForce[2];
  
        computedMoveTranslation.set(currentVel[0], currentVel[1], currentVel[2]);
        airAccelerate(computedMoveTranslation, desiredUserMovement, wishVecLimited.length(), 7.5, 100, delta);
  
      } else {
        if (!jumpRequestFulfilled) {
          desiredUserMovement.y = jumpStrength;
        }
        computedGravityForce[0] = 0;
        computedGravityForce[1] = 0;
        computedGravityForce[2] = 0;
        computedMoveTranslation.set(desiredUserMovement.x, desiredUserMovement.y, desiredUserMovement.z);
      }
      // CHECK IF DESIREWORLD MOVEMENT IS POSSIBLE
      characterController.computeColliderMovement(
          collider,    // The collider we would like to move
          computedMoveTranslation, // The movement we would like to apply if there wasn’t any obstacle
      );
      // Read the result of the movement computation
      let correctedMovement = characterController.computedMovement();
      currentVel = [correctedMovement.x, correctedMovement.y, correctedMovement.z];
      let nextPos: {x: number, y: number, z: number}  = {x: 0, y: 0, z: 0};
  
      // setting of inital position kind of buggy so we ensure it here
      if (initalPosSet) {
        nextPos = {x: rigidBody.translation().x + correctedMovement.x, y: rigidBody.translation().y + correctedMovement.y, z: rigidBody.translation().z + correctedMovement.z};
      } else {
        nextPos = {x: initialPos.x + correctedMovement.x, y: initialPos.y + correctedMovement.y, z: initialPos.z + correctedMovement.z};
        initalPosSet = true;
      }
  
      rigidBody.setNextKinematicTranslation(nextPos);
  
      // set playerReference position (which we base the camera on) to that of rigidBody that was moved this frame
      // note that we do not change the rotation of the reference because we do this using the camera controls attached to the camera component
      const rotQ = capsule.quaternion;
      gameState.playerPosition.target = [nextPos.x, nextPos.y + 0.55, nextPos.z];
  
      if ($isPresenting && headset) {
        teleport(new Vector3().set(nextPos.x, nextPos.y, nextPos.z));
        const eulHeadset = new Euler().setFromQuaternion(headset.quaternion, 'YXZ');
        capsule.setRotationFromEuler(new Euler(0, eulHeadset.y, 0));
      };
  
      const rot = tempEuler.setFromQuaternion(tempQuat.set(rotQ.x, rotQ.y, rotQ.z, rotQ.w).multiply(rotation180Y));
      gameState.playerYRotation.target = rot.y;
      playerRot = [rot.x, gameState.playerYRotation.current, rot.z];
  
      // ANIMATION WEIGHTS
      setWeightsAndTimescales(animInfl, linVelScale, wishVecLimited, notGroundedTimeout, $actions, delta);
      
  
    })
  </script>
  
{#if gameState.playerControlOverwrite == undefined}
  <CharacterKeyboardInput/>
  <CharacterMouseInput/>
{/if}

  
  {#if capsule && rigidBody && !gameState.cameraOverwrite}
    <T.PerspectiveCamera bind:ref={gameState.camera}
      fov={playerControlStates.useSecondary ? 40 : 90}>
      {#if !$isPresenting}
        <ThirdPersonControls object={capsule} {rigidBody} verticalOffset={0.5} yawOrbitSize={0} pitchOrbitSize={0}/>
      {/if}
    </T.PerspectiveCamera>
  {/if}
  
  <T.Group
    bind:ref={capsule}
    position={gameState.playerPosition.current}
  >
  </T.Group>
  <RigidBody
      type={'kinematicPosition'}
      bind:rigidBody
    >
  </RigidBody>
  <T is={model} scale={0.85} position={gameState.playerControlOverwrite ? gameState.playerControlOverwrite : gameState.playerPosition.current}
                rotation={gameState.playerControlOverwriteRotation ? gameState.playerControlOverwriteRotation : playerRot}/>
  
  
  
  