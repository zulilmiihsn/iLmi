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
const DOCK_START_POSITION = 100;

// Default Dock Apps (User requested: Safari, Music, Messages, Call)
const DEFAULT_DOCK_IDS = ['safari', 'music', 'messages', 'phone'];

let gridIndex = 0;

initialIosApps.forEach((app) => {
	const dockIndex = DEFAULT_DOCK_IDS.indexOf(app.id);
	if (dockIndex !== -1) {
		// Assign to specific dock slot based on checking order
		initialIosPositions.set(app.id, DOCK_START_POSITION + dockIndex);
	} else {
		// Assign to next available grid slot
		initialIosPositions.set(app.id, gridIndex);
		gridIndex++;
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

			// Get current iosApps
			const currentIosApps = state.apps.filter(
				app => app.platform === 'ios' || app.platform === 'both'
			);

			// Find app at fromIndex
			const appAtFromIndex = currentIosApps.find(app => {
				const pos = state.iosAppPositions.get(app.id);
				return pos === fromIndex;
			});

			if (!appAtFromIndex) return state;

			const movingAppId = appAtFromIndex.id;

			// Separate into Grid and Dock arrays based on CURRENT positions
			const gridApps: string[] = [];
			const dockApps: string[] = [];

			// Sort apps by position first to ensure correct array order
			const sortedApps = [...currentIosApps].sort((a, b) => {
				const posA = state.iosAppPositions.get(a.id) ?? Infinity;
				const posB = state.iosAppPositions.get(b.id) ?? Infinity;
				return posA - posB;
			});

			sortedApps.forEach(app => {
				if (app.id === movingAppId) return; // Skip moving app for now
				const pos = state.iosAppPositions.get(app.id) ?? -1;
				if (pos >= DOCK_START_POSITION) {
					dockApps.push(app.id);
				} else {
					gridApps.push(app.id);
				}
			});

			// Insert moving app into target array
			if (toIndex >= DOCK_START_POSITION) {
				// Target is Dock
				const relativeIndex = Math.min(toIndex - DOCK_START_POSITION, dockApps.length);
				dockApps.splice(relativeIndex, 0, movingAppId);
			} else {
				// Target is Grid
				const relativeIndex = Math.min(toIndex, gridApps.length);
				gridApps.splice(relativeIndex, 0, movingAppId);
			}

			// Rebuild map
			const newPositions = new Map<string, number>();

			// 1. Grid Items (0, 1, 2...)
			gridApps.forEach((id, index) => {
				newPositions.set(id, index);
			});

			// 2. Dock Items (100, 101, 102...)
			dockApps.forEach((id, index) => {
				newPositions.set(id, DOCK_START_POSITION + index);
			});

			// Preserve other apps
			state.apps.forEach(app => {
				if (!(app.platform === 'ios' || app.platform === 'both')) return;
				if (!newPositions.has(app.id)) {
					// Should not happen if logic is correct, but keep existing if missed?
					// No, we rebuilt strictly from current lists.
				}
			});

			// Reorder apps array
			const finalSortedApps = [...currentIosApps].sort((a, b) => {
				const posA = newPositions.get(a.id) ?? Infinity;
				const posB = newPositions.get(b.id) ?? Infinity;
				return posA - posB;
			});

			const otherApps = state.apps.filter(
				app => !(app.platform === 'ios' || app.platform === 'both')
			);

			return {
				apps: [...finalSortedApps, ...otherApps],
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
