<script lang="ts" generics="T extends string | number">
	interface Props {
		options: { value: T; label: string }[];
		value: T;
		label?: string;
	}

	let { options, value = $bindable(), label }: Props = $props();
</script>

<div class="flex h-7 items-center gap-2 text-xs">
	{#if label}<span class="w-24 shrink-0 text-neutral-400">{label}</span>{/if}
	<div class="flex flex-1 rounded-md bg-neutral-800 p-0.5">
		{#each options as option (option.value)}
			<button
				class="h-5 flex-1 rounded px-2 text-neutral-400 transition-colors hover:text-neutral-100"
				class:selected={option.value === value}
				onclick={() => (value = option.value)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.selected {
		background: var(--color-neutral-600);
		color: var(--color-neutral-50);
	}
</style>
