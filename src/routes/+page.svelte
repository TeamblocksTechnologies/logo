<script lang="ts">
	import { onMount } from 'svelte';
	import Canvas from '#lib/components/Canvas.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import { FONT_URL, type Variant } from '#lib/logo/defaults.ts';
	import { buildArtboard } from '#lib/logo/layout.ts';
	import { loadFont, type Font } from '#lib/logo/text.ts';
	import { app, persist } from '#lib/state.svelte.ts';

	let font: Font | null = $state.raw(null);

	const VARIANTS: Variant[] = ['icon', 'logo', 'favicon'];
	const artboards = $derived(
		VARIANTS.map((v) => buildArtboard(v, app.logo, app.export.frames[v], font))
	);

	$effect(() => {
		JSON.stringify(app);
		persist();
	});

	onMount(() => {
		loadFont(FONT_URL).then((f) => (font = f));
	});
</script>

<svelte:head>
	<title>Teamblocks logo</title>
</svelte:head>

<main class="fixed inset-0 overflow-hidden">
	{#if font}
		<Canvas
			{artboards}
			colors={app.export.colors}
			bind:selected={app.selected}
			reference={app.reference}
			insetRight={312}
		/>
	{/if}
	<Panel {artboards} />
</main>
