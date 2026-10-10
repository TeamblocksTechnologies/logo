import type { ExportSettings, FrameSettings, LogoSettings, Variant } from './defaults.ts';
import { iconShape, unionBounds, type Vec } from './geometry.ts';
import { fontSizeForCapHeight, textShape, type Font } from './text.ts';

export interface Artboard {
	variant: Variant;
	width: number;
	height: number;
	iconPath: string;
	textPath: string;
	/** Where the centre of the icon sits inside the frame. */
	iconCentre: Vec;
	/** Pixels per logo unit. */
	scale: number;
}

/** Lays the design out in logo units, then scales it to fit inside the frame's padding. */
export function buildArtboard(
	variant: Variant,
	logo: LogoSettings,
	frame: FrameSettings,
	font: Font | null
): Artboard {
	const roundness = logo.favicon.roundness / 100;
	const iconSettings =
		variant === 'favicon'
			? {
					...logo.icon,
					gap: logo.icon.gap * logo.favicon.gapMultiplier,
					tipRadius: logo.icon.tipRadius * roundness,
					wingRadius: logo.icon.wingRadius * roundness,
					innerRadius: logo.icon.innerRadius * roundness
				}
			: logo.icon;
	if (variant === 'favicon') {
		frame = { width: frame.width, height: frame.width, paddingX: 0, paddingY: 0 };
	}
	const icon = iconShape(iconSettings);
	let content = icon.bounds;

	const { wordmark } = logo;
	const fontSize = font ? fontSizeForCapHeight(font, wordmark.size) : 0;
	let text: { x: number; baseline: number } | null = null;
	if (variant === 'logo' && font && wordmark.text.trim()) {
		const baseline = wordmark.size / 2 + wordmark.offsetY;
		const probe = textShape(font, wordmark.text, fontSize, wordmark.letterSpacing, 0, baseline);
		if (Number.isFinite(probe.bounds.minX)) {
			const x = icon.bounds.maxX + wordmark.gap - probe.bounds.minX;
			text = { x, baseline };
			content = unionBounds(content, {
				...probe.bounds,
				minX: probe.bounds.minX + x,
				maxX: probe.bounds.maxX + x
			});
		}
	}

	const contentW = content.maxX - content.minX;
	const contentH = content.maxY - content.minY;
	const availW = Math.max(1, frame.width - frame.paddingX * 2);
	const availH = Math.max(1, frame.height - frame.paddingY * 2);
	const scale = Math.min(availW / contentW, availH / contentH);
	const offset = {
		x: (frame.width - contentW * scale) / 2 - content.minX * scale,
		y: (frame.height - contentH * scale) / 2 - content.minY * scale
	};

	return {
		variant,
		width: frame.width,
		height: frame.height,
		iconPath: iconShape(iconSettings, scale, offset).d,
		textPath:
			text && font
				? textShape(
						font,
						wordmark.text,
						fontSize * scale,
						wordmark.letterSpacing,
						text.x * scale + offset.x,
						text.baseline * scale + offset.y
					).d
				: '',
		iconCentre: offset,
		scale
	};
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function renderSvg(
	art: Artboard,
	colors: ExportSettings['colors'],
	options: { width?: number; height?: number; extra?: string } = {}
) {
	const { width = art.width, height = art.height, extra = '' } = options;
	const lines = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${art.width} ${art.height}" fill="none">`
	];
	if (!colors.transparent) {
		lines.push(
			`<rect width="${art.width}" height="${art.height}" fill="${attr(colors.background)}"/>`
		);
	}
	lines.push(`<path d="${art.iconPath}" fill="${attr(colors.icon)}"/>`);
	if (art.textPath) lines.push(`<path d="${art.textPath}" fill="${attr(colors.text)}"/>`);
	if (extra) lines.push(extra);
	lines.push('</svg>');
	return lines.join('\n');
}
