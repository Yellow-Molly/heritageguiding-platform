import type { Access } from 'payload'

/**
 * Access control: Only admin users can perform this action
 * Used for create/update/delete operations on content
 */
export const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}
