/**
 * The canonical Teamblocks logo.
 *
 * `LOGO_DEFAULTS` defines what the logo *is* — tweak values in the app, then
 * use "Copy logo defaults" in the panel and paste the result over the object
 * below to lock them in.
 *
 * Logo values are in relative units: one arrow edge (tip to wing) is
 * `ARROW_LENGTH` units long. Exports scale the whole design to fit their
 * frame, so these never change the output size.
 *
 * `EXPORT_DEFAULTS` are starting points for how the logo gets framed and
 * exported; they are not part of the logo's identity. Frame sizes are in px.
 */

/** Length of each arrow edge, from the tip to a wing. Everything else is relative to this. */
export const ARROW_LENGTH = 100;

export interface IconSettings {
	/** Angle at the arrow's tip, in degrees. */
	tipAngle: number;
	/**
	 * Angle of the arrow's back edges against the horizontal, in degrees.
	 * 0 lines the back edges of both arrows up into one flat line; positive
	 * values pull the inner corner towards the tip.
	 */
	backAngle: number;
	/** Distance between the two arrows' inner edges. */
	gap: number;
	/** Corner radius of the arrow's tip. */
	tipRadius: number;
	/** Corner radius of the two wing points. */
	wingRadius: number;
	/** Corner radius of the inner corner. */
	innerRadius: number;
}

export interface WordmarkSettings {
	text: string;
	/** Cap height of the text. */
	size: number;
	/** Letter spacing as a percentage of the font size (like Figma). */
	letterSpacing: number;
	/** Distance between the icon and the text. */
	gap: number;
	/** Vertical nudge of the text. 0 centres the cap height on the icon. */
	offsetY: number;
}

export interface FaviconSettings {
	/** Multiplies the arrow gap so it stays visible at tiny sizes. */
	gapMultiplier: number;
	/** How much of the icon's corner rounding to keep, in %. 0 is fully sharp. */
	roundness: number;
}

export interface LogoSettings {
	icon: IconSettings;
	wordmark: WordmarkSettings;
	favicon: FaviconSettings;
}

export const LOGO_DEFAULTS: LogoSettings = {
	icon: {
		tipAngle: 59,
		backAngle: 0,
		gap: 16,
		tipRadius: 2.5,
		wingRadius: 4,
		innerRadius: 4
	},
	wordmark: {
		text: 'Teamblocks',
		size: 108,
		letterSpacing: -5,
		gap: 13,
		offsetY: 0
	},
	favicon: {
		gapMultiplier: 1.25,
		roundness: 100
	}
};

/** DM Sans, weight 900 (the heaviest available), optical size 14. */
export const FONT_URL = '/fonts/DMSans-Black.ttf';

/**
 * `icon` is the arrows alone; `logo` is the icon with the wordmark beside it;
 * `favicon` is the icon for browser tabs — always square, with no padding,
 * plus its own gap and roundness settings so it stays crisp at tiny sizes.
 */
export type Variant = 'icon' | 'logo' | 'favicon';

export interface FrameSettings {
	width: number;
	height: number;
	paddingX: number;
	paddingY: number;
}

export interface ExportSettings {
	frames: Record<Variant, FrameSettings>;
	colors: {
		icon: string;
		text: string;
		background: string;
		transparent: boolean;
	};
	format: 'svg' | 'png';
	scale: number;
}

export const EXPORT_DEFAULTS: ExportSettings = {
	frames: {
		icon: { width: 512, height: 512, paddingX: 64, paddingY: 64 },
		logo: { width: 896, height: 256, paddingX: 64, paddingY: 84 },
		favicon: { width: 32, height: 32, paddingX: 0, paddingY: 0 }
	},
	colors: {
		icon: '#ffffff',
		text: '#ffffff',
		background: '#000000',
		transparent: false
	},
	format: 'svg',
	scale: 1
};
