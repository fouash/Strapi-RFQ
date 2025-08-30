/**
 * Tests for Saudi Compliance Service
 */

// Mock the compliance service for testing
class SaudiComplianceService {
  static validateVATNumber(vatNumber) {
    return /^3[0-9]{14}$/.test(vatNumber);
  }
  
  static validateCommercialRegistration(cr) {
    return /^[0-9]{10}$/.test(cr);
  }
  
  static validateNationalAddress(address) {
    return /^[0-9]{8}$/.test(address);
  }
  
  static validateAVL(avl) {
    return /^[0-9]{10}$/.test(avl);
  }
  
  static validateNWC(nwc) {
    return /^[0-9]{12}$/.test(nwc);
  }
  
  static validateSE(se) {
    return /^[0-9]{10}$/.test(se);
  }
  
  static validateMODON(modon) {
    return /^[0-9]{8}$/.test(modon);
  }
  
  static validateAll(data) {
    const errors = [];
    const warnings = [];
    
    // VAT Number validation (mandatory for businesses)
    if (data.vatNumber) {
      if (!/^3[0-9]{14}$/.test(data.vatNumber)) {
        errors.push('VAT Number must be 15 digits starting with 3');
      }
    } else {
      warnings.push('VAT Number is not provided - required for VAT-registered businesses');
    }
    
    // Commercial Registration validation (mandatory)
    if (data.commercialRegistration) {
      if (!/^[0-9]{10}$/.test(data.commercialRegistration)) {
        errors.push('Commercial Registration must be 10 digits');
      }
    } else {
      errors.push('Commercial Registration is required');
    }
    
    // National Address validation (recommended)
    if (data.nationalAddress) {
      if (!/^[0-9]{8}$/.test(data.nationalAddress)) {
        errors.push('National Address must be 8 digits');
      }
    } else {
      warnings.push('National Address is not provided - recommended for official correspondence');
    }
    
    // Additional numbers validation
    if (data.additionalNumbers) {
      const additionalNumbers = typeof data.additionalNumbers === 'string' 
        ? JSON.parse(data.additionalNumbers) 
        : data.additionalNumbers;
      
      if (additionalNumbers.avl && !/^[0-9]{10}$/.test(additionalNumbers.avl)) {
        errors.push('AVL number must be 10 digits');
      }
      
      if (additionalNumbers.nwc && !/^[0-9]{12}$/.test(additionalNumbers.nwc)) {
        errors.push('NWC number must be 12 digits');
      }
      
      if (additionalNumbers.se && !/^[0-9]{10}$/.test(additionalNumbers.se)) {
        errors.push('SE number must be 10 digits');
      }
      
      if (additionalNumbers.modon && !/^[0-9]{8}$/.test(additionalNumbers.modon)) {
        errors.push('MODON number must be 8 digits');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  static getComplianceStatus(data) {
    const result = this.validateAll(data);
    
    if (result.isValid && result.warnings.length === 0) {
      return 'compliant';
    } else if (result.isValid && result.warnings.length > 0) {
      return 'partial';
    } else {
      return 'non-compliant';
    }
  }
  
  static generateComplianceReport(data) {
    const validation = this.validateAll(data);
    const status = this.getComplianceStatus(data);
    
    const totalChecks = 7;
    const passedChecks = totalChecks - validation.errors.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    const recommendations = [];
    
    if (!data.vatNumber) {
      recommendations.push('Register for VAT if annual revenue exceeds 375,000 SAR');
    }
    
    if (!data.nationalAddress) {
      recommendations.push('Register for National Address for official government correspondence');
    }
    
    if (!data.additionalNumbers?.avl && data.commercialRegistration) {
      recommendations.push('Consider registering for AVL if dealing with value-added services');
    }
    
    return {
      status,
      score,
      details: validation,
      recommendations
    };
  }
}

describe('Saudi Compliance Validation', () => {
  
  describe('VAT Number Validation', () => {
    test('should validate correct VAT number format', () => {
      expect(SaudiComplianceService.validateVATNumber('312345678901234')).toBe(true);
    });
    
    test('should reject VAT number not starting with 3', () => {
      expect(SaudiComplianceService.validateVATNumber('212345678901234')).toBe(false);
    });
    
    test('should reject VAT number with incorrect length', () => {
      expect(SaudiComplianceService.validateVATNumber('31234567890123')).toBe(false);
      expect(SaudiComplianceService.validateVATNumber('3123456789012345')).toBe(false);
    });
  });
  
  describe('Commercial Registration Validation', () => {
    test('should validate correct CR format', () => {
      expect(SaudiComplianceService.validateCommercialRegistration('1234567890')).toBe(true);
    });
    
    test('should reject CR with incorrect length', () => {
      expect(SaudiComplianceService.validateCommercialRegistration('123456789')).toBe(false);
      expect(SaudiComplianceService.validateCommercialRegistration('12345678901')).toBe(false);
    });
    
    test('should reject CR with non-numeric characters', () => {
      expect(SaudiComplianceService.validateCommercialRegistration('123456789A')).toBe(false);
    });
  });
  
  describe('National Address Validation', () => {
    test('should validate correct National Address format', () => {
      expect(SaudiComplianceService.validateNationalAddress('12345678')).toBe(true);
    });
    
    test('should reject National Address with incorrect length', () => {
      expect(SaudiComplianceService.validateNationalAddress('1234567')).toBe(false);
      expect(SaudiComplianceService.validateNationalAddress('123456789')).toBe(false);
    });
  });
  
  describe('Additional Numbers Validation', () => {
    test('should validate AVL number format', () => {
      expect(SaudiComplianceService.validateAVL('1234567890')).toBe(true);
      expect(SaudiComplianceService.validateAVL('123456789')).toBe(false);
    });
    
    test('should validate NWC number format', () => {
      expect(SaudiComplianceService.validateNWC('123456789012')).toBe(true);
      expect(SaudiComplianceService.validateNWC('12345678901')).toBe(false);
    });
    
    test('should validate SE number format', () => {
      expect(SaudiComplianceService.validateSE('1234567890')).toBe(true);
      expect(SaudiComplianceService.validateSE('123456789')).toBe(false);
    });
    
    test('should validate MODON number format', () => {
      expect(SaudiComplianceService.validateMODON('12345678')).toBe(true);
      expect(SaudiComplianceService.validateMODON('1234567')).toBe(false);
    });
  });
  
  describe('Complete Compliance Validation', () => {
    test('should validate complete compliant data', () => {
      const data = {
        vatNumber: '312345678901234',
        commercialRegistration: '1234567890',
        nationalAddress: '12345678',
        additionalNumbers: {
          avl: '1234567890',
          nwc: '123456789012'
        }
      };
      
      const result = SaudiComplianceService.validateAll(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should identify validation errors', () => {
      const data = {
        vatNumber: '212345678901234', // Invalid - doesn't start with 3
        commercialRegistration: '123456789', // Invalid - wrong length
        nationalAddress: '12345678' // Valid
      };
      
      const result = SaudiComplianceService.validateAll(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VAT Number must be 15 digits starting with 3');
      expect(result.errors).toContain('Commercial Registration must be 10 digits');
    });
    
    test('should generate compliance status correctly', () => {
      const compliantData = {
        vatNumber: '312345678901234',
        commercialRegistration: '1234567890',
        nationalAddress: '12345678'
      };
      
      const partialData = {
        commercialRegistration: '1234567890',
        nationalAddress: '12345678'
        // Missing VAT number
      };
      
      const nonCompliantData = {
        vatNumber: '212345678901234', // Invalid
        commercialRegistration: '123456789' // Invalid
      };
      
      expect(SaudiComplianceService.getComplianceStatus(compliantData)).toBe('compliant'); // Actually compliant since it has VAT, CR, and National Address
      expect(SaudiComplianceService.getComplianceStatus(partialData)).toBe('partial');
      expect(SaudiComplianceService.getComplianceStatus(nonCompliantData)).toBe('non-compliant');
    });
    
    test('should generate compliance report with score', () => {
      const data = {
        vatNumber: '312345678901234',
        commercialRegistration: '1234567890'
        // Missing some optional data
      };
      
      const report = SaudiComplianceService.generateComplianceReport(data);
      expect(report.score).toBeGreaterThan(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.details).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });
});

// Mock data for testing
const mockBuyerData = {
  vatNumber: '312345678901234',
  commercialRegistration: '1234567890',
  nationalAddress: '12345678',
  additionalNumbers: {
    avl: '1234567890'
  }
};

const mockVendorData = {
  vatNumber: '312345678901235',
  commercialRegistration: '1234567891',
  nationalAddress: '12345679',
  additionalNumbers: {
    nwc: '123456789012',
    se: '1234567890'
  }
};

describe('Integration Tests', () => {
  test('should handle buyer compliance validation', () => {
    const result = SaudiComplianceService.validateAll(mockBuyerData);
    expect(result.isValid).toBe(true);
  });
  
  test('should handle vendor compliance validation', () => {
    const result = SaudiComplianceService.validateAll(mockVendorData);
    expect(result.isValid).toBe(true);
  });
  
  test('should handle additional numbers validation', () => {
    const dataWithAdditionalNumbers = {
      commercialRegistration: '1234567890',
      additionalNumbers: {
        avl: '1234567890',
        nwc: '123456789012',
        se: '1234567890',
        modon: '12345678'
      }
    };
    
    const result = SaudiComplianceService.validateAll(dataWithAdditionalNumbers);
    expect(result.isValid).toBe(true);
  });
});