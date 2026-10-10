<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		hint?: string;
		actions?: Snippet;
		children: Snippet;
	}

	let { title, hint, actions, children }: Props = $props();
	let open = $state(true);
</script>

<section class="border-b border-neutral-800 px-3 py-2.5 last:border-b-0">
	<header class="flex h-6 items-center justify-between">
		<button
			class="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-neutral-200 uppercase"
			onclick={() => (open = !open)}
		>
			<span class="inline-block w-2 text-neutral-500 transition-transform" class:rotate-90={open}
				>›</span
			>
			{title}
		</button>
		{@render actions?.()}
	</header>
	{#if open}
		{#if hint}<p class="mt-1 text-[11px] text-neutral-500">{hint}</p>{/if}
		<div class="mt-1.5 flex flex-col gap-0.5">
			{@render children()}
		</div>
	{/if}
</section>
