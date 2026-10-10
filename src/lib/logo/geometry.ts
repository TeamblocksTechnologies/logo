import { ARROW_LENGTH, type IconSettings } from './defaults';

export interface Vec {
	x: number;
	y: number;
}

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

const vec = (x: number, y: number): Vec => ({ x, y });
const add = (a: Vec, b: Vec) => vec(a.x + b.x, a.y + b.y);
const sub = (a: Vec, b: Vec) => vec(a.x - b.x, a.y - b.y);
const mul = (a: Vec, k: number) => vec(a.x * k, a.y * k);
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x;
const len = (a: Vec) => Math.hypot(a.x, a.y);
const norm = (a: Vec) => mul(a, 1 / (len(a) || 1));
const toRad = (deg: number) => (deg * Math.PI) / 180;

export const emptyBounds = (): Bounds => ({
	minX: Infinity,
	minY: Infinity,
	maxX: -Infinity,
	maxY: -Infinity
});

export function unionBounds(a: Bounds, b: Bounds): Bounds {
	return {
		minX: Math.min(a.minX, b.minX),
		minY: Math.min(a.minY, b.minY),
		maxX: Math.max(a.maxX, b.maxX),
		maxY: Math.max(a.maxY, b.maxY)
	};
}

function boundsOf(points: Vec[]): Bounds {
	const b = emptyBounds();
	for (const p of points) {
		b.minX = Math.min(b.minX, p.x);
		b.minY = Math.min(b.minY, p.y);
		b.maxX = Math.max(b.maxX, p.x);
		b.maxY = Math.max(b.maxY, p.y);
	}
	return b;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Back angles between a straight back edge and the inner corner reaching the tip. */
export const backAngleRange = (icon: IconSettings) => ({
	min: -icon.tipAngle / 2,
	max: 89 - icon.tipAngle
});

/**
 * Sharp corners of one symmetric arrow, with the tip at the origin and the
 * inner edge running straight down. Order: tip, far wing, inner corner, near wing.
 */
export function arrowCorners(icon: IconSettings): Vec[] {
	const a = toRad(icon.tipAngle);
	const { min, max } = backAngleRange(icon);
	const b = toRad(clamp(icon.backAngle, min, max));
	const tip = vec(0, 0);
	const nearWing = vec(0, ARROW_LENGTH);
	const farWing = vec(-ARROW_LENGTH * Math.sin(a), ARROW_LENGTH * Math.cos(a));
	// The inner corner sits on the arrow's axis, where a back edge leaving the
	// far wing at the back angle crosses it.
	const depth = (ARROW_LENGTH * Math.cos(a + b)) / Math.cos(a / 2 + b);
	const inner = vec(-depth * Math.sin(a / 2), depth * Math.cos(a / 2));
	return [tip, farWing, inner, nearWing];
}

/**
 * The two arrows' sharp corners, centred on the origin. The far wings sit on
 * the horizontal centre line and the second arrow is the first rotated 180°.
 */
export function iconPolygons(icon: IconSettings): Vec[][] {
	const corners = arrowCorners(icon);
	const shift = vec(-icon.gap / 2, -corners[1].y);
	const first = corners.map((p) => add(p, shift));
	return [first, first.map((p) => mul(p, -1))];
}

export interface RoundedShape {
	/** Path data, translated by the given offset. */
	d: string;
	bounds: Bounds;
}

const fmt = (n: number) => {
	const r = Math.round(n * 1000) / 1000;
	return Object.is(r, -0) ? '0' : String(r);
};

/** Polygon with circular-arc corners. Radii shrink when corners would overlap. */
export function roundedPolygon(
	points: Vec[],
	radii: number[],
	offset: Vec = vec(0, 0)
): RoundedShape {
	const n = points.length;
	const corners = points.map((p, i) => {
		const prev = points[(i - 1 + n) % n];
		const next = points[(i + 1) % n];
		const toPrev = norm(sub(prev, p));
		const toNext = norm(sub(next, p));
		const angle = Math.acos(Math.min(1, Math.max(-1, dot(toPrev, toNext))));
		const flat = Math.PI - angle < 1e-4;
		const t = flat || radii[i] <= 0 ? 0 : radii[i] / Math.tan(angle / 2);
		return { p, toPrev, toNext, angle, t, clockwise: cross(sub(p, prev), sub(next, p)) > 0 };
	});

	const scale = corners.map(() => 1);
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		const edge = len(sub(points[j], points[i]));
		const used = corners[i].t + corners[j].t;
		if (used > edge) {
			const k = edge / used;
			scale[i] = Math.min(scale[i], k);
			scale[j] = Math.min(scale[j], k);
		}
	}

	const outline: Vec[] = [];
	const parts: string[] = [];
	const pt = (v: Vec) => `${fmt(v.x + offset.x)} ${fmt(v.y + offset.y)}`;

	corners.forEach((c, i) => {
		const t = c.t * scale[i];
		const start = add(c.p, mul(c.toPrev, t));
		const end = add(c.p, mul(c.toNext, t));
		parts.push(`${i === 0 ? 'M' : 'L'}${pt(start)}`);
		outline.push(start);
		if (t > 1e-6) {
			const r = t * Math.tan(c.angle / 2);
			parts.push(`A${fmt(r)} ${fmt(r)} 0 0 ${c.clockwise ? 1 : 0} ${pt(end)}`);
			// Sample the arc so bounds follow the rounded outline.
			const centre = add(c.p, mul(norm(add(c.toPrev, c.toNext)), r / Math.sin(c.angle / 2)));
			const a0 = Math.atan2(start.y - centre.y, start.x - centre.x);
			let delta = Math.atan2(end.y - centre.y, end.x - centre.x) - a0;
			if (delta > Math.PI) delta -= 2 * Math.PI;
			if (delta < -Math.PI) delta += 2 * Math.PI;
			for (let s = 1; s <= 16; s++) {
				const a = a0 + (delta * s) / 16;
				outline.push(add(centre, vec(Math.cos(a) * r, Math.sin(a) * r)));
			}
		}
	});
	parts.push('Z');

	const b = boundsOf(outline);
	return {
		d: parts.join(''),
		bounds: {
			minX: b.minX + offset.x,
			minY: b.minY + offset.y,
			maxX: b.maxX + offset.x,
			maxY: b.maxY + offset.y
		}
	};
}

/** Both arrows, scaled and then translated by `offset`. */
export function iconShape(icon: IconSettings, scale = 1, offset: Vec = vec(0, 0)) {
	const radii = [icon.tipRadius, icon.wingRadius, icon.innerRadius, icon.wingRadius].map(
		(r) => r * scale
	);
	const shapes = iconPolygons(icon).map((poly) =>
		roundedPolygon(
			poly.map((p) => mul(p, scale)),
			radii,
			offset
		)
	);
	return {
		d: shapes.map((s) => s.d).join(''),
		bounds: unionBounds(shapes[0].bounds, shapes[1].bounds)
	};
}
