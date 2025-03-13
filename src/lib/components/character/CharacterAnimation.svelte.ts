
import { gameState } from "$lib/states/game_state.svelte";
import type { Vector3 as Vector3Rapier } from "@dimforge/rapier3d-compat";
import type { Tween } from "svelte/motion";
import { Quaternion, Vector3, MathUtils, AnimationAction } from "three";
import { playerControlStates } from "$lib/states/player_control.svelte";

class AnimationWeightsSmoothed {
  walk = $state(0)
  crouch_walk = $state(0)
  walk_sideways = $state(0)
  crouch_walk_sideways = $state(0)
  idle = $state(0)
  crouch_idle = $state(0)
  falling = $state(0)
}

const animationWeightsSmoothed = new AnimationWeightsSmoothed();

class CharacterAnimation {
  actions: any | undefined = $state();
}
export const characterAnimation = new CharacterAnimation();

export function setWeightsAndTimescales(animInfl: {xAxisSpeed: number, zAxisSpeed: number}, linVelScale: number, wishVec: Vector3, notGroundedTimeout: number, actions: any, delta: number) {
      animationWeightsSmoothed.walk = MathUtils.lerp(animationWeightsSmoothed.walk, playerControlStates.crouch ? 0 : animInfl.zAxisSpeed, delta * 10);
      animationWeightsSmoothed.crouch_walk = MathUtils.lerp(animationWeightsSmoothed.crouch_walk, playerControlStates.crouch ? animInfl.zAxisSpeed : 0, delta * 4);
      animationWeightsSmoothed.walk_sideways = MathUtils.lerp(animationWeightsSmoothed.walk_sideways, playerControlStates.crouch ? 0 : animInfl.xAxisSpeed, delta * 6);
      animationWeightsSmoothed.crouch_walk_sideways = MathUtils.lerp(animationWeightsSmoothed.crouch_walk_sideways, playerControlStates.crouch ? animInfl.xAxisSpeed : 0, delta * 6);
      animationWeightsSmoothed.idle = MathUtils.lerp(animationWeightsSmoothed.idle, playerControlStates.crouch ? 0 : (linVelScale > 1 ? 0 : 1), delta * 10);
      animationWeightsSmoothed.crouch_idle = MathUtils.lerp(animationWeightsSmoothed.crouch_idle, playerControlStates.crouch ? (linVelScale > 1 ? 0 : 1) : 0, delta * 4);
      animationWeightsSmoothed.falling = MathUtils.lerp(animationWeightsSmoothed.falling, notGroundedTimeout > 0.2 ? 1 : (wishVec.length() > 0.2 ? 0 : linVelScale > 0.2 ? 1 : 0), delta * 20);
      if (actions) {
        actions['walk']?.setEffectiveTimeScale(animInfl.zAxisSpeed * (- 1) * linVelScale * 0.25);
        actions['walk']?.setEffectiveWeight(Math.abs(animationWeightsSmoothed.walk));
        actions['crouch_walk_forward']?.setEffectiveTimeScale(animInfl.zAxisSpeed * (- 1) * linVelScale * 1);
        actions['crouch_walk_forward']?.setEffectiveWeight(Math.abs(animationWeightsSmoothed.crouch_walk));
        actions['walk_sideways']?.setEffectiveTimeScale(animInfl.xAxisSpeed * (- 1) * linVelScale * 0.34);
        actions['walk_sideways']?.setEffectiveWeight(Math.abs(animationWeightsSmoothed.walk_sideways));
        actions['crouch_walk_sideways']?.setEffectiveTimeScale(animInfl.xAxisSpeed * (- 1) * linVelScale);
        actions['crouch_walk_sideways']?.setEffectiveWeight(Math.abs(animationWeightsSmoothed.crouch_walk_sideways));
        actions['idle']?.setEffectiveWeight(Math.max(0.1, animationWeightsSmoothed.idle));
        actions['crouch_idle']?.setEffectiveWeight(Math.max(0, animationWeightsSmoothed.crouch_idle));
        actions['crouch_idle']?.setEffectiveTimeScale(0.6);
        actions['falling']?.setEffectiveWeight(Math.max(0, animationWeightsSmoothed.falling));
      }
      
    }

export function alignVelocityWorldToObjectLocal(desiredDir: Vector3, velVec: Tween<[number, number, number]>, objRotation: Quaternion) {
    let velVecLocal = new Vector3(velVec.current[0], velVec.current[1], velVec.current[2]).applyQuaternion(objRotation.clone().invert());
    let dot = velVecLocal.dot(desiredDir);
    let desiredDirScaled = desiredDir.clone().multiplyScalar(dot);

    return { xAxisSpeed : desiredDirScaled.x, zAxisSpeed : desiredDirScaled.z };
}

export function filterAnimationBones(
    action: AnimationAction,
    boneNames: string[],
    mode: 'include' | 'exclude' = 'include'
  ): void {
    // Casting to any to access the internal arrays
    const actionAny = action as any;
  
    // Grab the current property bindings & interpolants
    const bindings = actionAny._propertyBindings ?? [];
    const interpolants = actionAny._interpolants ?? [];
  
    // We’ll build new arrays that skip or include only the desired bones
    const filteredBindings: any[] = [];
    const filteredInterpolants: any[] = [];
  
    bindings.forEach((propertyMixer: any, index: number) => {
      const binding = propertyMixer.binding;
      const boneName = binding?.targetObject?.name;
  
      const isBoneInList = boneName && boneNames.includes(boneName);
  
      // If we are including only certain bones:
      //   - push this property if the boneName is in boneNames
      // If we are excluding certain bones:
      //   - push this property if the boneName is not in boneNames
      let keepThisBinding = false;
      if (mode === 'include') {
        keepThisBinding = isBoneInList;
      } else if (mode === 'exclude') {
        keepThisBinding = !isBoneInList;
      }
  
      if (keepThisBinding) {
        filteredBindings.push(propertyMixer);
        filteredInterpolants.push(interpolants[index]);
      }
    });
  
    // Replace the action's internal arrays with our filtered versions
    actionAny._propertyBindings = filteredBindings;
    actionAny._interpolants = filteredInterpolants;
  }