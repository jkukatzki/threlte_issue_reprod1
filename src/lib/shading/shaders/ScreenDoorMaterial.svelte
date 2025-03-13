<script lang="ts">
    import { createDitherMaterial } from "./ScreenDoorShader";
    import { T } from "@threlte/core";
    
    let {ditherMat} = createDitherMaterial();

</script>

<T is={ditherMat}/>