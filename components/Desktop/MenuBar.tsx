'use client';

import { useState, useEffect, useMemo } from 'react';
import ControlCenter from './ControlCenter';
import { useControlCenterStore } from '../../stores/controlCenter';
import { useWindowsStore } from '../../stores/windows';
import { getBatteryInfo, getNetworkInfo, isWifiConnected } from '../../utils/deviceInfo';
import '../../types/navigator';
import DesktopClock from './DesktopClock';

export default function MenuBar() {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [batteryCharging, setBatteryCharging] = useState(false);
	// const [_networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null); // Removed unused variable
	const [isWifi, setIsWifi] = useState(true);

	const activeApp = useWindowsStore(state => {
		const focusedWindow = state.windows.find(w => w.isFocused && !w.isMinimized);
		return focusedWindow?.title || 'Finder';
	});
	const toggleControlCenter = useControlCenterStore(state => state.toggle);

	// Computed battery color based on level
	const batteryColor = useMemo(() => {
		if (batteryLevel === null) return '#000000'; // Black for desktop
		if (batteryLevel <= 20) return '#ff3b30'; // Red
		if (batteryLevel <= 50) return '#ff9500'; // Orange
		return '#000000'; // Black
	}, [batteryLevel]);

	// Computed battery fill width
	const batteryFillWidth = useMemo(() => {
		if (batteryLevel === null) return 100;
		return Math.max(0, Math.min(100, batteryLevel));
	}, [batteryLevel]);

	useEffect(() => {
		// Get battery info
		async function updateBattery() {
			const battery = await getBatteryInfo();
			if (battery) {
				setBatteryLevel(Math.round(battery.level * 100));
				setBatteryCharging(battery.charging);
			}
		}

		// Get network info
		function updateNetwork() {
			const network = getNetworkInfo();
			// setNetworkInfo(network);
			if (network) {
				setIsWifi(isWifiConnected(network));
			}
		}

		// Initial load
		updateBattery();
		updateNetwork();

		// Listen for battery changes
		if (typeof window !== 'undefined' && navigator.getBattery) {
			navigator
				.getBattery()
				.then(battery => {
					battery.addEventListener('chargingchange', updateBattery);
					battery.addEventListener('levelchange', updateBattery);
				})
				.catch(() => {
					// Battery API not available
				});
		}

		// Listen for network changes
		const connection =
			navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		if (connection) {
			connection.addEventListener('change', updateNetwork);
		}

		// Update network info periodically
		const networkInterval = setInterval(updateNetwork, 5000);

		return () => {
			clearInterval(networkInterval);
		};
	}, []);

	function handleToggleControlCenter(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		toggleControlCenter();
	}

	return (
		<>
			<div className="macos-menubar fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-6 text-xs z-60">
				{/* Left: App Menu */}
				<div className="flex items-center gap-5 text-gray-900">
					{/* Apple Logo */}
					<svg className="w-4 h-4 fill-current text-gray-900" viewBox="0 0 24 24">
						<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
					</svg>
					<span className="font-semibold text-gray-900">{activeApp}</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						File
					</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						Edit
					</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						Image
					</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						View
					</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						Window
					</span>
					<span className="text-gray-900 hover:text-gray-700 transition-colors cursor-default">
						Help
					</span>
				</div>

				{/* Right: System Icons */}
				<div className="flex items-center gap-2.5 text-gray-900">
					<button
						className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70"
						aria-label="Search"
					>
						<i className="fas fa-search text-xs"></i>
					</button>
					<button
						className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70"
						aria-label="Wi-Fi"
					>
						<i className={`fas ${isWifi ? 'fa-wifi' : 'fa-signal'} text-xs`}></i>
					</button>
					{/* Battery */}
					<div className="flex items-center gap-px">
						<div className="relative flex items-center">
							{/* Battery Body */}
							<div className="w-[22px] h-[10px] border border-gray-900/30 rounded-[2.6px] p-px relative">
								{/* Battery Fill */}
								<div
									className={`h-full rounded-[1.5px] transition-all duration-300 ${
										batteryCharging ? 'bg-green-500' : ''
									}`}
									style={{
										width: `${batteryFillWidth}%`,
										backgroundColor: batteryCharging ? '#34c759' : batteryColor,
									}}
								></div>

								{/* Charging Bolt (Optional - overlay) */}
								{batteryCharging && (
									<div className="absolute inset-0 flex items-center justify-center">
										<svg
											className="w-2.5 h-2.5 text-white drop-shadow-sm"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
										</svg>
									</div>
								)}
							</div>
							{/* Battery Terminal (Cap) */}
							<div className="w-[1.5px] h-[4px] bg-gray-900/30 rounded-r-[1px] translate-x-[-0.5px]"></div>
						</div>

						{/* Percentage Text (Optional, often shown in macOS) */}
						{/* <span className="text-[10px] font-medium ml-1">{batteryLevel}%</span> */}
					</div>
					<button
						type="button"
						className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70 relative z-70 cursor-pointer"
						onClick={handleToggleControlCenter}
						aria-label="Control Center"
					>
						<i className="fas fa-sliders-h text-xs pointer-events-none"></i>
					</button>
					{/* Date and Time */}
					<DesktopClock />
				</div>
			</div>

			<ControlCenter />

			<style jsx>{`
				.macos-menubar {
					background: transparent;
					backdrop-filter: none;
					border-bottom: none;
				}
			`}</style>
		</>
	);
}
