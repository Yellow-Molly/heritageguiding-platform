'use client'

/**
 * Tour edit-page sidebar panel: one-time "Adopt Bokun extras baseline" gate.
 *
 * Flow:
 *   1. Renders "Adopt baseline" button when the tour has a Bokun experience id
 *      but no `bokunExtrasBaselineAt` set.
 *   2. Clicking opens the preview: fetches diff via
 *      GET /api/admin/bokun/extras-baseline-preview, shows CREATE/UPDATE/DELETE
 *      breakdown + a warning banner about Bokun-side deletions.
 *   3. Operator confirms → POST /api/admin/bokun/extras-baseline-adopt sets the
 *      flag. Adoption does NOT immediately push (uses skipBokunSync context).
 *      Next normal save triggers the first push.
 *
 * When baseline is already set, the panel shows the timestamp + a Re-baseline
 * link that re-opens the same preview/confirm cycle.
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-05-adopt-baseline-admin-ui.md
 */

import { useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type DiffPair = { cmsRowId: string | number; cmsName?: string; bokunId: number; bokunTitle: string }
type DiffOnlyCms = { cmsRowId: string | number; cmsName?: string; bokunExtraId?: string | null }
type DiffStale = { cmsRowId: string | number; cmsName?: string; bokunExtraId?: string | null }
type DiffOnlyBokun = { bokunId: number; bokunTitle: string }
interface DiffResponse {
  bokunExperienceId: string
  diff: {
    inBoth: DiffPair[]
    onlyInCms: DiffOnlyCms[]
    // Backwards compatibility: older preview API responses (pre-2026-05-29)
    // didn't include this bucket. Treat as empty when missing.
    stalePointers?: DiffStale[]
    onlyInBokun: DiffOnlyBokun[]
  }
}

function formatBaselineDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function TourBokunExtrasBaselinePanel() {
  const { id } = useDocumentInfo()
  const bokunExperienceId = useFormFields(
    ([fields]) => fields?.bokunExperienceId?.value as string | undefined
  )
  const baselineAt = useFormFields(
    ([fields]) => fields?.bokunExtrasBaselineAt?.value as string | undefined
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [diff, setDiff] = useState<DiffResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const openPreview = async () => {
    if (!id) {
      setError('Save the tour first before adopting baseline.')
      return
    }
    setModalOpen(true)
    setLoading(true)
    setError(null)
    setDiff(null)
    try {
      const res = await fetch(`/api/admin/bokun/extras-baseline-preview?tourId=${id}`)
      const json = (await res.json().catch(() => ({}))) as DiffResponse & { error?: string }
      if (!res.ok) {
        setError(json.error ?? `Preview failed (${res.status})`)
      } else {
        setDiff(json)
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  const adoptBaseline = async () => {
    if (!id) return
    setConfirming(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bokun/extras-baseline-adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId: id }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(json.error ?? `Adopt failed (${res.status})`)
      } else {
        // Force re-render of the sidebar by reloading; useFormFields would lag
        // behind the DB write since the adopt endpoint bypasses the form layer.
        window.location.reload()
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setConfirming(false)
    }
  }

  // Hide entirely when no Bokun experience link exists. Adoption requires one.
  if (!bokunExperienceId || !bokunExperienceId.trim()) return null

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
      <strong style={{ fontSize: '13px' }}>Extras push (Phase 2)</strong>
      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', marginBottom: '8px' }}>
        Adopt Bokun-side extras into CMS as a baseline. Once adopted, the next
        tour save pushes CMS add-on titles + descriptions to Bokun.{' '}
        <strong>Prices and the Required toggle stay dashboard-managed.</strong>
      </div>

      {baselineAt ? (
        <>
          <div
            style={{
              fontSize: '12px',
              color: '#065F46',
              backgroundColor: '#D1FAE5',
              padding: '6px 8px',
              borderRadius: '4px',
              marginBottom: '6px',
            }}
          >
            ✓ Baseline adopted {formatBaselineDate(baselineAt)}
          </div>
          <button
            type="button"
            onClick={openPreview}
            style={{
              fontSize: '11px',
              background: 'none',
              border: 'none',
              color: '#1F2937',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Re-baseline (after manual Bokun changes)
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={openPreview}
          disabled={!id}
          style={{
            width: '100%',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#FFFFFF',
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '4px',
            cursor: !id ? 'not-allowed' : 'pointer',
          }}
        >
          Adopt baseline…
        </button>
      )}

      {modalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => !confirming && setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', marginBottom: '12px' }}>
              Adopt Bokun extras baseline
            </h3>

            {loading ? (
              <div style={{ fontSize: '13px', color: '#374151' }}>Loading diff…</div>
            ) : error ? (
              <div
                style={{
                  fontSize: '13px',
                  color: '#991B1B',
                  backgroundColor: '#FEF2F2',
                  padding: '8px',
                  borderRadius: '4px',
                }}
              >
                {error}
              </div>
            ) : diff ? (
              <>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                  }}
                >
                  ⚠️ After adopting baseline, future saves will push CMS add-ons to
                  Bokun. Any Bokun-side extra not mirrored in CMS will be{' '}
                  <strong>DELETED</strong> on the next save.
                </div>

                <DiffSection
                  title={`Will UPDATE in Bokun (${diff.diff.inBoth.length})`}
                  color="#1F2937"
                  rows={diff.diff.inBoth.map((p) => `#${p.bokunId} ${p.bokunTitle}`)}
                />
                <DiffSection
                  title={`Will CREATE in Bokun (${diff.diff.onlyInCms.length})`}
                  color="#065F46"
                  rows={diff.diff.onlyInCms.map(
                    (r) => `CMS row ${String(r.cmsRowId)} (${r.cmsName ?? '—'})`
                  )}
                />
                <DiffSection
                  title={`Stale CMS pointers (${(diff.diff.stalePointers ?? []).length})`}
                  color="#92400E"
                  rows={(diff.diff.stalePointers ?? []).map(
                    (r) =>
                      `CMS row ${String(r.cmsRowId)} (${r.cmsName ?? '—'}) → bokunExtraId="${
                        r.bokunExtraId ?? ''
                      }" unresolved (missing in Bokun or duplicated by another row)`
                  )}
                  emphasize={(diff.diff.stalePointers ?? []).length > 0}
                />
                <DiffSection
                  title={`Will DELETE in Bokun (${diff.diff.onlyInBokun.length})`}
                  color="#991B1B"
                  rows={diff.diff.onlyInBokun.map((e) => `#${e.bokunId} ${e.bokunTitle}`)}
                  emphasize={diff.diff.onlyInBokun.length > 0}
                />

                {(diff.diff.stalePointers ?? []).length > 0 ? (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#92400E',
                      backgroundColor: '#FEF3C7',
                      padding: '8px',
                      borderRadius: '4px',
                      marginTop: '8px',
                    }}
                  >
                    ⚠️ Some CMS rows reference a Bokun extra that is missing or
                    already claimed by another row. Clear the{' '}
                    <code>Bokun Extra ID</code> field on those rows (and save the
                    tour) before adopting — otherwise the sync may fail or
                    double-write the same extra.
                  </div>
                ) : null}
              </>
            ) : null}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={confirming}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              {(() => {
                const staleCount = (diff?.diff.stalePointers ?? []).length
                const blocked = staleCount > 0
                const disabled = confirming || loading || !diff || blocked
                return (
                  <button
                    type="button"
                    onClick={adoptBaseline}
                    disabled={disabled}
                    title={
                      blocked
                        ? `Resolve ${staleCount} stale CMS pointer(s) before adopting.`
                        : undefined
                    }
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      backgroundColor: confirming || blocked ? '#6B7280' : '#1F2937',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {confirming
                      ? 'Adopting…'
                      : blocked
                        ? 'Fix stale pointers first'
                        : 'Adopt — allow future pushes'}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DiffSection({
  title,
  color,
  rows,
  emphasize,
}: {
  title: string
  color: string
  rows: string[]
  emphasize?: boolean
}) {
  return (
    <details
      open={emphasize}
      style={{
        marginBottom: '8px',
        borderLeft: `3px solid ${color}`,
        paddingLeft: '8px',
      }}
    >
      <summary style={{ fontSize: '12px', fontWeight: 600, color, cursor: 'pointer' }}>
        {title}
      </summary>
      {rows.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#6B7280', padding: '4px 0' }}>
          (none)
        </div>
      ) : (
        <ul style={{ fontSize: '11px', color: '#374151', margin: '4px 0', paddingLeft: '20px' }}>
          {rows.map((row, i) => (
            <li key={i}>{row}</li>
          ))}
        </ul>
      )}
    </details>
  )
}
