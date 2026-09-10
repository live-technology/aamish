# AAM-059 — Refresh the landing-page hero copy

## Problem

The landing-page hero repeats the new five-star-chef positioning as supporting text while retaining an older headline.

## Acceptance criteria

- The hero headline reads: **The taste of home, made by five-star chefs.**
- The former headline and duplicate supporting line are removed.
- The metadata uses the same positioning.
- Desktop and mobile hero layouts remain usable.

## Out of scope

No changes to the enquiry flow, administrator inbox, authentication, database, or other landing-page copy.

## Validation

Run `bun run lint` and `bun run build` from `apps/web`; inspect the local page at desktop and narrow widths.
