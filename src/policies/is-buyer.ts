/**
 * `is-buyer` policy
 */

export default (policyContext, config, { strapi }) => {
  const { state } = policyContext;
  
  if (!state.user) {
    return false;
  }
  
  // Check if user has buyer role
  const userRole = state.user.role?.name || state.user.role?.type;
  return userRole === 'Buyer' || userRole === 'buyer';
};