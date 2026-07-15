/**
 * Generate PWA PNG icons from the SVG favicon.
 *
 * Run once locally:
 *   npx @aspect-build/imagemagick convert -background none -density 384 \
 *       client/public/favicon.svg -resize 192x192 client/public/icon-192.png
 *   npx @aspect-build/imagemagick convert -background none -density 1024 \
 *       client/public/favicon.svg -resize 512x512 client/public/icon-512.png
 *
 * Or use any SVG-to-PNG tool / favicon generator (e.g. https://realfavicongenerator.net).
 * Place the output as client/public/icon-192.png and client/public/icon-512.png.
 */
console.log(
  'Generate icon-192.png and icon-512.png from favicon.svg using a tool like realfavicongenerator.net',
)
