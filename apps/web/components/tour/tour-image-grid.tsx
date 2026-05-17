import Image from 'next/image'

interface GalleryImage {
  image: {
    url: string
    alt: string
    blurDataUrl?: string
  }
}

interface TourImageGridProps {
  gallery: GalleryImage[]
  title: string
  onImageClick: (index: number) => void
}

/**
 * Image grid for tour detail page.
 * Desktop: 1 large left + right column (1 top, 2 bottom). 420px height.
 * Mobile: Single hero image, 240px height.
 * Graceful degradation for 1/2/3/4+ images.
 */
export function TourImageGrid({ gallery, title, onImageClick }: TourImageGridProps) {
  const images = gallery.filter((item) => item.image?.url)

  if (images.length === 0) {
    return (
      <div className="mx-5 h-[240px] rounded-2xl bg-[var(--color-surface)] lg:mx-20 lg:h-[420px]" />
    )
  }

  // Mobile: single hero image
  const mobileHero = (
    <div className="relative h-[240px] lg:hidden">
      <button
        onClick={() => onImageClick(0)}
        className="relative block h-full w-full"
        aria-label={`View ${title} photos`}
      >
        <Image
          src={images[0].image.url}
          alt={images[0].image.alt || title}
          width={1600}
          height={900}
          priority
          fetchPriority="high"
          placeholder={images[0].image.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={images[0].image.blurDataUrl}
          className="h-full w-full object-cover"
          sizes="100vw"
        />
      </button>
    </div>
  )

  // Desktop: image grid with graceful fallback
  const desktopGrid = (
    <div className="hidden px-20 lg:block">
      {images.length === 1 ? (
        <SingleImageGrid image={images[0]} title={title} onClick={() => onImageClick(0)} />
      ) : images.length === 2 ? (
        <TwoImageGrid images={images} title={title} onImageClick={onImageClick} />
      ) : images.length === 3 ? (
        <ThreeImageGrid images={images} title={title} onImageClick={onImageClick} />
      ) : (
        <FullImageGrid images={images} title={title} onImageClick={onImageClick} />
      )}
    </div>
  )

  return (
    <>
      {mobileHero}
      {desktopGrid}
    </>
  )
}

/** Single image — full width, 420px */
function SingleImageGrid({
  image,
  title,
  onClick,
}: {
  image: GalleryImage
  title: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="relative block h-[420px] w-full overflow-hidden rounded-2xl" aria-label={`View ${title} photos`}>
      <Image
        src={image.image.url}
        alt={image.image.alt || title}
        width={1600}
        height={900}
        priority
        fetchPriority="high"
        placeholder={image.image.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={image.image.blurDataUrl}
        className="h-full w-full object-cover"
        sizes="(min-width: 1024px) calc(100vw - 160px), 100vw"
      />
    </button>
  )
}

/** 2 images — large left + 1 right */
function TwoImageGrid({
  images,
  title,
  onImageClick,
}: {
  images: GalleryImage[]
  title: string
  onImageClick: (i: number) => void
}) {
  return (
    <div className="grid h-[420px] grid-cols-[1fr_420px] grid-rows-1 gap-1">
      <GridImageButton image={images[0]} index={0} title={title} onImageClick={onImageClick} className="rounded-l-2xl" priority />
      <GridImageButton image={images[1]} index={1} title={title} onImageClick={onImageClick} className="rounded-r-2xl" />
    </div>
  )
}

/** 3 images — large left + 2 stacked right */
function ThreeImageGrid({
  images,
  title,
  onImageClick,
}: {
  images: GalleryImage[]
  title: string
  onImageClick: (i: number) => void
}) {
  return (
    <div className="grid h-[420px] grid-cols-[1fr_420px] grid-rows-1 gap-1">
      <GridImageButton image={images[0]} index={0} title={title} onImageClick={onImageClick} className="rounded-l-2xl" priority />
      <div className="grid grid-rows-2 gap-1">
        <GridImageButton image={images[1]} index={1} title={title} onImageClick={onImageClick} className="rounded-tr-2xl" />
        <GridImageButton image={images[2]} index={2} title={title} onImageClick={onImageClick} className="rounded-br-2xl" />
      </div>
    </div>
  )
}

/** 4+ images — large left + right column (1 top, 2 bottom) */
function FullImageGrid({
  images,
  title,
  onImageClick,
}: {
  images: GalleryImage[]
  title: string
  onImageClick: (i: number) => void
}) {
  return (
    <div className="grid h-[420px] grid-cols-[1fr_420px] grid-rows-1 gap-1">
      <GridImageButton image={images[0]} index={0} title={title} onImageClick={onImageClick} className="rounded-l-2xl" priority />
      <div className="grid grid-rows-2 gap-1">
        <GridImageButton image={images[1]} index={1} title={title} onImageClick={onImageClick} className="rounded-tr-2xl" />
        <div className="grid grid-cols-2 gap-1">
          <GridImageButton image={images[2]} index={2} title={title} onImageClick={onImageClick} />
          <GridImageButton image={images[3]} index={3} title={title} onImageClick={onImageClick} className="rounded-br-2xl" />
        </div>
      </div>
    </div>
  )
}

/** Reusable image button for the grid */
function GridImageButton({
  image,
  index,
  title,
  onImageClick,
  className,
  priority = false,
}: {
  image: GalleryImage
  index: number
  title: string
  onImageClick: (i: number) => void
  className?: string
  priority?: boolean
}) {
  return (
    <button
      onClick={() => onImageClick(index)}
      className={`relative overflow-hidden ${className || ''}`}
      aria-label={`View photo ${index + 1} of ${title}`}
    >
      <Image
        src={image.image.url}
        alt={image.image.alt || ''}
        width={1600}
        height={900}
        priority={priority}
        fetchPriority={priority ? 'high' : undefined}
        placeholder={image.image.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={image.image.blurDataUrl}
        className="h-full w-full object-cover"
        sizes="(min-width: 1024px) 420px, 100vw"
      />
    </button>
  )
}
