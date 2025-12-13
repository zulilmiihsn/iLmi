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
import { useDragHandlers } from './useDragHandlers';

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

	// O(1) lookup map for render functions only (doesn't affect state sync)
	const appsMap = useMemo(() => new Map(apps.map(app => [app.id, app])), [apps]);

	// --- DND State ---
	const [activeId, setActiveId] = useState<string | null>(null);
	const isDragging = activeId !== null;

	// Helper to generate page items (pure function, no hooks)
	const computePageItems = (pageIndex: number, positions: Map<string, number>, appsList: typeof apps) => {
		const items: string[] = [];
		const PAGE_SIZE = pageIndex === 0 ? 24 : 28;
		const offset = pageIndex === 0 ? 0 : 24 + (pageIndex - 1) * 28;

		for (let i = 0; i < PAGE_SIZE; i++) {
			const absoluteIndex = offset + i;
			const app = appsList.find(a => positions.get(a.id) === absoluteIndex);
			items.push(app ? app.id : getEmptySlotId(pageIndex, i));
		}
		return items;
	};

	// Helper to compute dock items
	const computeDockItems = (positions: Map<string, number>) => {
		const dock: { id: string; pos: number }[] = [];
		positions.forEach((pos, id) => {
			if (pos >= 100) dock.push({ id, pos });
		});
		dock.sort((a, b) => a.pos - b.pos);
		return dock.map(d => d.id);
	};

	// Lazy initial state (computed once on mount)
	const [page0Items, setPage0Items] = useState<string[]>(() => computePageItems(0, iosAppPositions, apps));
	const [page1Items, setPage1Items] = useState<string[]>(() => computePageItems(1, iosAppPositions, apps));
	const [dockItemIds, setDockItemIds] = useState<string[]>(() => computeDockItems(iosAppPositions));

	// Ref to track if we should sync (skip during drag)
	const prevPositionsRef = useRef(iosAppPositions);

	// Sync only when store changes AND not dragging
	useEffect(() => {
		// Skip if dragging or if positions haven't changed
		if (isDragging) return;
		if (prevPositionsRef.current === iosAppPositions) return;

		prevPositionsRef.current = iosAppPositions;

		const newPage0 = computePageItems(0, iosAppPositions, apps);
		const newPage1 = computePageItems(1, iosAppPositions, apps);
		const newDock = computeDockItems(iosAppPositions);

		setPage0Items(prev => JSON.stringify(prev) === JSON.stringify(newPage0) ? prev : newPage0);
		setPage1Items(prev => JSON.stringify(prev) === JSON.stringify(newPage1) ? prev : newPage1);
		setDockItemIds(prev => JSON.stringify(prev) === JSON.stringify(newDock) ? prev : newDock);
	}, [iosAppPositions, isDragging, apps]);

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
	const touchStartRef = useRef<{ x: number; y: number } | null>(null); // Lifted up for access

	// Reset swipe tracking when drag starts
	useEffect(() => {
		if (isDragging) {
			touchStartRef.current = null;
		}
	}, [isDragging]);

	const appContainerRef = useRef<HTMLDivElement>(null);
	const appOpenOriginRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
	const pageContainerRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const currentPageRef = useRef(0);
	useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

	// Drag handlers with cross-container support
	const { handleDragStart, handleDragOver, handleDragEnd } = useDragHandlers({
		iosAppPositions,
		page0Items,
		page1Items,
		dockItemIds,
		setActiveId,
		setPage0Items,
		setPage1Items,
		setDockItemIds,
		reorderIosApps,
	});

	// Swipe Tracking
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

		// Filter containers to include:
		// 1. Current Page Items
		// 2. Dock Items
		const validIds = activePage === 0 ? page0Items : page1Items;


		// Get Dock IDs dynamically (pos >= 100)
		// Use local state 'dockItemIds' to support collision with items moved there during drag
		const allValidIds = [...validIds, ...dockItemIds];

		const filteredContainers = droppableContainers.filter(container => {
			return allValidIds.includes(container.id as string);
		});

		// Optimize for "magnetic" feel: ClosestCenter is trusted more for imprecise dropping.
		// RectIntersection is checking containment.

		// If we are over the Dock, we want sticky behavior.
		// If we are on Grid, Closest Center helps "snap" to nearest slot even if not fully over it.

		// Let's try combining:
		// 1. If we hit a valid rect, good.
		// 2. If not, use closestCenter.
		// User requested "tidak perlu presisi" (no need to be precise).
		// closestCenter IS the less precise, more magnetic one.

		return closestCenter({
			...rest,
			droppableContainers: filteredContainers
		});
	}, [page0Items, page1Items, iosAppPositions, dockItemIds]);


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
	const renderGridItem = (id: string, _index: number) => {
		const isApp = !id.startsWith('empty-');
		if (isApp) {
			const app = appsMap.get(id);
			if (!app) return null;
			return <SortableAppIcon key={id} id={id} app={app} onClick={handleAppClick} />;
		} else {
			// ENABLE empty slots as drop targets (remove disabled=true).
			// They are not draggable because we don't attach listeners in SortableAppIcon if isEmpty=true.
			return <SortableAppIcon key={id} id={id} app={{ id, name: '', icon: '', platform: 'ios', component: 'none' }} onClick={() => { }} isEmpty={true} />;
		}
	};

	const renderOverlayItem = (id: string) => {
		const app = appsMap.get(id);
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
		return dockItemIds.map(id => apps.find(a => a.id === id)!).filter(Boolean);
	}, [apps, dockItemIds]);

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
					onDragOver={handleDragOver}
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

					<HomeScreenDock apps={dockApps} onAppClick={handleAppClick} />
				</DndContext>

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
		</ErrorBoundary >
	);
}

export default HomeScreen;

