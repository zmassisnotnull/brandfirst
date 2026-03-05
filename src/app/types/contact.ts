export interface Contact {
  id: string;
  name: string;
  position: string;
  department?: string;
  companyId: string;
  
  // Contact Info
  mobile?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  
  // Address
  address?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  brandColor?: string;
  
  // Company Info
  address?: string;
  phone?: string;
  fax?: string;
  website?: string;
  
  // Metadata
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWithCompany extends Contact {
  company: Company;
}
