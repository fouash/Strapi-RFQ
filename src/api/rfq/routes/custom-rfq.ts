export default {
  routes: [
    {
      method: 'POST',
      path: '/rfqs/:id/award',
      handler: 'rfq.awardBid'
    }
  ]
};