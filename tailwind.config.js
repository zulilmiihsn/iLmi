/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			colors: {
				// macOS colors
				'macos-blue': '#007AFF',
				'macos-gray': '#8E8E93',
				'macos-bg': 'rgba(255, 255, 255, 0.1)',
				'macos-bg-dark': 'rgba(0, 0, 0, 0.2)',
				// iOS colors
				'ios-blue': '#007AFF',
				'ios-gray': '#8E8E93',
				// Theme colors (mapped to CSS variables)
				'bg-primary': 'var(--bg-primary)',
				'bg-secondary': 'var(--bg-secondary)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
			},
			fontFamily: {
				sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont'],
			},
			borderRadius: {
				'ios-icon': '22px',
				'ios-card': '14px',
				'macos-window': '10px',
			},
		},
	},
	plugins: [],
};
