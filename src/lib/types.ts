export type CheckStatus = 'paid' | 'pending' | 'overdue';

export interface SupplierCheck {
  id: string;
  supplier_name: string;
  supplier_phone?: string | null;
  supplier_email?: string | null;
  reference?: string | null;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerCheck {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  reference?: string | null;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type NewSupplierCheck = Omit<SupplierCheck, 'id' | 'created_at' | 'updated_at'>;
export type NewCustomerCheck = Omit<CustomerCheck, 'id' | 'created_at' | 'updated_at'>;
