# Agent Steering Document - Teletext Reborn

## CRITICAL: Document Reading Order

**ALWAYS read documents in this exact order before ANY implementation:**

1. `.kiro/specs/teletext-reborn/tasks.md` - Current task list and progress
2. `.kiro/specs/teletext-reborn/requirements.md` - All 34 requirements with 220+ acceptance criteria
3. `.kiro/specs/teletext-reborn/design.md` - Architecture, components, animations, APIs

**NEVER guess or assume.** If confused about ANY aspect:
1. Use `mcp_Ref_ref_search_documentation` to find relevant documentation
2. Use `mcp_sequential_thinking_sequentialthinking` to reason through complex problems
3. Ask the user for clarification before proceeding

---

## Project Mission

Build an **AAA-quality web application** that:
- Delivers the **best UX/UI** possible for a nostalgic Teletext experience
- Is **100% error-free** with comprehensive testing
- Achieves **100/100** on all quality metrics
- Creates genuine **delight and nostalgia** for users

---

## Quality Standards

### Code Quality
- Zero TypeScript/JavaScript errors
- Zero console warnings
- All functions documented with JSDoc
- Consistent naming conventions (camelCase for functions, PascalCase for classes)
- Maximum function length: 50 lines
- Maximum file length: 300 lines

### Visual Quality
- Pixel-perfect implementation of design specs
- Smooth 60fps animations (no jank)
- Authentic Teletext aesthetics (8 colors only)
- CRT effects must feel premium, not gimmicky

### UX Quality
- Every interaction provides immediate feedback
- Loading states are engaging, not frustrating
- Error messages are helpful and actionable
- Navigation is intuitive and discoverable

---

## Implementation Rules

### Before Writing ANY Code

1. **Read the task description completely**
2. **Cross-reference with requirements.md** - Find the exact acceptance criteria
3. **Check design.md** - Understand the component interfaces and data models
4. **Identify dependencies** - What must exist before this task?
5. **Plan the implementation** - Use sequential thinking for complex tasks

---

## MANDATORY: GSAP Animation Research Protocol

**Before implementing ANY GSAP animation, you MUST:**

### Step 1: Read Project Specs First
1. Read `.kiro/specs/teletext-reborn/requirements.md` - Find the exact animation requirements
2. Read `.kiro/specs/teletext-reborn/design.md` - Find the GSAP Animation Specifications section
3. Read `.kiro/steering/gsap-animations.md` - Understand verified syntax and patterns

### Step 2: Research & Verify
1. Use `mcp_Ref_ref_search_documentation` to search for GSAP documentation
2. Use `mcp_sequential_thinking_sequentialthinking` to plan the animation sequence
3. Verify ease syntax is GSAP 3 format (lowercase: `power2.out` NOT `Power2.easeOut`)
4. Verify TextPlugin is registered if using text animations
5. Verify only GPU-accelerated properties are animated (x, y, scale, opacity, filter)

### Step 3: Cross-Reference Before Coding
- [ ] Animation duration matches design.md specification exactly
- [ ] Easing function matches design.md specification exactly
- [ ] Timeline phases match the documented sequence
- [ ] All position parameters (`<`, `>`, `-=`, `+=`) are correct
- [ ] Cleanup/kill methods are planned for unmount

### Step 4: Implement with Verification
1. Write the animation code following `gsap-animations.md` patterns
2. Test at normal speed (timeScale 1)
3. Verify 60fps performance in browser dev tools
4. Check for console errors
5. Verify visual output matches design mockups

**DO NOT GUESS GSAP SYNTAX. ALWAYS VERIFY FIRST.**

### During Implementation

1. **Follow the design document exactly** - Don't deviate from specified:
   - Color values (only 8 Teletext colors)
   - Animation timings and easing functions
   - Component interfaces
   - API integration patterns

2. **Test as you build** - After each function:
   - Verify it works in isolation
   - Check for edge cases
   - Ensure error handling is in place

3. **Maintain consistency** - Match existing code patterns:
   - Same file structure
   - Same naming conventions
   - Same error handling approach

4. **For GSAP Animations specifically**:
   - ALWAYS use lowercase ease names: `power2.out`, `expo.inOut`
   - ALWAYS register TextPlugin before using text animations
   - ALWAYS store timeline references for cleanup
   - ALWAYS use transform properties (x, y, scale) not layout properties (width, top)
   - ALWAYS call `gsap.killTweensOf()` on component unmount
   - NEVER animate width, height, top, left, margin, padding (causes reflow)

### After Implementation

1. **Run all tests** - `npm test`
2. **Check for diagnostics** - Use getDiagnostics tool
3. **Visual verification** - Does it look exactly like the design?
4. **Cross-reference requirements** - Does it meet ALL acceptance criteria?

---

## Critical Design Constraints

### Color Palette (STRICT - NO EXCEPTIONS)
```
#000000 - Black (backgrounds)
#FF0000 - Red (errors, negative values, Fastext)
#00FF00 - Green (success, positive values, Fastext)
#FFFF00 - Yellow (primary text, Fastext)
#0000FF - Blue (headers, backgrounds)
#FF00FF - Magenta (special highlights, Time Machine)
#00FFFF - Cyan (interactive elements, links, Fastext)
#FFFFFF - White (secondary text)
```

### Typography (STRICT)
- Font: "Press Start 2P" ONLY
- Base size: 14-16px
- Line width: 40 characters MAXIMUM
- Double-height: CSS `transform: scaleY(2)`

### Layout (STRICT)
- Aspect ratio: 4:3
- Max width: 800px
- Grid: 40 columns × 22 rows
- Three zones: Header (1 row), Content (20-22 rows), Navigation (2 rows)

### Animation Timings (STRICT)
| Animation | Duration | Easing |
|-----------|----------|--------|
| Page transitions | 0.3-0.4s | power2.inOut |
| Boot sequence | 3s max | power4.out |
| Time travel | 2.5s | expo.inOut |
| Button hover | 0.15s | power1.out |
| Menu stagger | 0.05s/item | power2.out |
| Cursor blink | 0.53s | steps(1) |

---

## Error Prevention Checklist

Before marking ANY task complete, verify:

- [ ] No hardcoded colors outside the 8 Teletext colors
- [ ] No text exceeds 40 characters per line
- [ ] All animations use GSAP with specified easing
- [ ] All API calls have error handling and retry logic
- [ ] All user inputs are validated
- [ ] All interactive elements have hover/focus states
- [ ] All loading states show appropriate feedback
- [ ] localStorage operations have try/catch
- [ ] Keyboard navigation works for all interactive elements
- [ ] ARIA labels present for accessibility

---

## GSAP Animation Verification Checklist

Before marking ANY animation task complete:

- [ ] Read requirements.md for exact animation specs
- [ ] Read design.md GSAP Animation Specifications section
- [ ] Read gsap-animations.md for verified patterns
- [ ] Used `mcp_Ref_ref_search_documentation` if unsure about syntax
- [ ] Used `mcp_sequential_thinking_sequentialthinking` to plan complex sequences
- [ ] Ease syntax is lowercase GSAP 3 format (e.g., `power2.out`)
- [ ] TextPlugin registered with `gsap.registerPlugin(TextPlugin)`
- [ ] Only animating: x, y, scale, rotation, opacity, filter
- [ ] NOT animating: width, height, top, left, margin, padding
- [ ] Duration matches design.md exactly
- [ ] Easing matches design.md exactly
- [ ] Timeline stored in variable for cleanup
- [ ] `gsap.killTweensOf()` called on unmount
- [ ] Tested at normal speed (not slowed down)
- [ ] 60fps verified in browser Performance tab
- [ ] No console errors or warnings

---

## Common Pitfalls to Avoid

1. **Don't use arbitrary colors** - Only the 8 Teletext colors
2. **Don't skip loading states** - Every async operation needs feedback
3. **Don't forget error handling** - Every API call can fail
4. **Don't ignore mobile** - Responsive design is required
5. **Don't break the 40-char limit** - Truncate with ellipsis
6. **Don't use wrong animation easing** - Follow the spec exactly
7. **Don't skip accessibility** - ARIA labels, keyboard nav, contrast
8. **Don't forget caching** - All API responses must be cached

---

## When Stuck or Confused

1. **Re-read the requirements** - The answer is usually there
2. **Check the design document** - Look for component interfaces
3. **Use sequential thinking** - Break down the problem step by step
4. **Search documentation** - Use Ref MCP for external APIs
5. **Ask the user** - Better to clarify than guess wrong

---

## Success Metrics

The final application must achieve:

- **Performance**: Interactive in <3 seconds, 60fps animations
- **Accessibility**: WCAG 2.1 AA compliant
- **Functionality**: All 34 requirements with 220+ acceptance criteria met
- **Visual**: Authentic Teletext aesthetic, premium CRT effects
- **UX**: Intuitive navigation, delightful interactions
- **Reliability**: Graceful error handling, offline support
- **Code**: Zero errors, comprehensive tests, clean architecture

---

## Remember

This is not just a hackathon project - it's a **premium nostalgic experience** that should make users smile. Every pixel, every animation, every interaction matters. Build it with pride and attention to detail.

**Quality over speed. Always.**
