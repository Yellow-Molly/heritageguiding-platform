---
phase: 4
title: "TrustSignals: Dynamic Guide Count"
status: todo
priority: medium
effort: 30m
---

# Phase 4: TrustSignals — Dynamic Guide Count

## Overview

Replace hardcoded "25+" guide count with real count from CMS. Other stats (100% trusted, 15+ years, 98% happy) remain static marketing content.

## Related Files
- **Modify**: `apps/web/components/home/trust-signals.tsx`

## Implementation Steps

1. Add props interface: `{ guideCount?: number }`
2. In the stats array, replace hardcoded `value: 25` with `guideCount ?? 7` (fallback to known count)
3. Keep `suffix: '+'` to show "7+" style
4. Rest of the component stays identical — animations, layout, other stats

## Key Changes

```diff
+ interface TrustSignalsProps { guideCount?: number }

- export function TrustSignals() {
+ export function TrustSignals({ guideCount = 7 }: TrustSignalsProps) {

  const stats: StatItem[] = [
    {
      icon: <Globe className="h-7 w-7" />,
-     value: 25,
+     value: guideCount,
      suffix: '+',
      label: 'Expert Local Guides',
      ...
    },
    // ... other stats unchanged
  ]
```

## Success Criteria
- [ ] Guide count reflects real CMS data
- [ ] Count-up animation still works
- [ ] Falls back to 7 if no data passed
