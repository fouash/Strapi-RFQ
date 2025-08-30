export default {
  routes: [
    {
      method: 'GET',
      path: '/bids/by-rfq/:rfqId',
      handler: 'bid.findByRfq',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/bids/by-vendor/:vendorId',
      handler: 'bid.findByVendor',
      config: {
        policies: ['global::is-vendor']
      }
    }
  ]
};