'use client';

import { useState, useEffect, memo } from 'react';

function DesktopClock() {
	const [currentTime, setCurrentTime] = useState('');
	const [currentDate, setCurrentDate] = useState('');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		// Initial set
		const now = new Date();
		setCurrentTime(
			now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
		);
		setCurrentDate(
			now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
		);

		const interval = setInterval(() => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
			);
			setCurrentDate(
				now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
			);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	if (!mounted) return null; // Prevent hydration mismatch

	return (
		<span className="text-xs font-medium text-gray-900 ml-1">
			{currentDate} {currentTime}
		</span>
	);
}

export default memo(DesktopClock);
