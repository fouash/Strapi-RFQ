/**
 * Saudi Arabian Compliance Validation Service
 * Centralized validation for all Saudi compliance requirements
 */

export interface SaudiComplianceData {
  vatNumber?: string;
  commercialRegistration?: string;
  nationalAddress?: string;
  additionalNumbers?: {
    avl?: string;      // Authorized Value Added - 10 digits
    nwc?: string;      // National Water Company - 12 digits
    se?: string;       // Saudi Electricity - 10 digits
    modon?: string;    // Saudi Industrial Property Authority - 8 digits
  };
}

export interface ComplianceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SaudiComplianceService {
  
  /**
   * Validate all Saudi Arabian compliance numbers
   */
  static validateAll(data: SaudiComplianceData): ComplianceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
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
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate specific compliance number types
   */
  static validateVATNumber(vatNumber: string): boolean {
    return /^3[0-9]{14}$/.test(vatNumber);
  }
  
  static validateCommercialRegistration(cr: string): boolean {
    return /^[0-9]{10}$/.test(cr);
  }
  
  static validateNationalAddress(address: string): boolean {
    return /^[0-9]{8}$/.test(address);
  }
  
  static validateAVL(avl: string): boolean {
    return /^[0-9]{10}$/.test(avl);
  }
  
  static validateNWC(nwc: string): boolean {
    return /^[0-9]{12}$/.test(nwc);
  }
  
  static validateSE(se: string): boolean {
    return /^[0-9]{10}$/.test(se);
  }
  
  static validateMODON(modon: string): boolean {
    return /^[0-9]{8}$/.test(modon);
  }
  
  /**
   * Get compliance status based on provided data
   */
  static getComplianceStatus(data: SaudiComplianceData): 'compliant' | 'partial' | 'non-compliant' {
    const result = this.validateAll(data);
    
    if (result.isValid && result.warnings.length === 0) {
      return 'compliant';
    } else if (result.isValid && result.warnings.length > 0) {
      return 'partial';
    } else {
      return 'non-compliant';
    }
  }
  
  /**
   * Generate compliance report
   */
  static generateComplianceReport(data: SaudiComplianceData): {
    status: string;
    score: number;
    details: ComplianceValidationResult;
    recommendations: string[];
  } {
    const validation = this.validateAll(data);
    const status = this.getComplianceStatus(data);
    
    // Calculate compliance score (0-100)
    const totalChecks = 7; // VAT, CR, National Address, AVL, NWC, SE, MODON
    const passedChecks = totalChecks - validation.errors.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    const recommendations: string[] = [];
    
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