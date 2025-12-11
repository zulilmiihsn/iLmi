'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { TIMING } from '../../constants';

interface CalendarEvent {
	date: string; // YYYY-MM-DD
	title: string;
	color?: string;
}

// Optimization: Helper functions outside component
const getDaysInMonth = (year: number, month: number) => {
	return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
	return new Date(year, month, 1).getDay();
};

const getWeekNumber = (d: Date) => {
	const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return weekNo;
};

const isSameDay = (d1: Date, d2: Date) => {
	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	);
};

const formatDateStr = (date: Date) => {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Optimization: Memoized Day Component
const Day = memo(
	({
		date,
		isToday,
		isSelected,
		hasEvent,
		onClick,
		setTodayRef,
		darkMode,
	}: {
		date: Date | null;
		isToday: boolean;
		isSelected: boolean;
		hasEvent: boolean;
		onClick: (date: Date) => void;
		setTodayRef?: (el: HTMLDivElement | null) => void;
		darkMode: boolean;
	}) => {
		if (!date) return <div className="flex-1"></div>;

		return (
			<div
				ref={isToday && setTodayRef ? setTodayRef : null}
				className={`flex flex-col items-center justify-center relative cursor-pointer transition-colors ${darkMode ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}
				onClick={() => onClick(date)}
				role="gridcell"
				tabIndex={0}
				aria-label={`${date.toLocaleDateString(undefined, { dateStyle: 'full' })}${hasEvent ? ', has events' : ''}`}
				aria-selected={isSelected}
			>
				<div
					className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-normal transition-all
                ${isToday
							? 'bg-red-500 text-white font-semibold shadow-sm'
							: isSelected
								? darkMode
									? 'bg-white text-black'
									: 'bg-black text-white'
								: darkMode
									? 'text-white'
									: 'text-black'
						}`}
				>
					{date.getDate()}
				</div>
				{hasEvent && (
					<div
						className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday || isSelected ? (darkMode ? 'bg-black/50' : 'bg-white/50') : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
					></div>
				)}
			</div>
		);
	},
	(prev, next) => {
		return (
			prev.isToday === next.isToday &&
			prev.isSelected === next.isSelected &&
			prev.hasEvent === next.hasEvent &&
			prev.date === next.date &&
			prev.darkMode === next.darkMode
		);
	}
);

Day.displayName = 'Day';

// Optimization: Memoized Month Component
const Month = memo(
	({
		year,
		month,
		name,
		selectedDate,
		events,
		onDateClick,
		setTodayRef,
		darkMode,
	}: {
		year: number;
		month: number;
		name: string;
		selectedDate: Date;
		events: CalendarEvent[];
		onDateClick: (date: Date) => void;
		setTodayRef: (el: HTMLDivElement | null) => void;
		darkMode: boolean;
	}) => {
		// Memoize weeks calculation
		const weeks = useMemo(() => {
			const daysInMonth = getDaysInMonth(year, month);
			const firstDay = getFirstDayOfMonth(year, month);

			const weeksArr = [];
			let currentWeek = [];

			// Add initial padding
			for (let i = 0; i < firstDay; i++) {
				currentWeek.push(null);
			}

			for (let i = 1; i <= daysInMonth; i++) {
				const date = new Date(year, month, i);
				currentWeek.push(date);

				if (currentWeek.length === 7) {
					weeksArr.push(currentWeek);
					currentWeek = [];
				}
			}

			// Fill remaining cells
			if (currentWeek.length > 0) {
				while (currentWeek.length < 7) {
					currentWeek.push(null);
				}
				weeksArr.push(currentWeek);
			}
			return weeksArr;
		}, [year, month]);

		const today = useMemo(() => new Date(), []); // Stable today reference for this render cycle (practically)

		const theme = {
			headerBg: darkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-transparent',
			weekBorder: darkMode ? 'border-gray-900' : 'border-gray-100',
			weekNumBg: darkMode ? 'bg-gray-900/30 border-gray-900' : 'bg-gray-50/30 border-gray-50',
		};

		return (
			<div className="mb-4">
				<div
					className={`px-4 py-2 font-bold text-lg text-red-500 pl-14 sticky top-0 backdrop-blur-sm z-10 will-change-transform border-b transition-colors ${theme.headerBg}`}
				>
					{name} {year !== new Date().getFullYear() ? year : ''}
				</div>
				<div className="flex flex-col">
					{weeks.map((week, wIndex) => {
						const firstDateInWeek = week.find(d => d !== null);
						const weekNum = firstDateInWeek ? getWeekNumber(firstDateInWeek) : '';

						return (
							<div
								key={wIndex}
								className={`flex items-stretch h-12 border-b last:border-0 transition-colors ${theme.weekBorder}`}
							>
								{/* Week Number */}
								<div
									className={`w-10 flex items-center justify-center text-[10px] text-gray-400 font-medium border-r transition-colors ${theme.weekNumBg}`}
								>
									{weekNum}
								</div>

								{/* Days */}
								<div className="flex-1 grid grid-cols-7">
									{week.map((date, dIndex) => {
										if (!date)
											return (
												<Day
													key={dIndex}
													date={null}
													isToday={false}
													isSelected={false}
													hasEvent={false}
													onClick={() => { }}
													darkMode={darkMode}
												/>
											);

										const dateStr = formatDateStr(date);
										const isTodayVal = isSameDay(date, today);
										const isSelectedVal = isSameDay(date, selectedDate);
										const hasEventVal = events.some(e => e.date === dateStr);

										return (
											<Day
												key={dIndex}
												date={date}
												isToday={isTodayVal}
												isSelected={isSelectedVal}
												hasEvent={hasEventVal}
												onClick={onDateClick}
												setTodayRef={isTodayVal ? setTodayRef : undefined}
												darkMode={darkMode}
											/>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	},
	(prev, next) => {
		// Custom comparison for Month props to avoid unnecessary re-renders
		// Only re-render if events changed or checks against selectedDate change
		// This is tricky because selectedDate changes often.
		// However, if we pass selectedDate, we MUST re-render.
		// But we can rely on Day memoization to be fast.
		return (
			prev.year === next.year &&
			prev.month === next.month &&
			isSameDay(prev.selectedDate, next.selectedDate) &&
			prev.events === next.events &&
			prev.darkMode === next.darkMode
		);
	}
);

Month.displayName = 'Month';

export default function Calendar() {
	const { darkMode } = useSettingsStore();
	const [_currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const scrollRef = useRef<HTMLDivElement>(null);
	const todayRef = useRef<HTMLDivElement | null>(null);

	// Generate months
	const [months, setMonths] = useState<{ year: number; month: number; name: string }[]>([]);

	useEffect(() => {
		const now = new Date();
		const generatedMonths = [];
		// Optimizing range
		for (let i = -6; i <= 12; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
			generatedMonths.push({
				year: d.getFullYear(),
				month: d.getMonth(),
				name: d.toLocaleString('default', { month: 'short' }),
			});
		}
		setMonths(generatedMonths);
	}, []);

	// Auto-scroll to today on mount
	useLayoutEffect(() => {
		// Debounce scroll to ensure layout is ready
		const timer = setTimeout(() => {
			if (todayRef.current) {
				todayRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
			}
		}, TIMING.SCROLL_TO_TODAY_DELAY);
		return () => clearTimeout(timer);
	}, [months]);

	const scrollToToday = () => {
		const now = new Date();
		setSelectedDate(now);
		if (todayRef.current) {
			todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} else {
			setCurrentDate(now);
		}
	};

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
	};

	const [events] = useState<CalendarEvent[]>([
		{ date: '2025-11-24', title: 'Project Deadline' },
		{ date: '2025-12-25', title: 'Christmas' },
		{ date: '2026-01-01', title: 'New Year' },
	]);

	// Theme Objects
	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-white',
		text: darkMode ? 'text-white' : 'text-black',
		headerBg: darkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-200',
		subheaderBg: darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-gray-50/80 border-gray-200',
		toolbarBg: darkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-200',
		homeIndicator: darkMode ? 'bg-gray-500/80' : 'bg-black/80',
	};

	return (
		<div
			className={`w-full h-full flex flex-col font-sans select-none transition-colors duration-300 ${theme.bg} ${theme.text}`}
		>
			{/* Header */}
			<div
				className={`px-4 pt-6 pb-2 flex justify-between items-center backdrop-blur-xl z-20 border-b sticky top-0 will-change-transform transition-colors ${theme.headerBg}`}
			>
				<button className="flex items-center text-red-500 gap-1 active:opacity-50 transition-opacity">
					<i className="fas fa-chevron-left text-xl"></i>
					<span className="text-lg font-medium">{selectedDate.getFullYear()}</span>
				</button>

				<div className="flex items-center gap-5 text-red-500">
					<button className="active:opacity-50 transition-opacity">
						<i className="fas fa-list text-lg"></i>
					</button>
					<button className="active:opacity-50 transition-opacity">
						<i className="fas fa-search text-lg"></i>
					</button>
					<button className="active:opacity-50 transition-opacity">
						<i className="fas fa-plus text-xl"></i>
					</button>
				</div>
			</div>

			{/* Days Header */}
			<div
				className={`flex border-b backdrop-blur-md text-[10px] font-semibold text-gray-400 py-1.5 sticky top-[64px] z-20 will-change-transform transition-colors ${theme.subheaderBg}`}
			>
				<div className="w-10"></div> {/* Spacer for week numbers */}
				<div className="flex-1 grid grid-cols-7 text-center">
					<div>S</div>
					<div>M</div>
					<div>T</div>
					<div>W</div>
					<div>T</div>
					<div>F</div>
					<div>S</div>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto pb-20" ref={scrollRef}>
				{months.map(m => (
					<Month
						key={`${m.year}-${m.month}`}
						year={m.year}
						month={m.month}
						name={m.name}
						selectedDate={selectedDate}
						events={events}
						onDateClick={handleDateClick}
						setTodayRef={el => {
							todayRef.current = el;
						}}
						darkMode={darkMode}
					/>
				))}
			</div>

			{/* Bottom Toolbar */}
			<div
				className={`border-t backdrop-blur-xl pb-6 pt-2 px-4 flex justify-between items-center text-red-500 z-20 absolute bottom-0 left-0 right-0 transition-colors ${theme.toolbarBg}`}
			>
				<button
					onClick={scrollToToday}
					className="font-medium text-base active:opacity-50 transition-opacity"
				>
					Today
				</button>
				<button className="font-semibold text-base active:opacity-50 transition-opacity">
					Calendars
				</button>
				<button className="font-medium text-base active:opacity-50 transition-opacity">
					Inbox
				</button>

				{/* Home Indicator */}
				<div
					className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 rounded-full z-40 pointer-events-none transition-colors ${theme.homeIndicator}`}
				></div>
			</div>
		</div>
	);
}
