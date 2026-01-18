import type { Access } from 'payload'

/**
 * Access control: User must be logged in
 * Used for operations requiring authentication
 */
export const isAuthenticated: Access = ({ req }) => {
  return Boolean(req.user)
}
