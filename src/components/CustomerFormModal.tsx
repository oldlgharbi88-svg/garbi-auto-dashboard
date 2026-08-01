import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface CustomerFormModalProps {
  mode: 'regular' | 'credit';
  onClose: () => void;
  onSuccess: () => void;
  language: 'ar' | 'fr';
}

interface RegularCustomerFormData {
  name: string;
  phone: string;
  address: string;
  note: string;
}

interface CreditCustomerFormData {
  name: string;
  phone: string;
  amount: string;
  debtDescription: string;
  date: string;
}

const initialRegularForm: RegularCustomerFormData = {
  name: '',
  phone: '',
  address: '',
  note: ''
};

const initialCreditForm: CreditCustomerFormData = {
  name: '',
  phone: '',
  amount: '',
  debtDescription: '',
  date: new Date().toISOString().slice(0, 10)
};

const validateName = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return 'Name must be between 2 and 100 characters.';
  }

  if (!/^[\p{L}\p{M}0-9\s'’.-]+$/u.test(trimmed)) {
    return 'Name contains unsupported characters.';
  }

  return '';
};

const validatePhone = (value: string) => {
  if (!value.trim()) {
    return '';
  }

  const normalized = value.trim();
  const phoneRegex = /^(0[67]\d{8}|\+212[67]\d{8})$/;

  if (!phoneRegex.test(normalized)) {
    return 'Invalid phone format.';
  }

  return '';
};

const validateAmount = (value: string) => {
  const parsed = Number(value);
  if (!value.trim()) {
    return 'Amount is required.';
  }
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000000) {
    return 'Amount must be between 1 and 1,000,000.';
  }
  return '';
};

const validate = (data: RegularCustomerFormData | CreditCustomerFormData, mode: 'regular' | 'credit') => {
  const errors: Record<string, string> = {};
  const nameError = validateName(data.name);
  const phoneError = validatePhone(data.phone);

  if (nameError) {
    errors.name = nameError;
  }
  if (phoneError) {
    errors.phone = phoneError;
  }

  if (mode === 'regular') {
    const regularData = data as RegularCustomerFormData;
    if (regularData.address.trim().length > 200) {
      errors.address = 'Address must be at most 200 characters.';
    }
    if (regularData.note.trim().length > 500) {
      errors.note = 'Note must be at most 500 characters.';
    }
  } else {
    const creditData = data as CreditCustomerFormData;
    const amountError = validateAmount(creditData.amount);
    if (amountError) {
      errors.amount = amountError;
    }
    if (creditData.debtDescription.trim().length > 500) {
      errors.debtDescription = 'Debt description must be at most 500 characters.';
    }
  }

  return errors;
};

export default function CustomerFormModal({ mode, onClose, onSuccess, language }: CustomerFormModalProps) {
  const [regularForm, setRegularForm] = useState<RegularCustomerFormData>(initialRegularForm);
  const [creditForm, setCreditForm] = useState<CreditCustomerFormData>(initialCreditForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const translations = useMemo(() => ({
    fr: {
      titleRegular: 'Ajouter un nouveau client',
      titleCredit: 'Ajouter un client endetté',
      name: 'Nom',
      phone: 'Téléphone',
      address: 'Adresse',
      note: 'Note',
      amount: 'Montant dû',
      debtDescription: 'Description de la dette',
      date: 'Date',
      cancel: 'Annuler',
      save: 'Ajouter',
      saveCredit: 'Ajouter',
      errors: {
        name: 'Le nom est obligatoire (2 à 100 caractères).',
        phone: 'Le numéro de téléphone est invalide.',
        amount: 'Le montant doit être compris entre 1 et 1 000 000.',
        address: 'L’adresse doit faire au maximum 200 caractères.',
        note: 'La note doit faire au maximum 500 caractères.',
        debtDescription: 'La description de la dette doit faire au maximum 500 caractères.'
      }
    },
    ar: {
      titleRegular: 'إضافة زبون جديد',
      titleCredit: 'إضافة زبون مدين',
      name: 'الاسم',
      phone: 'الهاتف',
      address: 'العنوان',
      note: 'ملاحظة',
      amount: 'المبلغ المستحق',
      debtDescription: 'سبب الدين',
      date: 'التاريخ',
      cancel: 'إلغاء',
      save: 'إضافة',
      saveCredit: 'إضافة',
      errors: {
        name: 'الاسم مطلوب (من 2 إلى 100 حرف).',
        phone: 'رقم الهاتف غير صالح.',
        amount: 'يجب أن يكون المبلغ بين 1 و1,000,000.',
        address: 'يجب أن يكون العنوان على الأكثر 200 حرف.',
        note: 'يجب أن تكون الملاحظة على الأكثر 500 حرف.',
        debtDescription: 'يجب أن يكون سبب الدين على الأكثر 500 حرف.'
      }
    }
  }), [language]);

  const labels = translations[language];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRegularSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(regularForm, 'regular');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(Object.fromEntries(Object.entries(nextErrors).map(([key, value]) => [key, labels.errors[key as keyof typeof labels.errors] || value])));
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from('customers').insert({
      name: regularForm.name.trim(),
      phone: regularForm.phone.trim() || null,
      address: regularForm.address.trim() || null,
      note: regularForm.note.trim() || null,
      balance: 0,
      last_transaction_date: new Date().toISOString().slice(0, 10)
    });

    setSubmitting(false);
    if (error) {
      return;
    }

    onSuccess();
    onClose();
  };

  const handleCreditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(creditForm, 'credit');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(Object.fromEntries(Object.entries(nextErrors).map(([key, value]) => [key, labels.errors[key as keyof typeof labels.errors] || value])));
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.from('customers').insert({
      name: creditForm.name.trim(),
      phone: creditForm.phone.trim() || null,
      balance: Number(creditForm.amount),
      last_transaction_date: creditForm.date || new Date().toISOString().slice(0, 10)
    }).select('id').single();

    setSubmitting(false);
    if (error || !data?.id) {
      return;
    }

    await supabase.from('payments').insert({
      customer_id: data.id,
      amount: Number(creditForm.amount),
      payment_method: 'cash',
      payment_date: creditForm.date || new Date().toISOString().slice(0, 10),
      note: creditForm.debtDescription.trim() ? `Initial debt: ${creditForm.debtDescription.trim()}` : 'Initial debt'
    });

    onSuccess();
    onClose();
  };

  const isRegularMode = mode === 'regular';
  const isSubmitDisabled = isRegularMode
    ? submitting || !regularForm.name.trim() || regularForm.name.trim().length < 2
    : submitting || !creditForm.name.trim() || creditForm.name.trim().length < 2 || !creditForm.amount.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">{isRegularMode ? labels.titleRegular : labels.titleCredit}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{language === 'ar' ? 'إدخال سريع' : 'Saisie rapide'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
            ×
          </button>
        </div>

        {isRegularMode ? (
          <form noValidate onSubmit={handleRegularSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.name} *</label>
              <input
                type="text"
                value={regularForm.name}
                onChange={(event) => setRegularForm((previous) => ({ ...previous, name: event.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.name ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
              />
              {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.phone}</label>
                <input
                  type="tel"
                  value={regularForm.phone}
                  onChange={(event) => setRegularForm((previous) => ({ ...previous, phone: event.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.phone ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
                />
                {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.address}</label>
              <textarea
                value={regularForm.address}
                onChange={(event) => setRegularForm((previous) => ({ ...previous, address: event.target.value }))}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.address ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
              />
              {errors.address ? <p className="mt-1 text-sm text-red-600">{errors.address}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.note}</label>
              <textarea
                value={regularForm.note}
                onChange={(event) => setRegularForm((previous) => ({ ...previous, note: event.target.value }))}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.note ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
              />
              {errors.note ? <p className="mt-1 text-sm text-red-600">{errors.note}</p> : null}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${isSubmitDisabled ? 'cursor-not-allowed bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {submitting ? 'Enregistrement...' : labels.save}
              </button>
            </div>
          </form>
        ) : (
          <form noValidate onSubmit={handleCreditSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.name} *</label>
              <input
                type="text"
                value={creditForm.name}
                onChange={(event) => setCreditForm((previous) => ({ ...previous, name: event.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.name ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
              />
              {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.phone}</label>
                <input
                  type="tel"
                  value={creditForm.phone}
                  onChange={(event) => setCreditForm((previous) => ({ ...previous, phone: event.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.phone ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
                />
                {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.amount} *</label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  step="0.01"
                  value={creditForm.amount}
                  onChange={(event) => setCreditForm((previous) => ({ ...previous, amount: event.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.amount ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
                />
                {errors.amount ? <p className="mt-1 text-sm text-red-600">{errors.amount}</p> : null}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.debtDescription}</label>
              <textarea
                value={creditForm.debtDescription}
                onChange={(event) => setCreditForm((previous) => ({ ...previous, debtDescription: event.target.value }))}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2 text-on-surface ${errors.debtDescription ? 'border-red-500' : 'border-outline-variant bg-surface-container-high'}`}
              />
              {errors.debtDescription ? <p className="mt-1 text-sm text-red-600">{errors.debtDescription}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.date}</label>
              <input type="date" value={creditForm.date} onChange={(event) => setCreditForm((previous) => ({ ...previous, date: event.target.value }))} className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${isSubmitDisabled ? 'cursor-not-allowed bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {submitting ? 'Enregistrement...' : labels.saveCredit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
