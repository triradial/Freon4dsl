<script lang="ts">
    import { FREON_LOGGER } from './ComponentLoggers.js';

    /**
     * This component shows a complete projection, by displaying the root box of
     * the associated editor.
     */
    import {
        Box,
        ARROW_UP,
        ARROW_DOWN,
        TAB,
        BACKSPACE,
        ARROW_LEFT,
        DELETE,
        ENTER,
        ARROW_RIGHT,
        isNullOrUndefined,
        isTableRowBox,
        isElementBox,
        AstActionExecutor,
        type FreNode, type ClientRectangle, UndefinedRectangle
    } from '@freon4dsl/core';
    import RenderComponent from './RenderComponent.svelte';
    import ContextMenu from './ContextMenu.svelte';
    import { onMount, tick } from 'svelte';
    import { componentId, dummyBox } from './svelte-utils/index.js';
    import {
        activeElem,
        activeIn,
        draggedElem,
        draggedFrom,
        selectedBoxes,
        shouldBeHandledByBrowser,
        contextMenu, contextMenuVisible, viewport
    } from './stores/AllStores.svelte.js';
    import type { MainComponentProps } from './svelte-utils/FreComponentProps.js';

    let LOGGER = FREON_LOGGER;

    let { editor }: MainComponentProps = $props();

    let element: HTMLDivElement; // The current main element of this component.
    let rootBox: Box = $state(dummyBox);
    let id: string = $derived(
        // an id for the html element showing the rootBox
        rootBox && rootBox !== dummyBox ? componentId(rootBox) : 'freon-component-with-unknown-box'
    );

    function stopEvent(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        shouldBeHandledByBrowser.value = false;
    }

    const onKeyDown = (event: KeyboardEvent) => {
        LOGGER.log(
            'FreonComponent onKeyDown: ' +
                event.key +
                ' ctrl: ' +
                event.ctrlKey +
                ' alt: ' +
                event.altKey +
                ' shift: ' +
                event.shiftKey
        );
        if (event.ctrlKey) {
            if (!event.altKey) {
                switch (event.key) {
                    case ARROW_UP: // ctrl-arrow-up => select element above
                        editor.selectParent();
                        stopEvent(event);
                        break;
                    case ARROW_DOWN: // ctrl-arrow-down => select element beneath
                        editor.selectFirstLeafChildBox();
                        stopEvent(event);
                        break;
                    case 'z': // ctrl-z => UNDO
                        if (!shouldBeHandledByBrowser.value) {
                            LOGGER.log('Ctrl-z: UNDO');
                            AstActionExecutor.getInstance(editor).undo();
                            stopEvent(event);
                        }
                        break;
                    case 'y': // ctrl-y => REDO
                        if (!shouldBeHandledByBrowser.value) {
                            LOGGER.log('Ctrl-y: REDO');
                            AstActionExecutor.getInstance(editor).redo();
                            stopEvent(event);
                        }
                        break;
                    case 'x': // ctrl-x => CUT
                        if (!shouldBeHandledByBrowser.value) {
                            LOGGER.log('Ctrl-x: CUT');
                            AstActionExecutor.getInstance(editor).cut();
                            stopEvent(event);
                        }
                        break;
                    case 'c': // ctrl-c => COPY
                        if (!shouldBeHandledByBrowser.value) {
                            LOGGER.log('Ctrl-c: COPY');
                            AstActionExecutor.getInstance(editor).copy();
                            stopEvent(event);
                        }
                        break;
                    case 'v': // ctrl-v => PASTE
                        if (!shouldBeHandledByBrowser.value) {
                            LOGGER.log('Ctrl-v: PASTE');
                            AstActionExecutor.getInstance(editor).paste();
                            stopEvent(event);
                        }
                        break;
                    case 'h': // ctrl-h => SEARCH
                        // todo
                        stopEvent(event);
                        break;
                    case 'a': // ctrl-a => SELECT ALL in focused control
                        // todo
                        // stopEvent(event);
                        break;
                }
            } else {
                switch (event.key) {
                    case 'z': // ctrl-alt-z => REDO
                        if (!shouldBeHandledByBrowser.value) {
                            AstActionExecutor.getInstance(editor).redo();
                            stopEvent(event);
                        }
                        break;
                }
            }
        } else if (event.altKey) {
            // NO ctrl
            if (event.shiftKey) {
                switch (event.key) {
                    case BACKSPACE: // alt-shift-backspace => REDO
                        if (!shouldBeHandledByBrowser.value) {
                            AstActionExecutor.getInstance(editor).redo();
                            stopEvent(event);
                        }
                        break;
                }
            } else {
                // NO shift
                switch (event.key) {
                    case BACKSPACE: // alt-backspace => UNDO
                        if (!shouldBeHandledByBrowser.value) {
                            AstActionExecutor.getInstance(editor).undo();
                            stopEvent(event);
                        }
                        break;
                    case ARROW_UP: // alt-arrow-up
                        editor.selectParent();
                        stopEvent(event);
                        break;
                    case ARROW_DOWN: // alt-arrow-down
                        editor.selectFirstLeafChildBox();
                        stopEvent(event);
                        break;
                }
            }
        } else if (event.shiftKey) {
            // NO ctrl, NO alt
            switch (event.key) {
                case TAB: // shift-tab
                    // editor.selectPreviousLeaf();
                    // stopEvent(event);
                    break;
            }
        } else {
            // No meta key pressed
            switch (event.key) {
                case ARROW_LEFT:
                    editor.selectPreviousLeafIncludingExpressionPreOrPost();
                    stopEvent(event);
                    break;
                case DELETE:
                case BACKSPACE:
                    editor.deleteBox(editor.selectedBox);
                    stopEvent(event);
                    break;
                case TAB:
                case ENTER:
                    // editor.selectNextLeaf();
                    // stopEvent(event);
                    break;
                case ARROW_RIGHT:
                    editor.selectNextLeafIncludingExpressionPreOrPost();
                    stopEvent(event);
                    break;
                case ARROW_DOWN:
                    editor.selectBoxBelow(editor.selectedBox);
                    stopEvent(event);
                    break;
                case ARROW_UP:
                    editor.selectBoxAbove(editor.selectedBox);
                    stopEvent(event);
                    break;
            }
        }
    };

    /**
     * Keep track of the scrolling position in the editor, so we know exactly where boxes are
     * in relationship with each other.
     */
    function onScroll() {
        // Hide any contextmenu upon scrolling, because its position will not be correct.
        contextMenuVisible.value = false;
        // we use a timeOut here, like below in the ResizeObserver, to improve performance
        setTimeout(() => {
            editor.scrollX = element.scrollLeft;
            editor.scrollY = element.scrollTop;
        }, 400); // Might use another value for the delay, but this seems ok.
    }

    const clientRectangle = (): ClientRectangle => {
        LOGGER.log(`FreonComponent clientRect`)
        return element?.getBoundingClientRect() || UndefinedRectangle
    }

    function setViewportSizes(elem?: Element) {
        if (elem) {
            let rect = elem.getBoundingClientRect();
            let top = 0, left = 0;
            if (elem.parentElement) {
                let parentRect = elem.parentElement.getBoundingClientRect();
                top = parentRect.top;
                left = parentRect.left;
            }
            viewport.update(vp => {
                vp.setSizes(rect.height, rect.width, top, left);
                return vp;
            });
        }
    }

    onMount(() => {
        setViewportSizes(element);

        // We keep track of the size of the editor component, to be able to position any context menu correctly.
        // For this we use a ResizeObserver.
        const resizeObserver = new ResizeObserver((entries) => {
            contextMenuVisible.value = false;
            setTimeout(() => {
                setViewportSizes(entries.at(0)?.target);
            }, 400);
        });
        resizeObserver.observe(element);
        return () => resizeObserver.unobserve(element);
    });

    const refreshSelection = async (why?: string) => {
        LOGGER.log(
            'FreonComponent.refreshSelection: ' +
                why +
                ' editor selectedBox is ' +
                editor?.selectedBox?.kind
        );
        if (!isNullOrUndefined(editor.selectedBox)) {
            //&& !$selectedBoxes.includes(editor.selectedBox)) { // selection is no longer in sync with editor
            await tick();
            selectedBoxes.value = getSelectableChildren(editor.selectedBox);
            // editor.selectedBox.setFocus();
        }
    };

    function getSelectableChildren(box: Box): Box[] {
        const result: Box[] = [];
        // Because neither a TableRowBox nor an ElementBox has its own HTML equivalent,
        // its children are regarded to be selected.
        if (isTableRowBox(box)) {
            for (const child of box.children) {
                result.push(...getSelectableChildren(child));
            }
        } else if (isElementBox(box)) {
            result.push(...getSelectableChildren(box.content));
        } else {
            result.push(box);
        }
        return result;
    }

    const refreshRootBox = (why?: string) => {
        rootBox = editor.rootBox;
        LOGGER.log(
            'REFRESH ' +
                why +
                ' ==================> FreonComponent with rootbox ' +
                rootBox?.id +
                ' unit ' +
                (!isNullOrUndefined(rootBox?.node)
                    ? rootBox.node['name' as keyof FreNode]
                    : 'undefined')
        );
    };

    refreshRootBox('Initialize FreonComponent');
    refreshSelection('Initialize FreonComponent');

    $effect(() => {
        if (editor) {
            editor.refreshComponentSelection = refreshSelection;
            editor.refreshComponentRootBox = refreshRootBox;
            editor.getClientRectangle = clientRectangle
        }
    });

</script>

<!-- TODO This makes us dependent on @material/... do we want that?-->
<!-- include the material design styling -->
<svelte:head>
    <link
        href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css"
        rel="stylesheet"
    />
    <script
        src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"
    ></script>
</svelte:head>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class={'freon-component'}
    onkeydown={onKeyDown}
    onscroll={onScroll}
    bind:this={element}
    {id}
    role="group"
>
    <div class="gutter"></div>
    <div class="editor-component">
        <RenderComponent {editor} box={rootBox} cssClass="" />
    </div>
</div>
<!-- Here the only instance of ContextMenu is defined -->
<!-- TODO make some default items for the context menu -->
<ContextMenu bind:this={contextMenu.instance} {editor} />
