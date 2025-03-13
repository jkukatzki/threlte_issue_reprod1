import { gameState } from "$lib/states/game_state.svelte";

let lockedCursorState = $state(false);

export let lockedCursor = {
    get value() { return lockedCursorState },
    set value(val) {lockedCursorState = val}
}

let lockChangeListener: any;

export function lockCursor(e: PointerEvent){
    //only request pointerlock on phyiscal mouseclick
    if(e.type == 'mousedown') return;
    console.log('mouseevent');
    let target = e.target as HTMLElement
    let request: Promise<void> = target.requestPointerLock();
    if (!lockChangeListener) {
        console.log('adding pointerlockchange listener');
        lockChangeListener = document.addEventListener("pointerlockchange", () => {
            lockedCursorState = document.pointerLockElement !== null;
            if (lockedCursorState) {
                gameState.focused = true;
            } else if (!gameState.playerControlOverwrite) {
                gameState.focused = false;
            }
        });
    } 
}

export function unlockCursor() {
    document.exitPointerLock();
    lockedCursorState = false;
}

export function lockCursorGlobal() {
    document.body.requestPointerLock();
    if (!lockChangeListener) {
        console.log('adding pointerlockchange listener');
        lockChangeListener = document.addEventListener("pointerlockchange", () => {
            lockedCursorState = document.pointerLockElement !== null;
            if (lockedCursorState) {
                gameState.focused = true;
            } else if (!gameState.playerControlOverwrite) {
                gameState.focused = false;
            }
        });
    }
}
      