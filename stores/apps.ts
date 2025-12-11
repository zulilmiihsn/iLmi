import { create } from 'zustand';
import type { AppMetadata } from '../types';

const defaultApps: AppMetadata[] = [
	// --- Dock Apps (Standard macOS Order) ---
	{
		id: 'finder',
		name: 'Finder',
		icon: '/media/Finder.svg',
		component: 'Finder',
		platform: 'macos',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'safari',
		name: 'Safari',
		icon: '/media/Safari.svg',
		component: 'Safari',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'messages',
		name: 'Messages',
		icon: '/media/Message.svg',
		component: 'Messages',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'mail',
		name: 'Mail',
		icon: '/media/Mail.svg',
		component: 'Mail',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'maps',
		name: 'Maps',
		icon: '/media/Maps.svg',
		component: 'Maps',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'photos',
		name: 'Photos',
		icon: '/media/Gallery.svg',
		component: 'Photos',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'calendar',
		name: 'Calendar',
		icon: '/media/Calendar.svg',
		component: 'Calendar',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'notes',
		name: 'Notes',
		icon: '/media/Note.svg',
		component: 'Notes',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'music',
		name: 'Music',
		icon: '/media/Music.svg',
		component: 'Music',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'settings',
		name: 'Settings',
		icon: '/media/Settings.svg',
		component: 'Settings',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},

	// --- Desktop Apps (Utilities & Others) ---
	{
		id: 'calculator',
		name: 'Calculator',
		icon: '/media/Calculator.svg',
		component: 'Calculator',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'clock',
		name: 'Clock',
		icon: '/media/Clock.svg',
		component: 'Clock',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'camera',
		name: 'Camera',
		icon: '/media/Camera.svg',
		component: 'Camera',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'files',
		name: 'Files',
		icon: '/media/Files.svg',
		component: 'Files',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'phone',
		name: 'Phone',
		icon: '/media/Call.svg',
		component: 'Phone',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'terminal',
		name: 'Terminal',
		icon: '/media/Terminal.svg',
		component: 'Terminal',
		platform: 'macos',
		showInDock: false,
		showOnDesktop: true,
	},
];

interface AppsStore {
	apps: AppMetadata[];
	runningApps: Set<string>;
	iosAppPositions: Map<string, number>; // Map appId to grid position (0-19)
	getAppById: (id: string) => AppMetadata | undefined;
	launchApp: (id: string) => void;
	closeApp: (id: string) => void;
	isAppRunning: (id: string) => boolean;
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
}

// Initialize iosAppPositions - assign sequential positions to ios apps
// Home apps: positions 0-19, Dock apps: positions 100-103 (separate from home)
const initialIosApps = defaultApps.filter(app => app.platform === 'ios' || app.platform === 'both');
const initialIosPositions = new Map<string, number>();
const DOCK_START_POSITION = 100; // Dock apps start at position 100
const DOCK_APPS_COUNT = 4; // Last 4 apps go to dock

initialIosApps.forEach((app, index) => {
	// Last N apps go to dock, rest go to home
	if (index >= initialIosApps.length - DOCK_APPS_COUNT) {
		// Dock position: 100 + (index - (total - dock_count))
		const dockIndex = index - (initialIosApps.length - DOCK_APPS_COUNT);
		initialIosPositions.set(app.id, DOCK_START_POSITION + dockIndex);
	} else {
		// Home position: 0-19
		initialIosPositions.set(app.id, index);
	}
});

export const useAppsStore = create<AppsStore>((set, get) => ({
	apps: defaultApps,
	runningApps: new Set(),
	iosAppPositions: initialIosPositions,
	getAppById: (id: string) => {
		return get().apps.find(app => app.id === id);
	},
	launchApp: (id: string) => {
		set(state => ({
			runningApps: new Set([...state.runningApps, id]),
		}));
	},
	closeApp: (id: string) => {
		set(state => {
			const newRunning = new Set(state.runningApps);
			newRunning.delete(id);
			return { runningApps: newRunning };
		});
	},
	isAppRunning: (id: string) => {
		return get().runningApps.has(id);
	},
	reorderIosApps: (fromIndex: number, toIndex: number) => {
		set(state => {
			const DOCK_START_POSITION = 100;

			// Only allow reordering within home positions (0-19), not dock (100+)
			if (fromIndex >= DOCK_START_POSITION || toIndex >= DOCK_START_POSITION) {
				return state; // Don't allow moving dock apps or to dock positions
			}

			// Get current iosApps
			const currentIosApps = state.apps.filter(
				app => app.platform === 'ios' || app.platform === 'both'
			);

			// Find app at fromIndex by checking positions (only home positions)
			const appAtFromIndex = currentIosApps.find(app => {
				const pos = state.iosAppPositions.get(app.id);
				return pos === fromIndex && pos < DOCK_START_POSITION;
			});

			if (!appAtFromIndex) return state;

			// Check if toIndex is an empty space (no app at that position, only home positions)
			const appAtToIndex = currentIosApps.find(app => {
				const pos = state.iosAppPositions.get(app.id);
				return pos === toIndex && pos < DOCK_START_POSITION;
			});

			// Create new positions map - MUST be a new Map instance for React to detect changes
			const newPositions = new Map<string, number>();

			// Copy all existing positions first (including dock apps - they stay unchanged)
			currentIosApps.forEach(app => {
				const pos = state.iosAppPositions.get(app.id);
				if (pos !== undefined) {
					newPositions.set(app.id, pos);
				}
			});

			// Simple Shift Logic for Insert/Reorder
			// This handles both same-page and cross-page (e.g. 5 -> 25)

			// 1. Identify valid home apps (positions < DOCK_START_POSITION)
			// 2. Identify the app being moved
			const movingAppId = appAtFromIndex.id;

			// 3. Iterate all home apps to update positions
			currentIosApps.forEach(app => {
				const currentPos = state.iosAppPositions.get(app.id);
				if (currentPos === undefined || currentPos >= DOCK_START_POSITION) return;

				if (app.id === movingAppId) {
					// This is the moved app
					newPositions.set(app.id, toIndex);
				} else {
					// Other apps - shift if in range
					if (fromIndex < toIndex) {
						// Moving Down (e.g. 0 -> 5). Apps 1,2,3,4,5 need to shift UP (-1) to 0,1,2,3,4
						if (currentPos > fromIndex && currentPos <= toIndex) {
							newPositions.set(app.id, currentPos - 1);
						}
					} else {
						// Moving Up (e.g. 5 -> 0). Apps 0,1,2,3,4 need to shift DOWN (+1) to 1,2,3,4,5
						if (currentPos >= toIndex && currentPos < fromIndex) {
							newPositions.set(app.id, currentPos + 1);
						}
					}
				}
			});

			// Reorder apps array based on new positions
			const sortedApps = [...currentIosApps].sort((a, b) => {
				const posA = newPositions.get(a.id) ?? Infinity;
				const posB = newPositions.get(b.id) ?? Infinity;
				return posA - posB;
			});

			// Get non-ios apps (keep their order)
			const otherApps = state.apps.filter(
				app => !(app.platform === 'ios' || app.platform === 'both')
			);

			return {
				apps: [...sortedApps, ...otherApps],
				iosAppPositions: newPositions,
			};
		});
	},
}));

// Selector functions for computed values
export const selectIosApps = (state: AppsStore) =>
	state.apps.filter(app => app.platform === 'ios' || app.platform === 'both');

export const selectMacosApps = (state: AppsStore) =>
	state.apps.filter(app => app.platform === 'macos' || app.platform === 'both');
