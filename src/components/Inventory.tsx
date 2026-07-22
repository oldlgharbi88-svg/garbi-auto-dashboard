import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface InventoryItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: number;
  sellingprice: number;
  quantity: number;
}

interface InventoryInsert {
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: number;
  sellingprice: number;
  quantity: number;
}

interface InventoryFormState {
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: string;
  sellingprice: string;
  quantity: string;
}

type InventoryLanguage = 'ar' | 'fr';
type EditableField = 'purchaseprice' | 'sellingprice' | 'quantity';

const defaultFormState: InventoryFormState = {
  name: '',
  reference: '',
  compatible_cars: '',
  purchaseprice: '0',
  sellingprice: '0',
  quantity: '1'
};


const inputClasses =
  'bg-surface-container-lowest border border-outline-variant rounded-lg h-touch-target px-4 focus:ring-2 focus:ring-secondary-container';

export default function Inventory() {
  const [parts, setParts] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [language, setLanguage] = useState<InventoryLanguage>(() => {
    if (typeof window === 'undefined') {
      return 'fr';
    }

    return window.localStorage.getItem('inventoryLang') === 'ar' ? 'ar' : 'fr';
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formState, setFormState] = useState<InventoryFormState>(defaultFormState);
  const [saveError, setSaveError] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ id: number | string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    window.localStorage.setItem('inventoryLang', language);
  }, [language]);

  const translations = {
    fr: {
      title: 'Gestion de stock',
      subtitle: 'Suivi et mise à jour rapide des pièces disponibles.',
      searchPlaceholder: 'Rechercher une pièce ou une référence…',
      addButton: 'Ajouter une pièce',
      table: {
        number: '#',
        image: 'Image',
        name: 'Nom de la pièce',
        reference: 'Référence',
        compatible: 'Voitures compatibles',
        purchase: 'Prix d\'achat',
        selling: 'Prix de vente',
        quantity: 'Quantité',
        actions: 'Actions',
        lowStock: 'Stock faible'
      },
      form: {
        title: 'Ajouter une nouvelle pièce',
        name: 'Nom de la pièce',
        reference: 'Référence',
        compatible_cars: 'Voitures compatibles',
        purchaseprice: 'Prix d\'achat',
        sellingprice: 'Prix de vente',
        quantity: 'Quantité',
        image: 'Image de la pièce',
        imageHelp: 'PNG, JPEG ou WEBP • Max 5 Mo',
        uploadImage: 'Ajouter une image',
        removeImage: 'Retirer',
        cancel: 'Annuler',
        save: 'Enregistrer'
      },
      edit: 'Modifier',
      delete: 'Supprimer'
    },
    ar: {
      title: 'إدارة المخزون',
      subtitle: 'متابعة وتحديث سريع للقطع المتوفرة.',
      searchPlaceholder: 'ابحث عن قطعة أو مرجع…',
      addButton: 'إضافة قطعة',
      table: {
        number: '#',
        image: 'الصورة',
        name: 'اسم القطعة',
        reference: 'المرجع',
        compatible: 'السيارات المناسبة',
        purchase: 'سعر الشراء',
        selling: 'سعر البيع',
        quantity: 'الكمية',
        actions: 'الإجراءات',
        lowStock: 'مخزون منخفض'
      },
      form: {
        title: 'إضافة قطعة جديدة',
        name: 'اسم القطعة',
        reference: 'المرجع',
        compatible_cars: 'السيارات المناسبة',
        purchaseprice: 'سعر الشراء',
        sellingprice: 'سعر البيع',
        quantity: 'الكمية',
        cancel: 'إلغاء',
        save: 'حفظ'
      },
      edit: 'تعديل',
      delete: 'حذف'
    }
  };

  const labels = translations[language];

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Failed to load inventory:', error.message);
      return;
    }

    setParts((data as InventoryItem[] | null) ?? []);
  };

  useEffect(() => {
    fetchInventory();

    const inventoryChannel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedItem = payload.new as InventoryItem;
          setParts((previousParts) => [updatedItem, ...previousParts.filter((part) => part.id.toString() !== updatedItem.id.toString())]);
        }

        if (payload.eventType === 'DELETE') {
          const deletedItem = payload.old as InventoryItem;
          setParts((previousParts) => previousParts.filter((part) => part.id.toString() !== deletedItem.id.toString()));
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(inventoryChannel);
    };
  }, []);

  const filteredParts = parts.filter((item) => {
    const query = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(query) || item.reference.toLowerCase().includes(query);
  });

  const startInlineEdit = (item: InventoryItem, field: EditableField) => {
    setEditingCell({ id: item.id, field });
    setEditValue(String(item[field]));
  };

  const saveInlineEdit = async () => {
    if (!editingCell) {
      return;
    }

    const parsedValue = Number(editValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setEditingCell(null);
      setEditValue('');
      return;
    }

    const nextValue = editingCell.field === 'quantity' ? Math.max(0, Math.floor(parsedValue)) : parsedValue;
    const updatePayload = { [editingCell.field]: nextValue };

    const { data, error } = await supabase
      .from('inventory')
      .update(updatePayload)
      .eq('id', editingCell.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Unable to save inventory edit:', error.message);
      setEditingCell(null);
      setEditValue('');
      return;
    }

    if (data) {
      setParts((previousParts) => [data, ...previousParts.filter((part) => part.id.toString() !== data.id.toString())]);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleQuantityChange = async (itemId: number | string, delta: number) => {
    const part = parts.find((item) => item.id.toString() === itemId.toString());
    if (!part) {
      return;
    }

    const nextQuantity = Math.max(0, part.quantity + delta);
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: nextQuantity })
      .eq('id', itemId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Unable to update quantity:', error.message);
      return;
    }

    if (data) {
      setParts((previousParts) => [data, ...previousParts.filter((item) => item.id.toString() !== data.id.toString())]);
    }
  };

  const handleDeletePart = async (itemId: number | string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) {
      console.error('Unable to delete inventory item:', error.message);
      return;
    }

    setParts((previousParts) => previousParts.filter((part) => part.id.toString() !== itemId.toString()));
  };

  const openModal = () => {
    setFormState(defaultFormState);
    setShowModal(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previousState) => ({ ...previousState, [name]: value }));
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');

    if (!formState.name.trim() || !formState.reference.trim()) {
      setSaveError('Name and reference are required.');
      return;
    }

    const newItem: InventoryInsert = {
      name: formState.name.trim(),
      reference: formState.reference.trim(),
      compatible_cars: formState.compatible_cars.trim(),
      purchaseprice: Number(formState.purchaseprice) || 0,
      sellingprice: Number(formState.sellingprice) || 0,
      quantity: Math.max(0, Math.floor(Number(formState.quantity) || 0))
    };

    const { data, error } = await supabase.from('inventory').insert([newItem]).select().single();

    if (error) {
      console.error('Unable to add inventory item:', error.message);
      setSaveError(error.message ?? 'Unable to save inventory item.');
      return;
    }

    if (data) {
      setParts((previousParts) => [data, ...previousParts.filter((item) => item.id.toString() !== data.id.toString())]);
    }

    setShowModal(false);
    setFormState(defaultFormState);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Inventory / المخزون / Inventaire</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">{labels.title}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">{labels.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage((previousLanguage) => (previousLanguage === 'fr' ? 'ar' : 'fr'))}
              className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
            >
              {language === 'fr' ? 'العربية' : 'Français'}
            </button>
            <button
              type="button"
              onClick={openModal}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            >
              {labels.addButton}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-1 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder={labels.searchPlaceholder}
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.number}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.name}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.reference}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.compatible}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.purchase}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.selling}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.quantity}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container">
              {filteredParts.map((item, index) => {
                const isLowStock = item.quantity < 3;
                const isEditing = editingCell?.id === item.id;

                return (
                  <tr key={item.id} className={isLowStock ? 'bg-error-container' : 'bg-surface-container'}>
                    <td className="px-3 py-4 text-sm text-on-surface">{index + 1}</td>
                    <td className="px-3 py-4 text-sm font-semibold text-on-surface">{item.name}</td>
                    <td className="px-3 py-4 text-sm text-on-surface-variant">{item.reference}</td>
                    <td className="px-3 py-4 text-sm text-on-surface-variant">{item.compatible_cars}</td>
                    <td className="px-3 py-4 text-sm font-data-tabular text-on-surface">
                      {isEditing && editingCell?.field === 'purchaseprice' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveInlineEdit();
                            }
                          }}
                          className="w-24 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm text-on-surface"
                          type="number"
                        />
                      ) : (
                        <button type="button" onClick={() => startInlineEdit(item, 'purchaseprice')} className="text-left">
                          {item.purchaseprice.toFixed(2)} MAD
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm font-data-tabular text-on-surface">
                      {isEditing && editingCell?.field === 'sellingprice' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveInlineEdit();
                            }
                          }}
                          className="w-24 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm text-on-surface"
                          type="number"
                        />
                      ) : (
                        <button type="button" onClick={() => startInlineEdit(item, 'sellingprice')} className="text-left">
                          {item.sellingprice.toFixed(2)} MAD
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm font-data-tabular text-on-surface">
                      {isEditing && editingCell?.field === 'quantity' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveInlineEdit();
                            }
                          }}
                          className="w-20 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm text-on-surface"
                          type="number"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleQuantityChange(item.id, -1)} className="rounded-full border border-outline-variant px-2 py-1 text-sm text-on-surface">
                            −
                          </button>
                          <button type="button" onClick={() => startInlineEdit(item, 'quantity')} className="flex items-center gap-2 text-left">
                            <span className="font-data-tabular">{item.quantity}</span>
                            {isLowStock ? (
                              <span className="material-symbols-outlined text-base text-error" title={labels.table.lowStock}>warning</span>
                            ) : null}
                          </button>
                          <button type="button" onClick={() => handleQuantityChange(item.id, 1)} className="rounded-full border border-outline-variant px-2 py-1 text-sm text-on-surface">
                            +
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startInlineEdit(item, 'purchaseprice')} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button type="button" onClick={() => handleDeletePart(item.id)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">{labels.form.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-on-surface">{labels.form.title}</h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleFormSubmit}>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant md:col-span-2">
                {labels.form.name}
                <input name="name" value={formState.name} onChange={handleFormChange} className={inputClasses} placeholder={labels.form.name} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                {labels.form.reference}
                <input name="reference" value={formState.reference} onChange={handleFormChange} className={inputClasses} placeholder={labels.form.reference} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                {labels.form.compatible_cars}
                <input name="compatible_cars" value={formState.compatible_cars} onChange={handleFormChange} className={inputClasses} placeholder={labels.form.compatible_cars} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                {labels.form.purchaseprice}
                <input type="number" name="purchaseprice" value={formState.purchaseprice} onChange={handleFormChange} className={inputClasses} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                {labels.form.sellingprice}
                <input type="number" name="sellingprice" value={formState.sellingprice} onChange={handleFormChange} className={inputClasses} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                {labels.form.quantity}
                <input type="number" name="quantity" value={formState.quantity} onChange={handleFormChange} className={inputClasses} />
              </label>


              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                  {labels.form.cancel}
                </button>
                <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                  {labels.form.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
