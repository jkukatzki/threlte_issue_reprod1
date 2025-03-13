<script lang="ts">
    import { BoxGeometry, MeshStandardMaterial, Object3D } from "three";
    import Piano from "./Piano.svelte";
    import type { PianoKey } from "./PianoKey.svelte";
    import { T, useThrelte } from "@threlte/core";
    import { interactivity } from "@threlte/extras";


    interface Props {
        pianoKeys: PianoKey[];
        ref: Object3D;
        whiteKeysParent: Object3D;
        blackKeysParent: Object3D;
    }

    let { pianoKeys = $bindable([]), ref, whiteKeysParent, blackKeysParent }: Props = $props();

    interactivity();
    

</script>

<T.Mesh onclick={() => {console.log('click', ref);}} position={[ref.position.x, ref.position.y, ref.position.z]}>
    <T.BoxGeometry args={[1, 1, 1]}></T.BoxGeometry>
    <T.MeshStandardMaterial color="red"></T.MeshStandardMaterial>
</T.Mesh>
<T.Group position={[ref.position.x, ref.position.y, ref.position.z]} scale={[ref.scale.x, ref.scale.y, ref.scale.z]} rotation={[ref.rotation.x, ref.rotation.y, ref.rotation.z]}>
    {#each pianoKeys as keyObject, keyIndex}
        {#if keyObject.object && keyObject.color == "white"}
            <T is={whiteKeysParent}>
                <T.Mesh
                    onpointerdown={() => {console.log('press', keyObject); keyObject.pressed = true;}}
                    position={[keyObject.object.position.x, keyObject.object.position.y - (keyObject.pressed ? 0.2 : 0), keyObject.object.position.z]}
                    geometry={keyObject.object.geometry}
                    material={keyObject.pressed ? new MeshStandardMaterial({color: 'teal'}) : keyObject.object.material}>
                </T.Mesh>
            </T> 
        {:else if keyObject.object && keyObject.color == "black"}
        <T is={blackKeysParent}>
            <T.Mesh 
                position={[keyObject.object.position.x, keyObject.object.position.y - (keyObject.pressed ? 0.2 : 0), keyObject.object.position.z]}
                geometry={keyObject.object.geometry}
                material={keyObject.pressed ? new MeshStandardMaterial({color: 'teal'}) : keyObject.object.material}>
            </T.Mesh>
        </T> 
        {/if}
    {/each}
</T.Group>