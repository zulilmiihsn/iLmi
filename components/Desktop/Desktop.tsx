'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ErrorBoundary } from '../ErrorBoundary';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import ContextMenu from './ContextMenu';
import { useWindowsStore } from '../../stores/windows';
import { useSettingsStore } from '../../stores/settings';

import DesktopIcons from './DesktopIcons';

function Desktop() {
	const windows = useWindowsStore(state => state.windows);
	const { wallpaper, darkMode } = useSettingsStore(); // Get settings
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

	// Apply Dark Mode
	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setContextMenu({ x: e.pageX, y: e.pageY });
	};

	const closeContextMenu = () => {
		if (contextMenu) setContextMenu(null);
	};

	return (
		<ErrorBoundary>
			<div
				className="desktop w-screen h-screen overflow-hidden relative"
				onContextMenu={handleContextMenu}
				onClick={() => {
					closeContextMenu();
					// Deselect icons if clicked on empty space (handled inside DesktopIcons internally or needs a signal?
					// Ideally DesktopIcons listens to clicks outside.
					// But for now, simple click on desktop closes context menu is fine.
				}}
			>
				{/* Wallpaper */}
				<div key={wallpaper} className="wallpaper absolute inset-0 pointer-events-none">
					{/* Check if wallpaper is an image path or css gradient/color */}
					{wallpaper.startsWith('/') || wallpaper.startsWith('http') ? (
						<Image
							src={wallpaper}
							alt="Desktop Wallpaper"
							fill
							className="object-cover"
							priority
							unoptimized
						/>
					) : (
						<div className="w-full h-full" style={{ background: wallpaper }}></div>
					)}
				</div>

				{/* Desktop Icons */}
				<DesktopIcons />

				{/* Menu Bar */}
				<MenuBar />

				{/* Windows */}
				{windows.map(window => (
					<Window key={window.id} window={window} />
				))}

				{/* Dock */}
				<Dock />

				{/* Context Menu */}
				{contextMenu && (
					<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu} />
				)}

				<style jsx>{`
					.desktop {
						font-family:
							'SF Pro Display',
							-apple-system,
							BlinkMacSystemFont;
						font-weight: 600;
					}

					.wallpaper {
						will-change: transform;
					}
				`}</style>
			</div>
		</ErrorBoundary>
	);
}

export default Desktop;
