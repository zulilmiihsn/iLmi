'use client';

import { useEffect, useState, useMemo } from 'react';
import { detectDevice } from '../utils/deviceDetection';
import { debounce } from '../utils/debounce';
import { RESIZE } from '../constants';
import type { DeviceInfo } from '../types';
import Desktop from '../components/Desktop/Desktop';
import HomeScreen from '../components/Mobile/HomeScreen';
import BootScreen from '../components/BootScreen';

export default function Home() {
	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

	// Debounced resize handler untuk prevent excessive re-renders
	const debouncedHandleResize = useMemo(
		() => debounce(() => setDeviceInfo(detectDevice()), RESIZE.DEBOUNCE_DELAY),
		[]
	);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setDeviceInfo(detectDevice());

			window.addEventListener('resize', debouncedHandleResize);
			window.addEventListener('orientationchange', debouncedHandleResize);

			return () => {
				window.removeEventListener('resize', debouncedHandleResize);
				window.removeEventListener('orientationchange', debouncedHandleResize);
			};
		}
	}, [debouncedHandleResize]);

	if (!deviceInfo) {
		return <BootScreen />;
	}

	return deviceInfo.platform === 'macos' ? <Desktop /> : <HomeScreen />;
}

