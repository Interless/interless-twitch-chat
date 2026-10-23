# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project intends to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) after the first release.

## [Unreleased]

## [0.21.0] - 2026-10-23

### Documentation and release packaging

- Rewrite the project overview around the local editor and current StreamElements media-library workflow.
- Document all settings, troubleshooting, character commands, scale, assets and architecture without obsolete MVP instructions.
- Add consolidated v0.21.0 release notes and a tag-triggered GitHub Release workflow; run built-preview checks in CI.

### Added

- Overall chat scale slider (25–200%) in the offline preview and native StreamElements settings.
- Scale frames, dinosaurs, text, badges and message spacing together while retaining scene offsets and alignment.
- Persist preview scale in project/preset JSON and allow the native scale field to override the exported snapshot independently of the frozen theme.

### Changed

- Adjust logical viewport constraints for scaled layouts, retaining responsive widths and existing character-size controls.

## [0.20.0] - 2026-10-23

### Added

- Edit dinosaur commands in offline preview cards and native StreamElements text fields alongside media pickers.
- Support case-insensitive Latin and Cyrillic command names with optional leading exclamation mark.
- Preserve stable character IDs, media fields and viewer assignments when commands change; remove previous names as automatic aliases.
- Validate reserved and duplicate commands, retain preview defaults for invalid native edits, and persist custom commands in saved projects.

## [0.19.0] - 2026-10-23

### Changed

- Store dinosaur animations in the StreamElements media library instead of embedding Base64 files in copied JavaScript.
- Generate one native video/image picker per dinosaur command; retain dimensions, bounds and explicit media types for consistent sizing and extensionless media URLs.
- Keep imported source files in the offline preview and saved project JSON; preserve frozen appearance and selected-font export.
- Document uploads directly through Custom Widget settings, without a separate server or manual URL copying.

## [0.18.0] - 2026-10-23

### Changed

- Copy only the selected font face; keep all ten choices in the offline preview.
- Use losslessly compressed WOFF2 fonts instead of TTF, retaining the same character maps and metrics.
- Copy empty FIELDS and bake the current appearance into JS; stale StreamElements field values cannot override the copied appearance.
- Ship a compact default-font CSS while retaining the full font selection in preview.

### Added

- Reproducible font preparation with source hashes and round-trip validation.

## [0.17.1] - 2026-10-22

### Fixed

- Copy only widget CSS, without the full font license block.
- Remove duplicated font license strings from the browser JS bundle; keep notices in the separate FONT-LICENSE.txt shipped with the project.
- Verify all four clipboard payloads and reject license text in the production JS bundle.

## [0.17.0] - 2026-10-22

### Added

- Four direct clipboard buttons for HTML, CSS, JS and FIELDS using current preview settings and imported media.
- Selected plain-text fallback when clipboard access is missing or denied, with stale-code clearing on appearance changes.
- Font licenses included in copied CSS.

### Changed

- The preview installation workflow copies code instead of downloading a ZIP; project JSON save/open remains available.
- Compact preset controls are grouped under an additional details section.

## [0.16.0] - 2026-10-22

### Removed

- All shipped dinosaur media, default catalog, hardcoded selection buttons and the old media conversion script.

### Changed

- Preview and widget start with an empty character list; characters are supplied only by importing files or opening a saved project.
- The first uploaded character is the default; commands and bot help contain only the current set.
- Clear imported characters without restoring defaults or leaving broken image elements and stale assignments.
- Empty catalog entries in older presets cannot resurrect removed characters.

## [0.15.0] - 2026-10-22

### Added

- Whole-widget export at the top of preview, including every appearance setting and imported media.
- Full project JSON save/open, also included in exported ZIP, for further editing.
- Embedded settings snapshot takes precedence over stale StreamElements presets; explicit manual mode remains available.
- Step-by-step installation and update guide in preview and both release/custom archives.

### Changed

- Background decorations fade out over 900 ms before replacement, then fade in over 900 ms without overlapping generations.
- Exported field defaults match the configured preview.

## [0.14.0] - 2026-10-19

### Added

- Offline preview folder/file import with automatic commands, matching asset replacement and atomic validation.
- Portable StreamElements ZIP export with embedded assets, settings, installation instructions, bot command pages and font licenses.
- Reset imported media without resetting appearance.

### Changed

- Transparent VP9 WebM playback in chat and gallery, including embedded data URLs.
- Use the detailed dance original for trike instead of its pixelated derivative. Other source artwork remains limited by the supplied GIFs.

## [0.13.0] - 2026-10-19

- Immediate and random character assignments in the preview; lossless source conversions.
- Rename legacy commands to skel/dance; remove velo/rex commands while migrating stored selections.

## [0.12.0] - 2026-10-19

- Ten supplied dinosaurs, matching visible sizes, bot help, preset import/export and layout controls.

## [0.11.0] - 2026-10-16

### Added

- Dinosaur skull, trilobite, fern, excavation brush, laboratory flask and beer bottle icons, each with its own switch (11 total).
- Full-circle independent random rotation for each background drawing.

### Changed

- Replace cell-based positions with random placement and rotated-bounds collision rejection, retaining edge insets, gutters and short-card limits.
- Redraw the three-toed dinosaur footprint and geological pick hammer.
- Raise the background visibility slider and saved-setting limit to 70%.

## [0.10.0] - 2026-10-16

### Added

- Five original pixel background drawings: bone, field book, ammonite, geological hammer and dinosaur footprint.
- Individual icon toggles, overall switch, density, message occurrence, refresh frequency and opacity controls in the preview.
- Actual-size layout with inset, rotation clearance and non-overlapping cells; short cards cannot exceed their measured capacity.
- Automatic layout updates after resizing/font changes, independent background color and browser-persisted settings.
- Slow pattern refreshes with a static mode and bounded rendering cost.

### Changed

- Replace the fixed body cross and corner watermark with the configurable background layer, behind message text.

## [0.9.0] - 2026-10-16

### Added

- Ten original bundled fonts with complete Russian alphabet coverage: Press Start 2P, Tiny5, PT Sans, Rubik, Comfortaa, Lora, Marck Script, Bad Script, Caveat and Neucha.
- Grouped live preview font picker, Cyrillic sample, suggested sizes and a 10–40 px size slider.
- Browser persistence for the selected font and size; changes preserve messages and sides.
- Licenses and source checksums for every bundled font in the installation archive.

## [0.8.0] - 2026-10-16

### Added

- Live preview RGB/HEX palette for text, nameplates, message fills, bone frame details, role badge symbols/backgrounds/outlines and shadows.
- Independent element overrides with per-color/full reset and local browser persistence.
- Recolored SVG decorations preserve pixel shapes and the original dinosaur animations.

### Changed

- Existing StreamElements fields and event integration are unchanged; no new editor controls are installed by this release.

## [0.7.0] - 2026-10-16

### Added

- Slow smooth, stepped pixel and irregular pixel idle movement for message cards.
- Live frequency and distance sliders in the preview and matching StreamElements controls.
- Stable per-message phase, duration and direction to avoid synchronized cards.
- Automatic gap clearance for moving cards; zero/off and reduced-motion support.

### Changed

- Animate the card itself while keeping the dinosaur position stable.

## [0.6.0] - 2026-10-16

### Added

- Original second dinosaur GIF bundled offline for personal `!rex` selection.
- Per-character transparent-margin cropping and preview `!rex` button.
- Support for both built-in commands with old catalogs and empty asset URLs.

### Fixed

- Remove the pale interrupted highlight around the frame while retaining the purple outline and corner bones.

## [0.5.0] - 2026-10-16

### Added

- Reference role palette, all-light and all-dark color schemes.
- Independent 0–100% opacity controls for message fills and nameplate fills.
- Seven live preview presets, individual opacity sliders and a checkerboard background.

### Fixed

- Remove the side crosses from the nine-slice frame so they cannot stretch on tall messages.
- Keep text, badges, frame and character opaque while fading only the fills; disable solid backing shadows for translucent colors.

### Changed

- Use dark purple backgrounds and pale text for subscribers and lead moderators, matching the supplied screenshot.

## [0.4.1] - 2026-10-16

### Changed

- Use unmodified Press Start 2P with complete Russian alphabet support at 16 px and 1.5 line height.
- Migrate saved Interless Pixel settings to the ready-made font and matching metrics.
- Remove the derivative font, its upstream source and its generation script.

## [0.4.0] - 2026-10-16

### Added

- Locally drawn pixel role badges: VIP diamond, moderator sword, lead moderator hammer, broadcaster crown and viewer/subscriber cockroach.
- Lead moderator role detection from Twitch `lead_moderator` badges, including raw-tag fallback for incomplete widget badge lists.
- Preview role badge gallery and lead moderator selector.

### Changed

- Recreated the reference bone frame with larger pale corner bones, irregular purple outlines, lower drips and nameplate details.
- Narrower message cards, unified purple nameplates and a bundled reference-style Interless Pixel font with complete Russian alphabet mapping.
- Replaced the unconditional skull badge and suppressed duplicate Twitch authority badges.

## [0.3.1] - 2026-10-16

### Fixed

- Keep the chat in a compact left-anchored stack matching the reference; alternate the bubble and character order within that stack instead of moving rows to opposite edges of the browser.
- Place the first bubble on the left with the character on the right, then reverse for the second message, regardless of author role.
- Reset the preview sequence on Clear; add a numbered 1–4 demo with one author and an explicit version label.
- Keep preview controls beside the chat on wide screens and above it on smaller screens.

## [0.3.0] - 2026-10-16

### Added

- Per-user dinosaur selection via catalog-derived commands such as `!velo`.
- Configurable dinosaur catalog and initial assignments by Twitch login.
- Local persistence of personal selections by user ID and widget URL.
- Offline preview composer with author, role, multiline text and command testing.

### Changed

- Alternate message and character sides independently of role or message length.
- Preserve each message side through expiry, moderation and limit eviction.
- Consume selection commands before command filtering without advancing sides.

`velo` currently uses the original bundled dinosaur as a placeholder until its own asset is configured.

## [0.2.0] - 2026-10-16

### Added

- Reference-based purple pixel cards with bone frames, skull badges and separate nameplates.
- Original animated dinosaur and Cyrillic pixel font bundled for offline use.
- Character placement/size, per-role nameplate colors and custom WebM/MP4 playback.
- Standalone offline preview with sample Russian chat messages.

### Changed

- Replaced random placement with a configurable bottom-up chat stack.
- Added left, center and right alignment with horizontal, bottom and gap controls.
- Bound browser timer calls to `globalThis` to prevent `Illegal invocation` at runtime.

### Added

- React 19 Twitch chat overlay MVP for StreamElements and OBS.
- Normalized StreamElements adapter for chat and moderation events.
- Role priority and configurable role themes.
- Native Twitch emote and badge rendering.
- Responsive bottom-up message layout with configurable alignment and offsets.
- Message lifecycle service with timer cleanup.
- Strict TypeScript, ESLint, Prettier, Vitest, CI, Dependabot, docs, ZIP and checksum.
