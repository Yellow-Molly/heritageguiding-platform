import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/cache unstable_cache as a passthrough for tests.
// unstable_cache requires Next.js server runtime (incrementalCache) which is
// not available in vitest jsdom environment.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))
