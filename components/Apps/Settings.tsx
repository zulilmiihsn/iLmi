'use client';

import React from 'react';
import { useSettingsStore } from '../../stores/settings';

// Theme Configuration
const THEME = {
	light: {
		bg: 'bg-[#F2F2F7]',
		text: 'text-black',
		textSecondary: 'text-[#8E8E93]',
		sectionBg: 'bg-white',
		separator: 'border-[#C6C6C8]',
		iconBg: 'bg-[#E5E5EA]',
		destruct: 'text-[#FF3B30]',
	},
	dark: {
		bg: 'bg-[#000000]',
		text: 'text-white',
		textSecondary: 'text-[#98989D]',
		sectionBg: 'bg-[#1C1C1E]',
		separator: 'border-[#38383A]',
		iconBg: 'bg-[#2C2C2E]',
		destruct: 'text-[#FF453A]',
	},
};

// Reusable Components
const Section = ({
	children,
	title,
	darkMode,
}: {
	children: React.ReactNode;
	title?: string;
	darkMode: boolean;
}) => {
	const theme = darkMode ? THEME.dark : THEME.light;
	return (
		<div className="mb-8 mx-4 sm:mx-6 md:max-w-2xl md:mx-auto">
			{title && (
				<h2
					className={`text-[13px] uppercase mb-2 pl-4 font-normal tracking-wide transition-colors ${theme.textSecondary}`}
				>
					{title}
				</h2>
			)}
			<div className={`${theme.sectionBg} rounded-xl overflow-hidden shadow-sm transition-colors`}>
				{children}
			</div>
		</div>
	);
};

const ListItem = ({
	icon,
	label,
	value,
	hasArrow = true,
	iconColor = 'bg-gray-400',
	iconClass = 'fas fa-cog',
	isLast = false,
	onClick,
	children,
	darkMode,
	showSeparator = true,
}: {
	icon?: React.ReactNode;
	label: string;
	value?: string;
	hasArrow?: boolean;
	iconColor?: string;
	iconClass?: string;
	isLast?: boolean;
	onClick?: () => void;
	children?: React.ReactNode;
	darkMode: boolean;
	showSeparator?: boolean;
}) => {
	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div
			className={`flex items-center group cursor-pointer ${darkMode ? 'active:bg-[#2C2C2E]' : 'active:bg-[#E5E5EA]'} transition-colors`}
			onClick={onClick}
		>
			{/* Icon Column (Fixed Width) */}
			<div className="pl-4 pr-3 py-2.5">
				<div
					className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${iconColor} text-white shadow-sm shrink-0`}
				>
					{icon ? icon : <i className={`${iconClass} text-[14px]`}></i>}
				</div>
			</div>

			{/* Content Column (Grow) */}
			<div
				className={`flex-1 flex items-center justify-between py-2.5 pr-4 border-b ${!isLast && showSeparator ? theme.separator : 'border-transparent'} transition-colors`}
			>
				<span className={`text-[17px] ${theme.text} font-normal truncate pr-2 transition-colors`}>
					{label}
				</span>

				<div className="flex items-center gap-2">
					{children}
					{value && (
						<span className={`${theme.textSecondary} text-[17px] transition-colors`}>{value}</span>
					)}
					{hasArrow && (
						<i
							className={`fas fa-chevron-right ${theme.textSecondary} opacity-60 text-[12px] font-bold transition-colors`}
						></i>
					)}
				</div>
			</div>
		</div>
	);
};

const Toggle = ({
	checked,
	onChange,
	darkMode,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	darkMode: boolean;
}) => (
	<div
		className={`w-[51px] h-[31px] rounded-full p-[2px] cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-[#34C759]' : darkMode ? 'bg-[#39393D]' : 'bg-[#E9E9EA]'}`}
		onClick={e => {
			e.stopPropagation();
			onChange(!checked);
		}}
	>
		<div
			className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 cubic-bezier(.4,0,.2,1) ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
		/>
	</div>
);

const WallpaperOption = ({
	src,
	label,
	active,
	onClick,
	darkMode,
}: {
	src: string;
	label: string;
	active: boolean;
	onClick: () => void;
	darkMode: boolean;
}) => (
	<button
		className={`relative aspect-16/10 rounded-xl overflow-hidden transition-all duration-200 group ${active ? 'ring-2 ring-[#007AFF] ring-offset-2' : 'hover:scale-[1.02]'} ${darkMode ? 'ring-offset-black' : 'ring-offset-[#F2F2F7]'}`}
		onClick={onClick}
	>
		{src.startsWith('/') ? (
			// eslint-disable-next-line @next/next/no-img-element
			<img src={src} alt={label} className="w-full h-full object-cover" />
		) : (
			<div className="w-full h-full" style={{ background: src }}></div>
		)}

		{/* Label Overlay */}
		<div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/60 to-transparent">
			<span className="text-white text-xs font-medium drop-shadow-md px-1">{label}</span>
		</div>

		{active && (
			<div className="absolute top-2 right-2 bg-[#007AFF] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
				<i className="fas fa-check text-[10px]"></i>
			</div>
		)}
	</button>
);

const ProfileHeader = ({ darkMode }: { darkMode: boolean }) => {
	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div className="flex flex-col items-center pt-6 pb-8 transition-colors">
			<div className="relative mb-3 group cursor-pointer">
				<div
					className={`w-20 h-20 rounded-full overflow-hidden transition-all duration-300 ${darkMode ? 'ring-2 ring-[#38383A]' : 'ring-2 ring-white shadow-sm'}`}
				>
					<div
						className={`w-full h-full flex items-center justify-center bg-linear-to-b ${darkMode ? 'from-[#636366] to-[#2C2C2E]' : 'from-[#E5E5EA] to-[#C7C7CC]'}`}
					>
						<i
							className={`fas fa-user text-3xl transition-colors ${darkMode ? 'text-white/80' : 'text-white'}`}
						></i>
					</div>
				</div>
				{/* Edit Badge */}
				<div className="absolute bottom-0 right-0 bg-[#007AFF] w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#F2F2F7] dark:border-black">
					<i className="fas fa-camera text-white text-[10px]"></i>
				</div>
			</div>
			<h1 className={`text-xl font-semibold mb-0.5 transition-colors ${theme.text}`}>User</h1>
			<p className={`text-[14px] transition-colors ${theme.textSecondary}`}>
				Apple ID, iCloud, Media & Purchases
			</p>
		</div>
	);
};

export default function Settings() {
	const { darkMode, toggleDarkMode, wallpaper, setWallpaper } = useSettingsStore();

	const wallpapers = [
		{ src: '/media/Wallpaper-desktop-1.jpg', label: 'Big Sur' },
		{ src: '/media/Wallpaper-1.png', label: 'Dark Stream' },
		{ src: 'linear-gradient(to right, #ff7e5f, #feb47b)', label: 'Sunset' },
		{ src: 'linear-gradient(to right, #4facfe, #00f2fe)', label: 'Ocean' },
		{ src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Plum' },
		{ src: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', label: 'Aurora' },
	];

	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div
			className={`w-full h-full flex flex-col font-sans overflow-hidden transition-colors duration-300 ${theme.bg}`}
		>
			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto pb-10 macos-scrollbar">
				<ProfileHeader darkMode={darkMode} />

				{/* Profile Section Group (Simulating Apple ID section) */}
				<Section darkMode={darkMode}>
					<ListItem
						label="iLmi Pro"
						value="Details"
						icon={<i className="fab fa-apple text-lg mt-[-2px]"></i>}
						iconColor="bg-black"
						darkMode={darkMode}
					></ListItem>
					<ListItem
						label="Family Sharing"
						icon={<i className="fas fa-users text-sm"></i>}
						iconColor="bg-[#5AC8FA]"
						darkMode={darkMode}
						isLast
					></ListItem>
				</Section>

				{/* Appearance */}
				<Section title="Settings" darkMode={darkMode}>
					<ListItem
						label="Dark Mode"
						iconClass="fas fa-moon"
						iconColor="bg-[#5856D6]"
						hasArrow={false}
						darkMode={darkMode}
						// Manual border handling for list items with controls
						showSeparator={true}
					>
						<Toggle checked={darkMode} onChange={toggleDarkMode} darkMode={darkMode} />
					</ListItem>
					<ListItem
						label="Notifications"
						iconClass="fas fa-bell"
						iconColor="bg-[#FF3B30]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Focus"
						iconClass="fas fa-moon"
						iconColor="bg-[#5856D6]"
						darkMode={darkMode}
						isLast
					/>
				</Section>

				{/* Wallpaper */}
				<Section title="Wallpaper" darkMode={darkMode}>
					{/* Header Item */}
					<ListItem
						label="Choose a New Wallpaper"
						iconClass="fas fa-images"
						iconColor="bg-[#34C759]"
						hasArrow={true}
						darkMode={darkMode}
						showSeparator={false}
					/>

					{/* Grid Area */}
					<div
						className={`p-4 pt-2 grid grid-cols-2 gap-4 ${darkMode ? 'bg-[#1C1C1E]' : 'bg-white'}`}
					>
						{wallpapers.map((wp, i) => (
							<WallpaperOption
								key={i}
								src={wp.src}
								label={wp.label}
								active={wallpaper === wp.src}
								onClick={() => setWallpaper(wp.src)}
								darkMode={darkMode}
							/>
						))}
					</div>
				</Section>

				{/* General */}
				<Section title="General" darkMode={darkMode}>
					<ListItem
						label="About"
						iconClass="fas fa-info-circle"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Software Update"
						iconClass="fas fa-cog"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Storage"
						iconClass="fas fa-database"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
						isLast
					/>
				</Section>
			</div>
		</div>
	);
}
