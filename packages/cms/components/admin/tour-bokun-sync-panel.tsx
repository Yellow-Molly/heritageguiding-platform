'use client'

/**
 * Tour edit-page sidebar panel: sync status + manual "Sync to Bokun now" button.
 *
 * Reads sync state from Payload's form context (useFormFields) so values stay live
 * with the tour's current draft. The manual-sync button POSTs to
 * `/api/admin/bokun/sync-tour`, which enqueues the same Phase-05 job the
 * afterChange hook uses.
 *
 * @see plans/260514-1437-bokun-integration/phase-06-admin-ui-manual-sync.md
 */

import { useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { BokunSyncStatusPill } from './bokun-sync-status-pill'

type Status = 'pending' | 'synced' | 'failed' | 'disabled'

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Never synced'
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return 'Never synced'
  const diffMs = Date.now() - ts
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} d ago`
}

export function TourBokunSyncPanel() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields?.bokunSyncStatus?.value as Status | undefined)
  const lastSyncedAt = useFormFields(
    ([fields]) => fields?.bokunLastSyncedAt?.value as string | undefined
  )
  const lastError = useFormFields(
    ([fields]) => fields?.bokunLastError?.value as string | undefined
  )

  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSyncNow = async () => {
    if (!id) {
      setFeedback('Save the tour first before syncing.')
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/bokun/sync-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId: id }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setFeedback(json.error ?? `Sync failed (${res.status})`)
      } else {
        setFeedback('Sync queued. Refresh in ~30s to see updated status.')
      }
    } catch {
      setFeedback('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        backgroundColor: '#F9FAFB',
      }}
    >
      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
        CMS is the source of truth — edits here overwrite Bokun on next sync.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <strong style={{ fontSize: '13px' }}>Bokun:</strong>
        <BokunSyncStatusPill status={status} />
      </div>

      <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
        Last synced: {formatRelative(lastSyncedAt)}
      </div>

      {lastError ? (
        <details style={{ marginBottom: '8px' }}>
          <summary style={{ fontSize: '12px', color: '#991B1B', cursor: 'pointer' }}>
            Last error
          </summary>
          <pre
            style={{
              fontSize: '11px',
              color: '#991B1B',
              backgroundColor: '#FEF2F2',
              padding: '6px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginTop: '4px',
            }}
          >
            {lastError}
          </pre>
        </details>
      ) : null}

      <button
        type="button"
        onClick={handleSyncNow}
        disabled={busy || !id || status === 'disabled'}
        aria-busy={busy}
        style={{
          width: '100%',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#FFFFFF',
          backgroundColor: busy ? '#6B7280' : '#1F2937',
          border: 'none',
          borderRadius: '4px',
          cursor: busy || !id || status === 'disabled' ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Queuing…' : 'Sync to Bokun now'}
      </button>

      {feedback ? (
        <div style={{ fontSize: '11px', color: '#374151', marginTop: '6px' }}>{feedback}</div>
      ) : null}
    </div>
  )
}
