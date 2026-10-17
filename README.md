# HackHer

Single-page site for HackHer 2027, built around "write your own story."

```sh
npm install
npm run dev
```

## How it's put together

| Piece | File |
|---|---|
| Hero + storybook that opens and flips as you scroll | `src/components/StoryBook.jsx` |
| Women featured in the book | `src/data/women.js` |
| Bunny hopping along the trail through the sections | `src/components/BunnyTrail.jsx` |
| Section content (About, Stories, Sponsors, FAQ, Contact) | `src/components/Sections.jsx` |
| Sticker border + shadow | `src/components/StickerFilters.jsx` |

Animation: [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) with [Lenis](https://lenis.darkroom.engineering/) smooth scrolling.
With "reduce motion" turned on, the book doesn't pin and gets page buttons instead, and the bunny doesn't hop.

## Adding a drawing

1. Scan or photograph it in even light and put the original in `art/raw/`.
2. Turn it into a sticker:
   ```sh
   # pencil on paper
   npm run stickers -- art/raw/ada.jpg public/stickers/ada.webp
   # digital art on a flat background
   npm run stickers -- art/raw/logo.png public/stickers/logo.webp --mode flat --width 400
   ```
3. Use it with the sticker border: `<img className="sticker-sm" src="/stickers/ada.webp" />`
   (`sticker-lg` for big pieces). For portraits, set `portrait: '/stickers/ada.webp'` in `women.js`.

## Redrawing the book

The page text sits on four corner points per page, measured in `book.webp`'s pixels (`PAGES` in `StoryBook.jsx`).
If you replace the book sketch, open `http://localhost:5173/?debug` to see the page outlines and nudge the corners until they sit inside your pencil lines.
