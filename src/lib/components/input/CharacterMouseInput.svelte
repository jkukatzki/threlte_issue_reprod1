<script lang="ts">
    import { onDestroy } from "svelte";
    import { lockCursor, lockedCursor } from "../input/PointerLock.svelte";
    import {useThrelte} from '@threlte/core';
    import { playerControlStates } from '$lib/states/player_control.svelte';
        import { gameState } from "$lib/states/game_state.svelte";

    const { renderer, invalidate } = useThrelte()

    const domElement = renderer.domElement

    function onPointerMove(event: MouseEvent) {
        const lookSensitivity = 0.00025;

            playerControlStates.viewX  += event.movementX * lookSensitivity;
            playerControlStates.viewY += event.movementY * lookSensitivity;
        
        

        invalidate()
    }

    function onPointerDown(event: PointerEvent) {
        console.log('hey!', event.type, lockedCursor.value);
        if (event.type == 'mousedown' || event.type == 'pointerdown') {
            if (!lockedCursor.value) {
                lockCursor(event);
            }
            
        }
        if (event.button == 0) { playerControlStates.usePrimary = true; }
        if (event.button == 2) { playerControlStates.useSecondary = true; }
    }

    function onPointerUp(event: PointerEvent) {
        if (event.button == 0) { playerControlStates.usePrimary = false; }
        if (event.button == 2) { playerControlStates.useSecondary = false; }
    }

    function onWheelChange(event: WheelEvent) {
        if (event.deltaY > 0 && gameState.thirdPersonCameraIsObstructed) {
            return;
        }
        let a = playerControlStates.viewportZoom + (event.deltaY * (0.1+(playerControlStates.viewportZoom**1.1))*0.002);
        playerControlStates.viewportZoom = a > 10 ? 10 : a;
    }

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheelChange);
    $effect(() => {
        if (lockedCursor.value) {
            domElement.addEventListener('mousemove', onPointerMove);
        } else {
            domElement.removeEventListener('mousemove', onPointerMove)
        }
    });

    onDestroy(() => {
        domElement.removeEventListener('mousemove', onPointerMove);
        domElement.removeEventListener('pointerdown', onPointerDown);
        domElement.removeEventListener('pointerup', onPointerUp);
        domElement.removeEventListener('wheel', onWheelChange);
     })

</script>