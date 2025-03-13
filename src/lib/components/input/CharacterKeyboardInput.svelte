<script lang="ts">

    import { gameState } from "$lib/states/game_state.svelte";
    import { playerControlStates } from "$lib/states/player_control.svelte";

    let lastJumpKeyDownCancelled = true;

    function onKeyDown(e: KeyboardEvent) {
        playerControlStates.controlMode = "keyboardmouse";
        switch (e.key.toLowerCase()) {
        case 'f11': {
            if (document.body.requestFullscreen) {
                document.body.requestFullscreen();
            }
            break;
        }
        case 's': {
            playerControlStates.backward = 1
            break
        }
            
        case 'w': {
            playerControlStates.forward = 1
            break
        }
           
        case 'a': {
            playerControlStates.left = 1
            break
        }
        
        case 'd': {
            playerControlStates.right = 1
            break
        }
        
        case ' ': {
            if (!lastJumpKeyDownCancelled) {
                break;
            }
            playerControlStates.jumpRequest = true;
            lastJumpKeyDownCancelled = false;
            console.log('jump request');
            break;
        }
        
        case 'c': {
            playerControlStates.crouch = true;
            break;
        }

        case 'shift': {
            playerControlStates.sprint = true;
            break;
        }

        case 'e' : {
            playerControlStates.interactPrimary = true;
            break;
        }
            
        default:
            break
        }
    }
    

    function onKeyUp(e: KeyboardEvent) {
        switch (e.key.toLowerCase()) {
            case 's': {
                playerControlStates.backward = 0
                break;
            }
                
            case 'w': {
                playerControlStates.forward = 0
                break
            }
                
            case 'a': {
                playerControlStates.left = 0
                break
            }
                
            case 'd': {
                playerControlStates.right = 0
                break
            }
                
            case ' ': {
                playerControlStates.jumpRequest = false;
                lastJumpKeyDownCancelled = true;
                break;
            }
                
            case 'c': {
                playerControlStates.crouch = false;
                break;
            }

            case 'shift': {
                playerControlStates.sprint = false;
                break;
            }

            case 'e' : {
                playerControlStates.interactPrimary = false;
                break;
            }
        
            default:
                break
        }
    }

</script>


<svelte:window
    on:keydown|preventDefault={onKeyDown}
    on:keyup|preventDefault={onKeyUp}
/>
