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

	// Tailwind Classes Map
	const containerClasses = [
		'fixed flex flex-col',
		'rounded-xl overflow-hidden', // Rounded corners
		'border border-black/10 dark:border-white/10', // Borders
		'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]', // Inner glow for glass effect
		'will-change-[transform,width,height]',
		'transition-[transform,width,height,opacity] duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)]', // Smooth animation
		// Focus states
		windowState.isFocused
			? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_0_1px_0_rgba(0,0,0,0.5)] dark:shadow-[0_30px_80px_-10px_rgba(0,0,0,0.6)] z-50'
			: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] grayscale-[0.05] opacity-95 z-10',
		// Animation states
		isOpening && !windowState.originRect ? 'opacity-0 scale-95' : 'opacity-100', // Default opening scale
		isClosing ? 'opacity-0 scale-90 pointer-events-none' : '', // Closing scale
	].filter(Boolean).join(' ');

	if (isClosing) {
		return (
			<div className={containerClasses} style={windowStyle}>
				<div className="bg-gray-100 dark:bg-[#1E1E1E] h-9 flex items-center justify-between px-3 rounded-t-xl cursor-default border-b border-gray-200 dark:border-black/50">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_#e0443e]"></div>
						<div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_#d3a125]"></div>
						<div className="w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_#00a91d]"></div>
					</div>
					<div className="text-xs font-medium text-gray-500/80 dark:text-gray-400">
						{windowState.title}
					</div>
					<div className="w-14"></div>
				</div>
				<div className="h-[calc(100%-2.25rem)] bg-white dark:bg-[#1E1E1E]"></div>
			</div>
		);
	}

	return (
		<div
			ref={windowRef}
			className={containerClasses}
			style={windowStyle}
			onMouseDown={handleMouseDown}
			onDoubleClick={handleDoubleClick}
		>
			{/* Window Header */}
			<div
				className={`window-header h-9 flex items-center justify-between px-3 shrink-0 select-none transition-colors duration-200 
				${isDragging || isResizing || windowState.isFocused
						? 'bg-[#EDECEC] dark:bg-[#282828] border-b border-gray-300/50 dark:border-black/40' // Active header color
						: 'bg-[#F6F6F6] dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-white/5' // Inactive header color
					}`}
				onDoubleClick={e => {
					e.stopPropagation();
					handleDoubleClick();
				}}
			>
				{/* Window Controls */}
				<div className="flex items-center gap-2 group">
					<button
						className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_#e0443e] flex items-center justify-center text-transparent hover:text-[#4E0002] active:brightness-90 transition-all font-bold p-0 border-none outline-none leading-none"
						onClick={e => {
							e.stopPropagation();
							handleClose();
						}}
						aria-label="Close"
					>
						<svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 block" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
							<path d="M1 1L5 5M5 1L1 5" />
						</svg>
					</button>
					<button
						className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_#d3a125] flex items-center justify-center text-transparent hover:text-[#9A5515] active:brightness-90 transition-all font-bold p-0 border-none outline-none leading-none"
						onClick={e => {
							e.stopPropagation();
							handleMinimize();
						}}
						aria-label="Minimize"
					>
						<svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 block" viewBox="0 0 6 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
							<path d="M1 1H5" />
						</svg>
					</button>
					<button
						className="w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_#00a91d] flex items-center justify-center text-transparent hover:text-[#006500] active:brightness-90 transition-all font-bold p-0 border-none outline-none leading-none"
						onClick={e => {
							e.stopPropagation();
							storeRef.current.maximizeWindow(windowState.id);
						}}
						aria-label="Maximize"
					>
						<svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 block" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
							<path d="M1 5L5 1M5 1H2M5 1V4" />
						</svg>
					</button>
				</div>
				<div className="text-[13px] font-semibold text-gray-700/80 dark:text-gray-200/90 tracking-tight">
					{windowState.title}
				</div>
				<div className="w-14"></div>
			</div>

			{/* Window Content */}
			<div
				className={`window-content flex-1 bg-white dark:bg-[#1E1E1E] overflow-hidden relative 
				${!windowState.isFocused && 'pointer-events-none opacity-95'}`}
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

			{/* Resize Handle */}
			{!windowState.isMaximized && (
				<button
					className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 opacity-0"
					onMouseDown={handleResizeStart}
					aria-label="Resize"
					tabIndex={0}
				/>
			)}
		</div>
	);
}
