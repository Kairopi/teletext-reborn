# UX/UI Excellence Guidelines

## Design Philosophy

Teletext Reborn must feel like a **premium time machine**, not a cheap imitation. Every interaction should evoke:
- **Nostalgia** - Authentic to the 1980s-90s Teletext experience
- **Delight** - Surprising moments that make users smile
- **Polish** - Every detail considered and refined

---

## Visual Hierarchy

### Text Hierarchy (Strict)
1. **Page Titles**: Double-height (scaleY(2)), yellow, centered
2. **Section Headers**: 1.5x height, cyan, uppercase, with ═══ underline
3. **Body Text**: Standard height (14-16px), yellow or white
4. **Captions/Metadata**: 0.85x size, white at 70% opacity
5. **Navigation Labels**: Standard height, Fastext button colors
6. **Timestamps**: "HH:MM" or "X mins ago", white at 70% opacity

### Color Semantics (Strict)
| Color | Usage |
|-------|-------|
| Yellow | Primary content text |
| White | Secondary text, descriptions |
| Cyan | Interactive elements, links, page numbers |
| Green | Positive values, success states |
| Red | Negative values, errors, alerts |
| Magenta | Special highlights, Time Machine active |
| Blue | Headers, navigation backgrounds |
| Black | All backgrounds |

---

## Interaction Patterns

### Button States
```
Default  → Hover (brightness +20%, glow) → Active (scale 0.95) → Focus (cyan dotted outline)
```

### Loading Feedback
1. Immediate: Show "LOADING..." with blinking cursor
2. Progress: Block progress bar ░░░░░░░░░░ → ██████████
3. Extended (>3s): "STILL LOADING - PLEASE WAIT"
4. Complete: Brief "READY" flash in green

### Error Feedback
1. Visual: Red border + shake animation (±3px, 3 cycles)
2. Message: ⚠ prefix, red text, clear explanation
3. Action: Always offer [RETRY] and [HOME] options

### Success Feedback
1. Visual: Green border flash (300ms)
2. Message: Brief confirmation ("Saved!", "Done!")
3. Transition: Smooth fade to next state

---

## Animation Guidelines

### Principles
- **Purposeful**: Every animation serves a function
- **Consistent**: Same actions = same animations
- **Performant**: 60fps, no jank, CSS transforms only
- **Authentic**: Feels like CRT technology

### Page Transitions
1. Exit: Fade out bottom-to-top (0.15s)
2. Static: Brief noise flash (50ms)
3. Enter: Header first (0.1s), content (0.2s), navigation (0.1s)
4. Content: Line-by-line stagger (0.03s delay)

### Time Travel Animation (2.5s total)
1. Phase 1 (0-0.3s): Blur + brighten
2. Phase 2 (0.3-0.5s): White flash + screen shake
3. Phase 3 (0.5-2.0s): Year counter animation
4. Phase 4 (2.0-2.5s): Unblur + content reveal

### Micro-Interactions
- Hover: Immediate response (0.15s)
- Click: Tactile feedback (scale 0.95, 0.1s)
- Focus: Visible outline (2px dotted cyan)
- Menu items: Stagger appearance (0.05s/item)

---

## CRT Effects (Premium Feel)

### Required Effects
1. **Scanlines**: 2px spacing, 30% opacity, alternating brightness
2. **Phosphor Glow**: text-shadow 2px blur, 50% opacity
3. **Vignette**: Radial gradient, darker corners
4. **Screen Curvature**: 2-4px border-radius curve
5. **Glass Reflection**: Linear gradient overlay, 5% opacity
6. **RGB Separation**: 1px chromatic aberration
7. **Noise Texture**: 2% opacity grain overlay
8. **TV Bezel**: 8-12px dark gray border

### Idle State
- After 30 seconds: Subtle brightness flicker (0.97-1.0 opacity)
- Every 3-5 seconds while idle

---

## Responsive Behavior

### Desktop (>1024px)
- Full Teletext interface
- Optimal 800px width
- All CRT effects enabled

### Tablet (768px-1024px)
- Scaled interface
- Touch-friendly targets (44px minimum)
- Simplified CRT effects

### Mobile (<768px)
- Stacked navigation
- Larger touch targets
- Essential CRT effects only
- Horizontal scroll for content if needed

---

## Accessibility Requirements

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate
- Escape to go home
- Number keys for quick navigation
- Arrow keys for prev/next

### Screen Readers
- ARIA labels on all interactive elements
- Live regions for dynamic content
- Landmarks for header, main, navigation
- Meaningful alt text for ASCII art

### Visual
- Minimum 4.5:1 contrast ratio
- Focus indicators always visible
- No information conveyed by color alone
- Reduced motion support (prefers-reduced-motion)

---

## Delightful Moments

### Easter Eggs
- Page 888: Teletext fun facts
- Page 404: Humorous not found message
- Konami code: Color Burst mode
- Dec 31, 1999: Y2K countdown
- User's birthday: Confetti animation

### Personalization
- Birthday greeting with confetti
- "Welcome back!" after 7+ days
- Night owl mode (midnight-5am)
- New Year celebration (Jan 1st)
- First share: "Thanks for sharing!"

### Onboarding
- First-time: "Welcome to the future of the past!"
- Optional "What is Teletext?" introduction
- Rotating tips on home page
- "Press ? for shortcuts" hint

---

## Quality Checklist

Before shipping any feature:

- [ ] Matches design document exactly
- [ ] All states handled (default, hover, active, focus, disabled)
- [ ] Loading states are engaging
- [ ] Error states are helpful
- [ ] Animations are smooth (60fps)
- [ ] Works on all screen sizes
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Feels authentic to Teletext era
- [ ] Creates delight, not frustration
