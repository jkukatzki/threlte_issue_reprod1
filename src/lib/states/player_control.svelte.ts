class PlayerControlStates {
    viewX = $state(0);
    forward = $state(0);
    backward = $state(0);
    left = $state(0);
    right = $state(0);

    sprintState = $state(false);

    jumpRequest = $state(false);

    canJump = $state(false);

    crouchState: boolean = $state(false);

    canUncrouch = $state(true);

    usePrimary = $state(false);
    useSecondary = $state(false);

    interactPrimary = $state(false);
    interactSecondary = $state(false);

    selectedHotbarSlot = $state(0);
    
    private viewportZoomState = $state(5);

    controlMode: "keyboardmouse" | "gamepad" | "keyboardtouch" = $state("keyboardmouse");

    private viewYState = $state(0);
    get viewY() { return this.viewYState }
    set viewY(val: number) { this.viewYState = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, val)) }
    get viewportZoom() { return this.viewportZoomState }
    set viewportZoom(val: number) { this.viewportZoomState = val > 0 ? val : 0 }
    get sprint() { return this.sprintState }
    set sprint(val: boolean) { this.sprintState = val; if (val) { this.crouchState = false } }
    get crouch() { return this.crouchState }
    set crouch(val: boolean) { this.crouchState = val; if (val) { this.sprintState = false } }
}

export const playerControlStates = new PlayerControlStates();
