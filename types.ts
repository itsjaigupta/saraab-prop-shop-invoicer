export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  days?: number; // For rentals
}

export interface ToggleableField {
  value: string;
  enabled: boolean;
}

export interface ClientDetails {
  name: ToggleableField;
  phone: ToggleableField;
  email: ToggleableField;
  address: ToggleableField;
  pan: ToggleableField;
  gstin: ToggleableField;
}

export interface ProjectDetails {
  productionHouse: ToggleableField;
  productionDesigner: ToggleableField;
  artDirector: ToggleableField;
  brandName: ToggleableField;
}

export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface DateDetails {
  pickup: string;
  pickupSlot: TimeSlot;
  return: string;
  returnSlot: TimeSlot;
}

export interface Invoice {
  id: string;
  date: string; // Invoice generation date
  
  client: ClientDetails;
  project: ProjectDetails;
  dates: DateDetails;
  deliveryLocation: ToggleableField;
  
  items: InvoiceItem[];
  enableManualTotal: boolean; // New field for lump sum mode
  manualTotal: number; // New field for the manual total value
  showLineItemRates: boolean; // Controls visibility of rates in preview
  taxEnabled: boolean;
  taxRate: number; // Percentage
  discount: number; 
  discountType: 'amount' | 'percentage';
  securityDeposit: number; // Refundable security deposit
  notes: string;
  logo: string | null; // Base64 data URI for the logo
  signature: string | null; // Base64 data URI for the signature
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export enum Currency {
  INR = 'INR'
}