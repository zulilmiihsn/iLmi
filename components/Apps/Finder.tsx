'use client';

import { useState } from 'react';

interface FileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
}

interface SidebarItem {
	id: string;
	name: string;
	icon: string;
}

export default function Finder() {
	const [currentPath, setCurrentPath] = useState<string>('Desktop');
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [items, setItems] = useState<FileItem[]>([
		{ id: '1', name: 'My Documents', type: 'folder' },
		{ id: '2', name: 'Project Files', type: 'folder' },
		{ id: '3', name: 'Screenshots', type: 'folder' },
		{ id: '4', name: 'readme.txt', type: 'file' },
		{ id: '5', name: 'notes.pdf', type: 'file' },
	]);

	const sidebarItems: SidebarItem[] = [
		{ id: 'favorites', name: 'Favorites', icon: '⭐' },
		{ id: 'desktop', name: 'Desktop', icon: '🖥️' },
		{ id: 'documents', name: 'Documents', icon: '📄' },
		{ id: 'downloads', name: 'Downloads', icon: '⬇️' },
		{ id: 'pictures', name: 'Pictures', icon: '🖼️' },
		{ id: 'music', name: 'Music', icon: '🎵' },
		{ id: 'videos', name: 'Videos', icon: '🎬' },
	];

	function createFolder() {
		const name = prompt('Folder name:');
		if (name) {
			setItems([...items, { id: Date.now().toString(), name, type: 'folder' }]);
		}
	}

	function createFile() {
		const name = prompt('File name:');
		if (name) {
			setItems([...items, { id: Date.now().toString(), name, type: 'file' }]);
		}
	}

	function deleteItem(id: string) {
		if (confirm('Delete this item?')) {
			setItems(items.filter((item) => item.id !== id));
			if (selectedItem === id) {
				setSelectedItem(null);
			}
		}
	}

	function handleSidebarClick(item: SidebarItem) {
		setCurrentPath(item.name);
		setSelectedItem(null);
	}

	return (
		<div className="finder flex flex-col w-full h-full bg-white dark:bg-[#1E1E1E]" style={{ paddingTop: 'max(env(safe-area-inset-top), 44px)' }}>
			{/* Toolbar */}
			<div className="toolbar h-10 bg-[#F5F5F5] dark:bg-[#2C2C2E] border-b border-[#E5E5E5] dark:border-black flex items-center gap-2 px-3">
				<button
					className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
					disabled
					title="Back"
				>
					←
				</button>
				<button
					className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
					disabled
					title="Forward"
				>
					→
				</button>
				<div className="flex-1 px-3 py-1 bg-white dark:bg-ios-dark-gray5 rounded text-xs border border-ios-separator dark:border-ios-dark-separator">
					{currentPath}
				</div>
				<button
					className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700"
					onClick={createFolder}
					title="New Folder"
				>
					📁
				</button>
				<button
					className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700"
					onClick={createFile}
					title="New File"
				>
					📄
				</button>
				{selectedItem && (
					<button
						className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-ios-red"
						onClick={() => deleteItem(selectedItem)}
						title="Delete"
					>
						🗑️
					</button>
				)}
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<div className="sidebar w-48 bg-[#F0F0F0] dark:bg-[#252525] border-r border-[#E5E5E5] dark:border-black overflow-y-auto">
					<div className="p-2">
						{sidebarItems.map((item) => (
							<button
								key={item.id}
								className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 ${currentPath === item.name ? 'bg-[#D1D1D1] dark:bg-[#3A3A3C]' : ''
									}`}
								onClick={() => handleSidebarClick(item)}
							>
								<span>{item.icon}</span>
								<span>{item.name}</span>
							</button>
						))}
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#1E1E1E]">
					<div className="grid grid-cols-6 gap-4">
						{items.map((item) => (
							<button
								key={item.id}
								className={`p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 flex flex-col items-center transition-colors ${selectedItem === item.id ? 'bg-[#0058D0] text-white dark:bg-[#0058D0] dark:text-white' : ''
									}`}
								onClick={() => setSelectedItem(item.id)}
								onDoubleClick={() => {
									if (item.type === 'folder') {
										setCurrentPath(item.name);
									}
								}}
							>
								<span className="text-5xl mb-2">{item.type === 'folder' ? '📁' : '📄'}</span>
								<span className="text-xs text-center break-words max-w-full">{item.name}</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

