<script lang="ts">
    import { T } from '@threlte/core';
    import { AutoColliders, CollisionGroups, Debug, World } from '@threlte/rapier';
    import { AnimationAction, BoxGeometry } from 'three';
    import KinematicClientPlayerCharacter from './components/character/KinematicClientPlayerCharacter.svelte';
    import { gameState } from './states/game_state.svelte';
    import { useGltf, useGltfAnimations } from '@threlte/extras';
    import Piano from './components/interactable/Piano/Piano.svelte';


const playerGltf = useGltf('/models/character1.glb');
let { actions, mixer } = useGltfAnimations<string>(playerGltf);

const pianoGltf = useGltf('/models/piano.glb');

gameState.playerMixer = mixer;

let actionsState: Partial<Record<string, AnimationAction>> | undefined = $state();


$effect(() => {
  if ($playerGltf) {
    console.log('playerGltf', $playerGltf);
  }
  if ($actions) {
    actionsState = $actions;
  }
});

</script>

{#if $playerGltf && $pianoGltf && $actions}
<T.Camera makeDefault is={gameState.cameraOverwrite ? gameState.cameraOverwrite : gameState.camera}/>
<T.AmbientLight intensity={0.5} />
    <World>
        <Piano model={$pianoGltf.nodes.piano_game_object}></Piano>
        <Debug />
        <KinematicClientPlayerCharacter model={$playerGltf.nodes.player} actions={actions}/>
            <AutoColliders shape={'trimesh'}>
                <T.Mesh position.y={-0.5}>
                    <T.BoxGeometry args={[100, 1, 100]} />
                    <T.MeshStandardMaterial color={'red'} />
                </T.Mesh>
            </AutoColliders>
     
        
        
    </World>
{/if}

