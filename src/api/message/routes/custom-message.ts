export default {
  routes: [
    {
      method: 'GET',
      path: '/messages/conversations',
      handler: 'message.getConversations'
    },
    {
      method: 'POST',
      path: '/messages/mark-read',
      handler: 'message.markAllRead'
    }
  ]
};