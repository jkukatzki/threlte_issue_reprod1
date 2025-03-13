<script lang="ts">
    import { gameState } from "$lib/states/game_state.svelte";
    import InteractiveItem from "../InteractiveItem.svelte";
    import { T } from "@threlte/core";
    import { onDestroy, untrack } from "svelte";
    import { Camera, Mesh, Object3D, PerspectiveCamera, Quaternion, Vector2, Vector3 } from "three";
    import { PianoKey } from "./PianoKey.svelte";
    import { lockCursor, lockCursorGlobal, unlockCursor } from "$lib/components/input/PointerLock.svelte";
    import PianoDetailed from "./PianoDetailed.svelte";
    import { playerControlStates } from "$lib/states/player_control.svelte";

    interface Props {
        model: Object3D;
    }

    let { model }: Props = $props();

    let ref: Object3D | undefined = $state();

    let active: boolean = $state(false);

    let camera: Camera | undefined = $state();
    let refCamera: PerspectiveCamera | undefined = $state();

    let pianoInstrument = {rootKeyOffset: 27, keys: []};

    
    function handleInteract() {
        if (!ref) {
            return;
        }
        playerControlStates.interactPrimary = false;
        active = true;
        const worldPos = new Vector3();
        ref.getWorldPosition(worldPos);
        const worldRot = new Quaternion();
        ref.getWorldQuaternion(worldRot);
        gameState.playerControlOverwrite = [worldPos.x, worldPos.y + 0.35, worldPos.z - 0.1];
        gameState.playerControlOverwriteRotation = [0,0,0];
        if (model && model.getObjectByName('piano_camera')) {
            camera = model.getObjectByName('piano_camera')?.clone() as Camera;
            
            camera.position.add({x: worldPos.x, y: worldPos.y, z: worldPos.z});
            camera.applyQuaternion(worldRot);
        }
    }

    let initial = $state(false);

    $effect(() => {
        console.log('active', active);
        if (active == false) {
            lockCursorGlobal();
            untrack(() => {
                gameState.playerControlOverwrite = undefined;
                gameState.playerControlOverwriteRotation = undefined;
                gameState.cameraOverwrite = undefined;
                refCamera = undefined;
            });
        } else if (active == true) {
            console.log('ACTIVE!!!');
            unlockCursor();
            $effect(() => {
                if (camera) {
                    gameState.cameraOverwrite = camera;
                }
            });
            $effect(() => {
                if (keysObjects && !initial) {
                    console.log('setting up piano');
                    for (let keysObject of keysObjects) {
                        $effect(() => {
                            if (keysObject.pressed) {
                                // play key!
                            } else {
                                // stop playing key
                            }
                        })
                    }
                    untrack(() => {
                        initial = true;
                    })
                    
                }
            })
        }
    })

    function onKeyDown(e: KeyboardEvent): void {
        if (e.key == 'Escape') {
            active = false;
        }
        if (keyMap[e.key.toLowerCase()] !== undefined && keysObjects.length > 0) {
            const mappedKey = keyMap[e.key.toLowerCase()];
            //pianoInstrument.noteOn(keysObjects);
            if (!keysObjects[mappedKey+pianoInstrument.rootKeyOffset].pressed) {
                keysObjects[mappedKey+pianoInstrument.rootKeyOffset].pressed = true;
                // play key!
            }
            
        }
        
    };

    function onKeyUp(e: KeyboardEvent): void {
        if (keyMap[e.key.toLowerCase()] !== undefined && keysObjects.length > 0) {
            const mappedKey = keyMap[e.key.toLowerCase()];
            //pianoInstrument.noteOff(keysObjects);
            if (keysObjects[mappedKey+pianoInstrument.rootKeyOffset].pressed) {
                keysObjects[mappedKey+pianoInstrument.rootKeyOffset].pressed = false;
                // stop playing key
            }
        }
    }

    let selectedMIDIInput: string = $state('');

    const midiNoteOn = (e: any) => {
        if (keysObjects.length > 0) {
            const map: {[key: string]: number} = {
                "C": 0,
                "D": 2,
                "E": 4,
                "F": 5,
                "G": 7,
                "A": 9,
                "B": 11
            };
            const noteIndex = map[e.note.name] - 9 + e.note.octave * 12 + (e.note.accidental ? 1 : 0);
            keysObjects[noteIndex].pressed = true;
            // play key!
            
        }
    }

    const midiNoteOff = (e: any) => {
        if (keysObjects.length > 0) {
            const map: {[key: string]: number} = {
                "C": 0,
                "D": 2,
                "E": 4,
                "F": 5,
                "G": 7,
                "A": 9,
                "B": 11
            };
            const noteIndex = map[e.note.name] - 9 + e.note.octave * 12 + (e.note.accidental ? 1 : 0);
            keysObjects[noteIndex].pressed = false;

            // stop playing key
            
        }
    }

    const keyMapDe = {
        'q': -6,
        'a': -5,
        'w': -4,
        's': -3,
        'e': -2,
        'd': -1,
        'r': 0,
        'f': 0,
        't': 1,
        'g': 2,
        'z': 3,
        'h': 4,
        'u': 5,
        'j': 5,
        'i': 6,
        'k': 7,
        'o': 8,
        'l': 9,
        'p': 10,
        'ö': 11,
        'ä': 12,
    }
    const keyMapEn = {
        'q': -6,
        'a': -5,
        'w': -4,
        's': -3,
        'e': -2,
        'd': -1,
        'r': 0,
        'f': 0,
        't': 1,
        'g': 2,
        'y': 3,
        'h': 4,
        'u': 5,
        'j': 5,
        'i': 6,
        'k': 7,
        'o': 8,
        'l': 9,
        'p': 10,
    }

    let keyMapOptions = {'de': keyMapDe, 'us/uk': keyMapEn};
    let keyMap: {[key: string]: number} = $state(keyMapDe);

    let keysObjects: PianoKey[] = $state([]);
    let whiteKeysParent: Object3D | undefined = $state();
    let blackKeysParent: Object3D | undefined = $state();


    $effect(() => {
        if (model && ref) {
            const whiteKeys = model.getObjectByName('piano_white_keys');
            const blackKeys = model.getObjectByName('piano_black_keys');

            if (!whiteKeys || !blackKeys || whiteKeysParent || blackKeysParent) {
                console.error('could not find keys');
                return;
            }
            console.log('cloning');
            whiteKeysParent = whiteKeys?.clone();
            blackKeysParent = blackKeys?.clone();
            ref.remove(whiteKeys);
            ref.remove(blackKeys);
            let whiteKeyIndex = 0;
            let blackKeyIndex = 0;
            for (let i = pianoInstrument.rootKeyOffset; i < pianoInstrument.keys.length + pianoInstrument.rootKeyOffset - 1; i++) {
                const keyIndex = i - pianoInstrument.rootKeyOffset + 9;
                let label = "key";
                let keyModel;
                let color: "white" | "black" = "white";
                if (keyIndex % 12 == 0) {
                    color = 'white';
                    label = 'C';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 1) {
                    color = 'black';
                    label = 'C#';
                    blackKeyIndex++;
                } else if (keyIndex % 12 == 2) {
                    color = 'white';
                    label = 'D';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 3) {
                    color = 'black';
                    label = 'D#';
                    blackKeyIndex++;
                } else if (keyIndex % 12 == 4) {
                    color = 'white';
                    label = 'E';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 5) {
                    color = 'white';
                    label = 'F';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 6) {
                    color = 'black';
                    label = 'F#';
                    blackKeyIndex++;
                } else if (keyIndex % 12 == 7) {
                    color = 'white';
                    label = 'G';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 8) {
                    color = 'black';
                    label = 'G#';
                    blackKeyIndex++;
                } else if (keyIndex % 12 == 9) {
                    color = 'white';
                    label = 'A';
                    whiteKeyIndex++;
                } else if (keyIndex % 12 == 10) {
                    color = 'black';
                    label = 'A#';
                    blackKeyIndex++;
                } else if (keyIndex % 12 == 11) {
                    color = 'white';
                    label = 'B';
                    whiteKeyIndex++;
                }
                keyModel = color == 'white' ? whiteKeysParent?.children[0] as Mesh : blackKeysParent?.children[0] as Mesh;
                if (keyModel) {
                    const pianoKey = new PianoKey(pianoInstrument, false, keyModel, label, color, i - pianoInstrument.rootKeyOffset);
                    untrack(() => {
                        keysObjects.push(pianoKey);
                    });
                    if (color == 'white') {
                        whiteKeysParent?.remove(keyModel);
                    } else {
                        blackKeysParent?.remove(keyModel);
                    }
                } else {
                    console.error('could not find key', keyIndex);
                }
                
            }
        }
    })


    onDestroy(() => {
        if (whiteKeysParent && blackKeysParent) {
            ref?.add(whiteKeysParent);
            ref?.add(blackKeysParent);
            keysObjects.forEach((keyObject) => {
                if (keyObject.object) {
                    if (keyObject.color == 'white') {
                        whiteKeysParent?.add(keyObject.object);
                    } else {
                        blackKeysParent?.add(keyObject.object);
                    }
                }
            })
        }
    });
</script>


<InteractiveItem primaryActive={active} onPrimaryInteract={active ? undefined : handleInteract}>
    <T bind:ref={ref} is={model} position={[0,2,0]}></T>
</InteractiveItem>



{#if active && ref && whiteKeysParent && blackKeysParent}
    <PianoDetailed {ref} pianoKeys={keysObjects} {whiteKeysParent} {blackKeysParent}></PianoDetailed>
{/if}

<svelte:window
    on:keydown|preventDefault={active ? onKeyDown : undefined}
    on:keyup|preventDefault={active ? onKeyUp : undefined}
/>