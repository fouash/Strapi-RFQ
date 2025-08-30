/**
 * `is-vendor` policy
 */

export default (policyContext, config, { strapi }) => {
  const { state } = policyContext;
  
  if (!state.user) {
    return false;
  }
  
  // Check if user has vendor role
  const userRole = state.user.role?.name || state.user.role?.type;
  return userRole === 'Vendor' || userRole === 'vendor';
};