'use client'

/**
 * Small colored badge showing current Bokun sync status.
 * Used inside the bokun-sync-panel; deliberately minimal to keep the admin UI light.
 */

type Status = 'pending' | 'synced' | 'failed' | 'disabled'

const STATUS_STYLES: Record<Status, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' },
  synced: { bg: '#D1FAE5', fg: '#065F46', label: 'Synced' },
  failed: { bg: '#FEE2E2', fg: '#991B1B', label: 'Failed' },
  disabled: { bg: '#E5E7EB', fg: '#374151', label: 'Disabled' },
}

export function BokunSyncStatusPill({ status }: { status: Status | null | undefined }) {
  const key: Status = (status ?? 'pending') as Status
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.pending
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.fg,
      }}
    >
      {style.label}
    </span>
  )
}
