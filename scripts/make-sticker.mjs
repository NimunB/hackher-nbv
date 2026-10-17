// Turns a scanned pencil sketch (or a flat logo) into a transparent sticker image.
//
//   npm run stickers -- <input> <output.webp> [--mode scan|flat] [--width N]
//
// scan: photo of pencil on paper. Flattens uneven lighting, keeps the graphite,
//       fills the inside of the drawing with clean paper colour and removes
//       everything outside the outermost pencil line.
// flat: digital art on a plain background. Removes the background colour that
//       touches the image edges.
//
// The white sticker border itself is added in CSS (see StickerFilters.jsx), so
// every drawing gets the same border no matter what size it's shown at.

import sharp from 'sharp'

const PAPER = [247, 242, 232] // keep in sync with --paper in styles.css
const GRAPHITE = [43, 38, 51]

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const [input, output] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
const mode = flag('mode', 'scan')
const width = flag('width') && Number(flag('width'))

if (!input || !output) {
  console.error('usage: npm run stickers -- <input> <output.webp> [--mode scan|flat] [--width N]')
  process.exit(1)
}

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height
const N = W * H

const gray = new Float32Array(N)
for (let i = 0; i < N; i++) {
  gray[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2]
}

const out = Buffer.alloc(N * 4)
if (mode === 'scan') scan()
else flat()

let img = sharp(out, { raw: { width: W, height: H, channels: 4 } })
if (width) img = img.resize({ width })
await img.webp({ quality: 90, alphaQuality: 100 }).toFile(output)
console.log(`wrote ${output} (${W}x${H}${width ? ` → ${width}w` : ''}, ${mode})`)

function scan() {
  // Estimate the paper brightness everywhere (block max, then blur) so shadows
  // and uneven phone lighting don't read as pencil.
  const B = 8
  const bw = Math.ceil(W / B)
  const bh = Math.ceil(H / B)
  let small = new Float32Array(bw * bh)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const j = Math.floor(y / B) * bw + Math.floor(x / B)
      small[j] = Math.max(small[j], gray[y * W + x])
    }
  small = boxFilter(small, bw, bh, 2, Math.max)
  small = boxFilter(boxFilter(small, bw, bh, 3, mean), bw, bh, 3, mean)

  const ink = new Float32Array(N)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const bg = bilinear(small, bw, bh, x / B - 0.5, y / B - 0.5)
      const t = clamp((0.93 - gray[y * W + x] / bg) / (0.93 - 0.5))
      ink[y * W + x] = t * t * (3 - 2 * t)
    }

  // Fill the outside from the image edges; whatever the fill can't reach is the drawing.
  // Lines are thickened first so small gaps in the pencil don't let the fill leak in.
  const lines = new Uint8Array(N)
  for (let i = 0; i < N; i++) lines[i] = ink[i] > 0.3 ? 1 : 0
  const outside = floodFromEdges(dilate(lines, 5), (i, m) => !m[i])
  let region = new Uint8Array(N)
  for (let i = 0; i < N; i++) region[i] = outside[i] ? 0 : 1
  region = erode(region, 4)

  for (let i = 0; i < N; i++) {
    const k = ink[i]
    let a
    let rgb
    if (region[i]) {
      a = 1
      rgb = PAPER.map((p, c) => p + (GRAPHITE[c] - p) * k)
    } else {
      // stray strokes outside the main shape are kept, specks are dropped
      a = k > 0.35 ? k : 0
      rgb = GRAPHITE
    }
    out[i * 4] = rgb[0]
    out[i * 4 + 1] = rgb[1]
    out[i * 4 + 2] = rgb[2]
    out[i * 4 + 3] = Math.round(a * 255)
  }
}

function flat() {
  const bgColor = [0, 1, 2].map((c) => data[c])
  const dist = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(data[i * 3 + c] - bgColor[c])))
  const outside = floodFromEdges(null, (i) => dist(i) < 24)
  for (let i = 0; i < N; i++) {
    // soften the edge: pixels next to the background fade by how close they are to it
    const a = outside[i] ? 0 : touchesOutside(outside, i) ? clamp(dist(i) / 120) : 1
    out[i * 4] = data[i * 3]
    out[i * 4 + 1] = data[i * 3 + 1]
    out[i * 4 + 2] = data[i * 3 + 2]
    out[i * 4 + 3] = Math.round(a * 255)
  }
}

function floodFromEdges(mask, passable) {
  const seen = new Uint8Array(N)
  const stack = new Int32Array(N)
  let sp = 0
  const push = (i) => {
    if (!seen[i] && passable(i, mask)) {
      seen[i] = 1
      stack[sp++] = i
    }
  }
  for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x)
  for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1)
  while (sp) {
    const i = stack[--sp]
    const x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < N - W) push(i + W)
  }
  return seen
}

function touchesOutside(outside, i) {
  const x = i % W
  return (x > 0 && outside[i - 1]) || (x < W - 1 && outside[i + 1]) || outside[i - W] || outside[i + W]
}

// Square max/min filter on a binary mask, done as two 1D passes.
function morph(mask, r, hit) {
  const pass = (src, horizontal) => {
    const dst = new Uint8Array(N)
    const len = horizontal ? W : H
    const lines = horizontal ? H : W
    for (let l = 0; l < lines; l++) {
      const at = (k) => (horizontal ? l * W + k : k * W + l)
      for (let k = 0; k < len; k++) {
        let v = !hit
        for (let d = -r; d <= r; d++) {
          const kk = k + d
          if (kk >= 0 && kk < len && src[at(kk)] === (hit ? 1 : 0)) {
            v = hit
            break
          }
        }
        dst[at(k)] = v ? 1 : 0
      }
    }
    return dst
  }
  return pass(pass(mask, true), false)
}
function dilate(mask, r) { return morph(mask, r, true) }
function erode(mask, r) { return morph(mask, r, false) }

function boxFilter(src, w, h, r, reduce) {
  const get = (x, y) => src[clampI(y, h) * w + clampI(x, w)]
  const dst = new Float32Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const vals = []
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) vals.push(get(x + dx, y + dy))
      dst[y * w + x] = reduce(...vals)
    }
  return dst
}

function bilinear(src, w, h, x, y) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const g = (xx, yy) => src[clampI(yy, h) * w + clampI(xx, w)]
  return (
    g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) +
    g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy
  )
}

function mean(...v) { return v.reduce((a, b) => a + b, 0) / v.length }
function clamp(v) { return Math.min(1, Math.max(0, v)) }
function clampI(v, n) { return Math.min(n - 1, Math.max(0, v)) }
