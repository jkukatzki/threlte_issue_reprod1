<script>
    import App from '$lib/App.svelte'
    import { lockCursor } from '$lib/components/input/PointerLock.svelte';
  </script>
  
<div>
    <App />
</div>

<style>
    :global(body) {
      margin: 0 auto;
      overflow: hidden;
    }
  
    div {
      width: 100vw;
      height: 100vh;
      margin: 0 auto;
      overflow: hidden;
    }
</style>