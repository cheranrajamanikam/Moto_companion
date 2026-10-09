# MotoCompanion — Merge Changelog

## Base Project
Cheran's motocompanion-code-export — selected as base for complete TanStack Router + Supabase + shadcn/ui setup.

## Integrated from Sanjay
- Assets: asphalt-texture.jpg, bike-silhouette.png, hero-india-dark.jpg, hero-india-light.jpg, safety-gear.jpg, satellite-map.jpg, community-ride.jpg
- Components: DemoBanner.tsx, Reveal.tsx, SiteHeader.tsx, SiteFooter.tsx
- Landing page: merged unique sections and feature content
- Register page: merged perk items and layout improvements

## Integrated from Syed
- Types: src/types/rider.ts (full type system for riders, bikes, KYC, matches)
- Mock data: src/data/mockData.ts
- Services: userService, matchingService, kycService, bikeService, rideService, requestService, notificationService
- Components: 20+ matching components in src/components/matching/
- Routes: dashboard, kyc, match, match-pillion, profile, bikes, notifications, rides, ride-requests, preferences

## Integrated from Dikshith
- Features: src/features/rider-ai/ (AI Riding Companion with voice, route intelligence, gear recommendations)
- Features: src/features/community-chat/ (Real-time Discord-like community chat)
- Server: server/rider-ai-handler.ts
- Routes: ai-companion, chat

## Conflicts Resolved
- Supabase: unified to Cheran's client at src/integrations/supabase/client.ts
- Router: all Syed's react-router-dom imports replaced with @tanstack/react-router
- Naming: Syed's Badge.tsx renamed to RiderBadge.tsx to avoid conflict with shadcn Badge
- Imports: all relative imports updated to @/ alias paths

## Environment Variables Required
See .env.example
