import type { LogoSettings } from './defaults.ts';

function download(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svg: string, filename: string) {
	download(new Blob([svg], { type: 'image/svg+xml' }), `${filename}.svg`);
}

export async function downloadPng(svg: string, width: number, height: number, filename: string) {
	const img = new Image();
	img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	await img.decode();
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(width);
	canvas.height = Math.round(height);
	canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
	URL.revokeObjectURL(img.src);
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (blob) download(blob, `${filename}.png`);
}

/** Source for `LOGO_DEFAULTS`, ready to paste into src/lib/logo/defaults.ts. */
export function logoDefaultsSource(logo: LogoSettings) {
	const round = (_: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
	const json = JSON.stringify(logo, round, '\t');
	const body = json.replace(/"([a-zA-Z]+)":/g, '$1:');
	return `export const LOGO_DEFAULTS: LogoSettings = ${body};\n`;
}
