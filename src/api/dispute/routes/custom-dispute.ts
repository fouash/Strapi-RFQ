export default {
  routes: [
    {
      method: 'POST',
      path: '/disputes/:id/assign',
      handler: 'dispute.assign'
    },
    {
      method: 'POST',
      path: '/disputes/:id/escalate',
      handler: 'dispute.escalate'
    },
    {
      method: 'GET',
      path: '/disputes/statistics',
      handler: 'dispute.getStatistics'
    }
  ]
};