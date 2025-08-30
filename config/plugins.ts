export default ({ env }) => ({
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['companyName', 'contactPerson', 'phone'],
      },
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  email: {
    config: {
      provider: 'sendmail',
      providerOptions: {
        dkim: {
          privateKey: env('DKIM_PRIVATE_KEY'),
          keySelector: env('DKIM_KEY_SELECTOR'),
        },
      },
      settings: {
        defaultFrom: env('DEFAULT_FROM_EMAIL', 'noreply@strapi-rfq.com'),
        defaultReplyTo: env('DEFAULT_REPLY_TO_EMAIL', 'noreply@strapi-rfq.com'),
      },
    },
  },
  upload: {
    config: {
      sizeLimit: 250 * 1024 * 1024, // 250MB
      providerOptions: {
        localServer: {
          maxage: 300000
        },
      },
    },
  },
});
