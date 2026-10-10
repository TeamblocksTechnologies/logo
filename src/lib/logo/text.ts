import opentype from 'opentype.js';
import { emptyBounds, type Bounds } from './geometry.ts';

export type Font = opentype.Font;

export async function loadFont(url: string): Promise<Font> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`);
	return opentype.parse(await res.arrayBuffer());
}

const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

// opentype.js's own toPathData rounding produces NaN for some coordinates.
function pathData(path: opentype.Path) {
	return path.commands
		.map((c) => {
			switch (c.type) {
				case 'M':
				case 'L':
					return `${c.type}${fmt(c.x)} ${fmt(c.y)}`;
				case 'Q':
					return `Q${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x)} ${fmt(c.y)}`;
				case 'C':
					return `C${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x2)} ${fmt(c.y2)} ${fmt(c.x)} ${fmt(c.y)}`;
				default:
					return 'Z';
			}
		})
		.join('');
}

/** Font size that gives the requested cap height. */
export function fontSizeForCapHeight(font: Font, capHeight: number) {
	const os2 = font.tables.os2 as { sCapHeight?: number } | undefined;
	return (capHeight * font.unitsPerEm) / (os2?.sCapHeight ?? font.unitsPerEm * 0.7);
}

/**
 * Lays out text as outlines, starting at `x` on the `baseline`. Glyphs are
 * placed one by one with kerning because opentype.js can't shape this font.
 */
export function textShape(
	font: Font,
	text: string,
	fontSize: number,
	letterSpacing: number,
	x = 0,
	baseline = 0
) {
	const scale = fontSize / font.unitsPerEm;
	const tracking = (letterSpacing / 100) * fontSize;
	const parts: string[] = [];
	let bounds: Bounds = emptyBounds();
	let prev: opentype.Glyph | null = null;
	let pen = x;

	for (const char of text) {
		const glyph = font.charToGlyph(char);
		if (prev) pen += font.getKerningValue(prev, glyph) * scale + tracking;
		const path = glyph.getPath(pen, baseline, fontSize);
		const d = pathData(path);
		if (d) {
			parts.push(d);
			const b = path.getBoundingBox();
			bounds = {
				minX: Math.min(bounds.minX, b.x1),
				minY: Math.min(bounds.minY, b.y1),
				maxX: Math.max(bounds.maxX, b.x2),
				maxY: Math.max(bounds.maxY, b.y2)
			};
		}
		pen += (glyph.advanceWidth ?? 0) * scale;
		prev = glyph;
	}

	return { d: parts.join(''), bounds };
}
