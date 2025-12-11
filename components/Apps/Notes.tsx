'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSettingsStore } from '../../stores/settings';

// --- Types ---
interface Note {
	id: string;
	title: string;
	content: string;
	date: Date;
	folder: string;
	hasImage?: boolean;
	imageSrc?: string;
	tags?: string[];
	selected?: boolean;
}

// --- Components ---

const DeleteAlert = ({
	count,
	onCancel,
	onDelete,
	darkMode,
}: {
	count: number;
	onCancel: () => void;
	onDelete: () => void;
	darkMode: boolean;
}) => (
	<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
		<div
			className={`${darkMode ? 'bg-[#1C1C1E]/85 text-white' : 'bg-[#F2F2F7]/85 text-black'} w-[270px] rounded-[14px] overflow-hidden text-center backdrop-blur-xl shadow-lg animate-scale-in transition-colors`}
		>
			<div
				className={`pt-5 pb-4 px-4 border-b ${darkMode ? 'border-[#38383A]/50' : 'border-[#3C3C43]/20'}`}
			>
				<h3 className="font-semibold text-[17px] leading-snug">Delete {count} Notes?</h3>
				<p
					className={`text-[13px] mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'} leading-snug`}
				>
					This action cannot be undone.
				</p>
			</div>
			<div className={`flex divide-x ${darkMode ? 'divide-[#38383A]/50' : 'divide-[#3C3C43]/20'}`}>
				<button
					onClick={onCancel}
					className={`flex-1 py-[11px] text-[17px] text-[#007AFF] font-semibold ${darkMode ? 'active:bg-[#2C2C2E]' : 'active:bg-[#3C3C43]/10'} transition-colors`}
				>
					Cancel
				</button>
				<button
					onClick={onDelete}
					className={`flex-1 py-[11px] text-[17px] text-[#FF3B30] font-normal ${darkMode ? 'active:bg-[#2C2C2E]' : 'active:bg-[#3C3C43]/10'} transition-colors`}
				>
					Delete
				</button>
			</div>
		</div>
	</div>
);

const FormatToolbar = ({ onClose, darkMode }: { onClose: () => void; darkMode: boolean }) => (
	<div
		className={`${darkMode ? 'bg-[#1C1C1E] border-[#38383A]' : 'bg-[#F9F9F9] border-[#C6C6C8]'} border-t px-4 py-2 pb-safe z-20 absolute bottom-0 left-0 right-0 shadow-lg animate-in slide-in-from-bottom duration-300 transition-colors`}
	>
		<div className="flex items-center justify-between mb-3">
			<span className={`font-bold text-[15px] ${darkMode ? 'text-white' : 'text-[#1C1C1E]'}`}>
				Format
			</span>
			<button
				onClick={onClose}
				className={`${darkMode ? 'bg-[#2C2C2E] active:bg-[#3A3A3C]' : 'bg-[#E5E5EA] active:bg-[#D1D1D6]'} rounded-full p-1 transition-colors`}
			>
				<svg
					className="w-4 h-4 text-[#8E8E93]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2.5}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
		<div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
			{['Title', 'Heading', 'Subheading', 'Body'].map(style => (
				<button
					key={style}
					className={`px-4 py-2 rounded-[8px] whitespace-nowrap text-[15px] ${style === 'Title' ? 'bg-[#DCA326] text-white font-bold shadow-sm' : darkMode ? 'bg-[#2C2C2E] text-white' : 'bg-[#E5E5EA] text-black'} font-semibold`}
				>
					{style}
				</button>
			))}
		</div>
		<div
			className={`flex justify-between items-center mt-1 ${darkMode ? 'bg-[#2C2C2E]' : 'bg-[#E5E5EA]'} rounded-[10px] p-1.5 transition-colors`}
		>
			<button className="p-1.5 bg-[#DCA326] text-white rounded-[7px] w-9 h-9 flex items-center justify-center font-bold shadow-sm">
				B
			</button>
			<button
				className={`p-1.5 ${darkMode ? 'text-white' : 'text-black'} w-9 h-9 flex items-center justify-center italic font-serif`}
			>
				I
			</button>
			<button
				className={`p-1.5 ${darkMode ? 'text-white' : 'text-black'} w-9 h-9 flex items-center justify-center underline`}
			>
				U
			</button>
			<button
				className={`p-1.5 ${darkMode ? 'text-white' : 'text-black'} w-9 h-9 flex items-center justify-center line-through`}
			>
				S
			</button>
			<div className="w-px h-5 bg-[#C6C6C8] mx-1"></div>
			<button
				className={`p-1.5 ${darkMode ? 'text-white' : 'text-black'} w-9 h-9 flex items-center justify-center`}
			>
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
					/>
				</svg>
			</button>
			<button
				className={`p-1.5 ${darkMode ? 'text-white' : 'text-black'} w-9 h-9 flex items-center justify-center`}
			>
				<div className="w-3.5 h-3.5 bg-purple-500 rounded-full border border-black/10"></div>
			</button>
		</div>
		<div className="flex justify-between items-center mt-3">
			{[
				'M4 6h16M4 12h16M4 18h16',
				'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
				'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
				'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
				'M13 5l7 7-7 7M5 5l7 7-7 7',
				'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
			].map((d, i) => (
				<button
					key={i}
					className={`p-2 ${darkMode ? 'bg-[#2C2C2E] active:bg-[#3A3A3C]' : 'bg-[#E5E5EA] active:bg-[#D1D1D6]'} rounded-[8px]`}
				>
					<svg
						className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-[#1C1C1E]'}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
					</svg>
				</button>
			))}
		</div>
	</div>
);

const NoteItem = ({
	note,
	onClick,
	selectionMode,
	isLast,
	darkMode,
}: {
	note: Note;
	onClick: (note: Note) => void;
	selectionMode: boolean;
	isLast: boolean;
	darkMode: boolean;
}) => (
	<div
		onClick={() => onClick(note)}
		className={`flex pl-4 pr-0 py-0 ${darkMode ? 'active:bg-[#2C2C2E]' : 'active:bg-[#E5E5EA]'} transition-colors cursor-pointer group`}
	>
		{selectionMode && (
			<div className="flex items-center justify-center mr-3 py-3 animate-in slide-in-from-left-2 duration-200">
				<div
					className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-colors ${note.selected ? 'bg-[#DCA326] border-[#DCA326]' : 'border-[#C5C5C7] bg-transparent'}`}
				>
					{note.selected && (
						<svg
							className="w-3.5 h-3.5 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					)}
				</div>
			</div>
		)}
		<div
			className={`flex-1 flex py-3 pr-4 ${!isLast ? (darkMode ? 'border-b border-[#38383A]' : 'border-b border-[#C6C6C8]/50') : ''}`}
		>
			<div className="flex-1 min-w-0 mr-2">
				<h3
					className={`font-bold text-[17px] ${darkMode ? 'text-white' : 'text-black'} truncate leading-tight mb-0.5 ${!note.title ? 'text-gray-400 italic' : ''}`}
				>
					{note.title || 'New Note'}
				</h3>
				<div className="flex items-start text-[#8E8E93] text-[15px] leading-snug">
					<span className="mr-2 whitespace-nowrap">
						{note.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
					</span>
					<span className={`truncate ${darkMode ? 'text-[#8E8E93]' : 'text-[#3C3C43]/60'}`}>
						{note.content || 'No additional text'}
					</span>
				</div>
				<div className="flex items-center text-[#8E8E93] text-[13px] mt-1.5">
					<svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					{note.folder}
				</div>
			</div>
			{note.hasImage && note.imageSrc && (
				<div className="w-12 h-12 rounded-[6px] overflow-hidden shrink-0 bg-gray-100 self-start mt-0.5 relative">
					<Image
						src={note.imageSrc}
						alt=""
						fill
						className="object-cover"
						unoptimized={note.imageSrc.startsWith('data:')}
					/>
				</div>
			)}
		</div>
	</div>
);

// --- Main Component ---

export default function Notes() {
	const { darkMode } = useSettingsStore();

	const [view, setView] = useState<'list' | 'detail'>('list');
	const [notes, setNotes] = useState<Note[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectionMode, setSelectionMode] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [showFormatToolbar, setShowFormatToolbar] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);

	// Detail View State
	const [currentNote, setCurrentNote] = useState<Note | null>(null);

	// Load notes from localStorage on mount
	useEffect(() => {
		setMounted(true);
		const savedNotes = localStorage.getItem('notes');
		if (savedNotes) {
			try {
				const parsed = JSON.parse(savedNotes, (key, value) => {
					if (key === 'date') return new Date(value);
					return value;
				});

				if (Array.isArray(parsed)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const validNotes = parsed.map((n: any) => ({
						...n,
						// Ensure date is a Date object, fallback to now if missing/invalid
						date: n.date instanceof Date && !isNaN(n.date.getTime()) ? n.date : new Date(),
					}));
					setNotes(validNotes);
				}
			} catch (e) {
				console.error('Failed to parse notes', e);
				setNotes([]);
			}
		}
	}, []);

	// Save notes to localStorage whenever they change
	useEffect(() => {
		if (mounted) {
			localStorage.setItem('notes', JSON.stringify(notes));
		}
	}, [notes, mounted]);

	const handleNoteClick = (note: Note) => {
		if (selectionMode) {
			setNotes(notes.map(n => (n.id === note.id ? { ...n, selected: !n.selected } : n)));
		} else {
			setCurrentNote(note);
			setView('detail');
			setShowFormatToolbar(false);
		}
	};

	const handleBack = () => {
		setView('list');
		setCurrentNote(null);
		setShowFormatToolbar(false);
	};

	const createNewNote = () => {
		const newNote: Note = {
			id: Date.now().toString(),
			title: '',
			content: '',
			date: new Date(),
			folder: 'Notes',
			selected: false,
		};
		setNotes(prev => [newNote, ...prev]);
		setCurrentNote(newNote);
		setView('detail');
		setShowFormatToolbar(false);
	};

	const updateCurrentNote = (updates: Partial<Note>) => {
		if (!currentNote) return;

		const updatedNote = { ...currentNote, ...updates, date: new Date() };
		setCurrentNote(updatedNote);

		setNotes(prevNotes => prevNotes.map(n => (n.id === currentNote.id ? updatedNote : n)));
	};

	const deleteSelectedNotes = () => {
		if (selectedCount > 0) {
			setShowDeleteAlert(true);
		}
	};

	const confirmDelete = () => {
		setNotes(notes.filter(n => !n.selected));
		setSelectionMode(false);
		setShowDeleteAlert(false);
	};

	const toggleSelectionMode = () => {
		if (selectionMode) {
			// Clear selection when exiting mode
			setNotes(notes.map(n => ({ ...n, selected: false })));
		}
		setSelectionMode(!selectionMode);
	};

	const selectedCount = notes.filter(n => n.selected).length;

	// Filter notes based on search query
	const filteredNotes = notes.filter(
		n =>
			(n.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
			(n.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
	);

	// Group notes by date
	const todayNotes = filteredNotes.filter(n => {
		if (!n.date) return false;
		const today = new Date();
		try {
			return (
				n.date.getDate() === today.getDate() &&
				n.date.getMonth() === today.getMonth() &&
				n.date.getFullYear() === today.getFullYear()
			);
		} catch {
			return false;
		}
	});

	const previousNotes = filteredNotes.filter(n => !todayNotes.includes(n));

	if (!mounted) return null;

	// Theme Objects
	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-[#F2F2F7]',
		text: darkMode ? 'text-white' : 'text-black',
		cardBg: darkMode ? 'bg-[#1C1C1E]' : 'bg-white',
		headerBg: darkMode ? 'bg-black' : 'bg-[#F2F2F7]',
		searchBg: darkMode ? 'bg-[#1C1C1E]' : 'bg-[#E3E3E8]',
		placeholder: darkMode ? 'placeholder-[#8E8E93]' : 'placeholder-gray-500',
		detailHeader: darkMode ? 'bg-black/90 border-gray-800' : 'bg-white/90 border-[#E5E5EA]',
		detailBg: darkMode ? 'bg-black' : 'bg-white',
		detailText: darkMode ? 'text-white' : 'text-[#1C1C1E]',
	};

	return (
		<div
			className={`notes-app w-full h-full overflow-hidden font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}
		>
			{view === 'list' ? (
				<div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
					{/* Header */}
					<div
						className={`px-4 pt-[30px] pb-2 sticky top-0 z-10 transition-colors ${theme.headerBg}`}
					>
						<div className="flex justify-between items-end mb-3">
							<h1 className="text-3xl font-bold tracking-tight">
								{selectionMode ? `${selectedCount} Selected` : 'Notes'}
							</h1>
							<button
								onClick={toggleSelectionMode}
								className="text-[#DCA326] font-semibold text-[17px] active:opacity-50 transition-opacity"
							>
								{selectionMode ? 'Done' : 'Select'}
							</button>
						</div>

						{/* Search Bar */}
						<div className="relative mb-2">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg
									className="h-4 w-4 text-gray-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<input
								type="text"
								className={`block w-full pl-9 pr-8 py-2 border-none rounded-[10px] leading-5 focus:outline-none transition-colors text-[17px] ${theme.searchBg} ${theme.placeholder} ${darkMode ? 'text-white' : 'text-black'}`}
								placeholder="Search"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
								>
									<svg
										className="h-4 w-4 bg-gray-400 text-white rounded-full p-0.5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							)}
						</div>
					</div>

					{/* Note List */}
					<div className="flex-1 overflow-y-auto px-4 pb-20">
						{notes.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-64 text-gray-400">
								<svg
									className="w-16 h-16 mb-4 text-gray-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								<p className="text-lg font-medium">No Notes</p>
							</div>
						) : (
							<>
								{/* Today Section */}
								{todayNotes.length > 0 && (
									<div className="mb-8">
										<h2 className="text-[22px] font-bold mb-2 ml-1 tracking-tight">Today</h2>
										<div
											className={`${theme.cardBg} rounded-[14px] overflow-hidden shadow-sm transition-colors`}
										>
											{todayNotes.map((note, index) => (
												<NoteItem
													key={note.id}
													note={note}
													onClick={handleNoteClick}
													selectionMode={selectionMode}
													isLast={index === todayNotes.length - 1}
													darkMode={darkMode}
												/>
											))}
										</div>
									</div>
								)}

								{/* Previous Days Section */}
								{previousNotes.length > 0 && (
									<div className="mb-8">
										<h2 className="text-[22px] font-bold mb-2 ml-1 tracking-tight">
											Previous 30 Days
										</h2>
										<div
											className={`${theme.cardBg} rounded-[14px] overflow-hidden shadow-sm transition-colors`}
										>
											{previousNotes.map((note, index) => (
												<NoteItem
													key={note.id}
													note={note}
													onClick={handleNoteClick}
													selectionMode={selectionMode}
													isLast={index === previousNotes.length - 1}
													darkMode={darkMode}
												/>
											))}
										</div>
									</div>
								)}
							</>
						)}
					</div>

					{/* Bottom Toolbar */}
					<div
						className={`border-t pb-safe z-50 relative transition-colors ${darkMode ? 'bg-black border-[#38383A]' : 'bg-[#F2F2F7] border-[#C6C6C8]'}`}
					>
						<div className="flex justify-between items-center h-[44px] px-4">
							{selectionMode ? (
								<>
									<button className="h-full px-4 -ml-4 flex items-center text-[17px] text-[#DCA326] font-medium active:opacity-50 transition-opacity">
										Move
									</button>
									<button
										className={`h-full px-4 -mr-4 flex items-center text-[17px] font-medium active:opacity-50 transition-opacity ${selectedCount > 0 ? 'text-[#DCA326]' : 'text-[#DCA326]/50'}`}
										onClick={deleteSelectedNotes}
										disabled={selectedCount === 0}
									>
										Delete
									</button>
								</>
							) : (
								<>
									<div className="flex-1"></div>
									<div
										className={`text-[11px] font-normal text-center flex-1 whitespace-nowrap ${darkMode ? 'text-white/80' : 'text-black/80'}`}
									>
										{notes.length} Notes
									</div>
									<div className="flex-1 flex justify-end">
										<button
											type="button"
											onClick={e => {
												e.stopPropagation();
												createNewNote();
											}}
											className="w-11 h-11 flex items-center justify-center text-[#DCA326] hover:bg-[#0000000d] active:bg-[#0000001a] rounded-full transition-colors -mr-2"
											aria-label="New Note"
										>
											<svg
												className="w-6 h-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			) : (
				<div
					className={`flex flex-col h-full animate-in slide-in-from-right duration-300 relative ${theme.detailBg} transition-colors`}
				>
					{/* Detail Header */}
					<div
						className={`flex items-center justify-between px-4 pt-6 pb-3 border-b sticky top-0 backdrop-blur-md z-10 transition-colors ${theme.detailHeader}`}
					>
						<button
							onClick={handleBack}
							className="flex items-center text-[#DCA326] font-medium text-[17px] active:opacity-50 transition-opacity"
						>
							<svg className="w-6 h-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Notes
						</button>
						<div className="flex items-center gap-5">
							<button className="text-[#DCA326] active:opacity-50 transition-opacity">
								<svg
									className="w-[22px] h-[22px]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
									/>
								</svg>
							</button>
							<button
								onClick={() => setShowFormatToolbar(true)}
								className={`text-[#DCA326] active:opacity-50 transition-opacity ${showFormatToolbar ? 'opacity-50' : ''}`}
							>
								<svg
									className="w-[22px] h-[22px]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
									/>
								</svg>
							</button>
							<button
								onClick={handleBack}
								className="text-[#DCA326] font-bold text-[17px] active:opacity-50 transition-opacity"
							>
								Done
							</button>
						</div>
					</div>

					{/* Detail Content */}
					<div className="flex-1 overflow-y-auto px-5 py-4">
						<div className="mb-6">
							<span className="text-[#8E8E93] text-[13px] font-medium block text-center mb-5">
								{currentNote?.date.toLocaleDateString([], { month: 'long', day: 'numeric' })} at{' '}
								{currentNote?.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
							</span>
							<input
								type="text"
								value={currentNote?.title || ''}
								onChange={e => updateCurrentNote({ title: e.target.value })}
								placeholder="Title"
								className={`text-[28px] font-bold mb-2 w-full border-none outline-none placeholder-gray-300 bg-transparent ${theme.detailText}`}
							/>
						</div>
						<textarea
							value={currentNote?.content || ''}
							onChange={e => updateCurrentNote({ content: e.target.value })}
							placeholder="Type something..."
							className={`w-full h-[calc(100%-100px)] resize-none border-none outline-none text-[17px] leading-relaxed bg-transparent placeholder-gray-300 ${theme.detailText}`}
						/>
					</div>

					{/* Formatting Toolbar */}
					{showFormatToolbar && (
						<FormatToolbar onClose={() => setShowFormatToolbar(false)} darkMode={darkMode} />
					)}
				</div>
			)}

			{/* Delete Confirmation Alert */}
			{showDeleteAlert && (
				<DeleteAlert
					count={selectedCount}
					onCancel={() => setShowDeleteAlert(false)}
					onDelete={confirmDelete}
					darkMode={darkMode}
				/>
			)}
			<style jsx>{`
				.pb-safe {
					padding-bottom: max(env(safe-area-inset-bottom), 20px);
				}
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
				.scrollbar-hide {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
				/* Animations */
				@keyframes slideInRight {
					from {
						transform: translateX(100%);
					}
					to {
						transform: translateX(0);
					}
				}
				@keyframes slideInLeft {
					from {
						transform: translateX(-100%);
					}
					to {
						transform: translateX(0);
					}
				}
				@keyframes slideInBottom {
					from {
						transform: translateY(100%);
					}
					to {
						transform: translateY(0);
					}
				}
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				@keyframes scaleIn {
					from {
						opacity: 0;
						transform: scale(0.95);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				.slide-in-from-right {
					animation: slideInRight 0.3s ease-out forwards;
				}
				.slide-in-from-left {
					animation: slideInLeft 0.3s ease-out forwards;
				}
				.slide-in-from-bottom {
					animation: slideInBottom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
				}
				.animate-fade-in {
					animation: fadeIn 0.2s ease-out forwards;
				}
				.animate-scale-in {
					animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
				}
			`}</style>
		</div>
	);
}
