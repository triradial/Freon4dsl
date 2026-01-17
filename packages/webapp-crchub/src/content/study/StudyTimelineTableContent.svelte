<script lang="ts">
    let { tableHtml } = $props<{ tableHtml: string }>();
</script>

<div class="study-timeline-table-content">
    {@html tableHtml}
</div>

<style>
    /* Shared styling for timeline table content */
    .study-timeline-table-content {
        color: var(--text-primary-500);
        font-family: var(--font-family-sans);
    }

    /* Apply table component styling to tables within */
    :global(.study-timeline-table-content .table_component) {
        width: 100%;
        border-collapse: collapse;
    }

    :global(.study-timeline-table-content table) {
        width: 100%;
        border-collapse: collapse;
    }
</style>
