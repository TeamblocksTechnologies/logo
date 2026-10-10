<script lang="ts">
	import { app, resetExport, resetLogo } from '#lib/state.svelte.ts';
	import { EXPORT_DEFAULTS, LOGO_DEFAULTS, type Variant } from '#lib/logo/defaults.ts';
	import { backAngleRange } from '#lib/logo/geometry.ts';
	import { renderSvg, type Artboard } from '#lib/logo/layout.ts';
	import { downloadPng, downloadSvg, logoDefaultsSource } from '#lib/logo/export.ts';
	import ColorField from './ColorField.svelte';
	import NumberField from './NumberField.svelte';
	import Section from './Section.svelte';
	import Segmented from './Segmented.svelte';
	import Toggle from './Toggle.svelte';

	interface Props {
		artboards: Artboard[];
	}

	let { artboards }: Props = $props();

	const { icon, wordmark, favicon } = LOGO_DEFAULTS;
	const variants: { value: Variant; label: string }[] = [
		{ value: 'icon', label: 'Icon' },
		{ value: 'logo', label: 'Logo' },
		{ value: 'favicon', label: 'Favicon' }
	];

	const backRange = $derived(backAngleRange(app.logo.icon));
	const art = $derived(artboards.find((a) => a.variant === app.selected)!);
	const frame = $derived(app.export.frames[app.selected]);
	const frameDefaults = $derived(EXPORT_DEFAULTS.frames[app.selected]);
	const scale = $derived(app.export.scale);
	const filename = $derived(`teamblocks-${app.selected}${scale === 1 ? '' : `@${scale}x`}`);
	const outW = $derived(art.width * scale);
	const outH = $derived(art.height * scale);

	let flash = $state('');
	function notify(message: string) {
		flash = message;
		setTimeout(() => flash === message && (flash = ''), 1600);
	}

	const exportSvg = () => renderSvg(art, app.export.colors, { width: outW, height: outH });

	async function exportFile() {
		if (app.export.format === 'svg') downloadSvg(exportSvg(), filename);
		else await downloadPng(exportSvg(), outW, outH, filename);
	}

	async function copy(text: string, message: string) {
		await navigator.clipboard.writeText(text);
		notify(message);
	}

	function swapColors() {
		const { colors } = app.export;
		const fg = colors.icon;
		colors.icon = colors.text = colors.background;
		colors.background = fg;
	}
</script>

{#snippet reset(onclick: () => void, title: string)}
	<button class="text-[11px] text-neutral-500 hover:text-neutral-200" {onclick} {title}
		>Reset</button
	>
{/snippet}

<aside
	class="absolute top-3 right-3 bottom-3 flex w-[300px] flex-col overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-900/95 text-neutral-200 shadow-2xl backdrop-blur"
>
	<div class="flex-1 overflow-y-auto">
		<Section title="Icon" hint="Sizes are relative: an arrow edge is 100.">
			{#snippet actions()}
				{@render reset(resetLogo, 'Reset all logo values to the defaults file')}
			{/snippet}
			<NumberField
				label="Tip angle"
				bind:value={app.logo.icon.tipAngle}
				def={icon.tipAngle}
				min={20}
				max={120}
				step={0.5}
				unit="°"
			/>
			<NumberField
				label="Back angle"
				bind:value={app.logo.icon.backAngle}
				def={icon.backAngle}
				min={Math.ceil(backRange.min)}
				max={Math.floor(backRange.max)}
				step={0.5}
				unit="°"
				title="Angle of the back edges. 0° lines both arrows' backs up flat; positive pulls the inner corner towards the tip."
			/>
			<NumberField
				label="Arrow gap"
				bind:value={app.logo.icon.gap}
				def={icon.gap}
				min={0}
				max={60}
				step={0.5}
			/>
			<NumberField
				label="Tip radius"
				bind:value={app.logo.icon.tipRadius}
				def={icon.tipRadius}
				min={0}
				max={30}
				step={0.25}
			/>
			<NumberField
				label="Wing radius"
				bind:value={app.logo.icon.wingRadius}
				def={icon.wingRadius}
				min={0}
				max={30}
				step={0.25}
			/>
			<NumberField
				label="Inner radius"
				bind:value={app.logo.icon.innerRadius}
				def={icon.innerRadius}
				min={0}
				max={60}
				step={0.25}
			/>
		</Section>

		<Section title="Wordmark">
			<div class="flex h-7 items-center gap-2 text-xs">
				<span class="w-24 shrink-0 text-neutral-400">Text</span>
				<input
					class="h-6 min-w-0 flex-1 rounded bg-neutral-800 px-1.5 text-neutral-100 outline-none focus:ring-1 focus:ring-sky-500"
					bind:value={app.logo.wordmark.text}
				/>
			</div>
			<NumberField
				label="Text height"
				bind:value={app.logo.wordmark.size}
				def={wordmark.size}
				min={20}
				max={300}
				step={0.5}
				title="Cap height of the text"
			/>
			<NumberField
				label="Letter spacing"
				bind:value={app.logo.wordmark.letterSpacing}
				def={wordmark.letterSpacing}
				min={-20}
				max={20}
				step={0.1}
				unit="%"
			/>
			<NumberField
				label="Gap to icon"
				bind:value={app.logo.wordmark.gap}
				def={wordmark.gap}
				min={0}
				max={150}
				step={0.5}
			/>
			<NumberField
				label="Vertical nudge"
				bind:value={app.logo.wordmark.offsetY}
				def={wordmark.offsetY}
				min={-50}
				max={50}
				step={0.25}
			/>
		</Section>

		<Section title="Colors">
			{#snippet actions()}
				<button class="text-[11px] text-neutral-500 hover:text-neutral-200" onclick={swapColors}
					>Invert</button
				>
			{/snippet}
			<ColorField label="Icon" bind:value={app.export.colors.icon} />
			<ColorField label="Text" bind:value={app.export.colors.text} />
			<ColorField
				label="Background"
				bind:value={app.export.colors.background}
				disabled={app.export.colors.transparent}
			/>
			<Toggle label="Transparent" bind:checked={app.export.colors.transparent} />
		</Section>

		<Section title="Frame">
			{#snippet actions()}
				{@render reset(resetExport, 'Reset frame, color and export settings')}
			{/snippet}
			<Segmented options={variants} bind:value={app.selected} />
			{#if app.selected === 'favicon'}
				<NumberField
					label="Size"
					bind:value={() => frame.width, (v) => (frame.width = frame.height = v)}
					def={frameDefaults.width}
					min={16}
					max={512}
					step={1}
					unit="px"
				/>
				<NumberField
					label="Gap multiplier"
					bind:value={app.logo.favicon.gapMultiplier}
					def={favicon.gapMultiplier}
					min={0}
					max={4}
					step={0.05}
					unit="×"
					title="Multiplies the arrow gap so it stays visible at tiny sizes"
				/>
				<NumberField
					label="Roundness"
					bind:value={app.logo.favicon.roundness}
					def={favicon.roundness}
					min={0}
					max={100}
					step={1}
					unit="%"
					title="0% is fully sharp; 100% uses the icon's corner radii"
				/>
				<p class="text-[11px] text-neutral-500">Always square, with no padding.</p>
			{:else}
				<NumberField
					label="Width"
					bind:value={frame.width}
					def={frameDefaults.width}
					min={16}
					max={2048}
					step={1}
					unit="px"
				/>
				<NumberField
					label="Height"
					bind:value={frame.height}
					def={frameDefaults.height}
					min={16}
					max={2048}
					step={1}
					unit="px"
				/>
				<NumberField
					label="Padding X"
					bind:value={frame.paddingX}
					def={frameDefaults.paddingX}
					min={0}
					max={512}
					step={1}
					unit="px"
				/>
				<NumberField
					label="Padding Y"
					bind:value={frame.paddingY}
					def={frameDefaults.paddingY}
					min={0}
					max={512}
					step={1}
					unit="px"
				/>
			{/if}
		</Section>

		<Section title="Reference">
			<Toggle label="Show design.svg" bind:checked={app.reference.visible} />
			{#if app.reference.visible}
				<NumberField
					label="Opacity"
					bind:value={app.reference.opacity}
					min={0}
					max={1}
					step={0.05}
				/>
				<Toggle
					label="Difference"
					bind:checked={app.reference.difference}
					title="Matching areas cancel out, differences light up"
				/>
			{/if}
		</Section>
	</div>

	<div class="flex flex-col gap-2 border-t border-neutral-800 p-3">
		<Segmented
			label="Format"
			options={[
				{ value: 'svg', label: 'SVG' },
				{ value: 'png', label: 'PNG' }
			]}
			bind:value={app.export.format}
		/>
		<Segmented
			label="Scale"
			options={[1, 2, 3, 4].map((s) => ({ value: s, label: `${s}x` }))}
			bind:value={app.export.scale}
		/>
		<div class="flex items-center justify-between text-[11px] text-neutral-500">
			<span class="truncate">{filename}.{app.export.format}</span>
			<span class="tabular-nums">{outW} × {outH}</span>
		</div>
		<button
			class="h-8 rounded-md bg-sky-600 text-xs font-medium text-white hover:bg-sky-500"
			onclick={exportFile}
		>
			Export {app.selected}
		</button>
		<div class="flex gap-2">
			<button class="secondary" onclick={() => copy(exportSvg(), 'SVG copied')}>Copy SVG</button>
			<button
				class="secondary"
				onclick={() =>
					copy(logoDefaultsSource(app.logo), 'Defaults copied — paste into defaults.ts')}
				title="Copy LOGO_DEFAULTS source to paste into src/lib/logo/defaults.ts"
			>
				Copy logo defaults
			</button>
		</div>
		{#if flash}<p class="text-center text-[11px] text-sky-400">{flash}</p>{/if}
	</div>
</aside>

<style>
	.secondary {
		flex: 1;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: var(--color-neutral-800);
		font-size: 11px;
		color: var(--color-neutral-300);
	}
	.secondary:hover {
		background: var(--color-neutral-700);
		color: var(--color-neutral-50);
	}
</style>
