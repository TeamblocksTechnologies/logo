<script lang="ts">
	interface Props {
		label: string;
		checked: boolean;
		title?: string;
	}

	let { label, checked = $bindable(), title }: Props = $props();
</script>

<label class="flex h-7 cursor-pointer items-center gap-2 text-xs select-none" {title}>
	<span class="w-24 shrink-0 text-neutral-400">{label}</span>
	<input type="checkbox" class="peer sr-only" bind:checked />
	<span
		class="relative h-4 w-7 rounded-full bg-neutral-700 transition-colors peer-checked:bg-sky-600 peer-focus-visible:ring-1 peer-focus-visible:ring-sky-400 after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3"
	></span>
</label>
