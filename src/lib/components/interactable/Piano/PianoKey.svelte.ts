import type { Instrument } from "$lib/components/util/instrument/Instrument.svelte";
import type { Mesh } from "three";



export class PianoKey {
    pressed: boolean = $state(false);
    object: Mesh;
    label: string;
    color: 'white' | 'black';
    index: number;
    instrument: Instrument;

    constructor(instrument: Instrument, pressed: boolean, object: Mesh, label: string, color: 'white' | 'black', index: number) {
        this.instrument = instrument;
        this.pressed = pressed;
        this.object = object;
        this.label = label;
        this.color = color;
        this.index = index;
    }
    
}