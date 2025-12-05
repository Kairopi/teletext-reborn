# Product Overview

**Teletext Reborn** is a premium nostalgic web application that resurrects the iconic Teletext/Ceefax information service (1974-2012) with modern capabilities.

## Mission

Build an **AAA-quality web experience** that creates genuine delight and nostalgia while being 100% error-free and accessible.

## Core Features

- **Live Mode**: Real-time news, weather, and cryptocurrency data in authentic Teletext style
- **Enhanced Time Machine**: History.com-inspired "Today in History" experience with:
  - Simplified date selection (month/day only, defaults to TODAY)
  - Featured "Event of the Day" highlights
  - Holiday banners and celebrations
  - 50+ events, 25 births, 15 deaths per date
  - Event detail pages with full descriptions and Wikipedia links
  - Category tabs with pagination
- **Authentic Design**: Premium CRT effects, scanlines, 8-color palette, blocky fonts
- **GSAP Animations**: Cinematic boot sequence, page transitions, time travel effect

## Target Audience

- Users who remember Teletext (35+ demographic) - nostalgia
- Younger users curious about retro technology - discovery

## Unique Value Proposition

The only Teletext revival combining LIVE modern data with historical "Time Machine" exploration, creating both nostalgia and educational value.

## Page Structure

| Page | Section | Description |
|------|---------|-------------|
| 100 | Home | Navigation menu, weather widget, tips |
| 101-109 | News | Top Stories, World, Tech, Business, Sports |
| 200-209 | Weather | Current conditions, 5-day forecast |
| 300-309 | Finance | Cryptocurrency prices |
| 500 | Time Machine | Simplified date picker (month/day), quick jumps |
| 501 | Today in History | Featured event, category tabs, paginated events |
| 502 | Historical Weather | Weather on selected date |
| 503 | Event Detail | Full event description, Wikipedia link |
| 504 | Timeline View | Events by century (future) |
| 888 | Easter Egg | Teletext fun facts |
| 900 | Settings | User preferences |
| 999 | About | Credits and history |

## Quality Goals

- **Performance**: Interactive in <3 seconds
- **Accessibility**: WCAG 2.1 AA compliant
- **Reliability**: Graceful offline support
- **Delight**: Easter eggs and surprises

## Related Documents

- See `agent.md` for implementation rules
- See `ux-excellence.md` for design guidelines
- See `api-patterns.md` for API integration
- See `.kiro/specs/teletext-reborn/` for full specifications
