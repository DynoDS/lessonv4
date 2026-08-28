# Educational SVG

Educational SVG is the shared local picture library for Teaching Plugins.

Slide, worksheet, and working-wall designers use the same search tool. They do
not need to know the folder names. Other teaching workflows can use the tool
without adding a server or a separate connection.

## Current library

The organised library contains 135,610 SVGs.

The files are stored in `library` and grouped by visual style:

- `library/standard`
- `library/cartoon`
- `library/solid`

Each style uses short alphabetical folders. This keeps each folder manageable while preserving clear, stable paths.

## Search

Use one or more short, concrete queries. Alternative queries improve recall
when the first classroom phrase does not match a file name.

```powershell
node lesson-resources/educational-svg/search.js --query "man praying" --query "person prayer" --style cartoon --limit 12
```

The tool searches the fixed `library` folder beside itself. It ships inside the
Lesson Resources plugin, so no separate service or connection is needed. A
normal search takes a fraction of a second and does not use the network.

When the library is absent, the tool prints one
`EDUCATIONAL_SVG_UNAVAILABLE` result and exits successfully. Optional picture
work can then use its existing fallback without stopping the lesson.
