<script lang="ts">
    import Icon from "@iconify/svelte";
    import { genId } from "../../lib/generators";
    import type { HTMLAttributes } from "svelte/elements";

    type Props = HTMLAttributes<HTMLInputElement> & {
        disabled?: boolean,
        name?: string,
        value?: string
    };

    let { children, class: className, id, ...rest }: Props = $props();
    let combinedClasses = `nkm-checkbox-container ${className}`
    let checkboxId = genId(6);
</script>

<label class={combinedClasses} for={"nkm-checkbox-" + checkboxId}>
    <input type="checkbox" class="sr-only" checked={false} id={"nkm-checkbox-" + checkboxId} {...rest} />
    <div class="checkbox-tick" aria-hidden="true">
        <Icon icon="iconamoon:check-bold" width="32" height="32" />
    </div>
    <p>{@render children?.()}</p>
</label>