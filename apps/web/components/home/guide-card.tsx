import Image from 'next/image'

interface GuideCardProps {
  name: string
  photo: string
  role: string
}

export function GuideCard({ name, photo, role }: GuideCardProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full">
        <Image
          src={photo}
          alt={name}
          width={112}
          height={112}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)]">{name}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{role}</p>
    </div>
  )
}
