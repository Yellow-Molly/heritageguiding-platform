// Payload CMS hooks for field transformations
export { formatSlug, formatSlugHook } from './format-slug'

// Tour embedding generation hook for semantic search
export { generateTourEmbeddingOnSaveHook } from './generate-tour-embedding-on-save-hook'

// Media blur placeholder generation hook
export { generateBlurOnUploadHook } from './generate-blur-on-upload-hook'

// Next.js cache tag revalidation hooks (invalidate front-site data cache)
export {
  createRevalidateTagsAfterChangeHook,
  createRevalidateTagsAfterDeleteHook,
} from './revalidate-cache-tags-hook'
