'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWindowsStore } from '../../stores/windows';
import { useAppsStore } from '../../stores/apps';
import type { WindowState } from '../../types';
import { getAppComponent } from '../../utils/appComponents';
import { WINDOW, TIMING } from '../../constants';

interface WindowProps {
	window: WindowState;
}

export default function Window({ window: windowProp }: WindowProps) {
	const windowRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isMinimizing, setIsMinimizing] = useState(false);
	const [isOpening, setIsOpening] = useState(true);

	// Get windowState from store to avoid prop changes causing re-renders
	const windowState = useWindowsStore(
		state => state.windows.find(w => w.id === windowProp.id) || windowProp
	) as WindowState;

	const app = useMemo(() => {
		return useAppsStore.getState().getAppById(windowState.appId);
	}, [windowState.appId]);

	const storeRef = useRef({
		focusWindow: useWindowsStore.getState().focusWindow,
		updateWindow: useWindowsStore.getState().updateWindow,
		closeWindow: useWindowsStore.getState().closeWindow,
		minimizeWindow: useWindowsStore.getState().minimizeWindow,
		maximizeWindow: useWindowsStore.getState().maximizeWindow,
	});

	useEffect(() => {
		storeRef.current = {
			focusWindow: useWindowsStore.getState().focusWindow,
			updateWindow: useWindowsStore.getState().updateWindow,
			closeWindow: useWindowsStore.getState().closeWindow,
			minimizeWindow: useWindowsStore.getState().minimizeWindow,
			maximizeWindow: useWindowsStore.getState().maximizeWindow,
		};
	}, []);

	const Component = useMemo(() => {
		if (!app?.component) return null;
		return getAppComponent(app.component);
	}, [app?.component]);

	// Mutable state for drag/resize calculations to avoid re-renders
	const interactionRef = useRef({
		startX: 0,
		startY: 0,
		initialX: 0,
		initialY: 0,
		initialWidth: 0,
		initialHeight: 0,
		currentX: windowState.x,
		currentY: windowState.y,
		currentWidth: windowState.width,
		currentHeight: windowState.height,
		minimizeTarget: null as { x: number; y: number; width: number; height: number } | null,
	});

	// Sync interaction ref with store state when not interacting
	useEffect(() => {
		if (!isDragging && !isResizing && !isMinimizing) {
			interactionRef.current.currentX = windowState.x;
			interactionRef.current.currentY = windowState.y;
			interactionRef.current.currentWidth = windowState.width;
			interactionRef.current.currentHeight = windowState.height;
		}
	}, [
		windowState.x,
		windowState.y,
		windowState.width,
		windowState.height,
		isDragging,
		isResizing,
		isMinimizing,
	]);

	function handleMouseDown(e: React.MouseEvent) {
		const target = e.target as HTMLElement;
		if (
			(target.classList.contains('window-header') || target.closest('.window-header')) &&
			!windowState.isMaximized
		) {
			e.preventDefault();
			setIsDragging(true);
			storeRef.current.focusWindow(windowState.id);

			interactionRef.current.startX = e.clientX;
			interactionRef.current.startY = e.clientY;
			interactionRef.current.initialX = windowState.x;
			interactionRef.current.initialY = windowState.y;
		}
	}

	function handleResizeStart(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);
		storeRef.current.focusWindow(windowState.id);

		interactionRef.current.startX = e.clientX;
		interactionRef.current.startY = e.clientY;
		interactionRef.current.initialWidth = windowState.width;
		interactionRef.current.initialHeight = windowState.height;
	}

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!windowRef.current) return;

			// Use requestAnimationFrame for smooth visual updates during interaction
			requestAnimationFrame(() => {
				if (isDragging) {
					const deltaX = e.clientX - interactionRef.current.startX;
					const deltaY = e.clientY - interactionRef.current.startY;

					const globalWindow =
						typeof window !== 'undefined' ? window : { innerWidth: 1920, innerHeight: 1080 };

					// Calculate new position ensuring it stays somewhat within bounds
					// Allow some overflow but keep header accessible
					const newX = interactionRef.current.initialX + deltaX;
					const newY = Math.max(
						0,
						Math.min(globalWindow.innerHeight - 30, interactionRef.current.initialY + deltaY)
					);

					interactionRef.current.currentX = newX;
					interactionRef.current.currentY = newY;

					if (windowRef.current) {
						windowRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
						// Disable transition during drag
						windowRef.current.style.transition = 'none';
					}
				}

				if (isResizing) {
					const deltaX = e.clientX - interactionRef.current.startX;
					const deltaY = e.clientY - interactionRef.current.startY;

					const newWidth = Math.max(WINDOW.MIN_WIDTH, interactionRef.current.initialWidth + deltaX);
					const newHeight = Math.max(
						WINDOW.MIN_HEIGHT,
						interactionRef.current.initialHeight + deltaY
					);

					interactionRef.current.currentWidth = newWidth;
					interactionRef.current.currentHeight = newHeight;

					if (windowRef.current) {
						windowRef.current.style.width = `${newWidth}px`;
						windowRef.current.style.height = `${newHeight}px`;
						// Disable transition during resize
						windowRef.current.style.transition = 'none';
					}
				}
			});
		},
		[isDragging, isResizing]
	);

	const handleMouseUp = useCallback(() => {
		if (isDragging) {
			setIsDragging(false);
			storeRef.current.updateWindow(windowState.id, {
				x: interactionRef.current.currentX,
				y: interactionRef.current.currentY,
			});
		}
		if (isResizing) {
			setIsResizing(false);
			storeRef.current.updateWindow(windowState.id, {
				width: interactionRef.current.currentWidth,
				height: interactionRef.current.currentHeight,
			});
		}

		// Re-enable transitions after interaction
		if (windowRef.current) {
			windowRef.current.style.transition = '';
		}
	}, [isDragging, isResizing, windowState.id]);

	function handleDoubleClick() {
		storeRef.current.maximizeWindow(windowState.id);
	}

	useEffect(() => {
		if (typeof window === 'undefined') return;

		if (isDragging || isResizing) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

	// Handle opening animation
	useEffect(() => {
		if (isOpening) {
			const timer = setTimeout(() => {
				setIsOpening(false);
			}, TIMING.WINDOW_OPEN_DELAY);
			return () => clearTimeout(timer);
		}
	}, [isOpening]);

	// Handle close window with animation
	const handleClose = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => {
			storeRef.current.closeWindow(windowState.id);
		}, TIMING.WINDOW_CLOSE_DURATION);
	}, [windowState.id]);

	const handleMinimize = useCallback(() => {
		// Find dock icon position
		if (typeof document !== 'undefined') {
			const dockIcon = document.querySelector(`[data-app-id="${windowState.appId}"]`);
			if (dockIcon) {
				const rect = dockIcon.getBoundingClientRect();
				interactionRef.current.minimizeTarget = {
					x: rect.left,
					y: rect.top,
					width: rect.width,
					height: rect.height,
				};
			}
		}
		setIsMinimizing(true);
		setTimeout(() => {
			storeRef.current.minimizeWindow(windowState.id);
		}, TIMING.WINDOW_MINIMIZE_DURATION);
	}, [windowState.id, windowState.appId]);

	if (windowState.isMinimized) return null;

	// Calculate styles based on state
	// When maximized: 0, 0 position, 100% size
	// When normal: Translate3d for GPU perf, specific px size
	// When opening from dock: Start from dock icon position/size
	const windowStyle: React.CSSProperties = {
		zIndex: windowState.zIndex,
		// Reset top/left as we use transform now
		top: 0,
		left: 0,
	};

	if (isMinimizing && interactionRef.current.minimizeTarget) {
		const target = interactionRef.current.minimizeTarget;
		windowStyle.width = `${target.width}px`;
		windowStyle.height = `${target.height}px`;
		windowStyle.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
		windowStyle.opacity = 0;
		// Add a scale effect to simulate squeezing if we could,
		// but changing width/height combined with translate effectively scales it down.
		// We could add `filter: brightness(1.5)` temporarily to simulate "energy"
	} else if (isOpening && windowState.originRect) {
		windowStyle.width = `${windowState.originRect.width}px`;
		windowStyle.height = `${windowState.originRect.height}px`;
		windowStyle.transform = `translate3d(${windowState.originRect.x}px, ${windowState.originRect.y}px, 0)`;
		windowStyle.opacity = 0;
	} else {
		windowStyle.width = windowState.isMaximized ? '100%' : `${windowState.width}px`;
		windowStyle.height = windowState.isMaximized ? '100%' : `${windowState.height}px`;
		windowStyle.transform = windowState.isMaximized
			? 'translate3d(0, 0, 0)'
			: `translate3d(${windowState.x}px, ${windowState.y}px, 0)`;
	}

	if (isClosing) {
		return (
			<div className="macos-window fixed window-closing" style={windowStyle}>
				<div className="window-header bg-gray-100 dark:bg-gray-800 h-8 flex items-center justify-between px-3 rounded-t-lg cursor-default border-b border-gray-200 dark:border-black/50">
					<div className="flex items-center gap-[8px]">
						<div className="window-control window-control-close"></div>
						<div className="window-control window-control-minimize"></div>
						<div className="window-control window-control-maximize"></div>
					</div>
					<div className="text-xs font-medium text-gray-500/80 dark:text-gray-400">
						{windowState.title}
					</div>
					<div className="w-14"></div>
				</div>
				<div className="window-content h-[calc(100%-2rem)] overflow-auto macos-scrollbar"></div>
			</div>
		);
	}

	return (
		<div
			ref={windowRef}
			className={`macos-window fixed ${windowState.isFocused ? 'window-focused z-50' : 'window-blurred z-10'
				} ${isOpening && !windowState.originRect ? 'window-opening' : 'window-opened'}`}
			style={windowStyle}
			onMouseDown={handleMouseDown}
			onDoubleClick={handleDoubleClick}
		>
			<div
				className={`window-header h-8 flex items-center justify-between px-3 rounded-t-lg select-none transition-colors duration-200 ${isDragging || isResizing || windowState.isFocused
					? 'bg-[#E8E8E8] dark:bg-[#282828]'
					: 'bg-[#F6F6F6] dark:bg-[#1E1E1E]'
					} `}
				onDoubleClick={e => {
					e.stopPropagation();
					handleDoubleClick();
				}}
			>
				<div className="flex items-center gap-[8px] group">
					<button
						className="window-control window-control-close group-hover:text-[#4E0002]"
						onClick={e => {
							e.stopPropagation();
							handleClose();
						}}
						aria-label="Close window"
					>
						<svg
							className="hidden group-hover:block"
							width="6"
							height="6"
							viewBox="0 0 6 6"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M1 1L5 5M5 1L1 5"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
							/>
						</svg>
					</button>
					<button
						className="window-control window-control-minimize group-hover:text-[#9A5515]"
						onClick={e => {
							e.stopPropagation();
							handleMinimize();
						}}
						aria-label="Minimize window"
					>
						<svg
							className="hidden group-hover:block"
							width="6"
							height="2"
							viewBox="0 0 6 2"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M1 1H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
						</svg>
					</button>
					<button
						className="window-control window-control-maximize group-hover:text-[#006500]"
						onClick={e => {
							e.stopPropagation();
							storeRef.current.maximizeWindow(windowState.id);
						}}
						aria-label={windowState.isMaximized ? "Restore window" : "Maximize window"}
					>
						<svg
							className="hidden group-hover:block"
							width="6"
							height="6"
							viewBox="0 0 6 6"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M1 5L5 1M5 1H2M5 1V4"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
				<div className="text-xs font-semibold text-gray-700 dark:text-gray-200 opacity-90">
					{windowState.title}
				</div>
				<div className="w-14"></div>
			</div>

			<div
				className={`window-content h-[calc(100%-2rem)] bg-white dark:bg-[#1E1E1E] rounded-b-lg overflow-hidden relative ${!windowState.isFocused && 'pointer-events-none opacity-90 transition-opacity'}`}
			>
				<div className="absolute inset-0 overflow-auto macos-scrollbar">
					{Component && <Component />}
					{!Component && (
						<div className="p-4 flex items-center justify-center h-full text-gray-400">
							<div className="text-center">
								<p className="font-medium">App: {app?.name}</p>
								<p className="text-sm">Under Development</p>
							</div>
						</div>
					)}
				</div>
				{/* Overlay to catch clicks when not focused */}
				{!windowState.isFocused && <div className="absolute inset-0 z-10" />}
			</div>

			{!windowState.isMaximized && (
				<button
					className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize border-none bg-transparent p-0 z-50 touch-none"
					onMouseDown={handleResizeStart}
					aria-label="Resize window"
					tabIndex={0}
				></button>
			)}

			<style jsx>{`
				.macos-window {
					will-change: transform, width, height;
					border: 1px solid rgba(0, 0, 0, 0.1);
					box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
				}

				/* Focus state: Deep, strong shadow */
				.window-focused {
					box-shadow:
						0 20px 50px -12px rgba(0, 0, 0, 0.5),
						0 0 1px 0 rgba(0, 0, 0, 0.5);
					border-color: rgba(255, 255, 255, 0.1);
				}

				/* Blurred state: Subtle, flat shadow */
				.window-blurred {
					box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
					filter: grayscale(0.05);
				}

				/* Dark mode adjustments */
				:global(.dark) .macos-window {
					border: 1px solid rgba(0, 0, 0, 0.4);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05); /* Top highlight */
				}
				:global(.dark) .window-focused {
					box-shadow: 0 30px 80px -10px rgba(0, 0, 0, 0.6);
				}

				/* Smooth corner radius */
				.macos-window,
				.window-content {
					border-radius: 12px;
				}
				.window-header {
					border-radius: 12px 12px 0 0;
				}
				.window-content {
					border-radius: 0 0 12px 12px;
				}

				/* Transitions */
				.macos-window {
					transition:
						transform 0.25s cubic-bezier(0.2, 0, 0, 1),
						width 0.25s cubic-bezier(0.2, 0, 0, 1),
						height 0.25s cubic-bezier(0.2, 0, 0, 1),
						opacity 0.2s ease-out;
				}

				.window-opening {
					opacity: 0;
					transform: scale(0.95);
				}

				.window-opened {
					opacity: 1;
				}

				.window-closing {
					opacity: 0;
					transform: scale(0.9);
					pointer-events: none;
				}

				/* Native-like Window Controls */
				.window-control {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					border: none;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0;
					flex-shrink: 0;
					transition: all 0.1s ease;
				}

				/* Colors & Borders - Accurately matched to macOS */
				.window-control-close {
					background-color: #ff5f57;
					box-shadow: inset 0 0 0 1px #e0443e;
				}
				.window-control-minimize {
					background-color: #febc2e;
					box-shadow: inset 0 0 0 1px #d3a125;
				}
				.window-control-maximize {
					background-color: #28c840;
					box-shadow: inset 0 0 0 1px #00a91d;
				}

				/* Icon states */
				.window-control:active {
					filter: brightness(0.85);
				}

				:global(.dark) .window-header {
					box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.5); /* Separator line */
				}
			`}</style>
		</div>
	);
}
