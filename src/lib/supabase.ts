import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CompanyRow = {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  ice?: string | null;
  rc?: string | null;
  created_at?: string | null;
};

export type CompanyInvoiceRow = {
  id: string;
  company_id?: string | null;
  invoice_number: string;
  total_amount: number;
  paid_amount?: number | null;
  remaining_amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

export async function getCurrentSupabaseUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function syncCartCustomPriceToSupabase(productId: string, customPrice: number) {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      return;
    }

    const { error } = await supabase.from('cart_custom_prices').upsert(
      {
        user_id: user.id,
        product_id: productId,
        custom_price: customPrice,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,product_id' }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to sync custom price to Supabase', error);
  }
}

export async function fetchCartCustomPricesFromSupabase() {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      return {} as Record<string, number>;
    }

    const { data, error } = await supabase.from('cart_custom_prices').select('product_id, custom_price').eq('user_id', user.id);
    if (error) {
      throw error;
    }

    return Object.fromEntries((data ?? []).map((row: Record<string, unknown>) => [String(row.product_id), Number(row.custom_price)]));
  } catch (error) {
    console.error('Failed to load custom prices from Supabase', error);
    return {} as Record<string, number>;
  }
}
