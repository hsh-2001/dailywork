# Next.js UI Design & Implementation

## Purpose

Design and implement polished, modern, responsive user interfaces for Next.js applications using Tailwind CSS.

The goal is to produce interfaces that feel like modern SaaS/productivity applications rather than generic admin dashboards.

Prioritize:

1. Visual hierarchy
2. Simplicity
3. Consistency
4. Responsiveness
5. Accessibility
6. Performance
7. Reusability

---

# Technology Preferences

Use the project's existing stack.

Preferred:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React for icons
- Existing UI components
- Existing API/data-fetching architecture

Do not introduce new dependencies unless they provide clear value.

If the project already uses a component library such as Ant Design, reuse it where appropriate instead of unnecessarily replacing the entire UI system.

---

# Before Changing Code

Always inspect the existing implementation first.

Understand:

- project structure
- routes
- layouts
- existing components
- styling system
- theme
- API/data-fetching architecture
- state management
- reusable components

Do not rewrite working business logic just to improve the UI.

Do not change:

- API endpoints
- API response contracts
- database structure
- authentication behavior
- business rules

unless explicitly requested.

---

# Design Direction

The UI should feel:

- modern
- clean
- lightweight
- professional
- responsive
- calm
- easy to scan
- visually consistent

Use modern SaaS/productivity applications as general inspiration.

Do not directly copy another product's design.

Avoid generic dashboard aesthetics.

Avoid excessive:

- cards
- borders
- shadows
- gradients
- rounded containers
- large headings
- oversized buttons
- animations

Use whitespace to establish hierarchy.

---

# Layout

Create responsive layouts for:

- mobile
- tablet
- desktop
- large desktop

Design mobile intentionally rather than simply shrinking the desktop layout.

Desktop layouts may use:

- sidebar
- centered content
- multi-column layouts
- tables

Mobile layouts should prioritize:

- primary content
- important actions
- readable spacing
- touch-friendly controls

Avoid unnecessary horizontal scrolling.

Use a reasonable maximum content width.

---

# Tailwind CSS

Prefer Tailwind utility classes.

Use consistent spacing.

Prefer patterns such as:

```text
p-4
p-5
p-6

gap-3
gap-4
gap-6

space-y-4
space-y-6
```

Avoid arbitrary values unless necessary.

Create reusable components when a UI pattern appears more than once.

Examples:

- PageHeader
- Button
- Card
- Badge
- EmptyState
- ErrorState
- LoadingState
- DataTable
- FormSection
- Modal
- NavigationItem

Do not create abstractions for one-off elements unnecessarily.

---

# Color System

Use the existing application theme.

For the DailyWork/FlowSync style:

```text
Primary: #004FAF
Secondary: #0055BD
```

Use neutral backgrounds and text colors.

Use primary colors primarily for:

- primary actions
- active navigation
- links
- important states

Use semantic colors for:

- success
- warning
- error
- information

Do not make the entire page blue.

Avoid excessive gradients.

---

# Typography

Create a clear typography hierarchy.

Recommended approximate sizes:

```text
Page title:      24–32px
Section title:   18–22px
Body:            14–16px
Metadata:        12–14px
```

Use font weight and spacing to establish hierarchy.

Do not make everything large or bold.

---

# Navigation

Desktop navigation should provide:

- clear active state
- consistent icons
- readable labels
- logical grouping
- appropriate spacing

Mobile navigation should be intentionally designed.

Do not simply display the desktop sidebar on mobile.

Important navigation should remain easily accessible.

---

# Buttons

Maintain a consistent button system.

Primary:

- strong visual emphasis
- clear hover state
- active state
- disabled state
- loading state

Secondary:

- lower visual emphasis
- subtle background/border

Destructive:

- semantic danger styling

Buttons must have comfortable touch targets.

Avoid making every action a primary button.

Use Lucide React for icons.

---

# Forms

Forms should be clean and easy to scan.

Use:

- clear labels
- useful placeholders
- appropriate spacing
- validation messages
- loading states
- disabled states
- logical grouping

Avoid unnecessarily large form controls.

On mobile, prioritize comfortable touch interaction.

---

# Tables

Desktop tables should provide:

- clear column hierarchy
- compact but readable rows
- hover state
- status badges
- action controls
- pagination

For mobile, do not automatically force the desktop table into horizontal scrolling.

When appropriate, transform the table into:

- cards
- simplified rows
- expandable rows
- mobile-specific layouts

Choose based on the data.

---

# Loading States

Never leave large content areas blank while loading.

Use:

- skeletons for content
- spinners for small actions
- disabled buttons during mutations

Prefer skeleton loading for lists and dashboards.

---

# Empty States

Empty states should explain what happened and provide a useful next action.

Example:

```text
No overtime records yet.

Create your first overtime record to get started.

[ Create Record ]
```

Avoid displaying an empty table with no explanation.

---

# Error States

Error states should be understandable to normal users.

Show:

- what happened
- whether retry is possible
- retry action when appropriate

Do not expose raw technical errors unless useful for developers.

---

# Animation

Use animation sparingly.

Good uses:

- hover
- dropdowns
- dialogs
- navigation transitions
- subtle list transitions
- loading indicators

Animations should be fast and subtle.

Respect:

```css
prefers-reduced-motion
```

Do not add animation merely for visual decoration.

---

# Performance

Prioritize performance.

Use Server Components when possible.

Only use:

```tsx
"use client";
```

when client-side interaction/state actually requires it.

Avoid:

- unnecessary re-renders
- unnecessary dependencies
- expensive animations
- large client-side components
- duplicated state

Keep the client bundle small.

---

# Accessibility

Use semantic HTML.

Ensure:

- keyboard navigation
- visible focus states
- accessible labels
- sufficient contrast
- accessible dialogs
- appropriate button semantics
- appropriate form labels

Use ARIA only when necessary.

Never communicate important information using color alone.

---

# Responsive Design

Always consider these widths:

```text
320px
375px
430px
768px
1024px
1280px
1440px+
```

Check:

- navigation
- forms
- tables
- modals
- buttons
- spacing
- typography
- overflow

A component that looks good only at desktop width is not considered complete.

---

# Product UI Guidelines

For productivity applications such as DailyWork:

## Dashboard

Prioritize:

- key metrics
- recent activity
- useful summaries
- quick actions

Avoid filling the dashboard with unnecessary charts.

## Projects

Prioritize:

- project name
- status
- progress
- project type
- important metadata
- actions

## OT Records

Prioritize:

- work date
- start time
- end time
- total minutes
- project
- task
- note

Make creating a record quick.

Use a modal or dedicated form depending on the existing UX.

## Settings

Group related settings into logical sections.

Avoid making settings pages visually complicated.

---

# Component Architecture

Prefer reusable components.

Example:

```text
components/
├── ui/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── LoadingState.tsx
│   └── PageHeader.tsx
│
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── MobileNavigation.tsx
│
└── feature/
    ├── RecordList.tsx
    ├── RecordForm.tsx
    └── ProjectCard.tsx
```

Keep generic UI components separate from feature-specific components.

Do not over-engineer the component architecture.

---

# Implementation Workflow

When asked to improve a page:

### Step 1 — Inspect

Understand the existing page and components.

### Step 2 — Identify problems

Look for:

- poor hierarchy
- inconsistent spacing
- excessive borders
- poor mobile behavior
- unclear actions
- weak empty states
- poor loading states
- accessibility issues
- unnecessary client rendering

### Step 3 — Design

Create a simple visual hierarchy before writing code.

### Step 4 — Implement

Use existing components where possible.

Use Tailwind CSS.

Keep business logic unchanged.

### Step 5 — Responsive pass

Check mobile, tablet, and desktop layouts.

### Step 6 — UX pass

Check:

- loading
- empty
- error
- disabled
- hover
- focus
- success
- destructive actions

### Step 7 — Performance pass

Check unnecessary client components, state, rendering, and dependencies.

### Step 8 — Final cleanup

Remove:

- duplicated classes
- unnecessary wrappers
- unused imports
- unnecessary abstractions
- inconsistent spacing

---

# Important Rule

Do not redesign everything simply because a redesign is possible.

Improve the existing application incrementally while preserving its functionality.

Prefer:

```text
simple + consistent + reusable
```

over:

```text
complex + impressive + difficult to maintain
```

The final UI should feel like a cohesive product, not a collection of individually designed pages.