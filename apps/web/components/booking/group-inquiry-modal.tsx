'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GroupInquiryForm } from './group-inquiry-form'
import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'

/**
 * Modal wrapper for GroupInquiryForm.
 * Used on tour detail page to open inquiry form in a dialog.
 */
export function GroupInquiryModal({ tourName }: { tourName?: string }) {
  const t = useTranslations('groupBooking')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Users className="mr-2 h-4 w-4" />
          {t('modalTrigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <p className="text-sm text-[var(--color-text-muted)]">{t('modalDescription')}</p>
        </DialogHeader>
        <div className="p-6 pt-0">
          <GroupInquiryForm tourName={tourName} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
