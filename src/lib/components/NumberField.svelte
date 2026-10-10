<script lang="ts">
	interface Props {
		label: string;
		value: number;
		/** The default value; shows a reset button when the value differs. */
		def?: number;
		min: number;
		max: number;
		step?: number;
		unit?: string;
		title?: string;
	}

	let { label, value = $bindable(), def, min, max, step = 1, unit = '', title }: Props = $props();

	const decimals = $derived((String(step).split('.')[1] ?? '').length);
	const modified = $derived(def !== undefined && Math.abs(value - def) > 1e-9);
	const display = $derived(String(Math.round(value * 10 ** decimals) / 10 ** decimals));

	const snap = (v: number) => Math.round(v / step) * step;

	function commit(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const parsed = parseFloat(input.value);
		if (Number.isFinite(parsed)) value = parsed;
		input.value = display;
	}

	// Drag the label left/right to scrub the value, like Figma. Shift = 10x.
	let scrub: { x: number; start: number } | null = null;

	function scrubStart(e: PointerEvent) {
		if (e.button !== 0) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		scrub = { x: e.clientX, start: value };
	}

	function scrubMove(e: PointerEvent) {
		if (!scrub) return;
		const delta = (e.clientX - scrub.x) * step * (e.shiftKey ? 10 : 1);
		value = snap(scrub.start + delta);
	}
</script>

<div class="group flex h-7 items-center gap-2 text-xs" {title}>
	<span
		class="w-24 shrink-0 cursor-ew-resize truncate text-neutral-400 select-none"
		role="slider"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		tabindex="-1"
		onpointerdown={scrubStart}
		onpointermove={scrubMove}
		onpointerup={() => (scrub = null)}
		ondblclick={() => def !== undefined && (value = def)}
	>
		{label}
	</span>
	<input
		type="range"
		class="range min-w-0 flex-1"
		{min}
		{max}
		{step}
		value={Math.min(max, Math.max(min, value))}
		oninput={(e) => (value = parseFloat(e.currentTarget.value))}
		ondblclick={() => def !== undefined && (value = def)}
	/>
	<label
		class="flex h-6 w-16 shrink-0 items-center rounded bg-neutral-800 px-1.5 focus-within:ring-1 focus-within:ring-sky-500"
	>
		<input
			class="w-full min-w-0 bg-transparent text-right text-neutral-100 tabular-nums outline-none"
			value={display}
			inputmode="decimal"
			onchange={commit}
			onkeydown={(e) => {
				if (e.key === 'Enter') e.currentTarget.blur();
				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					e.preventDefault();
					const dir = e.key === 'ArrowUp' ? 1 : -1;
					value = snap(value + dir * step * (e.shiftKey ? 10 : 1));
				}
			}}
		/>
		{#if unit}<span class="ml-0.5 text-neutral-500">{unit}</span>{/if}
	</label>
	<button
		class="w-3 shrink-0 text-neutral-500 hover:text-neutral-100"
		class:invisible={!modified}
		title="Reset to {def}"
		aria-label="Reset {label}"
		onclick={() => def !== undefined && (value = def)}
	>
		↺
	</button>
</div>
