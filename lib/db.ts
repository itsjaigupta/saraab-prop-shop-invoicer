import { supabase } from './supabase';
import type { Invoice, Expense } from '../types';

// localStorage key helper (must match the format used in App.tsx)
const lsKey = (user: string, base: string) => `${base}_${user}`;

// ---------------------------------------------------------------------------
// Migration: copy existing localStorage data → Supabase on first launch
// ---------------------------------------------------------------------------
export async function migrateLocalToSupabase(userId: string): Promise<void> {
  if (!supabase) return;
  const flag = `saraab_sb_migrated_${userId}`;
  if (localStorage.getItem(flag)) return;

  try {
    // Only migrate if Supabase is empty for this user
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count > 0) {
      localStorage.setItem(flag, '1');
      return;
    }

    const rawInvoices = localStorage.getItem(lsKey(userId, 'saraab_invoices'));
    if (rawInvoices) {
      const invoices: Invoice[] = JSON.parse(rawInvoices);
      if (invoices.length > 0) {
        const rows = invoices.map(inv => ({
          invoice_id: inv.id,
          user_id: userId,
          data: inv,
        }));
        await supabase.from('invoices').upsert(rows);
      }
    }

    const rawExpenses = localStorage.getItem(lsKey(userId, 'saraab_expenses'));
    if (rawExpenses) {
      const expenses: Expense[] = JSON.parse(rawExpenses);
      if (expenses.length > 0) {
        const rows = expenses.map(exp => ({
          expense_id: exp.id,
          user_id: userId,
          data: exp,
        }));
        await supabase.from('expenses').upsert(rows);
      }
    }

    const rawBranding = localStorage.getItem(lsKey(userId, 'saraab_branding_defaults'));
    if (rawBranding) {
      const b = JSON.parse(rawBranding);
      await supabase
        .from('branding')
        .upsert({ user_id: userId, logo: b.logo ?? null, signature: b.signature ?? null });
    }

    localStorage.setItem(flag, '1');
    console.log('[db] Migrated localStorage → Supabase');
  } catch (err) {
    console.error('[db] Migration error (non-fatal):', err);
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
export async function loadInvoices(userId: string): Promise<Invoice[]> {
  if (!supabase) {
    const raw = localStorage.getItem(lsKey(userId, 'saraab_invoices'));
    return raw ? JSON.parse(raw) : [];
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const invoices = (data ?? []).map(r => r.data as Invoice);
  localStorage.setItem(lsKey(userId, 'saraab_invoices'), JSON.stringify(invoices));
  return invoices;
}

export async function saveInvoice(
  userId: string,
  invoice: Invoice,
  allInvoices: Invoice[],
): Promise<void> {
  localStorage.setItem(lsKey(userId, 'saraab_invoices'), JSON.stringify(allInvoices));
  if (!supabase) return;

  const { error } = await supabase.from('invoices').upsert({
    invoice_id: invoice.id,
    user_id: userId,
    data: invoice,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteInvoice(
  userId: string,
  invoiceId: string,
  remaining: Invoice[],
): Promise<void> {
  localStorage.setItem(lsKey(userId, 'saraab_invoices'), JSON.stringify(remaining));
  if (!supabase) return;

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export async function loadExpenses(userId: string): Promise<Expense[]> {
  if (!supabase) {
    const raw = localStorage.getItem(lsKey(userId, 'saraab_expenses'));
    return raw ? JSON.parse(raw) : [];
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const expenses = (data ?? []).map(r => r.data as Expense);
  localStorage.setItem(lsKey(userId, 'saraab_expenses'), JSON.stringify(expenses));
  return expenses;
}

export async function saveExpense(
  userId: string,
  expense: Expense,
  allExpenses: Expense[],
): Promise<void> {
  localStorage.setItem(lsKey(userId, 'saraab_expenses'), JSON.stringify(allExpenses));
  if (!supabase) return;

  const { error } = await supabase.from('expenses').upsert({
    expense_id: expense.id,
    user_id: userId,
    data: expense,
  });
  if (error) throw error;
}

export async function deleteExpense(
  userId: string,
  expenseId: string,
  remaining: Expense[],
): Promise<void> {
  localStorage.setItem(lsKey(userId, 'saraab_expenses'), JSON.stringify(remaining));
  if (!supabase) return;

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('expense_id', expenseId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Branding defaults
// ---------------------------------------------------------------------------
export async function loadBranding(
  userId: string,
): Promise<{ logo: string | null; signature: string | null } | null> {
  if (!supabase) {
    const raw = localStorage.getItem(lsKey(userId, 'saraab_branding_defaults'));
    return raw ? JSON.parse(raw) : null;
  }

  const { data, error } = await supabase
    .from('branding')
    .select('logo, signature')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveBranding(
  userId: string,
  logo: string | null,
  signature: string | null,
): Promise<void> {
  localStorage.setItem(
    lsKey(userId, 'saraab_branding_defaults'),
    JSON.stringify({ logo, signature }),
  );
  if (!supabase) return;

  const { error } = await supabase.from('branding').upsert({
    user_id: userId,
    logo,
    signature,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
