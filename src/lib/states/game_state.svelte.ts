import type { AnimationMixer, Camera, DataTexture, Object3D, PerspectiveCamera, Scene } from "three";

import type { RigidBody, World } from "@dimforge/rapier3d-compat";
import { Tween } from "svelte/motion";
import { cubicOut } from "svelte/easing";
import type { AsyncWritable } from "@threlte/core";
import type { ThrelteGltf } from "@threlte/extras";






class GameState {
    scene: Scene | undefined = $state();

    // cameras
    camera: PerspectiveCamera | undefined = $state();
    cameraOverwrite: Camera | undefined = $state();

    currentEnvMap: DataTexture | undefined = $state();
    debug = $state(false);
    physicsWorld: World | undefined = $state();
    playerPosition: Tween<[number, number, number]> = new Tween([0, 0, 0], { duration: 100, easing: cubicOut});
    playerYRotation: Tween<number> = new Tween(0, { duration: 100, easing: cubicOut});
    playerMixer: AnimationMixer | undefined = $state();
    playerModel: AsyncWritable<ThrelteGltf<{
        nodes: Record<string, any>;
        materials: Record<string, any>;
    }>> | undefined = $state();
    playerControlOverwrite: [number, number, number] | undefined = $state();
    playerControlOverwriteRotation: [number, number, number] | undefined = $state();
    
    // game focus
    focused = $state(false);

    thirdPersonCameraIsObstructed = $state(false);

    constructor() {
        const { MODE } = import.meta.env;
        if (MODE === 'development') {
            this.debug = true;
            console.log('Development mode', this.debug);
        }
    }
}

export let gameState = new GameState();