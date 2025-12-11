'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	KeyboardSensor,
	useSensor,
	useSensors,
	TouchSensor,
	MouseSensor,
	DragStartEvent,
	DragEndEvent,
	DragOverEvent,
	MeasuringStrategy,
	CollisionDetection,
	rectIntersection,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
} from '@dnd-kit/sortable';

import { ErrorBoundary } from '../../ErrorBoundary';
import StatusBar from '../StatusBar';
import AppIcon from '../AppIcon';
import SortableAppIcon from './SortableAppIcon';
import Widget from '../Widget';
import { useAppsStore } from '../../../stores/apps';
import { useSettingsStore } from '../../../stores/settings';
import { getAppComponent } from '../../../utils/appComponents';
import { RESIZE, HOME_SCREEN, TIMING, LAYOUT } from '../../../constants';
import { markUserInteraction, triggerHaptic } from '../../../utils/haptic';
import HomeScreenDock from './HomeScreenDock';
import HomeScreenPagination from './HomeScreenPagination';
import HomeScreenAppContainer from './HomeScreenAppContainer';
import { DragAutoScroller } from './DragAutoScroller';

// Helper to generate empty slot IDs
const getEmptySlotId = (page: number, index: number) => `empty-${page}-${index}`;

function HomeScreen() {
	const allApps = useAppsStore(state => state.apps);
	const { wallpaper, darkMode } = useSettingsStore();

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	const iosAppPositions = useAppsStore(state => state.iosAppPositions);
	const launchApp = useAppsStore(state => state.launchApp);
	const closeApp = useAppsStore(state => state.closeApp);
	const reorderIosApps = useAppsStore(state => state.reorderIosApps);

	const apps = useMemo(
		() => allApps.filter(app => app.platform === 'ios' || app.platform === 'both'),
		[allApps]
	);

	// --- DND State ---
	const [activeId, setActiveId] = useState<string | null>(null);
	const isDragging = activeId !== null;

	const generatePageItems = useCallback((pageIndex: number, currentPositions: Map<string, number>, currentApps: typeof apps) => {
		const items: string[] = [];
		const offset = pageIndex * 20;
		for (let i = 0; i < 20; i++) {
			const absoluteIndex = offset + i;
			const app = currentApps.find(a => {
				const pos = currentPositions.get(a.id);
				return pos === absoluteIndex;
			});
			items.push(app ? app.id : getEmptySlotId(pageIndex, i));
		}
		return items;
	}, []);

	const [page0Items, setPage0Items] = useState<string[]>([]);
	const [page1Items, setPage1Items] = useState<string[]>([]);

	// Sync only when NOT dragging
	useEffect(() => {
		if (!isDragging) {
			setPage0Items(generatePageItems(0, iosAppPositions, apps));
			setPage1Items(generatePageItems(1, iosAppPositions, apps));
		}
	}, [iosAppPositions, apps, generatePageItems, isDragging]);

	// --- Sensors ---
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
		useSensor(TouchSensor, {
			// Delay 250ms mimics Long Press. Quick swipes are ignored by drag.
			activationConstraint: { delay: 250, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// --- App / Swipe State ---
	const [currentApp, setCurrentApp] = useState<string | null>(null);
	const [appToOpen, setAppToOpen] = useState<string | null>(null);
	const [isSwiping, setIsSwiping] = useState(false);
	const [isSwipingFromBottom, setIsSwipingFromBottom] = useState(false);
	const [swipePosition, setSwipePosition] = useState(0);
	const [swipeUpPosition, setSwipeUpPosition] = useState(0);
	const [isDraggingSwipe, setIsDraggingSwipe] = useState(false); // For app close transition

	// DOM Refs
	const appContainerRef = useRef<HTMLDivElement>(null);
	const appOpenOriginRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
	const pageContainerRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const currentPageRef = useRef(0);
	useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

	// Swipe Tracking
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const swipeStateRef = useRef({ currentY: 0, startY: 0, isActive: false, progress: 0 });

	const statusBarColors = useMemo(() => {
		const appId = currentApp || appToOpen;
		if (!appId) return { backgroundColor: 'transparent', textColor: 'white' };
		// Simplified color logic
		const isDark = darkMode;
		if (appId === 'terminal') return { backgroundColor: '#000000', textColor: '#ffffff' };
		return {
			backgroundColor: isDark ? '#000000' : '#ffffff',
			textColor: isDark ? '#ffffff' : '#000000',
		};
	}, [currentApp, appToOpen, darkMode]);

	// --- Handlers ---

	// --- Custom Collision Strategy ---
	// Only detect collisions with items on the CURRENT PAGE.
	// This fixes the issue where 'closestCenter' might pick an item from Page 0 while we are on Page 1.
	const pageAwareCollisionDetection = useCallback<CollisionDetection>((args) => {
		const { droppableContainers, ...rest } = args;
		const activePage = currentPageRef.current;

		// Filter containers to only include those on the current page
		// We know IDs are like 'appId' or 'empty-PAGE-INDEX'
		// But valid app IDs don't have page info directly.
		// However, we can use our state lists: page0Items, page1Items.

		// Optimization: We can just use rectIntersection for the 'empty' slots (fallback) 
		// and closestCenter for apps? 
		// Or simply: Look at `pointerWithin` first.

		// Let's implement a filtered closestCenter.
		const validIds = activePage === 0 ? page0Items : page1Items;

		const filteredContainers = droppableContainers.filter(container => {
			return validIds.includes(container.id as string);
		});

		// First, try rectangle intersection (more accurate for "hovering over")
		const rectCollisions = rectIntersection({
			...rest,
			droppableContainers: filteredContainers
		});

		// If we hit something directly, great.
		if (rectCollisions.length > 0) {
			return rectCollisions;
		}

		// CUSTOM SNAP LOGIC:
		// The user wants lenient dropping. If not directly over a slot, snap to nearest.
		// 'closestCenter' does exactly this by measuring distance to centers.
		// However, standard dnd-kit behavior might sometimes return nothing if too far?
		// No, closestCenter generally returns something if there are candidates.
		// We ensure we ONLY pass filteredContainers (current page items).
		return closestCenter({
			...rest,
			droppableContainers: filteredContainers
		});
	}, [page0Items, page1Items]); // Re-create if items change (memoized efficiently)

	// --- Handlers ---

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
		triggerHaptic('medium');
		document.body.style.overflow = 'hidden';
	}, []);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);
		document.body.style.overflow = '';

		let finalOverId = over?.id;

		// --- PRIMARY DROP LOGIC: Force Grid Math ---
		// We use mathematical grid calculation to determine the drop target slot.
		// This is more robust than collision detection for cross-page transitions.

		if (active.rect.current.translated) {
			const activePage = currentPageRef.current;
			const targetItems = activePage === 0 ? page0Items : page1Items;

			const dragRect = active.rect.current.translated;
			const dragCenter = {
				x: dragRect.left + dragRect.width / 2,
				y: dragRect.top + dragRect.height / 2
			};

			// Grid Layout Metrics (Matches Tailwind: pt-12, px-4, gap-5)
			const METRICS = {
				paddingTop: 48,
				paddingX: 16,
				gap: 20,
				cols: 4,
				rows: 5
			};

			const screenW = window.innerWidth;

			// Calculate standard column width
			const availableWidth = screenW - (METRICS.paddingX * 2);
			const totalGapWidth = (METRICS.cols - 1) * METRICS.gap;
			const appWidth = (availableWidth - totalGapWidth) / METRICS.cols;

			const colStride = appWidth + METRICS.gap;

			// Calculate Row and Col based on pointer position relative to Grid Origin
			const relativeX = dragCenter.x - METRICS.paddingX;
			const relativeY = dragCenter.y - METRICS.paddingTop;

			let col = Math.floor(relativeX / colStride);
			let row = Math.floor(relativeY / colStride);

			// Clamp to valid grid range
			col = Math.max(0, Math.min(METRICS.cols - 1, col));
			row = Math.max(0, Math.min(METRICS.rows - 1, row));

			const calculatedIndex = row * METRICS.cols + col;

			if (calculatedIndex >= 0 && calculatedIndex < targetItems.length) {
				finalOverId = targetItems[calculatedIndex];
			}
		}

		if (!finalOverId) return;

		// Prevent dropping on self
		if (active.id === finalOverId) return;

		const isPage0Source = page0Items.includes(active.id as string);
		const isPage0Target = page0Items.includes(finalOverId as string);

		// Validation: Ensure target is in our managed lists
		if (!isPage0Source && !page1Items.includes(active.id as string)) return;

		const sourceItems = isPage0Source ? page0Items : page1Items;
		const targetItems = isPage0Target ? page0Items : page1Items;

		// Get standard indices
		const oldIndex = sourceItems.indexOf(active.id as string);
		const newIndex = targetItems.indexOf(finalOverId as string);

		// Calculate global absolute indices for the Store
		const sourcePageOffset = isPage0Source ? 0 : 20;
		const targetPageOffset = isPage0Target ? 0 : 20;

		const absoluteFromIndex = sourcePageOffset + oldIndex;
		const absoluteToIndex = targetPageOffset + newIndex;

		// Commit Reorder to Store (Global State)
		reorderIosApps(absoluteFromIndex, absoluteToIndex);

		// Note: We deliberately skip local Optimistic UI updates here to avoid complex state synchronization issues
		// particularly with cross-page moves. The Store update triggers a re-render almost instantly.

	}, [page0Items, page1Items, reorderIosApps]);

	// --- Touch Handling (Swipe/Scroll) ---
	const handleTouchStart = (e: React.TouchEvent) => {
		if (isDragging) return;
		const touch = e.touches[0];
		touchStartRef.current = { x: touch.clientX, y: touch.clientY };

		// Page Swipe Init
		if (!currentApp && !appToOpen) {
			// Captured by ref
		}

		// Close App Init
		if (currentApp && !isSwipingFromBottom) {
			if (touch.clientY >= window.innerHeight - 40) { // Bottom bar area
				setIsSwipingFromBottom(true);
				setSwipeUpPosition(0);
			}
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (isDragging || !touchStartRef.current) return;
		const cx = e.touches[0].clientX;
		const cy = e.touches[0].clientY;
		const startX = touchStartRef.current.x;
		const startY = touchStartRef.current.y;
		const deltaX = cx - startX;
		const deltaY = cy - startY;

		// Page Swipe
		if (!currentApp && !appToOpen) {
			// dnd-kit should let this pass if it's horizontal swipe (tolerance)
			// Manually animate page container?
			// React state 'currentPage' handles the main position.
			// We can do resistance if needed but keeping it simple:
			// Just detect end.
		}

		// Close App Swipe
		if (currentApp && isSwipingFromBottom) {
			const progress = Math.max(0, Math.min(100, ((startY - cy) / window.innerHeight) * 100));
			setIsDraggingSwipe(true);
			requestAnimationFrame(() => {
				if (appContainerRef.current) {
					appContainerRef.current.style.transform = `translate3d(0, -${progress}vh, 0)`;
					appContainerRef.current.style.transition = 'none';
					if (progress > 80) appContainerRef.current.style.opacity = `${1 - (progress - 80) / 20}`;
				}
			});
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (isDragging || !touchStartRef.current) return;
		const cx = e.changedTouches[0].clientX;
		const cy = e.changedTouches[0].clientY;
		const startX = touchStartRef.current.x;
		const deltaX = cx - startX;

		// Page Swipe
		if (!currentApp && !appToOpen) {
			const SWIPE_THRESHOLD = window.innerWidth * 0.2;
			if (deltaX < -SWIPE_THRESHOLD && currentPage < 1) setCurrentPage(1);
			if (deltaX > SWIPE_THRESHOLD && currentPage > 0) setCurrentPage(0);
		}

		// Close App Swipe
		if (currentApp && isSwipingFromBottom) {
			setIsSwipingFromBottom(false);
			setIsDraggingSwipe(false);
			const deltaY = touchStartRef.current.y - cy;
			if (deltaY > window.innerHeight * 0.2) {
				// Close
				if (appContainerRef.current) {
					appContainerRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
					appContainerRef.current.style.transform = `translate3d(0, -100vh, 0)`;
					appContainerRef.current.style.opacity = '0';
				}
				setTimeout(() => {
					closeApp(currentApp);
					setCurrentApp(null);
					setSwipeUpPosition(0);
					if (appContainerRef.current) {
						appContainerRef.current.style.transform = '';
						appContainerRef.current.style.opacity = '';
					}
				}, 300);
			} else {
				// Reset
				if (appContainerRef.current) {
					appContainerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
					appContainerRef.current.style.transform = 'translate3d(0, 0, 0)';
					appContainerRef.current.style.opacity = '1';
				}
			}
		}

		touchStartRef.current = null;
	};

	const handleAppClick = useCallback((appId: string) => {
		if (isDragging) return;

		triggerHaptic('light');

		const iconElement = document.querySelector(`[data-app-id="${appId}"]`) as HTMLElement;
		if (iconElement) {
			const rect = iconElement.getBoundingClientRect();
			appOpenOriginRef.current = {
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			};
		}

		setAppToOpen(appId);
		setIsSwiping(true);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (appContainerRef.current && appOpenOriginRef.current) {
					const origin = appOpenOriginRef.current;
					const windowWidth = window.innerWidth;
					const windowHeight = window.innerHeight;
					const scale = Math.min(origin.width / windowWidth, origin.height / windowHeight);
					const translateX = (origin.x + origin.width / 2) - (windowWidth / 2);
					const translateY = (origin.y + origin.height / 2) - (windowHeight / 2);

					appContainerRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
					appContainerRef.current.style.opacity = '0';
					appContainerRef.current.style.borderRadius = `${origin.width / 4}px`;
					appContainerRef.current.style.transition = 'none';

					void appContainerRef.current.offsetHeight;

					appContainerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-out, border-radius 0.4s ease-out';
					appContainerRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
					appContainerRef.current.style.opacity = '1';
					appContainerRef.current.style.borderRadius = '0px';
				}
			});
		});

		setTimeout(() => {
			launchApp(appId);
			setCurrentApp(appId);
			setIsSwiping(false);
			setAppToOpen(null);
			if (appContainerRef.current) {
				appContainerRef.current.style.transition = '';
				appContainerRef.current.style.transform = '';
				appContainerRef.current.style.borderRadius = '';
			}
		}, 450);
	}, [isDragging, launchApp]);

	// --- Render Helpers ---
	const renderGridItem = (id: string, index: number) => {
		const isApp = !id.startsWith('empty-');
		if (isApp) {
			const app = apps.find(a => a.id === id);
			if (!app) return null;
			return <SortableAppIcon key={id} id={id} app={app} onClick={handleAppClick} />;
		} else {
			// ENABLE empty slots as drop targets (remove disabled=true).
			// They are not draggable because we don't attach listeners in SortableAppIcon if isEmpty=true.
			return <SortableAppIcon key={id} id={id} app={{ id, name: '', icon: '', platform: 'ios' }} onClick={() => { }} isEmpty={true} />;
		}
	};

	const renderOverlayItem = (id: string) => {
		const app = apps.find(a => a.id === id);
		if (!app) return null;
		return (
			<div className="w-16 h-16 pointer-events-none">
				{/* Pass isDragging=false to AppIcon so it renders fully opaque without the 'ios-dragging' styles that might reduce opacity.
				    The opacity/ghosting of the *original* item is handled by SortableAppIcon. 
					The *dragged* copy (overlay) should be clear and solid. */}
				<AppIcon
					app={app}
					isDragging={false}
				/>
			</div>
		);
	};

	const Component = useMemo(() => {
		const appId = currentApp || appToOpen;
		if (!appId) return null;
		const app = useAppsStore.getState().getAppById(appId);
		if (!app?.component) return null;
		return getAppComponent(app.component);
	}, [currentApp, appToOpen]);

	const dockApps = useMemo(() => {
		return apps.filter(a => (iosAppPositions.get(a.id) ?? 0) >= 100).sort((a, b) => (iosAppPositions.get(a.id) ?? 0) - (iosAppPositions.get(b.id) ?? 0));
	}, [apps, iosAppPositions]);

	return (
		<ErrorBoundary>
			<div className="ios-homescreen w-screen h-screen overflow-hidden relative touch-pan-x"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Wallpaper */}
				<div key={wallpaper} className="wallpaper absolute inset-0 -z-10">
					{wallpaper.startsWith('/') || wallpaper.startsWith('http') ? (
						<Image src={wallpaper} alt="Wallpaper" fill className="object-cover" priority unoptimized />
					) : (
						<div className="w-full h-full" style={{ background: wallpaper }}></div>
					)}
				</div>

				{!currentApp && !appToOpen && <StatusBar backgroundColor="transparent" textColor="white" />}

				<DndContext
					sensors={sensors}
					collisionDetection={pageAwareCollisionDetection}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
				>
					{/* Drag Monitor for Auto-Scroll */}
					<DragAutoScroller
						onChangePage={(dir: 'next' | 'prev') => {
							if (dir === 'next' && currentPage < 1) setCurrentPage(1);
							if (dir === 'prev' && currentPage > 0) setCurrentPage(0);
						}}
					/>

					<div className="absolute inset-0 pt-12 pb-32 overflow-hidden">
						<div
							className="flex h-full w-[200vw]"
							style={{
								transform: `translateX(-${currentPage * 100}vw)`,
								transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
							}}
						>
							{/* Page 0 */}
							<div className="ios-app-grid-page w-screen h-full px-4">
								<SortableContext items={page0Items} strategy={rectSortingStrategy}>
									<div className="grid grid-cols-4 gap-5">
										<div className="col-span-2 row-span-2 pointer-events-none">
											<Widget type="battery" />
										</div>
										{page0Items.map((id, index) => (
											<div key={id} className="w-full aspect-square">
												{renderGridItem(id, index)}
											</div>
										))}
									</div>
								</SortableContext>
							</div>

							{/* Page 1 */}
							<div className="ios-app-grid-page w-screen h-full px-4">
								<SortableContext items={page1Items} strategy={rectSortingStrategy}>
									<div className="grid grid-cols-4 gap-5">
										{page1Items.map((id, index) => (
											<div key={id} className="w-full aspect-square">
												{renderGridItem(id, index)}
											</div>
										))}
									</div>
								</SortableContext>
							</div>
						</div>
					</div>

					<DragOverlay>
						{activeId ? renderOverlayItem(activeId) : null}
					</DragOverlay>
				</DndContext>

				<HomeScreenPagination currentPage={currentPage} visible={!currentApp && !appToOpen} />
				<HomeScreenDock apps={dockApps} onAppClick={handleAppClick} />

			</div>

			<HomeScreenAppContainer
				Component={Component}
				appContainerRef={appContainerRef}
				isSwipingFromBottom={isSwipingFromBottom}
				swipeUpPosition={swipeUpPosition}
				swipePosition={swipePosition}
				isSwiping={isSwiping}
				isDraggingSwipe={isDraggingSwipe}
				currentApp={currentApp}
				appToOpen={appToOpen}
				statusBarColors={statusBarColors}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			/>

			<style jsx>{`
					.ios-homescreen {
						font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont;
						font-weight: 600;
					}
				`}</style>
		</ErrorBoundary>
	);
}

export default HomeScreen;

