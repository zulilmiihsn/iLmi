'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSettingsStore } from '../../stores/settings';

type Tab = 'library' | 'foryou' | 'albums' | 'search';
type ViewMode = 'years' | 'months' | 'days' | 'all';

interface LocalPhoto {
	id: string;
	url: string;
	date: string;
	type: 'photo' | 'video';
}

export default function Photos() {
	const { darkMode } = useSettingsStore();

	const [activeTab, setActiveTab] = useState<Tab>('albums'); // Default to Albums as per reference image 1
	const [viewMode, setViewMode] = useState<ViewMode>('all');
	const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [localPhotos, setLocalPhotos] = useState<string[]>([]);

	// Mock Data
	const mockPhotos = [
		'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
		'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=400&fit=crop',
	];

	// Combine local and mock photos
	const allPhotos = [...localPhotos, ...mockPhotos];

	const albums = [
		{ title: 'Recents', count: allPhotos.length + 461, image: allPhotos[0] || mockPhotos[0] },
		{ title: 'Great Shots', count: 36, image: mockPhotos[1] },
		{ title: 'Favorites', count: 72, image: mockPhotos[2] },
		{ title: 'HDR Video', count: 23, image: mockPhotos[3] },
		{ title: 'Instagram', count: 105, image: mockPhotos[4] },
		{ title: 'WhatsApp', count: 890, image: mockPhotos[5] },
	];

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			setSelectedImage(null);
		}
	}, []);

	useEffect(() => {
		// Load photos from localStorage
		const loadLocalPhotos = () => {
			try {
				const stored = localStorage.getItem('camera_photos');
				if (stored) {
					const parsed: LocalPhoto[] = JSON.parse(stored);
					setLocalPhotos(parsed.map(p => p.url));
				}
			} catch (e) {
				console.error('Failed to load photos', e);
			}
		};

		loadLocalPhotos();

		// Listen for storage events (in case camera adds a photo while photos app is open)
		window.addEventListener('storage', loadLocalPhotos);

		if (selectedImage && typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			window.removeEventListener('storage', loadLocalPhotos);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [selectedImage, handleKeyDown]);

	const getAlbumPhotos = (albumTitle: string) => {
		if (albumTitle === 'Recents') return allPhotos;
		// For other albums, just return a subset or specific mock photos for demonstration
		if (albumTitle === 'Favorites') return mockPhotos.slice(0, 5);
		if (albumTitle === 'Great Shots') return mockPhotos.slice(5, 10);
		return mockPhotos.slice(0, 3); // Default for others
	};

	// Theme Objects
	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-white',
		text: darkMode ? 'text-white' : 'text-black',
		textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
		headerBg: darkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-200/50',
		tabBarBg: darkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-200/80',
		activeTab: 'text-blue-500',
		inactiveTab: darkMode
			? 'text-gray-400 hover:text-gray-200'
			: 'text-gray-400 hover:text-gray-600',
		gridBg: darkMode ? 'bg-black' : 'bg-white',
		albumBg: darkMode
			? 'bg-gray-900 group-hover:shadow-gray-800/50'
			: 'bg-gray-100 group-hover:shadow-md',
		mediaTypeBg: darkMode ? 'bg-[#1C1C1E]' : 'bg-gray-50',
		mediaTypeBorder: darkMode ? 'divide-gray-800' : 'divide-gray-200',
		mediaTypeHover: darkMode ? 'active:bg-[#2C2C2E]' : 'active:bg-gray-200',
	};

	// Desktop Sidebar Component
	const Sidebar = () => (
		<div
			className={`hidden md:flex flex-col w-[260px] h-full border-r ${darkMode ? 'bg-[#1E1E1E] border-black' : 'bg-[#F2F3F5] border-[#E5E5E5]'}`}
		>
			<div className="p-4 pt-6">
				<h2 className={`text-xs font-semibold px-2 mb-2 ${theme.textSecondary}`}>LIBRARY</h2>
				<ul className="space-y-1">
					<li>
						<button
							onClick={() => setActiveTab('library')}
							className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
								activeTab === 'library'
									? darkMode
										? 'bg-gray-700 text-white'
										: 'bg-gray-300 text-black'
									: 'hover:bg-black/5 dark:hover:bg-white/10'
							}`}
						>
							<i className="fas fa-images w-4 text-center"></i>
							Library
						</button>
					</li>
					<li>
						<button
							onClick={() => setActiveTab('foryou')}
							className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
								activeTab === 'foryou'
									? darkMode
										? 'bg-gray-700 text-white'
										: 'bg-gray-300 text-black'
									: 'hover:bg-black/5 dark:hover:bg-white/10'
							}`}
						>
							<i className="fas fa-heart w-4 text-center"></i>
							For You
						</button>
					</li>
					<li>
						<button
							onClick={() => setActiveTab('albums')}
							className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
								activeTab === 'albums'
									? darkMode
										? 'bg-gray-700 text-white'
										: 'bg-gray-300 text-black'
									: 'hover:bg-black/5 dark:hover:bg-white/10'
							}`}
						>
							<i className="fas fa-layer-group w-4 text-center"></i>
							Albums
						</button>
					</li>
					<li>
						<button
							onClick={() => setActiveTab('search')}
							className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
								activeTab === 'search'
									? darkMode
										? 'bg-gray-700 text-white'
										: 'bg-gray-300 text-black'
									: 'hover:bg-black/5 dark:hover:bg-white/10'
							}`}
						>
							<i className="fas fa-search w-4 text-center"></i>
							Search
						</button>
					</li>
				</ul>
			</div>

			<div className="p-4 pt-2 flex-1 overflow-y-auto">
				<h2 className={`text-xs font-semibold px-2 mb-2 ${theme.textSecondary}`}>ALBUMS</h2>
				<ul className="space-y-1">
					{albums.map((album, i) => (
						<li key={i}>
							<button
								onClick={() => {
									setActiveTab('albums');
									setSelectedAlbum(album.title);
								}}
								className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
									selectedAlbum === album.title
										? darkMode
											? 'bg-gray-700 text-white'
											: 'bg-gray-300 text-black'
										: 'hover:bg-black/5 dark:hover:bg-white/10'
								}`}
							>
								<div className="w-4 h-4 rounded overflow-hidden relative grayscale opacity-70">
									<Image src={album.image} alt="" fill className="object-cover" />
								</div>
								<span className="truncate flex-1">{album.title}</span>
								<span className={`text-xs ${theme.textSecondary}`}>{album.count}</span>
							</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	);

	return (
		<div
			className={`photos w-full h-full flex relative overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}
		>
			<Sidebar />

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden relative">
				{/* Desktop Toolbar */}
				<div
					className={`hidden md:flex h-12 items-center justify-between px-4 border-b ${darkMode ? 'border-black bg-[#1E1E1E]' : 'border-[#E5E5E5] bg-white'}`}
				>
					<div className="flex gap-2">
						<button
							className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
						>
							<i className="fas fa-chevron-left"></i>
						</button>
						<button
							className={`p-1.5 rounded-md opacity-50 cursor-not-allowed ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
						>
							<i className="fas fa-chevron-right"></i>
						</button>
					</div>
					<h1 className="font-semibold text-sm">
						{selectedAlbum ||
							(activeTab === 'library'
								? 'Library'
								: activeTab === 'foryou'
									? 'For You'
									: activeTab === 'albums'
										? 'Albums'
										: 'Search')}
					</h1>
					<div className="flex gap-2">
						<button
							className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
						>
							<i className="fas fa-search"></i>
						</button>
						<button
							className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
						>
							<i className="fas fa-plus"></i>
						</button>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto pb-24 md:pb-0 md:p-4">
					{/* LIBRARY TAB */}
					{activeTab === 'library' && (
						<div key="library" className="flex flex-col min-h-full animate-in fade-in duration-300">
							{/* Header - Mobile Only */}
							<div
								className={`md:hidden px-4 pt-6 pb-2 flex justify-between items-end sticky top-0 backdrop-blur-xl z-20 border-b shadow-sm transition-all duration-300 ${theme.headerBg}`}
							>
								<div>
									<h1 className="text-3xl font-bold tracking-tight">Library</h1>
								</div>
								<div className="flex gap-4">
									<button className="text-blue-500 font-medium text-base hover:opacity-70 transition-opacity">
										Select
									</button>
									<button className="text-blue-500 hover:opacity-70 transition-opacity">
										<i className="fas fa-ellipsis-circle text-xl"></i>
									</button>
								</div>
							</div>

							{/* Photo Grid */}
							<div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-0.5 md:gap-4 mt-2 md:mt-0 pb-32 md:pb-0">
								{allPhotos.map((img, i) => (
									<div
										key={i}
										className="aspect-square relative cursor-pointer overflow-hidden group md:rounded-md"
										onClick={() => setSelectedImage(img)}
									>
										<Image
											src={img}
											alt={`Photo ${i}`}
											fill
											className="object-cover transition-transform duration-500 group-hover:scale-110"
											unoptimized
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
									</div>
								))}
								{/* Fill with more mock data if needed to look full */}
								{allPhotos.length < 12 &&
									mockPhotos.map((img, i) => (
										<div
											key={`mock-${i}`}
											className="aspect-square relative cursor-pointer overflow-hidden group md:rounded-md"
											onClick={() => setSelectedImage(img)}
										>
											<Image
												src={img}
												alt={`Mock Photo ${i}`}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-110"
												unoptimized
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
										</div>
									))}
							</div>

							{/* Floating View Selector */}
							<div className="fixed bottom-24 md:bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-700 delay-200">
								<div
									className={`${darkMode ? 'bg-[#1C1C1E]/80 border-gray-700' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl rounded-full p-1 shadow-lg flex gap-1 pointer-events-auto border hover:scale-105 transition-transform duration-300`}
								>
									{['Years', 'Months', 'Days', 'All Photos'].map(m => (
										<button
											key={m}
											onClick={() => setViewMode(m.toLowerCase().split(' ')[0] as ViewMode)}
											className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
												(viewMode === 'all' && m === 'All Photos') || viewMode === m.toLowerCase()
													? darkMode
														? 'bg-gray-600 text-white shadow-sm'
														: 'bg-gray-200 text-black shadow-sm'
													: darkMode
														? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
														: 'text-gray-500 hover:text-black hover:bg-gray-100/50'
											}`}
										>
											{m}
										</button>
									))}
								</div>
							</div>
						</div>
					)}

					{/* ALBUMS TAB */}
					{activeTab === 'albums' && !selectedAlbum && (
						<div key="albums-list" className="flex flex-col animate-in fade-in duration-300">
							{/* Header - Mobile Only */}
							<div
								className={`md:hidden px-4 pt-6 pb-2 flex justify-between items-center sticky top-0 backdrop-blur-xl z-20 border-b shadow-sm transition-all ${theme.headerBg}`}
							>
								<button className="text-blue-500 text-2xl hover:opacity-70 transition-opacity">
									<i className="fas fa-plus"></i>
								</button>
								<h1 className="text-3xl font-bold absolute left-1/2 -translate-x-1/2 tracking-tight">
									Albums
								</h1>
								<button className="text-blue-500 text-base font-medium hover:opacity-70 transition-opacity">
									Edit
								</button>
							</div>

							{/* My Albums */}
							<div className="mt-4 px-4 md:px-0">
								<div className="flex justify-between items-baseline mb-3">
									<h2 className="text-xl font-bold">My Albums</h2>
									<button className="text-blue-500 text-sm hover:opacity-70 transition-opacity">
										See All
									</button>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
									{albums.map((album, i) => (
										<button
											key={i}
											className="flex flex-col gap-1 text-left group active:scale-95 transition-transform duration-200"
											onClick={() => setSelectedAlbum(album.title)}
										>
											<div
												className={`aspect-square rounded-xl overflow-hidden relative w-full shadow-sm transition-shadow ${theme.albumBg}`}
											>
												<Image
													src={album.image}
													alt={album.title}
													fill
													className="object-cover transition-transform duration-500 group-hover:scale-105"
													unoptimized
												/>
												{/* Heart icon overlay for Favorites */}
												{album.title === 'Favorites' && (
													<div className="absolute bottom-2 left-2 text-white drop-shadow-md animate-pulse">
														<i className="fas fa-heart"></i>
													</div>
												)}
											</div>
											<span
												className={`text-sm font-medium leading-tight mt-1 group-hover:text-blue-600 transition-colors ${theme.text}`}
											>
												{album.title}
											</span>
											<span className={`text-xs ${theme.textSecondary}`}>{album.count}</span>
										</button>
									))}
								</div>
							</div>

							{/* People & Places */}
							<div className="mt-8 px-4 md:px-0">
								<h2 className="text-xl font-bold mb-3">People & Places</h2>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div
										className={`aspect-square rounded-xl overflow-hidden relative ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
									>
										<div className="grid grid-cols-2 grid-rows-2 w-full h-full">
											<div className="relative">
												<Image
													src={mockPhotos[6]}
													alt="Person 1"
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
											<div className="relative">
												<Image
													src={mockPhotos[7]}
													alt="Person 2"
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
											<div className="relative">
												<Image
													src={mockPhotos[8]}
													alt="Person 3"
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
											<div className="relative">
												<Image
													src={mockPhotos[9]}
													alt="Person 4"
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
										</div>
										<span className="absolute bottom-2 left-2 text-white font-medium drop-shadow-md">
											People
										</span>
									</div>
									<div
										className={`aspect-square rounded-xl overflow-hidden relative ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
									>
										<Image
											src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop"
											alt="Map"
											fill
											className="object-cover"
											unoptimized
										/>
										<span className="absolute bottom-2 left-2 text-white font-medium drop-shadow-md">
											Places
										</span>
									</div>
								</div>
							</div>

							{/* Media Types */}
							<div className="mt-8 mb-8 px-4 md:px-0">
								<h2 className="text-xl font-bold mb-3">Media Types</h2>
								<div
									className={`${theme.mediaTypeBg} rounded-xl overflow-hidden divide-y ${theme.mediaTypeBorder} transition-colors max-w-lg`}
								>
									{[
										{ icon: 'video', label: 'Videos', count: 45 },
										{ icon: 'user', label: 'Selfies', count: 12 },
										{ icon: 'photo-video', label: 'Live Photos', count: 180 },
										{ icon: 'cube', label: 'Portrait', count: 34 },
									].map((item, i) => (
										<div
											key={i}
											className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${theme.mediaTypeHover}`}
										>
											<div className="flex items-center gap-3">
												<i className={`fas fa-${item.icon} text-blue-500 w-6 text-center`}></i>
												<span className="text-base text-blue-500">{item.label}</span>
											</div>
											<div className={`flex items-center gap-2 ${theme.textSecondary}`}>
												<span className="text-sm">{item.count}</span>
												<i className="fas fa-chevron-right text-xs"></i>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* ALBUM DETAIL VIEW */}
					{activeTab === 'albums' && selectedAlbum && (
						<div
							key={selectedAlbum}
							className={`flex flex-col min-h-full animate-in slide-in-from-right duration-500 ease-out z-40 ${theme.bg}`}
						>
							{/* Header - Mobile Only */}
							<div
								className={`md:hidden px-4 pt-6 pb-2 flex justify-between items-center sticky top-0 backdrop-blur-xl z-20 border-b shadow-sm ${theme.headerBg}`}
							>
								<button
									onClick={() => setSelectedAlbum(null)}
									className="text-blue-500 flex items-center gap-1 text-lg hover:opacity-70 transition-opacity"
								>
									<i className="fas fa-chevron-left text-xl"></i> Albums
								</button>
								<h1 className="text-lg font-semibold tracking-tight">{selectedAlbum}</h1>
								<button className="text-blue-500 text-lg hover:opacity-70 transition-opacity">
									Select
								</button>
							</div>

							{/* Photo Grid */}
							<div className="grid grid-cols-3 md:grid-cols-5 gap-0.5 md:gap-4 mt-2 md:mt-0 pb-32">
								{getAlbumPhotos(selectedAlbum).map((img, i) => (
									<div
										key={i}
										className="aspect-square relative cursor-pointer overflow-hidden group md:rounded-md"
										onClick={() => setSelectedImage(img)}
									>
										<Image
											src={img}
											alt={`Photo ${i}`}
											fill
											className="object-cover transition-transform duration-500 group-hover:scale-110"
											unoptimized
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
									</div>
								))}
								{/* Empty state if no photos */}
								{getAlbumPhotos(selectedAlbum).length === 0 && (
									<div
										className={`col-span-3 py-20 text-center ${theme.textSecondary} animate-in fade-in zoom-in-95 duration-500`}
									>
										<p>No photos in this album</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* FOR YOU & SEARCH (Placeholders) */}
					{(activeTab === 'foryou' || activeTab === 'search') && (
						<div className="flex items-center justify-center h-full">
							<div className={`text-center ${theme.textSecondary}`}>
								<i
									className={`fas fa-${activeTab === 'foryou' ? 'heart' : 'search'} text-4xl mb-2`}
								></i>
								<p className="capitalize">{activeTab} feature coming soon</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bottom Navigation Bar - Mobile Only */}
			<div
				className={`md:hidden absolute bottom-0 left-0 right-0 backdrop-blur-2xl border-t pb-6 pt-[14px] z-30 transition-colors ${theme.tabBarBg}`}
			>
				<div className="flex justify-around items-center w-full">
					<button
						onClick={() => setActiveTab('library')}
						className={`flex flex-col items-center gap-1 w-16 transition-colors duration-200 ${activeTab === 'library' ? theme.activeTab : theme.inactiveTab}`}
					>
						<i
							className={`text-2xl mb-0.5 ${activeTab === 'library' ? 'fas fa-images' : 'far fa-images'}`}
						></i>
						<span
							className={`text-[10px] ${activeTab === 'library' ? 'font-semibold' : 'font-medium'}`}
						>
							Library
						</span>
					</button>
					<button
						onClick={() => setActiveTab('foryou')}
						className={`flex flex-col items-center gap-1 w-16 transition-colors duration-200 ${activeTab === 'foryou' ? theme.activeTab : theme.inactiveTab}`}
					>
						<i
							className={`text-2xl mb-0.5 ${activeTab === 'foryou' ? 'fas fa-heart' : 'far fa-heart'}`}
						></i>
						<span
							className={`text-[10px] ${activeTab === 'foryou' ? 'font-semibold' : 'font-medium'}`}
						>
							For You
						</span>
					</button>
					<button
						onClick={() => setActiveTab('albums')}
						className={`flex flex-col items-center gap-1 w-16 transition-colors duration-200 ${activeTab === 'albums' ? theme.activeTab : theme.inactiveTab}`}
					>
						<i
							className={`text-2xl mb-0.5 ${activeTab === 'albums' ? 'fas fa-layer-group' : 'fas fa-layer-group'}`}
						></i>
						<span
							className={`text-[10px] ${activeTab === 'albums' ? 'font-semibold' : 'font-medium'}`}
						>
							Albums
						</span>
					</button>
					<button
						onClick={() => setActiveTab('search')}
						className={`flex flex-col items-center gap-1 w-16 transition-colors duration-200 ${activeTab === 'search' ? theme.activeTab : theme.inactiveTab}`}
					>
						<i
							className={`text-2xl mb-0.5 ${activeTab === 'search' ? 'fas fa-search' : 'fas fa-search'}`}
						></i>
						<span
							className={`text-[10px] ${activeTab === 'search' ? 'font-semibold' : 'font-medium'}`}
						>
							Search
						</span>
					</button>
				</div>
				{/* Home Indicator */}
				<div
					className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 rounded-full z-40 pointer-events-none ${darkMode ? 'bg-white/80' : 'bg-black/80'}`}
				></div>
			</div>

			{/* Fullscreen Image Viewer */}
			{selectedImage && (
				<div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-in fade-in duration-200">
					<button
						className="absolute top-12 left-4 text-white z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
						onClick={() => setSelectedImage(null)}
					>
						<i className="fas fa-chevron-left"></i>
					</button>
					<div className="relative w-full h-full">
						<Image
							src={selectedImage}
							alt="Selected photo"
							fill
							className="object-contain"
							unoptimized
						/>
					</div>
				</div>
			)}
		</div>
	);
}
