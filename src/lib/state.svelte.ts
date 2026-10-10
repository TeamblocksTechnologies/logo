import {
	EXPORT_DEFAULTS,
	LOGO_DEFAULTS,
	type ExportSettings,
	type LogoSettings,
	type Variant
} from './logo/defaults';

const STORAGE_KEY = 'teamblocks-logo:v2';

interface AppState {
	logo: LogoSettings;
	export: ExportSettings;
	selected: Variant;
	reference: { visible: boolean; opacity: number; difference: boolean };
}

const initial = (): AppState => ({
	logo: structuredClone(LOGO_DEFAULTS),
	export: structuredClone(EXPORT_DEFAULTS),
	selected: 'logo',
	reference: { visible: false, opacity: 0.5, difference: true }
});

/** Copies saved values onto the defaults, ignoring keys that no longer exist. */
function merge<T>(base: T, saved: unknown): T {
	if (typeof base !== 'object' || base === null) {
		return typeof saved === typeof base ? (saved as T) : base;
	}
	if (typeof saved !== 'object' || saved === null) return base;
	const out = { ...base } as Record<string, unknown>;
	for (const key of Object.keys(out)) {
		out[key] = merge(out[key], (saved as Record<string, unknown>)[key]);
	}
	return out as T;
}

function load(): AppState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return merge(initial(), JSON.parse(raw));
	} catch {
		// Fall through to defaults.
	}
	return initial();
}

export const app: AppState = $state(load());

export function persist() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
}

export function resetLogo() {
	app.logo = structuredClone(LOGO_DEFAULTS);
}

export function resetExport() {
	app.export = structuredClone(EXPORT_DEFAULTS);
}
