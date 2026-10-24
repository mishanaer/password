# Shared controls and tokens

Button and its required helpers are copied from [mishanaer/richbox](https://github.com/mishanaer/richbox/tree/90f63f19da4b5a58b72ae1319afda196db664c63/demo/react), commit `90f63f19da4b5a58b72ae1319afda196db664c63`.

Button behavior, geometry, and shared color tokens are unchanged. Its icon type import points to `icon-types.ts`, which retains only the original type contract; the unused icon registry and Lucide dependency were removed. Unused controls and their helpers were omitted. `fluid.css` no longer scans removed files; `styles/richbox/style.css` retains only the demo layout rules used here. The application uses Geist.

`LICENSE.richbox`, `LICENSE.upstream`, and `upstream.json` preserve attribution. Shared primitive source is kept intact rather than creating local button variants.
