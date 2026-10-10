/**
 * Renders every logo variant from src/lib/logo/defaults.ts into exports/,
 * plus transparent-background copies in exports/transparent/.
 * Run with `pnpm export`.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';
import { EXPORT_DEFAULTS, LOGO_DEFAULTS, type Variant } from '../src/lib/logo/defaults.ts';
import { buildArtboard, renderSvg } from '../src/lib/logo/layout.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = `${root}exports`;
const variants: Variant[] = ['icon', 'logo', 'favicon'];
const pngScales = [1, 2, 4];

const fontFile = await readFile(`${root}static/fonts/DMSans-Black.ttf`);
const font = opentype.parse(
	fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength)
);

const sets = [
	{ dir: outDir, colors: EXPORT_DEFAULTS.colors },
	{ dir: `${outDir}/transparent`, colors: { ...EXPORT_DEFAULTS.colors, transparent: true } }
];

await rm(outDir, { recursive: true, force: true });

for (const { dir, colors } of sets) {
	await mkdir(dir, { recursive: true });
	const label = dir.slice(root.length);

	for (const variant of variants) {
		const art = buildArtboard(variant, LOGO_DEFAULTS, EXPORT_DEFAULTS.frames[variant], font);
		const svg = renderSvg(art, colors);
		const name = `teamblocks-${variant}`;
		await writeFile(`${dir}/${name}.svg`, `${svg}\n`);
		console.log(`${label}/${name}.svg  ${art.width} × ${art.height}`);

		for (const scale of pngScales) {
			const png = new Resvg(svg, { fitTo: { mode: 'width', value: art.width * scale } })
				.render()
				.asPng();
			const file = `${name}${scale === 1 ? '' : `@${scale}x`}.png`;
			await writeFile(`${dir}/${file}`, png);
			console.log(`${label}/${file}  ${art.width * scale} × ${art.height * scale}`);
		}
	}
}
