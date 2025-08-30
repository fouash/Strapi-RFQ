/**
 * `is-owner-or-admin` policy
 */

export default async (policyContext, config, { strapi }) => {
  const { state, params } = policyContext;
  
  if (!state.user) {
    return false;
  }
  
  // Check if user is admin
  const userRole = state.user.role?.name || state.user.role?.type;
  if (userRole === 'Super Admin' || userRole === 'Administrator') {
    return true;
  }
  
  // Check if user owns the resource
  const { id } = params;
  if (!id) {
    return false;
  }
  
  // This would need to be customized based on the content type
  // For now, return true for authenticated users
  return true;
};