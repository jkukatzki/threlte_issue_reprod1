<script lang="ts">
    import { inputDevices } from "$lib/components/stores/input_devices.svelte";
    import { onDestroy } from "svelte";
    import CloseButton from "$lib/components/util/HUD/UI/CloseButton.svelte";
    import { Card, CardBody, CardHeader, CardText, CardTitle, Col, Container, FormGroup, Input, Row } from "@sveltestrap/sveltestrap";
    import Knob from "$lib/components/util/HUD/UI/Knob.svelte";

    interface Props {
        onclose: () => void;
        keys: any[];
        keyMap: any;
        keyMapOptions: {[key: string]: any};
        synthType?
        : string;
        selectedMIDIInput: string;
        volume: number;
        effects: any;
    }
    let {onclose, keys = $bindable([]), keyMap = $bindable(), keyMapOptions, synthType = $bindable(), volume = $bindable(), selectedMIDIInput = $bindable(), effects}: Props = $props();

    let ref: Node | undefined = $state();
    $effect(() => {
        let foo = $state.snapshot(ref);
        if(foo instanceof Node) {
            document.body.children[0].appendChild(foo);
        }
    });

    onDestroy(() => {
        if(ref instanceof Element) {
            ref.remove();
        }
    });

    $effect(() => {
        if (inputDevices.midiInputPorts != null && !selectedMIDIInput) {
            selectedMIDIInput = inputDevices.midiInputPorts[inputDevices.midiInputPorts.length - 1].name;
        }
    })

</script>

<div bind:this={ref} class="piano-hud-window min-vh-100 min-vw-100 p-3">
    <Card class="p-3" theme="dark">
        <div style="position: absolute; top: -6px; left: -6px; z-index: 1">
            <CloseButton onclick={onclose}/>
        </div>
        <!-- <CardBody>
            <Row>
                <Col xs={3}>
                    <Container>
                        <Card theme="dark">
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col xs="auto">
                                        <FormGroup floating label="Key Map">
                                            <Input bind:value={keyMap} type="select">
                                                {#each Object.keys(keyMapOptions) as option}
                                                    <option value={keyMapOptions[option]}>{option}</option>
                                                {/each}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    {#if inputDevices.midiInputPorts != null}
                                        <Col xs="auto">
                                            <FormGroup floating label="MIDI">
                                                <Input bind:value={selectedMIDIInput} type="select" placeholder="Enter a value">
                                                    {#each inputDevices.midiInputPorts as option}
                                                        <option value={option.name}>{option.name}</option>
                                                    {/each}
                                                    {#if inputDevices.midiInputPorts.length === 0}
                                                        <option selected value="">No MIDI Inputs</option>
                                                    {/if}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                    {/if}
                                    <Col xs="auto">
                                        <FormGroup floating label="Synth Type">
                                            <Input bind:value={synthType} type="select">
                                                {#each ['Synth', 'AMSynth', 'FMSynth', 'Pluck', 'Noise'] as option}
                                                    <option value={option}>{option}</option>
                                                {/each}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col xs="auto">
                                        <Card class="p-2" style="width: 100%">
                                                <p>Volume</p>
                                                <Knob bind:value={volume} min={-12} max={12} unitString={"dB"}/>
                                        </Card>
                                        
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Container>
                    GENERAL INSTRUMENT SETTINGS
                    
                    
                </Col>
                <Col xs={9}>
                    {#if effects}
                        <Card theme="dark">
                            <CardHeader style="max-height: 10em">
                                <CardTitle>Effects</CardTitle>
                            </CardHeader>
                            <CardBody class="overflow-auto">
                                <Row cols={6}>
                                    {#each effects as effect}
                                        <Col>
                                            <Card class="p-2">    
                                                <p>{effect.effect.name}</p>
                                                <input type="checkbox" bind:checked={effect.active}/>
                                                <Knob value={effect.defaultVal} onValueChange={effect.onValue1Change} min={effect.minVal} max={effect.maxVal} unitString={""}/>
                                            </Card>
                                        </Col>
                                    {/each}
                                </Row>
                            </CardBody>
                        </Card>
                    {/if}
                </Col>
            </Row>
            <Row>
                {#each keys as key}
                    {#if key.pressed}
                    <Col xs={1}>
                        <p>{key.label}</p>
                    </Col>
                    {/if}
                {/each}
            </Row>
        </CardBody> -->
    </Card>
 
</div>

<style>
    .piano-hud-window {
        position: absolute;
        left: 50%;
        top: 0;
        transform: translate(-50%, 0);
        z-index: 1;
    }
</style>