/**
 * vendor service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::vendor.vendor', ({ strapi }) => ({
  async validateSaudiCompliance(data) {
    const errors = [];
    
    // VAT Number validation
    if (data.vatNumber && !/^3[0-9]{14}$/.test(data.vatNumber)) {
      errors.push('VAT Number must be 15 digits starting with 3');
    }
    
    // Commercial Registration validation
    if (data.commercialRegistration && !/^[0-9]{10}$/.test(data.commercialRegistration)) {
      errors.push('Commercial Registration must be 10 digits');
    }
    
    // National Address validation
    if (data.nationalAddress && !/^[0-9]{8}$/.test(data.nationalAddress)) {
      errors.push('National Address must be 8 digits');
    }
    
    // Additional Saudi numbers validation
    if (data.additionalNumbers) {
      const additionalNumbers = typeof data.additionalNumbers === 'string' 
        ? JSON.parse(data.additionalNumbers) 
        : data.additionalNumbers;
      
      // AVL (Authorized Value Added) - 10 digits
      if (additionalNumbers.avl && !/^[0-9]{10}$/.test(additionalNumbers.avl)) {
        errors.push('AVL number must be 10 digits');
      }
      
      // NWC (National Water Company) - 12 digits
      if (additionalNumbers.nwc && !/^[0-9]{12}$/.test(additionalNumbers.nwc)) {
        errors.push('NWC number must be 12 digits');
      }
      
      // SE (Saudi Electricity) - 10 digits
      if (additionalNumbers.se && !/^[0-9]{10}$/.test(additionalNumbers.se)) {
        errors.push('SE number must be 10 digits');
      }
      
      // MODON (Saudi Industrial Property Authority) - 8 digits
      if (additionalNumbers.modon && !/^[0-9]{8}$/.test(additionalNumbers.modon)) {
        errors.push('MODON number must be 8 digits');
      }
    }
    
    return errors;
  }
}));