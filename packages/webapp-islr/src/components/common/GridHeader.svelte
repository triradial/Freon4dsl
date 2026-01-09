<script lang="ts">
    import { addObject } from "../../services/stores/object-drawer-store.js";
    // @ts-ignore
    import { Plus as IconPlus, RefreshCcw as IconRefresh } from '@lucide/svelte';

    const { parentId = null, objectType, title, onrefresh } = $props<{ parentId?: string | null; objectType: string; title: string; onrefresh: () => void }>();
    const onAddObject = () => {
        addObject(objectType as "project" | "patient", parentId ?? undefined);
    };
</script>

<div class="card grid-header w-full">
    <div class="flex items-center justify-left">
        <h3 class="main-label-text mr-2">{title}</h3>
        <div class="flex items-center gap-2">
            <button type="button" class="icon-button primary inverted" onclick={onAddObject}><IconPlus size="16" /></button>
            <button type="button" class="icon-button primary inverted" onclick={onrefresh}><IconRefresh size="16" /></button>
        </div>
    </div>
</div>
