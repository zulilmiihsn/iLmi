'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSettingsStore } from '../../stores/settings';

export default function Maps() {
	const { darkMode } = useSettingsStore();
	const [searchFocused, setSearchFocused] = useState(false);
	const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

	return (
		<div
			className={`w-full h-full relative overflow-hidden font-sans select-none will-change-transform transform-gpu backface-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}
		>
			{/* Map Background */}
			<div className="absolute inset-0 z-0">
				{/* Using the generated 3D map background */}
				<Image
					src="/media/apple_maps_dark_3d_background.png"
					alt="Map Background"
					fill
					className="object-cover scale-110 transform-gpu"
					priority
					quality={75}
					draggable={false}
				/>

				{/* Light Mode Overlay for contrast */}
				{!darkMode && (
					<div className="absolute inset-0 bg-white/40 z-0 backdrop-grayscale-[0.5] pointer-events-none"></div>
				)}

				{/* Overlay Gradient for better text readability if needed */}
				<div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
			</div>

			{/* Floating Action Buttons (Top Right) */}
			<div className="absolute top-14 right-4 z-10 flex flex-col gap-3">
				{/* Map Settings / Info */}
				<button
					className={`w-11 h-11 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border ${darkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-blue-500"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 16v-4" />
						<path d="M12 8h.01" />
					</svg>
				</button>

				{/* 3D/2D Toggle */}
				<button
					onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
					className={`w-11 h-11 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform border ${darkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}
				>
					<span
						className={`font-bold text-sm tracking-tighter ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
					>
						{viewMode}
					</span>
				</button>

				{/* Compass */}
				<button
					className={`w-11 h-11 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border ${darkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={darkMode ? 'text-white' : 'text-gray-800'}
					>
						<circle cx="12" cy="12" r="10" />
						<polygon
							points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
							fill="currentColor"
							className={darkMode ? 'text-white' : 'text-gray-800'}
							stroke="none"
						/>
					</svg>
				</button>
			</div>

			{/* Location Items on Map (Simulated) */}
			<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
				{/* Only show these if we want to simulate markers */}
			</div>

			{/* Bottom Sheet / Search Interface */}
			<div
				className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out ${searchFocused ? 'h-[85%]' : 'h-auto'}`}
			>
				{/* Location Button (Bottom Right, above sheet) */}
				<div
					className={`absolute -top-16 right-4 transition-opacity duration-200 ${searchFocused ? 'opacity-0' : 'opacity-100'}`}
				>
					<button
						className={`w-11 h-11 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border ${darkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-blue-500"
						>
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
					</button>
				</div>

				{/* Current Location Info (Simulating the 'Houston' tag and temp) */}
				<div
					className={`absolute -top-20 left-4 flex flex-col items-start transition-opacity duration-200 ${searchFocused ? 'opacity-0' : 'opacity-100'}`}
				>
					<div
						className={`backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 mb-1 border shadow-sm ${darkMode ? 'bg-gray-800/60 border-white/5' : 'bg-white/60 border-gray-200/50'}`}
					>
						<span
							className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
						>
							68°
						</span>
						<span className="w-1 h-1 rounded-full bg-green-500"></span>
						<span className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							AQI 22
						</span>
					</div>
				</div>

				{/* Main Bottom Sheet */}
				<div
					className={`backdrop-blur-xl w-full rounded-t-[20px] pb-8 pt-5 px-4 shadow-2xl border-t min-h-[300px] transition-colors duration-300 ${darkMode ? 'bg-gray-900/90 border-white/10' : 'bg-white/90 border-gray-200/50'}`}
				>
					{/* Drag Handle */}
					<div className="w-10 h-1 bg-gray-500/50 rounded-full mx-auto mb-1 absolute top-2 left-1/2 -translate-x-1/2"></div>

					{/* Search Bar */}
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg
								className="h-4 w-4 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<input
							type="text"
							className={`block w-full pl-10 pr-10 py-3 border-none rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors sm:text-sm shadow-inner ${darkMode ? 'bg-[#2c2c2e] text-gray-100 focus:bg-[#3a3a3c]' : 'bg-gray-100 text-gray-900 focus:bg-gray-200'}`}
							placeholder="Search Maps"
							onFocus={() => setSearchFocused(true)}
							onBlur={() => setSearchFocused(false)}
						/>
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
							<button
								className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'}`}
							>
								<svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
									<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
								</svg>
							</button>
							<div className={`w-px h-4 mx-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
							{/* User Avatar Tiny */}
							<div className="w-6 h-6 rounded-full bg-linear-to-tr from-blue-400 to-blue-600 border border-white/20 flex items-center justify-center overflow-hidden relative">
								<Image src="/media/user-avatar.svg" alt="User" fill className="object-cover" />
							</div>
						</div>
					</div>

					{/* Suggestions / Recent (Only visible when expanded or just hints) */}
					<div className="mt-6 space-y-4">
						<div className="flex items-center justify-between">
							<h3
								className={`text-md font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
							>
								Latest in the area...
							</h3>
						</div>

						{/* Example Places List */}
						<div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
							{/* Card 1 */}
							<div
								className={`shrink-0 w-64 h-40 rounded-xl overflow-hidden shadow-lg border relative ${darkMode ? 'bg-[#2c2c2e] border-white/5' : 'bg-white border-gray-200'}`}
							>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent z-10"></div>
								{/* Placeholder image for place */}
								<div className="w-full h-full bg-gray-700" />
								<div className="absolute bottom-3 left-3 z-20">
									<div className="text-white font-semibold">Minute Maid Park</div>
									<div className="text-xs text-gray-300">Sports Complex · 0.1 mi</div>
								</div>
								<div className="absolute top-3 right-3 z-20 rounded-full bg-black/50 p-1">
									<div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold">
										4.7
									</div>
								</div>
							</div>

							{/* Card 2 */}
							<div
								className={`shrink-0 w-64 h-40 rounded-xl overflow-hidden shadow-lg border relative ${darkMode ? 'bg-[#2c2c2e] border-white/5' : 'bg-white border-gray-200'}`}
							>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent z-10"></div>
								<div className="w-full h-full bg-gray-700" />
								<div className="absolute bottom-3 left-3 z-20">
									<div className="text-white font-semibold">Home Ballpark</div>
									<div className="text-xs text-gray-300">Stadium · 0.2 mi</div>
								</div>
							</div>
						</div>

						{/* Favorites Row */}
						<div className="pt-2">
							<h3
								className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
							>
								Favorites
							</h3>
							<div className="flex gap-6">
								<div className="flex flex-col items-center gap-1">
									<div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
										<svg
											className="w-6 h-6 text-blue-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
											/>
										</svg>
									</div>
									<span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										Home
									</span>
								</div>
								<div className="flex flex-col items-center gap-1">
									<div className="w-14 h-14 rounded-full bg-gray-700/50 flex items-center justify-center border border-white/10">
										<svg
											className="w-6 h-6 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										Work
									</span>
								</div>
								<div className="flex flex-col items-center gap-1">
									<div className="w-14 h-14 rounded-full bg-gray-700/50 flex items-center justify-center border border-white/10">
										<svg
											className="w-6 h-6 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 6v6m0 0v6m0-6h6m-6 0H6"
											/>
										</svg>
									</div>
									<span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										Add
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
