# Regional layers in the existing map helper

`presentation: "regional-layers"` is a form of the ordinary `map` helper on `map: "south-america"`, for a lesson about where something is inside the continent: the Amazon rainforest crossing borders, the Equator running through Ecuador, Colombia and Brazil, with the country names a child reads off the map. It is drawn by `shared/visuals/map-regional-layers.js`, which `shared/visuals/map-svg.js` hands this presentation to, so the board, a worksheet, the working wall and the stick-in pack all draw it from the same fields.

```json
{ "type": "map", "map": "south-america", "presentation": "regional-layers",
  "view": [0, 0.03, 0.82, 0.48],
  "countryLabels": ["Brazil", "Colombia", "Peru", "Ecuador", "Bolivia", "Venezuela", "Guyana", "Suriname"],
  "regionLayers": ["Amazon rainforest"], "referenceLines": ["Equator"] }
```

## Fields

- `countryLabels`: names from Brazil, Colombia, Peru, Ecuador, Bolivia, Venezuela, Guyana, Suriname, Argentina, Chile, Paraguay, Uruguay, or `{ "text", "at": [x, y] }` for a place of your own. Each name is placed inside its own country's drawn borders when it fits there, with a white halo so it reads over shading. A country too small for its name (Ecuador, Guyana, Suriname) is named out at sea or in the margin beside the map, on a leader to a dot inside it; leaders never cross each other or run through another name. French Guiana is not offered because the shipped map draws no coastline for it, so its land reads as sea.
- `mapLabels`: `{ "text", "at" }` names placed in the sea, such as an ocean.
- `regionLayers`: `"Amazon rainforest"`, or your own `{ "text", "meaning": "rainforest" | "region", "points", "source": { "citation", "registration" } }`. Shaded with a pale fill and a hatch, so borders stay visible and the shading survives a photocopier, and named in a key in open sea (or under the map when the sea has no room).
- `referenceLines`: `"Equator"`, or your own `{ "text", "points", "source" }`. Named on the line, at sea if there is room.
- `view`: the part of the map to show, `[left, top, right, bottom]` as fractions of the image; each side at least a fifth. `[0, 0.03, 0.82, 0.48]` is northern South America, which is what lets eight names stay readable on half a slide. Leave it out for the whole continent.
- `locator: true`: a small unshaded world map under it with the continents named and the Equator. Off unless asked, because it takes space from the map it explains.
- `worksheetMode: "regional-marking"`: keeps names and lines and removes the shading and any annotations, for a task where the child shades the region.
- `annotations` (the ordinary marks) still work on top.

Positions are fractions of the 472 x 649 shipped image, never of the composed picture.

## Size

Names print at the surface's reading size and never below its floor (18pt on the board). The map is drawn as large as the slot allows; the layout that keeps most names inside their own countries wins, then the largest names. A slot too small is refused by name (`MAP_LABELS_DO_NOT_FIT`, naming the place that would not fit) rather than shrunk. On a slide give it at least half the width, ideally the 60% side of `split-h-60-40`; on the wall use `"visualScale": "dominant"`.

## Where the geography comes from

Nothing here is drawn by eye.

- **Registration.** The shipped `south-america.png` has no recorded projection, so it was measured: its drawn borders were fitted to Natural Earth 1:50m admin-0 country boundaries (public domain). A Lambert azimuthal equal-area projection centred 60.41W 28.25S, with `x = 515.25 X + 215.85`, `y = -534.89 Y + 379.49` (unit-sphere X and Y, image pixels), matches them with a median error of 0 px and a 90th percentile of 3 px over 9,291 border samples. Equirectangular, Mercator and Miller fits were two to four times worse.
- **Amazon rainforest.** Dinerstein et al. (2017), *An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm*, BioScience 67(6); Ecoregions 2017, RESOLVE, CC BY 4.0, read from the UNEP-WCMC `Resolve_Ecoregions` service. The union of the 24 lowland tropical moist forest ecoregions of Amazonia and the Guianas (listed in the layer's own `source.citation`); Andean montane forests, dry forests and savannas are left out. Small gaps under 0.15 degrees were closed, the outline projected with the fit above, clipped to the land the image draws, and simplified to 66 points (4.7% area difference). This is forest extent. The Amazon drainage basin is a different, larger area and is refused as rainforest evidence.
- **Equator.** Latitude 0 sampled every 3 degrees from 81W to 33W and projected with the same fit; the projection curves it slightly.

A lesson-supplied layer must carry `source.citation` and `source.registration`; the strings document evidence but cannot check it, so check the render against the source.

## World-site marking

The world map with `worksheetMode: "world-sites"`, `map: "world-with-antarctica"`, `presentation: "seven-continent-world"`, area and named point annotations, `showEquator: true` and a `key` keeps that evidence on a worksheet or stick-in piece, with every site in one neutral style and room for a pencil ring between sites (the piece is refused if two sites sit under 5mm apart). The stick-in pack picks this form automatically for such a map. `builder/test/map-world-sites.fixture.json` freezes one lesson's E/F map; its rainforest areas are copied teaching evidence, not a sourced outline.

## Stick-in pack

A regional map copied from a slide prints as the slide drew it, names and shading included, because the child reads the answer off that evidence. At the pack's default 150mm width one piece takes half a landscape page.
