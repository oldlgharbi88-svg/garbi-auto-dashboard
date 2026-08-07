import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_phone?: string | null;
  supplier_email?: string | null;
  supplier_ice?: string | null;
  invoice_date: string;
  due_date?: string | null;
  amount: number;
  paid: boolean;
  paid_date?: string | null;
  payment_method?: string | null;
  invoice_image_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface SupplierInvoiceItem {
  id: string;
  supplier_invoice_id: string;
  part_id?: number | null;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InventoryOption {
  id: number;
  name: string;
  reference: string;
  quantity: number;
  sellingprice: number;
  purchaseprice: number;
}

interface SupplierInvoiceItemFormRow {
  id: string;
  part_id?: number | null;
  part_name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface SupplierInvoiceFormState {
  invoice_number: string;
  supplier_name: string;
  supplier_phone: string;
  supplier_email: string;
  supplier_ice: string;
  invoice_date: string;
  due_date: string;
  base_amount: string;
  tax_rate: string;
  payment_method: string;
  paid: boolean;
  paid_date: string;
  notes: string;
  items: SupplierInvoiceItemFormRow[];
  update_inventory: boolean;
}

const emptyItemRow = (): SupplierInvoiceItemFormRow => ({
  id: crypto.randomUUID(),
  part_id: undefined,
  part_name: '',
  quantity: '1',
  unit_price: '0',
  total_price: '0'
});

const initialFormState = (): SupplierInvoiceFormState => ({
  invoice_number: '',
  supplier_name: '',
  supplier_phone: '',
  supplier_email: '',
  supplier_ice: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  base_amount: '0',
  tax_rate: '20',
  payment_method: '',
  paid: false,
  paid_date: '',
  notes: '',
  items: [emptyItemRow()],
  update_inventory: false
});

const inputClasses = 'w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const badgeBase = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold';

const getInvoiceStatus = (invoice: SupplierInvoice): 'paid' | 'pending' | 'overdue' => {
  if (invoice.paid) {
    return 'paid';
  }
  if (invoice.due_date) {
    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    if (dueDate < now) {
      return 'overdue';
    }
  }
  return 'pending';
};

const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

export default function SupplierInvoices() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<SupplierInvoiceItem[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [formState, setFormState] = useState<SupplierInvoiceFormState>(initialFormState());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      const [invoicesResponse, itemsResponse, inventoryResponse] = await Promise.all([
        supabase.from('supplier_invoices').select('*').order('invoice_date', { ascending: false }),
        supabase.from('supplier_invoice_items').select('*'),
        supabase.from('inventory').select('id,name,reference,quantity,sellingprice,purchaseprice').order('name', { ascending: true })
      ]);

      if (invoicesResponse.error) {
        throw invoicesResponse.error;
      }
      if (itemsResponse.error) {
        throw itemsResponse.error;
      }
      if (inventoryResponse.error) {
        throw inventoryResponse.error;
      }

      setInvoices((invoicesResponse.data as SupplierInvoice[]) ?? []);
      setInvoiceItems((itemsResponse.data as SupplierInvoiceItem[]) ?? []);
      setInventoryOptions((inventoryResponse.data as InventoryOption[]) ?? []);
    } catch (err) {
      console.error(err);
      setError('Unable to load supplier invoices right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const supplierOptions = useMemo(() => {
    const values = new Set(invoices.map((invoice) => invoice.supplier_name));
    return Array.from(values).sort();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const status = getInvoiceStatus(invoice);
      const matchesTab = activeTab === 'all' ? true : status === activeTab;
      const matchesStatusFilter = statusFilter === 'all' ? true : status === statusFilter;
      const matchesSearch = !query || [invoice.invoice_number, invoice.supplier_name].some((value) => value.toLowerCase().includes(query));
      const matchesSupplier = supplierFilter === 'all' || invoice.supplier_name === supplierFilter;
      const invoiceDate = new Date(invoice.invoice_date);
      const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo);
      return matchesTab && matchesStatusFilter && matchesSearch && matchesSupplier && matchesDateFrom && matchesDateTo;
    });
  }, [activeTab, dateFrom, dateTo, invoices, searchTerm, statusFilter, supplierFilter]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonthInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoice_date);
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
    });
    const amount = thisMonthInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const unpaidInvoices = invoices.filter((invoice) => !invoice.paid);
    const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    return {
      count: thisMonthInvoices.length,
      amount,
      unpaidCount: unpaidInvoices.length,
      unpaidAmount
    };
  }, [invoices]);

  const openCreateModal = () => {
    setEditingInvoice(null);
    setFormState(initialFormState());
    setImageFile(null);
    setImagePreview(null);
    setSavingMessage('');
    setShowModal(true);
  };

  const openEditModal = (invoice: SupplierInvoice) => {
    const invoiceItemsForRow = invoiceItems.filter((item) => item.supplier_invoice_id === invoice.id);
    setEditingInvoice(invoice);
    setFormState({
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier_name,
      supplier_phone: invoice.supplier_phone ?? '',
      supplier_email: invoice.supplier_email ?? '',
      supplier_ice: invoice.supplier_ice ?? '',
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date ?? '',
      base_amount: String(Number(invoice.amount || 0)),
      tax_rate: '20',
      payment_method: invoice.payment_method ?? '',
      paid: invoice.paid,
      paid_date: invoice.paid_date ?? '',
      notes: invoice.notes ?? '',
      items: invoiceItemsForRow.length > 0
        ? invoiceItemsForRow.map((item) => ({
            id: item.id,
            part_id: item.part_id ?? undefined,
            part_name: item.part_name,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
            total_price: String(item.total_price)
          }))
        : [emptyItemRow()],
      update_inventory: false
    });
    setImageFile(null);
    setImagePreview(invoice.invoice_image_url ?? null);
    setSavingMessage('');
    setShowModal(true);
  };

  const updateForm = (field: keyof SupplierInvoiceFormState, value: string | boolean) => {
    setFormState((current) => ({ ...current, [field]: value as never }));
  };

  const updateItemField = (itemId: string, field: keyof SupplierInvoiceItemFormRow, value: string) => {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item)
    }));
  };

  const addItemRow = () => {
    setFormState((current) => ({ ...current, items: [...current.items, emptyItemRow()] }));
  };

  const removeItemRow = (itemId: string) => {
    setFormState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId)
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSavingMessage('Image too large. Maximum size is 10MB.');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setSavingMessage('Unsupported file type.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSavingMessage('');
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSavingMessage('');

    const payload = {
      invoice_number: formState.invoice_number.trim(),
      supplier_name: formState.supplier_name.trim(),
      supplier_phone: formState.supplier_phone.trim() || null,
      supplier_email: formState.supplier_email.trim() || null,
      supplier_ice: formState.supplier_ice.trim() || null,
      invoice_date: formState.invoice_date || new Date().toISOString().slice(0, 10),
      due_date: formState.due_date || null,
      amount: Number(formState.base_amount || 0) * (1 + Number(formState.tax_rate || 0) / 100),
      paid: formState.paid,
      paid_date: formState.paid ? (formState.paid_date || new Date().toISOString().slice(0, 10)) : null,
      payment_method: formState.payment_method || null,
      notes: formState.notes.trim() || null
    };

    if (!payload.invoice_number || !payload.supplier_name || !payload.invoice_date || !formState.base_amount) {
      setSavingMessage('Please enter invoice number, supplier, date and amount.');
      setSubmitting(false);
      return;
    }

    try {
      let imageUrl = editingInvoice?.invoice_image_url ?? null;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
        const storagePath = `supplier-invoices/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('supplier-invoices').upload(storagePath, imageFile, { upsert: true, contentType: imageFile.type });
        if (uploadError) {
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage.from('supplier-invoices').getPublicUrl(storagePath);
        imageUrl = publicUrlData.publicUrl;
      }

      let savedInvoice: SupplierInvoice;
      if (editingInvoice) {
        const { data, error: updateError } = await supabase
          .from('supplier_invoices')
          .update({ ...payload, invoice_image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', editingInvoice.id)
          .select()
          .single();
        if (updateError) {
          throw updateError;
        }
        savedInvoice = data as SupplierInvoice;
      } else {
        const { data, error: insertError } = await supabase
          .from('supplier_invoices')
          .insert([{ ...payload, invoice_image_url: imageUrl, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
          .select()
          .single();
        if (insertError) {
          throw insertError;
        }
        savedInvoice = data as SupplierInvoice;
      }

      await supabase.from('supplier_invoice_items').delete().eq('supplier_invoice_id', savedInvoice.id);
      const validItems = formState.items
        .filter((item) => item.part_name.trim() || item.part_id)
        .map((item) => ({
          supplier_invoice_id: savedInvoice.id,
          part_id: item.part_id ?? null,
          part_name: item.part_name.trim(),
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0)
        }));

      if (validItems.length > 0) {
        await supabase.from('supplier_invoice_items').insert(validItems);
      }

      if (formState.update_inventory) {
        for (const item of validItems) {
          if (!item.part_id) {
            continue;
          }
          const { data: currentPart } = await supabase.from('inventory').select('quantity').eq('id', item.part_id).single();
          const nextQuantity = Number(currentPart?.quantity || 0) + Number(item.quantity || 0);
          await supabase.from('inventory').update({ quantity: nextQuantity }).eq('id', item.part_id);
        }
      }

      setShowModal(false);
      setEditingInvoice(null);
      setImageFile(null);
      setImagePreview(null);
      setFormState(initialFormState());
      await refreshData();
    } catch (err) {
      console.error(err);
      setSavingMessage('Saving failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (invoice: SupplierInvoice) => {
    const confirmed = window.confirm(`Delete invoice ${invoice.invoice_number}?`);
    if (!confirmed) {
      return;
    }
    try {
      await supabase.from('supplier_invoice_items').delete().eq('supplier_invoice_id', invoice.id);
      await supabase.from('supplier_invoices').delete().eq('id', invoice.id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError('Unable to delete invoice.');
    }
  };

  const markAsPaid = async (invoice: SupplierInvoice) => {
    try {
      await supabase.from('supplier_invoices').update({ paid: true, paid_date: new Date().toISOString().slice(0, 10) }).eq('id', invoice.id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError('Unable to update payment status.');
    }
  };

  const viewInvoice = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setSelectedImageUrl(invoice.invoice_image_url ?? null);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Supplier Invoices / فواتير الموردين</p>
          <h2 className="mt-2 text-3xl font-semibold text-on-surface">Supplier invoices</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Track paper invoices received from suppliers and digitize them in one place.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20">
          ➕ Ajouter une facture fournisseur
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
          <p className="text-sm text-on-surface-variant">Total invoices this month</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{summary.count}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
          <p className="text-sm text-on-surface-variant">Total amount this month</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{formatCurrency(summary.amount)}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
          <p className="text-sm text-on-surface-variant">Unpaid invoices</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{summary.unpaidCount}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
          <p className="text-sm text-on-surface-variant">Unpaid amount</p>
          <p className="mt-2 text-2xl font-semibold text-red-500">{formatCurrency(summary.unpaidAmount)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'paid', 'pending', 'overdue'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setStatusFilter(tab === 'all' ? 'all' : tab);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
            >
              {tab === 'all' ? 'Toutes les factures / كل الفواتير' : tab === 'paid' ? 'Payées / مدفوعة' : tab === 'pending' ? 'En attente / في الانتظار' : 'En retard / متأخرة'}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void refreshData()} className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
          🔄 Actualiser / تحديث
        </button>
      </div>

      <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by invoice or supplier" className={inputClasses} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'paid' | 'pending' | 'overdue')} className={inputClasses}>
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className={inputClasses}>
            <option value="all">All suppliers</option>
            {supplierOptions.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={inputClasses} />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={inputClasses} />
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-600/40 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}

      <div className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container">
        <table className="min-w-full divide-y divide-outline-variant text-sm">
          <thead className="bg-surface-container-high text-left text-xs uppercase tracking-[0.25em] text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">📷</th>
              <th className="px-4 py-3">N° Facture</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant">Loading supplier invoices…</td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant">No invoices found.</td>
              </tr>
            ) : (
              filteredInvoices.map((invoice, index) => {
                const status = getInvoiceStatus(invoice);
                return (
                  <tr key={invoice.id} className="hover:bg-surface-container-high/40">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      {invoice.invoice_image_url ? (
                        <button type="button" onClick={() => setSelectedImageUrl(invoice.invoice_image_url ?? null)} className="h-12 w-12 overflow-hidden rounded-lg border border-outline-variant">
                          <img src={invoice.invoice_image_url} alt={invoice.invoice_number} className="h-full w-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => viewInvoice(invoice)} className="font-semibold text-primary hover:underline">
                        {invoice.invoice_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setSupplierFilter(invoice.supplier_name)} className="font-semibold text-on-surface hover:underline">
                        {invoice.supplier_name}
                      </button>
                    </td>
                    <td className="px-4 py-3">{invoice.invoice_date}</td>
                    <td className="px-4 py-3">{invoice.due_date ?? '—'}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(invoice.amount || 0))}</td>
                    <td className="px-4 py-3">
                      <span className={`${badgeBase} ${status === 'paid' ? 'bg-green-500/15 text-green-500' : status === 'overdue' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {status === 'paid' ? 'Paid ✓' : status === 'overdue' ? 'Overdue 🔴' : 'Pending ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => viewInvoice(invoice)} className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-semibold text-on-surface">👁️ Voir</button>
                        <button type="button" onClick={() => openEditModal(invoice)} className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-semibold text-on-surface">✏️ Modifier</button>
                        <button type="button" onClick={() => void handleDelete(invoice)} className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500">🗑️ Supprimer</button>
                        {!invoice.paid ? (
                          <button type="button" onClick={() => void markAsPaid(invoice)} className="rounded-full bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-500">✓ Marquer payée</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{editingInvoice ? 'Edit supplier invoice' : 'New supplier invoice'}</p>
                <h3 className="mt-2 text-2xl font-semibold text-on-surface">Ajouter / modifier une facture fournisseur</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <section className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                <h4 className="text-lg font-semibold text-on-surface">1. Invoice image</h4>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container p-6 text-center text-on-surface-variant">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden" onChange={handleImageChange} />
                    <span className="text-4xl">📷</span>
                    <p className="mt-3 text-sm">Drag & drop or click to upload</p>
                    <p className="mt-1 text-xs">JPEG, PNG, WEBP, HEIC, PDF • Max 10MB</p>
                  </label>
                  <div className="flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface-container p-4">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-64 rounded-2xl object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-outline-variant text-sm text-on-surface-variant">No image selected</div>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-white">
                      📷 Prendre une photo
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                  <h4 className="text-lg font-semibold text-on-surface">2. Supplier information</h4>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">
                      Nom du fournisseur *
                      <input value={formState.supplier_name} onChange={(event) => updateForm('supplier_name', event.target.value)} required className={inputClasses} />
                    </label>
                    <label className="block text-sm font-semibold text-on-surface">
                      Téléphone
                      <input value={formState.supplier_phone} onChange={(event) => updateForm('supplier_phone', event.target.value)} className={inputClasses} />
                    </label>
                    <label className="block text-sm font-semibold text-on-surface">
                      Email
                      <input type="email" value={formState.supplier_email} onChange={(event) => updateForm('supplier_email', event.target.value)} className={inputClasses} />
                    </label>
                    <label className="block text-sm font-semibold text-on-surface">
                      ICE
                      <input value={formState.supplier_ice} onChange={(event) => updateForm('supplier_ice', event.target.value)} className={inputClasses} />
                    </label>
                  </div>
                </div>
                <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                  <h4 className="text-lg font-semibold text-on-surface">3. Invoice details</h4>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">
                      N° de facture *
                      <input value={formState.invoice_number} onChange={(event) => updateForm('invoice_number', event.target.value)} required className={inputClasses} />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-on-surface">
                        Date de facture *
                        <input type="date" value={formState.invoice_date} onChange={(event) => updateForm('invoice_date', event.target.value)} required className={inputClasses} />
                      </label>
                      <label className="block text-sm font-semibold text-on-surface">
                        Date d'échéance
                        <input type="date" value={formState.due_date} onChange={(event) => updateForm('due_date', event.target.value)} className={inputClasses} />
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-on-surface">
                        Montant HT *
                        <input type="number" min="0" step="0.01" value={formState.base_amount} onChange={(event) => updateForm('base_amount', event.target.value)} required className={inputClasses} />
                      </label>
                      <label className="block text-sm font-semibold text-on-surface">
                        TVA %
                        <input type="number" min="0" step="0.01" value={formState.tax_rate} onChange={(event) => updateForm('tax_rate', event.target.value)} className={inputClasses} />
                      </label>
                    </div>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container p-3 text-sm text-on-surface-variant">
                      Montant TTC: <span className="font-semibold text-on-surface">{formatCurrency(Number(formState.base_amount || 0) * (1 + Number(formState.tax_rate || 0) / 100))}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-on-surface">
                        Méthode de paiement
                        <select value={formState.payment_method} onChange={(event) => updateForm('payment_method', event.target.value)} className={inputClasses}>
                          <option value="">—</option>
                          <option value="cash">Espèces</option>
                          <option value="check">Chèque</option>
                          <option value="transfer">Virement</option>
                          <option value="credit">Crédit</option>
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-on-surface">
                        Statut
                        <select value={formState.paid ? 'paid' : 'pending'} onChange={(event) => updateForm('paid', event.target.value === 'paid')} className={inputClasses}>
                          <option value="pending">En attente</option>
                          <option value="paid">Payée</option>
                        </select>
                      </label>
                    </div>
                    <label className="block text-sm font-semibold text-on-surface">
                      Date de paiement
                      <input type="date" value={formState.paid_date} onChange={(event) => updateForm('paid_date', event.target.value)} className={inputClasses} />
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-on-surface">4. Items</h4>
                  <button type="button" onClick={addItemRow} className="rounded-full bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface">➕ Add item</button>
                </div>
                <div className="mt-4 space-y-3">
                  {formState.items.map((item, index) => (
                    <div key={item.id} className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container p-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto]">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-on-surface-variant">Part</label>
                        <input list="inventory-options" value={item.part_name} onChange={(event) => updateItemField(item.id, 'part_name', event.target.value)} className={inputClasses} placeholder="Search inventory" />
                        <datalist id="inventory-options">
                          {inventoryOptions.map((option) => (
                            <option key={option.id} value={option.name} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-on-surface-variant">Quantity</label>
                        <input type="number" min="1" value={item.quantity} onChange={(event) => updateItemField(item.id, 'quantity', event.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-on-surface-variant">Unit price</label>
                        <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateItemField(item.id, 'unit_price', event.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-on-surface-variant">Total</label>
                        <input type="number" min="0" step="0.01" value={item.total_price} onChange={(event) => updateItemField(item.id, 'total_price', event.target.value)} className={inputClasses} />
                      </div>
                      <button type="button" onClick={() => removeItemRow(item.id)} className="self-end rounded-2xl border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                    <input type="checkbox" checked={formState.update_inventory} onChange={(event) => updateForm('update_inventory', event.target.checked)} />
                    Mettre à jour le stock
                  </label>
                  <div className="text-sm text-on-surface-variant">
                    Total: <span className="font-semibold text-on-surface">{formatCurrency(formState.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0))}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                <h4 className="text-lg font-semibold text-on-surface">5. Notes</h4>
                <textarea value={formState.notes} onChange={(event) => updateForm('notes', event.target.value)} rows={4} className={`${inputClasses} mt-3`} />
              </section>

              {savingMessage ? <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500">{savingMessage}</div> : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
                  {submitting ? 'Saving…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showDetailModal && selectedInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Invoice details</p>
                <h3 className="mt-2 text-2xl font-semibold text-on-surface">{selectedInvoice.invoice_number}</h3>
              </div>
              <button type="button" onClick={() => setShowDetailModal(false)} className="rounded-full border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface">✕</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                {selectedImageUrl ? (
                  <div className="space-y-3">
                    <img src={selectedImageUrl} alt={selectedInvoice.invoice_number} className="max-h-[420px] w-full rounded-2xl object-contain" />
                    <a href={selectedImageUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface">
                      Download image
                    </a>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-outline-variant text-sm text-on-surface-variant">No image available</div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                  <h4 className="text-lg font-semibold text-on-surface">Invoice details</h4>
                  <dl className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <div className="flex justify-between gap-3"><dt>Supplier</dt><dd className="font-semibold text-on-surface">{selectedInvoice.supplier_name}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Invoice date</dt><dd className="font-semibold text-on-surface">{selectedInvoice.invoice_date}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Due date</dt><dd className="font-semibold text-on-surface">{selectedInvoice.due_date ?? '—'}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Amount</dt><dd className="font-semibold text-on-surface">{formatCurrency(Number(selectedInvoice.amount || 0))}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Status</dt><dd className="font-semibold text-on-surface">{selectedInvoice.paid ? 'Paid' : 'Pending'}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Payment method</dt><dd className="font-semibold text-on-surface">{selectedInvoice.payment_method ?? '—'}</dd></div>
                  </dl>
                </div>
                <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                  <h4 className="text-lg font-semibold text-on-surface">Items</h4>
                  <div className="mt-3 space-y-2">
                    {invoiceItems.filter((item) => item.supplier_invoice_id === selectedInvoice.id).length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No items listed.</p>
                    ) : (
                      invoiceItems.filter((item) => item.supplier_invoice_id === selectedInvoice.id).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container p-3 text-sm">
                          <span>{item.part_name}</span>
                          <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
