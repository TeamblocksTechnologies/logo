<script lang="ts">
	interface Props {
		label: string;
		value: string;
		disabled?: boolean;
	}

	let { label, value = $bindable(), disabled = false }: Props = $props();
</script>

<div class="flex h-7 items-center gap-2 text-xs" class:opacity-40={disabled}>
	<span class="w-24 shrink-0 text-neutral-400">{label}</span>
	<label
		class="flex h-6 flex-1 items-center gap-2 rounded bg-neutral-800 px-1.5 focus-within:ring-1 focus-within:ring-sky-500"
	>
		<input type="color" class="swatch" bind:value {disabled} />
		<input
			class="w-full min-w-0 bg-transparent text-neutral-100 uppercase outline-none"
			{disabled}
			{value}
			onchange={(e) => {
				const v = e.currentTarget.value.trim();
				if (/^#?[0-9a-f]{6}$/i.test(v)) value = v.startsWith('#') ? v : `#${v}`;
				e.currentTarget.value = value;
			}}
		/>
	</label>
</div>

<style>
	.swatch {
		width: 1rem;
		height: 1rem;
		padding: 0;
		border: 1px solid var(--color-neutral-600);
		border-radius: 3px;
		background: none;
		cursor: pointer;
	}
	.swatch::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	.swatch::-webkit-color-swatch {
		border: none;
		border-radius: 2px;
	}
</style>
