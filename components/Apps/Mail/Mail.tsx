'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import {
	Email,
	ACCOUNT_FOLDERS,
	MOCK_MAILBOXES_STATIC,
	loadEmails,
	saveEmails,
	MailboxItem,
	SwipeableEmailItem,
	ComposeModal,
	EmailDetail,
} from './index';

// --- Main App Component ---

type ViewState = 'mailboxes' | 'list' | 'detail';

export default function Mail() {
	const { darkMode } = useSettingsStore();

	// State
	const [emails, setEmails] = useState<Email[]>([]);
	const [mounted, setMounted] = useState(false);
	const [selectedMailbox, setSelectedMailbox] = useState<string>('inbox');
	const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
	const [isComposeOpen, setIsComposeOpen] = useState(false);
	const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['gmail']));
	const [searchQuery, setSearchQuery] = useState('');
	const [isUnreadFilterActive, setIsUnreadFilterActive] = useState(false);

	// Edit Mode State
	const [isEditing, setIsEditing] = useState(false);
	const [selectedForAction, setSelectedForAction] = useState<Set<string>>(new Set());

	// Navigation State for Mobile
	const [currentView, setCurrentView] = useState<ViewState>('mailboxes');
	const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

	// Load data on mount
	useEffect(() => {
		setMounted(true);
		setEmails(loadEmails());
	}, []);

	// Reset edit mode on view change
	useEffect(() => {
		setIsEditing(false);
		setSelectedForAction(new Set());
	}, [currentView, selectedMailbox]);

	// Derived State: Dynamic Mailboxes with Counts
	const mailboxesWithCounts = useMemo(() => {
		return MOCK_MAILBOXES_STATIC.map(box => {
			if (box.id === 'all_inboxes') {
				return { ...box, count: emails.filter(e => e.mailbox === 'inbox' && !e.read).length };
			}
			if (box.id === 'vip') {
				return { ...box, count: emails.filter(e => e.isVip && !e.read).length };
			}
			if (box.type === 'account') {
				return { ...box, count: 0 };
			}
			return box;
		});
	}, [emails]);

	// Filtered Emails for List View
	const displayEmails = useMemo(() => {
		let filtered = emails;

		// 1. Filter by Mailbox
		if (selectedMailbox === 'all_inboxes') {
			filtered = emails.filter(e => e.mailbox === 'inbox');
		} else if (selectedMailbox === 'vip') {
			filtered = emails.filter(e => e.isVip);
		} else {
			filtered = emails.filter(e => e.mailbox === selectedMailbox);
		}

		// 2. Filter by Search
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				e =>
					e.from.toLowerCase().includes(q) ||
					e.subject.toLowerCase().includes(q) ||
					e.preview.toLowerCase().includes(q)
			);
		}

		// 3. Filter by Unread Toggle
		if (isUnreadFilterActive) {
			filtered = filtered.filter(e => !e.read);
		}

		// 4. Sort by Date (desc)
		return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [emails, selectedMailbox, searchQuery, isUnreadFilterActive]);

	// Actions
	const toggleAccount = (id: string) => {
		const newSet = new Set(expandedAccounts);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		setExpandedAccounts(newSet);
	};

	const navigateToMailbox = (mailboxId: string) => {
		setDirection('forward');
		setSelectedMailbox(mailboxId);
		setCurrentView('list');
		setIsUnreadFilterActive(false);
	};

	const navigateToEmail = (emailId: string) => {
		if (isEditing) {
			// In edit mode, toggle selection
			const newSet = new Set(selectedForAction);
			if (newSet.has(emailId)) newSet.delete(emailId);
			else newSet.add(emailId);
			setSelectedForAction(newSet);
			return;
		}

		setDirection('forward');
		setSelectedEmailId(emailId);
		setCurrentView('detail');

		const updatedEmails = emails.map(e => (e.id === emailId ? { ...e, read: true } : e));
		setEmails(updatedEmails);
		saveEmails(updatedEmails);
	};

	const handleBack = () => {
		setDirection('backward'); // Animation direction
		if (currentView === 'detail') {
			setCurrentView('list');
			setSelectedEmailId(null);
		} else if (currentView === 'list') {
			setCurrentView('mailboxes');
			setSelectedMailbox('');
		}
	};

	const handleSendEmail = (to: string, subject: string, body: string) => {
		const newEmail: Email = {
			id: Date.now().toString(),
			from: 'Me',
			to: to,
			subject: subject,
			preview: body,
			date: new Date().toLocaleDateString(),
			read: true,
			mailbox: 'sent',
		};

		let updatedEmails = [newEmail, ...emails];
		if (to.toLowerCase().includes('me') || to.toLowerCase().includes('icloud')) {
			const inboxCopy: Email = {
				...newEmail,
				id: Date.now().toString() + '_inbox',
				from: 'Me',
				mailbox: 'inbox',
				read: false,
			};
			updatedEmails = [inboxCopy, ...updatedEmails];
		}

		setEmails(updatedEmails);
		saveEmails(updatedEmails);
		setIsComposeOpen(false);
	};

	const handleDeleteEmail = (id: string) => {
		const target = emails.find(e => e.id === id);
		if (!target) return;

		let updatedEmails;
		if (target.mailbox === 'trash') {
			updatedEmails = emails.filter(e => e.id !== id);
		} else {
			updatedEmails = emails.map(e => (e.id === id ? { ...e, mailbox: 'trash' } : e));
		}
		setEmails(updatedEmails);
		saveEmails(updatedEmails);

		if (currentView === 'detail') handleBack();
	};

	const handleArchiveEmail = (id: string) => {
		const updatedEmails = emails.map(e => (e.id === id ? { ...e, mailbox: 'archive' } : e));
		setEmails(updatedEmails);
		saveEmails(updatedEmails);
		if (currentView === 'detail') handleBack();
	};

	// Batch Actions
	const handleBatchDelete = () => {
		if (selectedForAction.size === 0) return;

		let updatedEmails = [...emails];
		selectedForAction.forEach(id => {
			const target = updatedEmails.find(e => e.id === id);
			if (target) {
				if (target.mailbox === 'trash') {
					updatedEmails = updatedEmails.filter(e => e.id !== id);
				} else {
					updatedEmails = updatedEmails.map(e => (e.id === id ? { ...e, mailbox: 'trash' } : e));
				}
			}
		});

		setEmails(updatedEmails);
		saveEmails(updatedEmails);
		setIsEditing(false);
		setSelectedForAction(new Set());
	};

	const handleBatchArchive = () => {
		if (selectedForAction.size === 0) return;

		const updatedEmails = emails.map(e =>
			selectedForAction.has(e.id) ? { ...e, mailbox: 'archive' } : e
		);
		setEmails(updatedEmails);
		saveEmails(updatedEmails);
		setIsEditing(false);
		setSelectedForAction(new Set());
	};

	const handleReply = () => {
		const currentEmail = emails.find(e => e.id === selectedEmailId);
		if (currentEmail) {
			setIsComposeOpen(true);
		}
	};

	const toggleEditMode = () => {
		if (isEditing) {
			setIsEditing(false);
			setSelectedForAction(new Set());
		} else {
			setIsEditing(true);
		}
	};

	const animationClass = `animate-in md:animate-none ${direction === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'}`;

	// Theme colors
	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-white',
		sidebarBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-ios-gray6',
		headerBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-ios-gray6',
		text: darkMode ? 'text-white' : 'text-black',
		textSecondary: darkMode ? 'text-ios-gray' : 'text-ios-gray',
		borderColor: darkMode ? 'border-ios-dark-separator' : 'border-ios-separator',
		listBg: darkMode ? 'bg-black' : 'bg-white',
	};

	if (!mounted) return null;

	const selectedEmail = emails.find(e => e.id === selectedEmailId);

	return (
		<div className={`w-full h-full flex overflow-hidden font-sans ${theme.bg} ${theme.text}`}>
			{/* Sidebar (Mailboxes) */}
			<div
				className={`
					flex flex-col border-r ${theme.sidebarBg} ${theme.borderColor}
					w-full md:w-[280px] md:shrink-0
					${currentView === 'mailboxes' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
			>
				{/* Sidebar Header */}
				<div className={`flex flex-col border-b pt-6 md:pt-0 ${theme.borderColor}`}>
					<div className="h-[44px] flex items-center justify-between px-5">
						<button onClick={toggleEditMode} className="text-ios-blue text-ios-body">
							{isEditing ? 'Done' : 'Edit'}
						</button>
						<h1 className="text-ios-body font-semibold">Mailboxes</h1>
						<div className="w-8"></div> {/* Spacer */}
					</div>
				</div>

				{/* Mailboxes List */}
				<div className="flex-1 overflow-y-auto">
					<div
						className={`my-4 mx-5 rounded-[10px] overflow-hidden ${darkMode ? 'bg-ios-dark-gray5' : 'bg-white'}`}
					>
						{mailboxesWithCounts
							.filter(m => m.type !== 'account')
							.map(mailbox => (
								<MailboxItem
									key={mailbox.id}
									item={mailbox}
									isActive={
										selectedMailbox === mailbox.id &&
										typeof window !== 'undefined' &&
										window.innerWidth >= 768
									}
									onClick={() => !isEditing && navigateToMailbox(mailbox.id)}
									darkMode={darkMode}
								/>
							))}
					</div>

					{/* Accounts */}
					{mailboxesWithCounts
						.filter(m => m.type === 'account')
						.map(account => (
							<div key={account.id} className="mb-2">
								<div
									className="flex items-center px-5 py-2 cursor-pointer"
									onClick={() => toggleAccount(account.id)}
								>
									<span
										className={`text-ios-footnote font-semibold uppercase flex-1 ${theme.textSecondary}`}
									>
										{account.name === 'iCloud' ? 'iCloud' : account.name.split('@')[0]}
									</span>
									<i
										className={`fas fa-chevron-right text-xs text-gray-400 transition-transform ${expandedAccounts.has(account.id) ? 'rotate-90' : ''
											}`}
									></i>
								</div>
								{expandedAccounts.has(account.id) && (
									<div
										className={`mx-5 rounded-[10px] overflow-hidden ${darkMode ? 'bg-ios-dark-gray5' : 'bg-white'}`}
									>
										{ACCOUNT_FOLDERS.map(folder => (
											<MailboxItem
												key={`${account.id}-${folder.id}`}
												item={{
													...folder,
													count: emails.filter(e => e.mailbox === folder.id && !e.read).length,
												}}
												isActive={
													selectedMailbox === folder.id &&
													typeof window !== 'undefined' &&
													window.innerWidth >= 768
												}
												onClick={() => !isEditing && navigateToMailbox(folder.id)}
												darkMode={darkMode}
											/>
										))}
									</div>
								)}
							</div>
						))}
				</div>

				{/* Sidebar Footer */}
				<div
					className={`relative z-20 flex items-center justify-between px-5 py-2 pb-8 md:pb-2 border-t ${theme.headerBg} ${theme.borderColor}`}
				>
					<div className="w-10"></div> {/* Spacer to balance right button */}
					<div className="text-ios-caption2 text-center">Updated Just Now</div>
					<button
						onClick={() => setIsComposeOpen(true)}
						className="w-10 h-10 flex items-center justify-center text-ios-blue active:opacity-50 transition-opacity"
					>
						<i className="far fa-edit text-xl"></i>
					</button>
				</div>
			</div>

			{/* Message List (Inbox) */}
			<div
				className={`
					flex flex-col border-r ${theme.listBg} ${theme.borderColor}
					w-full md:w-[320px] md:shrink-0
					${currentView === 'list' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
			>
				{/* List Header */}
				<div
					className={`flex flex-col border-b pt-6 md:pt-0 ${theme.headerBg} ${theme.borderColor}`}
				>
					<div className="h-[44px] flex items-center justify-between px-3">
						{/* Back Button (Mobile Only) */}
						<button
							onClick={handleBack}
							className="flex items-center text-ios-blue text-ios-body md:hidden"
						>
							<i className="fas fa-chevron-left text-xl mr-1"></i>
							Mailboxes
						</button>
						{/* Desktop: Hidden Spacer or Back if needed logic later */}
						<div className="hidden md:block w-8"></div>

						<button onClick={toggleEditMode} className="text-ios-blue text-ios-body">
							{isEditing ? 'Done' : 'Edit'}
						</button>
					</div>
					<div className="px-5 pb-2">
						<h1 className="text-ios-large-title font-bold leading-tight capitalize">
							{selectedMailbox.replace('_', ' ')}
						</h1>
					</div>
					<div className="px-5 pb-3">
						<div
							className={`relative flex items-center rounded-[10px] px-3 py-2 ${darkMode ? 'bg-ios-dark-gray5' : 'bg-ios-gray5'}`}
						>
							<i className="fas fa-search text-gray-500 mr-2"></i>
							<input
								type="text"
								placeholder="Search"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className="flex-1 bg-transparent border-none outline-none text-ios-body"
							/>
							<i className="fas fa-microphone text-gray-500 ml-2"></i>
						</div>
					</div>
				</div>

				{/* Email List */}
				<div className="flex-1 overflow-y-auto">
					{displayEmails.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-400">
							<p className="text-ios-body">{isUnreadFilterActive ? 'No Unread Mail' : 'No Mail'}</p>
						</div>
					) : (
						displayEmails.map(email => (
							<SwipeableEmailItem
								key={email.id}
								email={email}
								isSelected={selectedEmailId === email.id}
								isEditing={isEditing}
								isChecked={selectedForAction.has(email.id)}
								onClick={() => navigateToEmail(email.id)}
								onDelete={() => handleDeleteEmail(email.id)}
								onArchive={() => handleArchiveEmail(email.id)}
								darkMode={darkMode}
							/>
						))
					)}
				</div>

				{/* List Footer */}
				<div
					className={`relative z-20 flex items-center justify-between px-5 py-2 pb-8 md:pb-2 border-t ${theme.headerBg} ${theme.borderColor}`}
				>
					{isEditing ? (
						// Edit Mode Toolbar (Icons style)
						<>
							<button
								onClick={handleBatchArchive}
								disabled={selectedForAction.size === 0}
								className={`w-10 h-10 flex items-center justify-center rounded-full active:opacity-50 transition-opacity ${selectedForAction.size > 0 ? 'text-ios-blue' : 'text-gray-400'}`}
							>
								<i className="fas fa-archive text-lg"></i>
							</button>
							<div className={`text-ios-caption1 font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
								{selectedForAction.size > 0
									? `${selectedForAction.size} Selected`
									: 'Select Messages'}
							</div>
							<button
								onClick={handleBatchDelete}
								disabled={selectedForAction.size === 0}
								className={`w-10 h-10 flex items-center justify-center rounded-full active:opacity-50 transition-opacity ${selectedForAction.size > 0 ? 'text-ios-blue' : 'text-gray-400'}`}
							>
								<i className="fas fa-trash text-lg"></i>
							</button>
						</>
					) : (
						// Normal Toolbar
						<>
							<button
								onClick={() => setIsUnreadFilterActive(!isUnreadFilterActive)}
								className={`w-10 h-10 flex items-center justify-center rounded-full active:opacity-50 transition-opacity ${isUnreadFilterActive ? 'bg-ios-blue text-white' : 'text-ios-blue'}`}
							>
								<i
									className={`fas fa-filter text-lg ${isUnreadFilterActive ? 'text-white' : ''}`}
								></i>
							</button>
							<div className={`text-ios-caption1 font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
								{isUnreadFilterActive
									? `Filtered by: Unread`
									: displayEmails.filter(e => !e.read).length > 0
										? `${displayEmails.filter(e => !e.read).length} Unread`
										: 'Updated Just Now'}
							</div>
							<button
								onClick={() => setIsComposeOpen(true)}
								className="w-10 h-10 flex items-center justify-center text-ios-blue active:opacity-50 transition-opacity"
							>
								<i className="far fa-edit text-xl"></i>
							</button>
						</>
					)}
				</div>
			</div>

			{/* Reading Pane (Content) */}
			<div
				className={`
					flex-col ${theme.bg}
					w-full flex-1
					${currentView === 'detail' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
			>
				{/* Mobile Header for Detail View */}
				<div
					className={`md:hidden flex flex-col border-b pt-6 md:pt-0 ${theme.borderColor} ${theme.headerBg}`}
				>
					<div className="h-[44px] flex items-center justify-between px-3">
						<button onClick={handleBack} className="flex items-center text-ios-blue text-ios-body">
							<i className="fas fa-chevron-left text-xl mr-1"></i>
							{selectedMailbox === 'inbox' ? 'Inbox' : 'Back'}
						</button>
						<div className="flex gap-4 text-ios-blue">
							<i className="fas fa-chevron-up"></i>
							<i className="fas fa-chevron-down"></i>
						</div>
					</div>
				</div>

				{selectedEmail ? (
					<EmailDetail
						email={selectedEmail}
						onBack={handleBack}
						onReply={handleReply}
						onDelete={handleDeleteEmail}
						onArchive={handleArchiveEmail}
					/>
				) : (
					<div className="flex-1 flex items-center justify-center text-ios-gray">
						<div className="text-center">
							<i className="fas fa-envelope-open text-6xl mb-4 opacity-50"></i>
							<p className="text-ios-title3 font-medium">No Message Selected</p>
						</div>
					</div>
				)}
			</div>

			{/* Compose Modal */}
			{isComposeOpen && (
				<ComposeModal
					onClose={() => setIsComposeOpen(false)}
					onSend={handleSendEmail}
				/>
			)}
		</div>
	);
}
