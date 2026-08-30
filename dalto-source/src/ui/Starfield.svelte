<script lang="ts">
  import { onMount } from 'svelte';
  let canvas: HTMLCanvasElement;
  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let stars: { x: number; y: number; r: number; a: number; s: number; dx: number }[] = [];
    let w = 0, h = 0, raf = 0;
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    function resize() {
      w = canvas.width = innerWidth; h = canvas.height = innerHeight; stars = [];
      const n = Math.min(150, Math.floor((w * h) / 9500));
      for (let i = 0; i < n; i++)
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.2,
          a: Math.random(), s: Math.random() * 0.02 + 0.004, dx: (Math.random() - 0.5) * 0.05 });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.a += st.s; if (st.a > 1 || st.a < 0) st.s *= -1;
        st.x += st.dx; if (st.x < 0) st.x = w; if (st.x > w) st.x = 0;
        ctx.globalAlpha = Math.abs(st.a) * 0.9;
        ctx.fillStyle = Math.random() < 0.05 ? '#f39f5a' : '#fff';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    }
    resize(); addEventListener('resize', resize);
    if (!reduce) draw();
    else stars.forEach((st) => { ctx.globalAlpha = st.a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill(); });
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  });
</script>
<canvas class="stars" bind:this={canvas}></canvas>
