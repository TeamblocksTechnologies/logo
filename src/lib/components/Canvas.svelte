<script lang="ts">
	import { onMount } from 'svelte';
	import type { ExportSettings, Variant } from '#lib/logo/defaults.ts';
	import { renderSvg, type Artboard } from '#lib/logo/layout.ts';
	import designUrl from '../../../resources/design.svg?url';

	interface Props {
		artboards: Artboard[];
		colors: ExportSettings['colors'];
		selected: Variant;
		reference: { visible: boolean; opacity: number; difference: boolean };
		/** Space covered by the floating panel, kept clear when fitting. */
		insetRight?: number;
	}

	let { artboards, colors, selected = $bindable(), reference, insetRight = 0 }: Props = $props();

	const NAMES: Record<Variant, string> = { icon: 'Icon', logo: 'Logo', favicon: 'Favicon' };
	const SPACING = 80;
	const MIN_ZOOM = 0.02;
	const MAX_ZOOM = 64;
	// Centre of the icon in resources/design.svg and its size in px per logo
	// unit, used to line up the overlay.
	const DESIGN = { width: 897, height: 256, iconX: 113.17, iconY: 128.19, scale: 0.777 };

	let el: HTMLDivElement;
	let width = $state(0);
	let height = $state(0);
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let spaceHeld = $state(false);
	let panning = $state(false);

	const placed = $derived.by(() => {
		let x = 0;
		return artboards.map((art) => {
			const p = { art, x, y: 0 };
			x += art.width + SPACING;
			return p;
		});
	});

	function overlay(art: Artboard) {
		if (!reference.visible) return '';
		const k = art.scale / DESIGN.scale;
		const x = art.iconCentre.x - DESIGN.iconX * k;
		const y = art.iconCentre.y - DESIGN.iconY * k;
		const blend = reference.difference ? ' style="mix-blend-mode:difference"' : '';
		return `<image href="${designUrl}" x="${x}" y="${y}" width="${DESIGN.width * k}" height="${DESIGN.height * k}" opacity="${reference.opacity}"${blend}/>`;
	}

	function zoomAt(next: number, sx = (width - insetRight) / 2, sy = height / 2) {
		next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
		panX = sx - ((sx - panX) * next) / zoom;
		panY = sy - ((sy - panY) * next) / zoom;
		zoom = next;
	}

	function fit(items: typeof placed, maxZoom = MAX_ZOOM) {
		if (!items.length || !width) return;
		const minX = Math.min(...items.map((p) => p.x));
		const minY = Math.min(...items.map((p) => p.y));
		const maxX = Math.max(...items.map((p) => p.x + p.art.width));
		const maxY = Math.max(...items.map((p) => p.y + p.art.height));
		const margin = 64;
		const availW = width - insetRight - margin * 2;
		const availH = height - margin * 2;
		zoom = Math.min(
			maxZoom,
			Math.max(MIN_ZOOM, Math.min(availW / (maxX - minX), availH / (maxY - minY)))
		);
		panX = margin + (availW - (maxX - minX) * zoom) / 2 - minX * zoom;
		panY = margin + (availH - (maxY - minY) * zoom) / 2 - minY * zoom;
	}

	export const fitAll = () => fit(placed);
	export const fitSelected = () => fit(placed.filter((p) => p.art.variant === selected));

	const STEPS = [0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64];
	const zoomIn = () => zoomAt(STEPS.find((s) => s > zoom + 1e-6) ?? MAX_ZOOM);
	const zoomOut = () => zoomAt([...STEPS].reverse().find((s) => s < zoom - 1e-6) ?? MIN_ZOOM);

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const scale = e.deltaMode === 1 ? 16 : 1;
		if (e.ctrlKey || e.metaKey) {
			// Trackpad pinch arrives as ctrl + wheel.
			const rect = el.getBoundingClientRect();
			zoomAt(
				zoom * Math.exp(-e.deltaY * scale * 0.01),
				e.clientX - rect.left,
				e.clientY - rect.top
			);
		} else {
			panX -= e.deltaX * scale;
			panY -= e.deltaY * scale;
		}
	}

	let drag: { x: number; y: number; panX: number; panY: number } | null = null;

	function onPointerDown(e: PointerEvent) {
		const onArtboard = (e.target as HTMLElement).closest('[data-artboard]');
		const pan = e.button === 1 || (e.button === 0 && (spaceHeld || !onArtboard));
		if (!pan) return;
		e.preventDefault();
		el.setPointerCapture(e.pointerId);
		drag = { x: e.clientX, y: e.clientY, panX, panY };
		panning = true;
	}

	function onPointerMove(e: PointerEvent) {
		if (!drag) return;
		panX = drag.panX + e.clientX - drag.x;
		panY = drag.panY + e.clientY - drag.y;
	}

	function onPointerUp() {
		drag = null;
		panning = false;
	}

	const typing = (e: KeyboardEvent) =>
		e.target instanceof HTMLElement &&
		e.target.closest('input, textarea, select, [contenteditable]');

	function onKeyDown(e: KeyboardEvent) {
		if (typing(e)) return;
		const mod = e.metaKey || e.ctrlKey;
		if (e.code === 'Space') {
			spaceHeld = true;
			e.preventDefault();
		} else if (e.shiftKey && e.code === 'Digit0') {
			zoomAt(1);
		} else if (e.shiftKey && e.code === 'Digit1') {
			fitAll();
		} else if (e.shiftKey && e.code === 'Digit2') {
			fitSelected();
		} else if (e.key === '=' || e.key === '+') {
			e.preventDefault();
			zoomIn();
		} else if (e.key === '-' || e.key === '_') {
			e.preventDefault();
			zoomOut();
		} else if (mod && e.key === '0') {
			e.preventDefault();
			zoomAt(1);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (e.code === 'Space') spaceHeld = false;
	}

	onMount(() => {
		// Non-passive so ctrl + wheel doesn't zoom the whole page.
		el.addEventListener('wheel', onWheel, { passive: false });
		requestAnimationFrame(() => fit(placed, 1));
		return () => el.removeEventListener('wheel', onWheel);
	});
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} onblur={() => (spaceHeld = false)} />

<div
	bind:this={el}
	bind:clientWidth={width}
	bind:clientHeight={height}
	class="absolute inset-0 overflow-hidden bg-[#1e1e1e] select-none"
	class:cursor-grab={spaceHeld && !panning}
	class:cursor-grabbing={panning}
	role="application"
	aria-label="Logo canvas"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	{#each placed as p (p.art.variant)}
		{@const active = p.art.variant === selected}
		<div class="absolute" style:left="{panX + p.x * zoom}px" style:top="{panY + p.y * zoom}px">
			<button
				data-artboard
				class="absolute bottom-full left-0 mb-1.5 flex gap-2 text-[11px] whitespace-nowrap"
				class:text-sky-400={active}
				class:text-neutral-400={!active}
				onclick={() => (selected = p.art.variant)}
			>
				{NAMES[p.art.variant]}
				<span class="text-neutral-500 tabular-nums">{p.art.width} × {p.art.height}</span>
			</button>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div data-artboard class="artboard" class:active onclick={() => (selected = p.art.variant)}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG is generated locally with escaped attributes -->
				{@html renderSvg(p.art, colors, {
					width: p.art.width * zoom,
					height: p.art.height * zoom,
					extra: overlay(p.art)
				})}
			</div>
		</div>
	{/each}
</div>

<div
	class="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg border border-neutral-700/60 bg-neutral-900/95 p-1 text-xs text-neutral-300 shadow-xl backdrop-blur"
>
	<button class="hud" onclick={zoomOut} title="Zoom out (-)">−</button>
	<button class="hud w-14 tabular-nums" onclick={() => zoomAt(1)} title="Zoom to 100% (⇧0)">
		{Math.round(zoom * 100)}%
	</button>
	<button class="hud" onclick={zoomIn} title="Zoom in (+)">+</button>
	<span class="mx-1 h-4 w-px bg-neutral-700"></span>
	<button class="hud px-2" onclick={fitAll} title="Zoom to fit (⇧1)">Fit</button>
	<button class="hud px-2" onclick={fitSelected} title="Zoom to selection (⇧2)">Selection</button>
</div>

<style>
	.artboard {
		outline: 1px solid rgb(255 255 255 / 0.08);
	}
	.artboard.active {
		outline: 1px solid var(--color-sky-500);
	}
	.artboard :global(svg) {
		display: block;
	}
	.hud {
		height: 1.5rem;
		min-width: 1.5rem;
		border-radius: 0.25rem;
	}
	.hud:hover {
		background: var(--color-neutral-700);
		color: var(--color-neutral-50);
	}
</style>
