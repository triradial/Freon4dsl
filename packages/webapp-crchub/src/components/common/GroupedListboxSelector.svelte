<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    // @ts-ignore
    import { ChevronDown as IconChevronDown } from '@lucide/svelte';
    // @ts-ignore  
    import { Check as IconCheck } from '@lucide/svelte';

    interface Item {
        id: string;
        label: string;
        group: string;
        [key: string]: any;
    }

    const { 
        items, 
        currentItem, 
        onSelect,
        placeholder = "Select an item...",
        error = false
    } = $props<{
        items: Item[];
        currentItem: Item | null;
        onSelect: (item: Item | null) => void;
        placeholder?: string;
        error?: boolean;
    }>();

    let openState = $state(false);
    let searchQuery = $state("");
    // Use $derived to properly track currentItem prop changes
    let selectedItem = $derived(currentItem);
    let searchInput: HTMLInputElement;

    // Filter items based on search query
    const filteredItems = $derived(
        searchQuery.trim() === ""
            ? items
            : items.filter((item) =>
                  item.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
    );

    // Group items by their group property
    const groupedItems: Array<[string, Item[]]> = $derived.by(() => {
        const groups = new Map<string, Item[]>();
        filteredItems.forEach((item) => {
            const group = item.group || "Other";
            if (!groups.has(group)) {
                groups.set(group, []);
            }
            groups.get(group)!.push(item);
        });
        return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    });

    function handleOpenChange(e: { open: boolean }) {
        openState = e.open;
        if (e.open) {
            // Focus search input after a brief delay to ensure popover is rendered
            setTimeout(() => {
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }, 150);
        } else {
            searchQuery = "";
        }
    }
    
    function handleButtonClick() {
        openState = !openState;
    }

    function handleItemSelect(item: Item) {
        selectedItem = item;
        onSelect(item);
        openState = false;
        searchQuery = "";
    }

    // Get display text for the trigger button
    const displayText = $derived(
        selectedItem ? selectedItem.label : placeholder
    );
</script>

<Popover
    open={openState}
    onOpenChange={handleOpenChange}
    positioning={{ 
        placement: 'bottom', 
        strategy: 'fixed',
        gutter: 0,
        offset: { mainAxis: 0, crossAxis: 0 }
    }}
    zIndex="1000"
    contentBase="listbox-selector"
    triggerBase="w-full"
    closeOnInteractOutside={true}
    modal={false}
>
    {#snippet trigger()}
        <button type="button" class="input-field {error ? 'error' : ''} w-full flex items-center justify-between cursor-pointer"
            onclick={handleButtonClick}
        >
            <span class="truncate {selectedItem ? '' : 'opacity-50'}">
                {displayText}
            </span>
            <IconChevronDown size={16} class="flex-shrink-0 ml-4" />
        </button>
    {/snippet}

    {#snippet content()}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="flex flex-col" onmousedown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
            <!-- Search Input -->
            <input 
                type="text" 
                class="input-field mb-2" 
                placeholder="Search..." 
                value={searchQuery} 
                oninput={(e) => {
                    e.stopPropagation();
                    searchQuery = e.currentTarget.value;
                }}
                onmousedown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                }}
                onclick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                }}
                bind:this={searchInput}
            />

            <!-- Custom Grouped List - max height shows approximately 8 items -->
            <div class="list max-h-[240px] overflow-y-auto">
                <ul class="list-none p-0 m-0">
                    {#each groupedItems as [groupName, groupItems] (groupName)}
                        <li class="sticky grouper-item">
                            {groupName}
                        </li>
                        {#each groupItems as item (item.id)}
                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                            <li role="option" aria-selected={selectedItem?.id === item.id} onmousedown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
                                <button 
                                    type="button" 
                                    class="list-item w-full justify-between {selectedItem?.id === item.id ? 'selected' : ''}"
                                    onmousedown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }}
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleItemSelect(item);
                                    }}
                                >
                                    <span>{item.label}</span>
                                    {#if selectedItem?.id === item.id}
                                        <IconCheck size={16} class="check" />
                                    {/if}
                                </button>
                            </li>
                        {/each}
                    {/each}
                </ul>
            </div>
        </div>
    {/snippet}
</Popover>
