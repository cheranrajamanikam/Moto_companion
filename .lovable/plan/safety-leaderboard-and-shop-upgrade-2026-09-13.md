# Safety, leaderboard, and shop upgrade

## What will change

- Rework **Safety & SOS** into a focused emergency dashboard with:
  - A large pulsing red SOS control.
  - A short, visible countdown with a cancel option before an alert is saved.
  - Location capture, sending state, success/error feedback, and recent alert resolution.
  - A crash-detection status card using supported device motion signals, with clear permission and unavailable states.
  - One consolidated emergency contacts list with add, call, and remove actions.
  - A practical SOS actions checklist that can be checked during an incident.
- Upgrade the **weekly leaderboard** into a stronger challenge card with the top three riders, current rider highlighting, weekly stats, and the full points ranking.
- Upgrade the **shop** with a prominent AI gear recommendation banner, category filters, a polished responsive product grid, rupee pricing, stock states, reliable add-to-cart feedback, and cart count.
- Preserve the current light/dark theme, navigation, data model, and existing backend security rules.

## Behavior and safety

- SOS waits through the countdown before writing the alert, so accidental taps can be cancelled.
- Crash detection will be described as browser-assisted monitoring, not a guaranteed emergency service. It will request motion permission only after the rider enables it.
- Existing rider-specific records remain protected by the current signed-in-user access rules.
- The shop recommendation banner opens the existing AI gear recommendation flow rather than duplicating it.

## Verification

- Confirm the countdown can start and cancel, and that a completed countdown saves one SOS alert.
- Confirm contact add/remove/call actions, checklist interaction, alert resolution, category filtering, add-to-cart, AI recommendation navigation, leaderboard ordering, and both themes.
- Check desktop and mobile layouts, runtime errors, and the final build status.
