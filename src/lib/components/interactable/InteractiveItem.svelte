<script lang="ts">
    import { gameState } from "$lib/states/game_state.svelte";
    import { playerControlStates } from "$lib/states/player_control.svelte";
    import { T } from "@threlte/core";
    import { interactivity, Outlines } from "@threlte/extras";
    import { Box3, Vector3, type Group, type Object3D, type Object3DEventMap, type Vector2 } from "three";
    import ScreenDoorMaterial from "../../shading/shaders/ScreenDoorMaterial.svelte";

    interface Props {
        children: () => Object3D[];
        onPrimaryInteract?: () => void | undefined;
        // if item ist being interacted with through primary interaction
        primaryActive: boolean;
    }

    let { children, onPrimaryInteract = undefined, primaryActive} = $props();
    
    let ref: Group<Object3DEventMap>;

    let isFocused = $state(false);
    
    

    interactivity({
        compute: (event, state) => {
            if (!gameState.camera) {
                return;
            }
            state.raycaster.setFromCamera({x: 0, y: 0} as Vector2, gameState.camera);
        }
    });

    let bboxSize: [x: number, y: number, z: number] = $state([0, 0, 0]);
    let bboxPosition: [x: number, y: number, z: number] = $state([0, 0, 0]);

    $effect(() => {
        const bbox = new Box3().setFromObject(ref);
        const size = bbox.getSize(new Vector3());
        bboxSize = [size.x, size.y, size.z];
        const centerVec = new Vector3();
        bbox.getCenter(centerVec)
        bboxPosition = [centerVec.x, centerVec.y, centerVec.z];
        if (isFocused) {
            if (playerControlStates.interactPrimary) {
                if (onPrimaryInteract) {onPrimaryInteract();}
            }
        }
    })


</script>

{#if !primaryActive}
    <T.Group bind:ref={ref} onpointerenter={() => isFocused = true} onpointerleave={() => isFocused = false}>
        {@render children()}
    </T.Group>
    <T.Mesh position={bboxPosition} visible={isFocused}>
        <T.BoxGeometry args={bboxSize}></T.BoxGeometry>
        <ScreenDoorMaterial></ScreenDoorMaterial>
    </T.Mesh>
{:else}
    <T.Group>
        {@render children()}
    </T.Group>
{/if}

