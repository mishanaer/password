# Password

An animated OTP input playground for [mishanaer.com/ui](https://mishanaer.com/ui), adapted from [Smintfy/ui-snippet](https://github.com/Smintfy/ui-snippet/tree/421bd3b9c39f81f89cc38a5bc1b9df9de2679cbd). Uses existing [Deslop primitives](https://github.com/mishanaer/deslop/tree/main/primitives), Richbox controls, and Geist.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open [localhost:3000](http://127.0.0.1:3000/). `/ui/otp` serves the same playground.

## Behavior

- Select 4, 5, or 6 digits and animation speed 0.5× or 1×.
- Toggle Mask to display entered digits as `*`. Empty cells keep their placeholder; toggling preserves the entered code and pending verification.
- The first cell is focused on entry and after changing length.
- In the playground, typing a digit outside the input focuses it and appends the digit. Other editable controls and keyboard shortcuts are left alone.
- Six digits are split into two groups with a separator.
- Completing the code starts a local check lasting exactly 2 seconds, independent of animation speed.
- Editing cancels the previous check; a complete replacement starts a fresh check. Changing length or unmounting also cancels pending work.
- Both outcomes clear the code and focus the first cell. An incorrect code shakes the row.
- Status is announced to assistive technology. Visible success/error messages are intentionally omitted in this minimal playground.

**Demo only:** accepted codes are `1234`, `12345`, and `123456`. This is not authentication, a password manager, or an SMS integration. There is no backend or storage of entered codes. A production integration must verify codes on the server.

## Component

`components/snippets/family-style-otp.tsx` exports `FamilyStyleOTP`, with optional `length` (4/5/6, default 6), `speed` (default 1), `mask` (default false), and `captureUnfocusedInput` (default false) props. `components/otp-playground.tsx` adds the settings panel. The component uses the shared CSS and color tokens loaded by `app/globals.css`.

At 1×, digit and row movement uses Motion spring `visualDuration: 0.18`, `bounce: 0.15`; fades use `0.08 s`, `easeOut`. Focus movement uses `0.12 s`, `easeInOut`. Error shake lasts `0.3 s`. The verification pulse uses `0.6 s`, `ease-in-out`, with `0.1 s` spacing between cells. At 0.5× animation durations double. Cells stay 36×40 px with a 12 px radius.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm audit
```

See [AUDIT.md](AUDIT.md) for the review, manual regression checks, and remaining limitations.

## Attribution

The OTP is adapted from Smintfy/ui-snippet under [MIT](LICENSE). Shared controls and tokens retain their [source references and licenses](components/richbox/README.md). Changes include the settings panel, design tokens, spring digit/length transitions, automatic verification, cancellation on edits, and focus stacking fixes.
