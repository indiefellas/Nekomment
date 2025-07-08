<script lang="ts">
  import { afterUpdate } from "svelte";
  import { TooltipPlacement, TooltipPlacementMask } from "./TooltipPlacement";
  import { mathematica } from "svelte-highlight/languages";

	export let placement: TooltipPlacement = TooltipPlacement.Top;
	export let spacing: number = 5;
	export let spacingToViewport: number = 10;
	let pos = { x: 0, y: 0 }
	let anchor = { x: 0, y: 0 }

	let tooltipElm: HTMLSpanElement;
	let holderElm: HTMLSpanElement;

	export function calculatePositions() {
		console.log("recalculating positions");

		let holderBounds = holderElm.getBoundingClientRect();
		let tooltipBounds = tooltipElm.getBoundingClientRect();

		// Set initial placements
		switch (placement & TooltipPlacementMask.Position) {
			case TooltipPlacement.Top:
				pos = { x: (holderBounds.width - tooltipBounds.width) / 2, y: -tooltipBounds.height - spacing }
				anchor = { x: 0.5, y: 1 }
				break;
			case TooltipPlacement.Bottom:
				pos = { x: (holderBounds.width - tooltipBounds.width) / 2, y: holderBounds.height + spacing }
				anchor = { x: 0.5, y: 0 }
				break;
			case TooltipPlacement.Left:
				pos = { x: -tooltipBounds.width - spacing, y: (holderBounds.height - tooltipBounds.height) / 2 }
				anchor = { x: 1, y: 0.5 }
				break;
			case TooltipPlacement.Right:
				pos = { x: holderBounds.width + spacing, y: (holderBounds.height - tooltipBounds.height) / 2 }
				anchor = { x: 0, y: 0.5 }
				break;
		}

		// Push tooltip to window bounds
		pos.x = Math.min(Math.max(pos.x, spacingToViewport - holderBounds.left), window.innerWidth - holderBounds.left - tooltipBounds.width - spacingToViewport);
		pos.y = Math.min(Math.max(pos.y, spacingToViewport - holderBounds.top), window.innerHeight - holderBounds.top - tooltipBounds.height - spacingToViewport);
	}

	afterUpdate(() => {
		calculatePositions();
	})

</script>

<span class="tooltip-holder" bind:this={holderElm} 
	on:pointerenter={() => calculatePositions()} on:focus={() => calculatePositions()}>
	<slot name="content"></slot><span class="tooltip" bind:this={tooltipElm}
		style:--pos-x={pos.x} style:--pos-y={pos.y} 
		style:--anchor-x={anchor.x}  style:--anchor-y={anchor.y}>
		<slot name="tooltip"></slot>
	</span>
</span>

<style>
	.tooltip-holder {
		display: inline-block;
		position: relative;
	}

	.tooltip {
		display: block;
		position: absolute;
		left: calc(var(--pos-x) * 1px);
		top: calc(var(--pos-y) * 1px);
		right: -100vw;
		z-index: 1000;
		margin: 0;

		width: fit-content;
		max-width: min(40em, calc(100dvw - 20px));
		background: var(--background-4);
		border-radius: 5px;
		padding: 0.4em 0.8ch;
		font-size: 0.8rem;
		box-shadow: var(--shadow-2);

		opacity: 0;
		transform-origin: calc(var(--anchor-x) * 100%) calc(var(--anchor-y) * 100%);
		pointer-events: none;

		transition: transform .1s, opacity .1s;
	}

	.tooltip-holder:is(:hover, :has(:global(:focus-visible))) > .tooltip {
		opacity: 1;
		transform: scale(1);
		animation: tooltip-in forwards 0.1s;
	}

	@keyframes tooltip-in {
		from {
			transform: scale(0.9);
		} to {
			transform: scale(1);
		}
	}
</style>
