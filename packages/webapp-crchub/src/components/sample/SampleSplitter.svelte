<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { mount, unmount } from 'svelte';
	import { documentService } from '../../services/document.service';
	import { storageService } from '../../services/storage.service';
	import { userService } from '../../services/user.service';
	import type { DocumentGQL, DocumentStruct } from '../../types/api/documentstruct';
	import type { TagGQL } from '../../types/api/tagstruct';
	// Uuid type - using string as UUIDs are strings
	type Uuid = string;
	import { getColorByDocStatus, getDocTypeColor, getSourceColor, getSourceLabel, formatDateStandard } from '../../types/api/utils';
	import { themeStore } from '../../stores/theme.store';
	import { dateRangeStore } from '../../stores/date-range.store';
	import { get } from 'svelte/store';
	import { Heart, Pencil, Link as LinkIcon, Trash2, ChevronLeft, ChevronRight, Wand2 } from '@lucide/svelte';
	import { Portal } from '@skeletonlabs/skeleton-svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import Timeline from '../parts/Timeline.svelte';
	import EventsGrid from '../parts/EventsGrid.svelte';
	import EventsToolbar from '../parts/EventsToolbar.svelte';
	import PdfViewer from '../parts/PdfViewer.svelte';
	import SmartChat from '../parts/SmartChat.svelte';
	import NoteEditorPopover from '../popovers/note/NoteEditorPopover.svelte';

	interface Props {
		docId: string;
	}

	let { docId }: Props = $props();

	let docData = $state<DocumentStruct | null>(null);
	let loading = $state(true);
	let domainInfo = $state<any>(null);
	let pdfUrl = $state<string | null>(null);
	
	// Initialize with cached preference if available, otherwise default
	const cachedTab = userService.getDocumentTabPreferenceSync();
	let activeTab = $state(cachedTab && ['document', 'events', 'chat'].includes(cachedTab) ? cachedTab : 'document');
	
	// Initialize splitter width from cache (convert percentage to rem)
	const cachedSplitter = userService.getSplitterPreferencesSync();
	const defaultRem = 12.5;
	const cachedPercentage = cachedSplitter?.document || 20;
	const percentageToRem = (percentage: number) => (percentage / 100) * 62.5;
	let detailPanelWidth = $state(percentageToRem(cachedPercentage) || defaultRem);
	let isResizing = $state(false);
	
	// Document detail splitter constraints (in rem)
	const DOC_DETAIL_PANEL_MIN_WIDTH = 12;
	const DOC_DETAIL_PANEL_MAX_WIDTH = 37.5;
	
	// Splitter state and handlers (like CaseList)
	let isDraggingSplitter = $state(false);
	let splitterContainer: HTMLDivElement | undefined = $state();
	let splitterHandle: HTMLButtonElement | undefined = $state();

	function handleSplitterMouseDown(event: MouseEvent) {
		if (!browser) return;
		event.preventDefault();
		isDraggingSplitter = true;
		isResizing = true;
		document.addEventListener('mousemove', handleSplitterMouseMove);
		document.addEventListener('mouseup', handleSplitterMouseUp);
		if (splitterHandle) {
			splitterHandle.style.cursor = 'col-resize';
		}
	}

	function handleSplitterMouseMove(event: MouseEvent) {
		if (!isDraggingSplitter || !splitterContainer) return;
		
		const rect = splitterContainer.getBoundingClientRect();
		const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
		const newWidth = ((event.clientX - rect.left) / rootFontSize);
		
		// Constrain to min/max
		const constrainedWidth = Math.max(DOC_DETAIL_PANEL_MIN_WIDTH, Math.min(DOC_DETAIL_PANEL_MAX_WIDTH, newWidth));
		detailPanelWidth = constrainedWidth;
	}

	function handleSplitterMouseUp() {
		if (!browser) return;
		isDraggingSplitter = false;
		isResizing = false;
		document.removeEventListener('mousemove', handleSplitterMouseMove);
		document.removeEventListener('mouseup', handleSplitterMouseUp);
		if (splitterHandle) {
			splitterHandle.style.cursor = '';
		}
		saveSplitterWidth();
	}

	// Save splitter width preference
	async function saveSplitterWidth() {
		try {
			const remToPercentage = (rem: number) => (rem / 62.5) * 100;
			const percentage = remToPercentage(detailPanelWidth);
			await userService.saveSplitterPreferences({ document: percentage });
		} catch (error) {
			console.error('[DocDetail] Error saving splitter width:', error);
		}
	}
	// Initialize events preferences from cache
	const cachedEventsPrefs = userService.getDocumentEventsPreferencesSync();
	let activeEventsTab = $state(cachedEventsPrefs?.activeView || 'timeline');
	let eventsSearchText = $state(cachedEventsPrefs?.quickFilterText || '');
	let filterByDocument = $state(false);

	// Restore date slider values after date range is initialized
	let dateRangeRestored = $state(false);
	
	// Theme state
	let currentTheme = $state<'light' | 'dark'>('dark');
	let unsubscribeTheme: (() => void) | null = null;
	let docRefreshHandler: (() => void) | null = null;
	
	// Map version code to source type for badge display
	function getSourceTypeFromVersion(version: string): string {
		if (version === 'A') return 'AI_GENERATED';
		if (version === 'U') return 'USER_OVERRIDE';
		return '';
	}
	
	// Note editor state
	let noteEditorInstance: any = null;
	let noteEditorContainer: HTMLDivElement | null = null;
	
	// Copy link toast state
	let copyLinkToastOpen = $state(false);
	let copyLinkToastName = $state('');
	let copyLinkToastTrigger: HTMLElement | null = $state(null);
	let copyLinkToastPosition = $state({ top: 0, left: 0 });
	
	// Delete confirmation state
	let showDeleteConfirm = $state(false);
	let docToDelete: DocumentStruct | null = $state(null);
	
	$effect(() => {
		if (copyLinkToastOpen && copyLinkToastTrigger) {
			const rect = copyLinkToastTrigger.getBoundingClientRect();
			const offset = 8; // Gap between button and toast
			copyLinkToastPosition = {
				top: rect.top + (rect.height / 2), // Vertically centered with button
				left: rect.right + offset // Position to the right of the button
			};
		}
	});


	// Group tags by tag_group
	function groupTagsByGroup(tags: TagGQL[]): Map<string, TagGQL[]> {
		const grouped = new Map<string, TagGQL[]>();
		if (!tags) return grouped;
		
		for (const tag of tags) {
			const groupName = tag.tag_group || 'Other';
			if (!grouped.has(groupName)) {
				grouped.set(groupName, []);
			}
			grouped.get(groupName)!.push(tag);
		}
		
		// Sort tags within each group
		for (const [groupName, tagList] of grouped.entries()) {
			tagList.sort((a, b) => a.tag.localeCompare(b.tag));
		}
		
		return grouped;
	}

	// Get note icon color
	function getNoteIconColor(): string {
		if (!docData?.note) return 'var(--note-icon-gray-color)';
		return 'var(--note-icon-color)';
	}
	
	// Get note tooltip text
	function getNoteTooltip(): string {
		if (!docData?.note) return 'Add note';
		const noteText = docData.note.replace(/<[^>]*>/g, '');
		return noteText.substring(0, 100) + (noteText.length > 100 ? '...' : '');
	}
	
	// Open note editor
	function openNoteEditor(triggerElement: HTMLElement) {
		if (!docData) return;
		handleNoteEditorClose();
		
		noteEditorContainer = document.createElement('div');
		document.body.appendChild(noteEditorContainer);
		
		noteEditorInstance = mount(NoteEditorPopover, {
			target: noteEditorContainer,
			props: {
				open: true,
				triggerElement: triggerElement,
				caseId: docData.case_id,
				caseName: docData.document || '',
				initialNote: docData.note || '',
				sourceType: 'doc',
				onClose: handleNoteEditorClose,
				onSave: handleNoteEditorSave
			}
		});
	}
	
	function handleNoteEditorClose() {
		if (noteEditorInstance) {
			try {
				unmount(noteEditorInstance);
			} catch (e) {
				console.warn('[DocDetail] Error unmounting note editor:', e);
			}
			noteEditorInstance = null;
		}
		if (noteEditorContainer && noteEditorContainer.parentNode) {
			noteEditorContainer.parentNode.removeChild(noteEditorContainer);
			noteEditorContainer = null;
		}
	}
	
	async function handleNoteEditorSave(noteText: string) {
		if (docData) {
			docData.note = noteText;
		}
		handleNoteEditorClose();
	}
	
	// Document action handlers
	async function handleEdit() {
		if (!docData?.document_id) return;
		try {
			const { openObjectDrawer } = await import('$lib/services/stores/object-drawer-store.js');
			openObjectDrawer('document', 'edit', docData);
		} catch (error) {
			console.error('[DocDetail] Error opening edit drawer:', error);
		}
	}
	
	function handleDelete() {
		if (docData) {
			docToDelete = docData;
			showDeleteConfirm = true;
		}
	}
	
	function handleDeleteCancel() {
		showDeleteConfirm = false;
		docToDelete = null;
	}
	
	async function handleDeleteConfirm() {
		if (!docToDelete?.document_id) return;
		try {
			const result = await documentService.deleteDoc(docToDelete.document_id);
			if (result.success) {
				// Navigate back to case or documents list
				if (docToDelete.case_id) {
					goto(`/case/${docToDelete.case_id}`);
				} else {
					goto('/documents');
				}
			} else {
				alert('Failed to delete document. Please try again.');
			}
			showDeleteConfirm = false;
			docToDelete = null;
		} catch (error) {
			console.error('[DocDetail] Error deleting document:', error);
			alert('Failed to delete document. Please try again.');
		}
	}
	
	async function handleCopyLink(event: MouseEvent) {
		if (!browser || !docData?.document_id) return;
		const url = `${window.location.origin}/doc/${docData.document_id}`;
		try {
			await navigator.clipboard.writeText(url);
			const triggerElement = event.currentTarget as HTMLElement;
			copyLinkToastName = docData.document || '';
			copyLinkToastTrigger = triggerElement;
			copyLinkToastOpen = true;
			setTimeout(() => {
				copyLinkToastOpen = false;
			}, 2000);
		} catch (error) {
			console.error('[DocDetail] Failed to copy link:', error);
		}
	}

	// Save tab preference when it changes
	async function handleTabChange(details: { value: string }) {
		activeTab = details.value;
		try {
			await userService.saveDocumentTabPreference(details.value);
		} catch (error) {
			console.error('[DocDetail] Error saving tab preference:', error);
		}
	}

	// Save events preferences (view, quick filter, and date range)
	async function saveEventsPreferences() {
		try {
			const dateRangeState = get(dateRangeStore);
			await userService.saveDocumentEventsPreferences({
				activeView: activeEventsTab as 'timeline' | 'grid',
				quickFilterText: eventsSearchText,
				dateSliderValues: dateRangeState.sliderValues
			});
		} catch (error) {
			console.error('[DocDetail] Error saving events preferences:', error);
		}
	}

	// Save events view preference when it changes
	async function saveEventsViewPreference() {
		await saveEventsPreferences();
	}

	// Save quick filter when it changes (debounced)
	let saveQuickFilterTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleEventsSearchChange(value: string) {
		eventsSearchText = value;
		// Debounce saving to avoid too many database calls
		if (saveQuickFilterTimeout) {
			clearTimeout(saveQuickFilterTimeout);
		}
		saveQuickFilterTimeout = setTimeout(() => {
			saveEventsPreferences();
		}, 500);
	}

	// Save date range when it changes (debounced)
	let saveDateRangeTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleDateRangeChange() {
		// Debounce saving to avoid too many database calls
		if (saveDateRangeTimeout) {
			clearTimeout(saveDateRangeTimeout);
		}
		saveDateRangeTimeout = setTimeout(() => {
			saveEventsPreferences();
		}, 500);
	}

	// Load document
	onMount(() => {
		if (!browser) return;

		// Initialize theme
		themeStore.init();
		if (browser && typeof localStorage !== 'undefined') {
			const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
			currentTheme = savedTheme || 'dark';
		}
		
		unsubscribeTheme = themeStore.subscribe((theme) => {
			currentTheme = theme;
		});

		// Load domain info from sessionStorage
		const domainInfoString = sessionStorage.getItem('userdomaininfo');
		if (domainInfoString) {
			try {
				domainInfo = JSON.parse(domainInfoString);
			} catch (error) {
				console.error('[DocDetail] Error parsing domainInfo:', error);
			}
		}

		// Verify and update from database in the background
		(async () => {
			try {
				const savedTab = await userService.getDocumentTabPreference();
				if (savedTab && ['document', 'events', 'chat'].includes(savedTab) && savedTab !== activeTab) {
					activeTab = savedTab;
				}
				
				// Load events preferences from database
				const savedEventsPrefs = await userService.getDocumentEventsPreferences();
				if (savedEventsPrefs) {
					if (savedEventsPrefs.activeView) {
						activeEventsTab = savedEventsPrefs.activeView;
					}
					if (savedEventsPrefs.quickFilterText !== undefined) {
						eventsSearchText = savedEventsPrefs.quickFilterText;
					}
					// Restore date slider values after date range is set
					if (savedEventsPrefs.dateSliderValues) {
						// Wait for date range to be initialized
						const checkDateRange = setInterval(() => {
							const state = get(dateRangeStore);
							if (state.minDate && state.maxDate && !dateRangeRestored) {
								dateRangeStore.setSliderValues(savedEventsPrefs.dateSliderValues!);
								dateRangeRestored = true;
								clearInterval(checkDateRange);
							}
						}, 100);
						// Stop checking after 5 seconds
						setTimeout(() => clearInterval(checkDateRange), 5000);
					}
				}
			} catch (error) {
				console.error('[DocDetail] Error loading preferences:', error);
			}
		})();

		// Load document function (reusable for refresh)
		async function loadDocument() {
			try {
				// Load document
				const docGQL = await documentService.getDoc(docId as Uuid);
				if (!docGQL) {
					console.error('[DocDetail] Document not found:', docId);
					loading = false;
					return;
				}

				// Transform document data
				const status_color = getColorByDocStatus(docGQL.status_id);
				const today = new Date();
				const age = Math.ceil((today.getTime() - new Date(docGQL.upload_date + 'T00:00:00').getTime()) / (1000 * 3600 * 24));
				const doc_typecolor = getDocTypeColor(docGQL.document_type, currentTheme);
				let search_tags = '';
				if (docGQL.tags && docGQL.tags.length > 0) {
					search_tags = docGQL.tags.map(t => t.tag).join(' ');
				}

				const created = docGQL.temporals?.[0]?.changed_at || '';

				// Extract summary using getJsonValue
				const summaryData = documentService.getJsonValue(docGQL, 'comprehensive_summary');

				docData = {
					...docGQL,
					status_color: status_color,
					doc_typecolor: doc_typecolor,
					age: age,
					search_tags: search_tags,
					created: created,
					summary: summaryData.current_value || '',
					summary_version: summaryData.current_version
				} as DocumentStruct;

				// Store document name in sessionStorage for breadcrumb
				if (browser) {
					sessionStorage.setItem('currentDocName', docGQL.document);
					if (docGQL.case?.case) {
						sessionStorage.setItem('currentCaseName', docGQL.case.case);
						// Use case_id from case object or top-level case_id
						const caseId = (docGQL.case as any).case_id || (docGQL as any).case_id;
						if (caseId) {
							sessionStorage.setItem('currentCaseId', caseId);
						}
					} else {
						// Clear case info if document doesn't belong to a case
						sessionStorage.removeItem('currentCaseName');
						sessionStorage.removeItem('currentCaseId');
					}
					// Dispatch event to notify breadcrumb of update
					window.dispatchEvent(new CustomEvent('doc-name-updated'));
				}

				// Load PDF URL if it's a PDF
				if (docGQL.document_type?.toLowerCase() === 'pdf') {
					try {
						const downloadUrl = await storageService.getDocumentDownloadUrl(
							docGQL.document_id,
							docGQL.case_id,
							docGQL.document_type
						);
						pdfUrl = downloadUrl;
					} catch (error) {
						console.error('[DocDetail] Error getting PDF URL:', error);
					}
				}

				loading = false;
			} catch (error) {
				console.error('[DocDetail] Error loading document:', error);
				loading = false;
			}
		}

		// Initial load
		loadDocument();

		// Listen for doc-refresh events
		async function handleDocRefresh() {
			if (!docId) return;
			console.log('[DocDetail] doc-refresh event received, reloading document...');
			loading = true;
			await loadDocument();
		}
		
		docRefreshHandler = handleDocRefresh;
		window.addEventListener('doc-refresh', docRefreshHandler);
		
		return () => {
			if (unsubscribeTheme) {
				unsubscribeTheme();
			}
			if (browser && docRefreshHandler) {
				window.removeEventListener('doc-refresh', docRefreshHandler);
				docRefreshHandler = null;
			}
		};
	});

	onDestroy(() => {
		if (browser && docRefreshHandler) {
			window.removeEventListener('doc-refresh', docRefreshHandler);
			docRefreshHandler = null;
		}
	});

</script>

<div class="doc-detail-container">
	{#if loading}
		<div class="loading-message">Loading document details...</div>
	{:else if !docData}
		<div class="error-message">Document not found</div>
	{:else if docData}
		{@const currentDoc = docData}
		<!-- Split Panes Container -->
		<div bind:this={splitterContainer} class="doc-detail-splitter-container" class:dragging={isDraggingSplitter}>
			<div class="detail-panel" style="width: {detailPanelWidth}rem;">
					<div class="case-card">
						<div class="card-body-static">
							<div class="field-block">
								<div class="field-header-row">
									<span class="field-header">Document</span>
									<div class="detail-actions">
										<button type="button" class="grid-action-btn general-btn" onclick={handleEdit} title="Edit Document" aria-label="Edit Document">
											<Pencil size={16} />
										</button>
										<button type="button" class="grid-action-btn delete-btn" onclick={handleDelete} title="Delete Document" aria-label="Delete Document">
											<Trash2 size={16} />
										</button>
										<button type="button" class="grid-action-btn general-btn" onclick={handleCopyLink} title="Copy Link" aria-label="Copy Link">
											<LinkIcon size={16} />
										</button>
									</div>
								</div>
								<div class="case-detail-name-container">
									<div class="case-detail-name-content">
										<div class="case-detail-name-row">
											<span class="field-value">{currentDoc.document}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="card-body-scrollable">
							<hr class="field-divider" />
							<div class="field-block">
								<div class="field-label-row-notes">
									<span class="field-label">Notes</span>
									<button class="note-icon-button-inline" data-has-note={!!currentDoc.note}
										onclick={(e) => openNoteEditor(e.currentTarget as HTMLElement)}
										title={getNoteTooltip()}
										aria-label="Edit note"
										style="color: {getNoteIconColor()};">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/>
										</svg>
									</button>
								</div>
								{#if currentDoc.note}
									<span class="note-text">{currentDoc.note.replace(/<[^>]*>/g, '')}</span>
								{/if}
							</div>
							<hr class="field-divider" />
							<div class="field-row">
								<div class="field-block status-field-block">
									<span class="field-label">Status</span>
									<div class="status-cell-container">
										<span class="status-badge" style="background-color: {currentDoc.status_color || '#808080'};">
											{currentDoc.status}
										</span>
									</div>
								</div>
								<div class="field-block">
									<span class="field-label">Uploaded</span>
									<span class="field-value">{formatDateStandard(currentDoc.upload_date)}</span>
								</div>
							</div>
							{#if currentDoc.tags && currentDoc.tags.length > 0}
								{@const groupedTags = groupTagsByGroup(currentDoc.tags)}
								<div class="field-block">
									<span class="field-label">Tags</span>
									<div class="tags-list-container">
										{#each Array.from(groupedTags.entries()).sort((a, b) => a[0].localeCompare(b[0])) as [groupName, tags]}
											{#each tags as tag}
												<div class="tag-list-item">
													<span class="tag-color-circle" style="--tag-color: {tag.color || '#808080'};"></span>
													<span class="tag-list-text">
														<span class="tag-group-name">{groupName}:</span>
														<span class="tag-name">{tag.tag}</span>
													</span>
												</div>
											{/each}
										{/each}
									</div>
								</div>
							{/if}
							{#if currentDoc.summary}
								<div class="field-block">
									<div class="field-label-row">
										<span class="field-label">Summary</span>
										{#if currentDoc.summary_version !== 'B'}
											{@const sourceType = getSourceTypeFromVersion(currentDoc.summary_version || '')}
											<span class="source-badge" style="background-color: {getSourceColor(sourceType, currentTheme)}">
												{getSourceLabel(sourceType)}
											</span>
										{/if}
									</div>
									<div class="field-value summary-content">{currentDoc.summary}</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			<button 
				type="button"
				bind:this={splitterHandle}
				class="splitter"
				onmousedown={handleSplitterMouseDown}
				role="slider"
				aria-label="Resize detail panel"
				aria-orientation="vertical"
				aria-valuenow={detailPanelWidth}
				aria-valuemin={DOC_DETAIL_PANEL_MIN_WIDTH}
				aria-valuemax={DOC_DETAIL_PANEL_MAX_WIDTH}
			></button>
			<div class="content-panel" style="width: calc(100% - {detailPanelWidth}rem - 0.25rem);">
					<div class="doc-content-card">
						<Tabs class="app-tab" value={activeTab} onValueChange={handleTabChange}>
							<Tabs.List>
								<Tabs.Trigger value="document">Viewer</Tabs.Trigger>
								<Tabs.Trigger value="events">Events</Tabs.Trigger>
								<Tabs.Trigger value="chat">Chat</Tabs.Trigger>
								<Tabs.Indicator />
							</Tabs.List>

							<Tabs.Content value="document">
								<div class="document-tab-content">
									{#if pdfUrl && currentDoc.document_type?.toLowerCase() === 'pdf'}
										<PdfViewer url={pdfUrl} isResizing={isResizing} />
									{:else if currentDoc.document_type?.toLowerCase() !== 'pdf'}
										<div class="non-pdf-message">
											Document type "{currentDoc.document_type}" is not supported for viewing. Please download the file.
										</div>
									{:else}
										<div class="loading-pdf">Loading PDF...</div>
									{/if}
								</div>
							</Tabs.Content>

							<Tabs.Content value="events">
								<div class="events-tab-content">
									{#if currentDoc.case_id}
										<EventsToolbar
											caseId={currentDoc.case_id}
											searchText={eventsSearchText}
											activeView={activeEventsTab}
											documentId={currentDoc.document_id}
											filterByDocument={filterByDocument}
											onSearchChange={handleEventsSearchChange}
											onClearSearch={() => {
												eventsSearchText = '';
												saveEventsPreferences();
											}}
											onViewChange={(value) => {
												if (value === 'timeline' || value === 'grid') {
													activeEventsTab = value;
													saveEventsViewPreference();
												}
											}}
											onFilterByDocumentChange={(value) => {
												filterByDocument = value;
											}}
											onDateSliderChange={handleDateRangeChange}
										/>
										{#if activeEventsTab === 'timeline'}
											<div class="timeline-view-content">
												<Timeline 
													caseId={currentDoc.case_id} 
													searchText={eventsSearchText}
													documentId={currentDoc.document_id}
													filterByDocumentId={filterByDocument}
												/>
											</div>
										{:else if activeEventsTab === 'grid'}
											<div class="grid-view-content">
												<EventsGrid 
													caseId={currentDoc.case_id} 
													searchText={eventsSearchText}
													documentId={currentDoc.document_id}
													filterByDocumentId={filterByDocument}
												/>
											</div>
										{/if}
									{:else}
										<div class="no-case-message">No case associated with this document</div>
									{/if}
								</div>
							</Tabs.Content>

							<Tabs.Content value="chat">
								<div class="chat-tab-content">
									<SmartChat type="doc" id={currentDoc.document_id} name={currentDoc.document || ''} />
								</div>
							</Tabs.Content>
						</Tabs>
					</div>
				</div>
		</div>
	{/if}
	
	<!-- Delete Confirmation Dialog -->
	{#if showDeleteConfirm && docToDelete}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="delete-confirmation-overlay" onclick={handleDeleteCancel} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" tabindex="-1">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="delete-confirmation-dialog" onclick={(e) => e.stopPropagation()}>
				<h3 id="delete-confirm-title">Delete Document</h3>
				<p>Are you sure you want to delete the document "{docToDelete.document}"?</p>
				<div class="delete-confirmation-buttons">
					<button type="button" class="btn btn-sm secondary-btn" onclick={handleDeleteCancel}>No</button>
					<button type="button" class="btn btn-sm danger-btn" onclick={handleDeleteConfirm}>Yes</button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Copy Link Toast -->
	{#if copyLinkToastOpen && copyLinkToastTrigger}
		<Portal>
			<div class="toast-popover-container" style="position: fixed; top: {copyLinkToastPosition.top}px; left: {copyLinkToastPosition.left}px; transform: translateY(-50%); z-index: 10001;">
				<div class="card p-2 bg-surface-100-900 shadow-xl toast-message">
					<div class="text-sm font-medium text-surface-900-50">
						link copied
					</div>
				</div>
			</div>
		</Portal>
	{/if}
</div>
