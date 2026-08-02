import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { processImage } from '../utils/imageProcessor';
import RestockModal from './RestockModal';

interface InventoryItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: number;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
  archived?: boolean | null;
  last_restock_date?: string | null;
  total_sold?: number | null;
  low_stock_threshold?: number | null;
}

interface InventoryInsert {
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: number;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
  archived?: boolean;
  total_sold?: number;
  low_stock_threshold?: number;
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageEditTarget, setImageEditTarget] = useState<InventoryItem | null>(null);
  const [imageEditFile, setImageEditFile] = useState<File | null>(null);
  const [imageEditPreview, setImageEditPreview] = useState<string | null>(null);
  const [imageEditError, setImageEditError] = useState<string>('');
  const [imageEditSuccess, setImageEditSuccess] = useState<string>('');
  const [isUpdatingImage, setIsUpdatingImage] = useState<boolean>(false);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState<boolean>(false);
  const [updatingImageId, setUpdatingImageId] = useState<number | string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [processedImageBlob, setProcessedImageBlob] = useState<Blob | null>(null);
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string>('');
  const [imageUploadMode, setImageUploadMode] = useState<'original' | 'processed'>('original');
  const [imageProcessingCache, setImageProcessingCache] = useState<Record<string, Blob>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [historyEntries, setHistoryEntries] = useState<Array<{ id: string; quantity_ordered: number; status: string; created_at?: string | null; supplier?: string | null; note?: string | null }>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingQuantityId, setUpdatingQuantityId] = useState<number | string | null>(null);
  const [updatingQuantityDelta, setUpdatingQuantityDelta] = useState<number | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem('inventoryLang', language);
  }, [language]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  useEffect(() => {
    return () => {
      if (imageEditPreview) {
        URL.revokeObjectURL(imageEditPreview);
      }
    };
  }, [imageEditPreview]);

  useEffect(() => {
    return () => {
      if (processedImagePreview) {
        URL.revokeObjectURL(processedImagePreview);
      }
    };
  }, [processedImagePreview]);

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
        lowStock: 'Stock faible',
        outOfStock: 'Rupture',
        bulk: 'Commander la sélection'
      },
      tabs: {
        all: 'Toutes les pièces',
        inStock: 'En stock',
        lowStock: 'Stock faible',
        outOfStock: 'Pièces en rupture'
      },
      restock: {
        summaryTitle: 'Pièces en rupture',
        count: 'Pièces à réapprovisionner',
        totalValue: 'Valeur estimée',
        export: 'Exporter la liste',
        orderAll: 'Commander tout',
        selectAll: 'Tout sélectionner',
        clearSelection: 'Effacer la sélection',
        history: 'Historique',
        archive: 'Archiver',
        restock: 'Réapprovisionner',
        order: 'Commander',
        viewHistory: 'Voir l’historique'
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
      imageProcessing: {
        processButton: 'Traiter l’image',
        processingTitle: 'Traitement de l’image…',
        removingBackground: 'Suppression de l’arrière-plan…',
        enhancing: 'Amélioration de l’image…',
        finalizing: 'Finalisation…',
        useProcessed: 'Utiliser l’image traitée',
        useOriginal: 'Utiliser l’original',
        original: 'Original',
        processed: 'Version professionnelle',
        fallbackNotice: 'Le traitement a échoué. L’image originale sera utilisée.'
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
        lowStock: 'مخزون منخفض',
        outOfStock: 'نفد المخزون',
        bulk: 'تنفيذ التحديد'
      },
      tabs: {
        all: 'كل القطع',
        inStock: 'متوفرة',
        lowStock: 'مخزون ضعيف',
        outOfStock: 'القطع اللي نفدت'
      },
      restock: {
        summaryTitle: 'القطع اللي نفدت',
        count: 'قطع تحتاج تجهيز',
        totalValue: 'القيمة المقدرة',
        export: 'تصدير القائمة',
        orderAll: 'تجهيز الكل',
        selectAll: 'اختيار الكل',
        clearSelection: 'إلغاء التحديد',
        history: 'السجل',
        archive: 'أرشفة',
        restock: 'تجهيز',
        order: 'تجهيز',
        viewHistory: 'عرض السجل'
      },
      form: {
        title: 'إضافة قطعة جديدة',
        name: 'اسم القطعة',
        reference: 'المرجع',
        compatible_cars: 'السيارات المناسبة',
        purchaseprice: 'سعر الشراء',
        sellingprice: 'سعر البيع',
        quantity: 'الكمية',
        image: 'صورة القطعة',
        imageHelp: 'PNG أو JPEG أو WEBP • الحد الأقصى 5 ميغابايت',
        removeImage: 'إزالة',
        cancel: 'إلغاء',
        save: 'حفظ'
      },
      imageProcessing: {
        processButton: 'معالجة الصورة',
        processingTitle: 'جاري معالجة الصورة…',
        removingBackground: 'جاري إزالة الخلفية…',
        enhancing: 'جاري تحسين الصورة…',
        finalizing: 'جاري الإنهاء…',
        useProcessed: 'استخدام الصورة المجهزة',
        useOriginal: 'استخدام الأصل',
        original: 'الأصل',
        processed: 'نسخة احترافية',
        fallbackNotice: 'فشل المعالجة. سيتم استخدام الصورة الأصلية.'
      },
      edit: 'تعديل',
      delete: 'حذف'
    }
  };

  const labels = translations[language];

  const resetImageSelection = () => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    if (processedImagePreview) {
      URL.revokeObjectURL(processedImagePreview);
    }

    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setImageUploadError('');
    setProcessingStage('');
    setIsProcessingImage(false);
    setProcessedImageBlob(null);
    setProcessedImagePreview(null);
    setProcessingError('');
    setImageUploadMode('original');
  };

  const createRandomFilename = (originalName: string) => {
    const extension = originalName.split('.').pop() ?? '';
    const randomString = Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${randomString}${extension ? `.${extension}` : ''}`;
  };

  const createCacheKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  const extractStorageFilename = (imageUrl: string) => {
    try {
      const pathname = new URL(imageUrl).pathname;
      const segments = pathname.split('/');
      const fileName = segments[segments.length - 1] ?? '';
      return decodeURIComponent(fileName);
    } catch {
      return null;
    }
  };

  const uploadPartImage = async (file: File | Blob, fallbackName: string = 'image.png'): Promise<string> => {
    const fileName = createRandomFilename(fallbackName);
    const { data, error } = await supabase.storage.from('part-images').upload(fileName, file, {
      cacheControl: '3600',
      contentType: file.type || 'image/png',
      upsert: false
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('part-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      resetImageSelection();
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError('Please select a PNG, JPEG, or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image must be 5 MB or less.');
      event.target.value = '';
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    setImageUploadError('');
  };

  const clearImageEditSelection = () => {
    if (imageEditPreview) {
      URL.revokeObjectURL(imageEditPreview);
    }

    if (processedImagePreview) {
      URL.revokeObjectURL(processedImagePreview);
    }

    setImageEditTarget(null);
    setImageEditFile(null);
    setImageEditPreview(null);
    setImageEditError('');
    setProcessingStage('');
    setIsProcessingImage(false);
    setProcessedImageBlob(null);
    setProcessedImagePreview(null);
    setProcessingError('');
    setImageUploadMode('original');
    setIsImageEditModalOpen(false);
  };

  const openImageEditPicker = (item: InventoryItem) => {
    setImageEditTarget(item);
    setImageEditError('');
    setImageEditSuccess('');
    setIsImageEditModalOpen(false);
    imageFileInputRef.current?.click();
  };

  const handleImageEditSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearImageEditSelection();
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageEditError('Please select a PNG, JPEG, or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageEditError('Image must be 5 MB or less.');
      event.target.value = '';
      return;
    }

    if (imageEditPreview) {
      URL.revokeObjectURL(imageEditPreview);
    }

    setImageEditFile(file);
    setImageEditPreview(URL.createObjectURL(file));
    setImageEditError('');
    setIsImageEditModalOpen(true);
    setProcessingStage(labels.imageProcessing.processingTitle);
    setIsProcessingImage(true);
    setImageUploadMode('processed');
    setProcessingError('');

    try {
      const cacheKey = createCacheKey(file);
      const cachedImage = imageProcessingCache[cacheKey];
      if (cachedImage) {
        setProcessedImageBlob(cachedImage);
        setProcessedImagePreview(URL.createObjectURL(cachedImage));
        setIsProcessingImage(false);
        setProcessingStage(labels.imageProcessing.finalizing);
      } else {
        const processedBlob = await processImage(file, ({ stage }) => {
          setProcessingStage(stage);
        });
        setImageProcessingCache((previousCache) => ({ ...previousCache, [cacheKey]: processedBlob }));
        setProcessedImageBlob(processedBlob);
        setProcessedImagePreview(URL.createObjectURL(processedBlob));
        setIsProcessingImage(false);
        setProcessingStage(labels.imageProcessing.finalizing);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : labels.imageProcessing.fallbackNotice;
      setProcessingError(message);
      setIsProcessingImage(false);
    }

    event.target.value = '';
  };

  const handleSaveImageEdit = async () => {
    if (!imageEditTarget || !imageEditFile) {
      return;
    }

    setIsUpdatingImage(true);
    setUpdatingImageId(imageEditTarget.id);
    setImageEditError('');

    try {
      // Upload the replacement image first so we can safely update the inventory row.
      const uploadTarget = imageUploadMode === 'processed' && processedImageBlob ? processedImageBlob : imageEditFile;
      const publicUrl = await uploadPartImage(uploadTarget, imageEditFile?.name ?? 'image.png');

      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory')
        .update({ image_url: publicUrl })
        .eq('id', imageEditTarget.id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      // Delete the old image after the row update succeeds; if that fails, we warn and continue.
      const oldImageUrl = imageEditTarget.image_url;
      if (oldImageUrl) {
        const oldFileName = extractStorageFilename(oldImageUrl);
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage.from('part-images').remove([oldFileName]);
          if (deleteError) {
            console.warn('Unable to delete the previous part image:', deleteError.message);
          }
        }
      }

      if (updatedItem) {
        setParts((previousParts) => [updatedItem, ...previousParts.filter((part) => part.id.toString() !== updatedItem.id.toString())]);
      } else {
        await fetchInventory();
      }

      setImageEditSuccess('Image updated successfully.');
      clearImageEditSelection();
      await fetchInventory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the image.';
      setImageEditError(message);
    } finally {
      setIsUpdatingImage(false);
      setUpdatingImageId(null);
    }
  };

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Failed to load inventory:', error.message);
      return;
    }

    setParts((data as InventoryItem[] | null) ?? []);
  };

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

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

  const visibleParts = useMemo(() => {
    const query = searchTerm.toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    return parts.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.reference.toLowerCase().includes(query) ||
        item.compatible_cars.toLowerCase().includes(query);

      const matchesDate = (() => {
        if (!item.last_restock_date) {
          return true;
        }

        const itemDate = new Date(item.last_restock_date);
        if (Number.isNaN(itemDate.getTime())) {
          return true;
        }

        if (fromDate && itemDate < fromDate) {
          return false;
        }

        if (toDate) {
          const inclusiveEndDate = new Date(toDate);
          inclusiveEndDate.setHours(23, 59, 59, 999);
          if (itemDate > inclusiveEndDate) {
            return false;
          }
        }

        return true;
      })();

      if (!matchesSearch || !matchesDate) {
        return false;
      }

      const threshold = item.low_stock_threshold ?? 3;
      const status = item.quantity === 0 ? 'out-of-stock' : item.quantity <= threshold ? 'low-stock' : 'in-stock';
      const shouldShow =
        activeTab === 'all' ||
        (activeTab === 'in-stock' && status === 'in-stock') ||
        (activeTab === 'low-stock' && status === 'low-stock') ||
        (activeTab === 'out-of-stock' && status === 'out-of-stock');

      return shouldShow && !item.archived;
    });
  }, [activeTab, dateFrom, dateTo, parts, searchTerm]);

  const outOfStockParts = useMemo(() => visibleParts.filter((item) => item.quantity === 0), [visibleParts]);
  const lowStockParts = useMemo(() => visibleParts.filter((item) => item.quantity > 0 && item.quantity <= (item.low_stock_threshold ?? 3)), [visibleParts]);
  const inStockParts = useMemo(() => visibleParts.filter((item) => item.quantity > (item.low_stock_threshold ?? 3)), [visibleParts]);

  const counts = useMemo(
    () => ({
      all: visibleParts.length,
      inStock: inStockParts.length,
      lowStock: lowStockParts.length,
      outOfStock: outOfStockParts.length
    }),
    [inStockParts.length, lowStockParts.length, outOfStockParts.length, visibleParts.length]
  );

  const totalRestockValue = useMemo(() => outOfStockParts.reduce((sum, item) => sum + item.purchaseprice * 1, 0), [outOfStockParts]);

  const toggleSelected = (itemId: number | string) => {
    setSelectedIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  };

  const selectAllVisible = () => {
    setSelectedIds(visibleParts.map((item) => item.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleArchivePart = async (itemId: number | string) => {
    const { error } = await supabase.from('inventory').update({ archived: true }).eq('id', itemId);
    if (error) {
      console.error('Unable to archive item:', error.message);
      return;
    }

    setParts((previousParts) => previousParts.map((part) => (part.id.toString() === itemId.toString() ? { ...part, archived: true } : part)));
    setToastMessage('Pièce archivée.');
  };

  const openHistory = async (item: InventoryItem) => {
    setHistoryTarget(item);
    const { data, error } = await supabase.from('restock_orders').select('*').eq('part_id', item.id).order('created_at', { ascending: false });
    if (!error) {
      setHistoryEntries((data ?? []) as Array<{ id: string; quantity_ordered: number; status: string; created_at?: string | null; supplier?: string | null; note?: string | null }>);
    }
  };

  const handleBulkRestock = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const selectedItems = parts.filter((part) => selectedIds.includes(part.id));
    const itemNames = selectedItems.map((item) => item.name).join(', ');
    setToastMessage(`Commande préparée pour: ${itemNames}`);
    clearSelection();
  };

  const startInlineEdit = (item: InventoryItem, field: EditableField) => {
    setEditingCell({ id: item.id, field });
    setEditValue(String(item[field]));
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) {
      return;
    }

    const parsedValue = Number(editValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      cancelInlineEdit();
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
      cancelInlineEdit();
      return;
    }

    if (data) {
      setParts((previousParts) => [data, ...previousParts.filter((part) => part.id.toString() !== data.id.toString())]);
    }

    cancelInlineEdit();
  };

  const handleQuantityChange = async (itemId: number | string, delta: number) => {
    const itemKey = itemId.toString();
    const part = parts.find((item) => item.id.toString() === itemKey);
    if (!part) {
      return;
    }

    if (delta < 0 && part.quantity === 0) {
      return;
    }

    const nextQuantity = delta < 0 ? Math.max(0, part.quantity - 1) : part.quantity + 1;

    setUpdatingQuantityId(itemId);
    setUpdatingQuantityDelta(delta);
    setParts((previousParts) =>
      previousParts.map((item) => (item.id.toString() === itemKey ? { ...item, quantity: nextQuantity } : item))
    );

    try {
      const { error } = await supabase.from('inventory').update({ quantity: nextQuantity }).eq('id', itemId);

      if (error) {
        setParts((previousParts) =>
          previousParts.map((item) => (item.id.toString() === itemKey ? { ...item, quantity: part.quantity } : item))
        );
        setToastMessage('Impossible de mettre à jour la quantité.');
        return;
      }
    } finally {
      setUpdatingQuantityId(null);
      setUpdatingQuantityDelta(null);
    }
  };

  const handleDeletePart = async (itemId: number | string) => {
    const confirmed = window.confirm('Supprimer cette pièce de l’inventaire ?');
    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) {
      console.error('Unable to delete inventory item:', error.message);
      setToastMessage('Impossible de supprimer cette pièce.');
      return;
    }

    setParts((previousParts) => previousParts.filter((part) => part.id.toString() !== itemId.toString()));
    setToastMessage('Pièce supprimée.');
  };

  const openModal = () => {
    setFormState(defaultFormState);
    resetImageSelection();
    setSaveError('');
    setShowModal(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previousState) => ({ ...previousState, [name]: value }));
  };

  const handleProcessSelectedImage = async () => {
    if (!selectedImageFile) {
      return;
    }

    setIsProcessingImage(true);
    setProcessingStage(labels.imageProcessing.processingTitle);
    setProcessingError('');
    setImageUploadMode('processed');

    try {
      const cacheKey = createCacheKey(selectedImageFile);
      const cachedImage = imageProcessingCache[cacheKey];
      if (cachedImage) {
        setProcessedImageBlob(cachedImage);
        setProcessedImagePreview(URL.createObjectURL(cachedImage));
        setIsProcessingImage(false);
        setProcessingStage(labels.imageProcessing.finalizing);
      } else {
        const processedBlob = await processImage(selectedImageFile, ({ stage }) => {
          setProcessingStage(stage);
        });
        setImageProcessingCache((previousCache) => ({ ...previousCache, [cacheKey]: processedBlob }));
        setProcessedImageBlob(processedBlob);
        setProcessedImagePreview(URL.createObjectURL(processedBlob));
        setIsProcessingImage(false);
        setProcessingStage(labels.imageProcessing.finalizing);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : labels.imageProcessing.fallbackNotice;
      setProcessingError(message);
      setIsProcessingImage(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');

    if (!formState.name.trim() || !formState.reference.trim()) {
      setSaveError('Name and reference are required.');
      return;
    }

    let imageUrl: string | null = null;
    if (selectedImageFile) {
      setIsUploadingImage(true);
      try {
        const uploadTarget = imageUploadMode === 'processed' && processedImageBlob ? processedImageBlob : selectedImageFile;
        imageUrl = await uploadPartImage(uploadTarget, selectedImageFile.name);
      } catch (error) {
        const uploadMessage = error instanceof Error ? error.message : 'Unable to upload image.';
        setSaveError(uploadMessage);
        imageUrl = null;
      } finally {
        setIsUploadingImage(false);
      }
    }

    const newItem: InventoryInsert = {
      name: formState.name.trim(),
      reference: formState.reference.trim(),
      compatible_cars: formState.compatible_cars.trim(),
      purchaseprice: Number(formState.purchaseprice) || 0,
      sellingprice: Number(formState.sellingprice) || 0,
      quantity: Math.max(0, Math.floor(Number(formState.quantity) || 0)),
      image_url: imageUrl,
      archived: false,
      total_sold: 0,
      low_stock_threshold: 3
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

    resetImageSelection();
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
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
              <span>Du</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="bg-transparent outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
              <span>Au</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="bg-transparent outline-none" />
            </label>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'all', label: labels.tabs.all, count: counts.all },
            { key: 'in-stock', label: labels.tabs.inStock, count: counts.inStock },
            { key: 'low-stock', label: labels.tabs.lowStock, count: counts.lowStock },
            { key: 'out-of-stock', label: labels.tabs.outOfStock, count: counts.outOfStock }
          ].map((tab) => {
            const active = activeTab === tab.key;
            const isOutOfStock = tab.key === 'out-of-stock';
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock')}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? isOutOfStock
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {tab.label} {active ? `(${tab.count})` : `(${tab.count})`}
              </button>
            );
          })}
        </div>

        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">{labels.restock.summaryTitle}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{outOfStockParts.length} {labels.restock.count}</h2>
              <p className="mt-1 text-sm text-zinc-400">{labels.restock.totalValue}: {totalRestockValue.toFixed(2)} MAD</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-full border border-red-500/30 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-red-300">
                {labels.restock.export}
              </button>
              <button type="button" onClick={handleBulkRestock} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                {labels.restock.orderAll}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={selectAllVisible} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
              {labels.restock.selectAll}
            </button>
            <button type="button" onClick={clearSelection} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
              {labels.restock.clearSelection}
            </button>
            {selectedIds.length > 0 ? (
              <span className="rounded-full bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-400">{selectedIds.length} sélectionnée(s)</span>
            ) : null}
          </div>
          <button type="button" onClick={handleBulkRestock} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            {labels.table.bulk}
          </button>
        </div>

        {imageEditSuccess ? (
          <div className="mb-4 rounded-2xl border border-success/40 bg-success-container px-4 py-3 text-sm text-on-success-container">
            {imageEditSuccess}
          </div>
        ) : null}

        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageEditSelection}
          className="hidden"
        />

        <div className="overflow-hidden rounded-2xl border border-outline-variant">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === visibleParts.length}
                    onChange={() => (selectedIds.length === visibleParts.length ? clearSelection() : selectAllVisible())}
                    className="rounded border-outline-variant"
                  />
                </th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.number}</th>
                <th className="px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.image}</th>
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
              {visibleParts.map((item, index) => {
                const threshold = item.low_stock_threshold ?? 3;
                const isOutOfStock = item.quantity === 0;
                const isLowStock = item.quantity > 0 && item.quantity <= threshold;
                const isEditing = editingCell?.id === item.id;
                const rowStateClass = isOutOfStock ? 'bg-red-500/10 text-zinc-300' : isLowStock ? 'bg-amber-500/10 text-zinc-300' : 'bg-surface-container';

                return (
                  <tr key={item.id} className={rowStateClass}>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        className="rounded border-outline-variant"
                      />
                    </td>
                    <td className="px-3 py-4 text-sm text-on-surface">{index + 1}</td>
                    <td className="px-3 py-4">
                      <div className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-base text-on-surface-variant">image</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openImageEditPicker(item)}
                          disabled={isUpdatingImage && updatingImageId === item.id}
                          className="absolute right-0 top-0 rounded-full border border-outline-variant bg-surface-container-high p-1 text-on-surface opacity-0 shadow-sm transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
                          aria-label="Edit image"
                        >
                          {isUpdatingImage && updatingImageId === item.id ? (
                            <span className="flex items-center justify-center">
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="56" />
                              </svg>
                            </span>
                          ) : (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L8.5 17.5l-4 1 1-4 11-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                              <path d="m14.5 6.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-on-surface">
                      <div className="flex flex-col gap-1">
                        <span>{item.name}</span>
                        {isOutOfStock ? <span className="w-fit rounded-full bg-red-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">{labels.table.outOfStock}</span> : null}
                        {isLowStock ? <span className="w-fit rounded-full bg-amber-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">{labels.table.lowStock}</span> : null}
                      </div>
                    </td>
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
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              cancelInlineEdit();
                            }
                          }}
                          className="w-20 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm text-on-surface"
                          type="number"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleQuantityChange(item.id, -1)}
                            disabled={item.quantity === 0 || updatingQuantityId === item.id}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant px-2 py-1 text-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Decrease quantity"
                          >
                            {updatingQuantityId === item.id && updatingQuantityDelta === -1 ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="56" />
                              </svg>
                            ) : (
                              '−'
                            )}
                          </button>
                          <button
                            type="button"
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              startInlineEdit(item, 'quantity');
                            }}
                            className="flex items-center gap-2 text-left"
                          >
                            <span className="font-data-tabular">{item.quantity}</span>
                            {isLowStock ? (
                              <span className="material-symbols-outlined text-base text-error" title={labels.table.lowStock}>warning</span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuantityChange(item.id, 1)}
                            disabled={updatingQuantityId === item.id}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant px-2 py-1 text-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Increase quantity"
                          >
                            {updatingQuantityId === item.id && updatingQuantityDelta === 1 ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="56" />
                              </svg>
                            ) : (
                              '+'
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setRestockTarget(item)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
                          {labels.restock.restock}
                        </button>
                        <button type="button" onClick={() => void openHistory(item)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          {labels.restock.viewHistory}
                        </button>
                        <button type="button" onClick={() => void handleArchivePart(item.id)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          {labels.restock.archive}
                        </button>
                        <button type="button" onClick={() => startInlineEdit(item, 'purchaseprice')} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button type="button" onClick={() => void handleDeletePart(item.id)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
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

      {isImageEditModalOpen && imageEditTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Update image / Mise à jour de l’image</p>
                <h2 className="mt-2 text-2xl font-semibold text-on-surface">Replace image</h2>
              </div>
              <button type="button" onClick={clearImageEditSelection} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">Current image</p>
                <div className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-gray-200">
                  {imageEditTarget.image_url ? (
                    <img src={imageEditTarget.image_url} alt={imageEditTarget.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">image</span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">New image</p>
                {imageEditPreview ? (
                  <div className="mt-3 overflow-hidden rounded-2xl">
                    <img src={imageEditPreview} alt="Preview of replacement" className="h-40 w-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-outline-variant text-sm text-on-surface-variant">
                    Choose a new PNG, JPEG, or WEBP image up to 5 MB.
                  </div>
                )}
                {imageEditError ? <p role="alert" className="mt-3 text-sm text-error">{imageEditError}</p> : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={clearImageEditSelection} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveImageEdit}
                disabled={!imageEditFile || isUpdatingImage}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingImage ? 'Updating...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-[80] rounded-2xl border border-red-500/30 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 backdrop-blur">
          {toastMessage}
        </div>
      ) : null}

      <RestockModal
        item={restockTarget}
        isOpen={Boolean(restockTarget)}
        onClose={() => setRestockTarget(null)}
        onSuccess={() => {
          void fetchInventory();
          setToastMessage('Réapprovisionnement enregistré.');
        }}
      />

      {historyTarget ? (
        <div className="fixed inset-y-0 right-0 z-[75] flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-red-400">{labels.restock.history}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{historyTarget.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{historyTarget.reference}</p>
            </div>
            <button type="button" onClick={() => setHistoryTarget(null)} className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              Fermer
            </button>
          </div>

          <div className="mt-6 space-y-3 overflow-y-auto">
            {historyEntries.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">Aucun historique disponible.</div>
            ) : (
              historyEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{entry.quantity_ordered} pièces</p>
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">{entry.status}</span>
                  </div>
                  {entry.supplier ? <p className="mt-2 text-sm text-zinc-400">Fournisseur: {entry.supplier}</p> : null}
                  {entry.note ? <p className="mt-2 text-sm text-zinc-400">Note: {entry.note}</p> : null}
                  {entry.created_at ? <p className="mt-2 text-xs text-zinc-500">{new Date(entry.created_at).toLocaleDateString('fr-FR')}</p> : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

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

              <label className="flex flex-col gap-2 text-sm text-on-surface-variant md:col-span-2">
                {labels.form.image}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageSelection}
                  className="w-full text-sm text-on-surface-variant file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-primary"
                />
                <p className="mt-2 text-xs text-on-surface-variant">{labels.form.imageHelp}</p>
                {imageUploadError ? <p role="alert" className="mt-3 text-sm text-error">{imageUploadError}</p> : null}
                {selectedImagePreview ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container p-3">
                    <img src={selectedImagePreview} alt="Selected preview" className="h-[60px] w-[60px] rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col gap-2">
                      <p className="text-sm font-semibold text-on-surface">{selectedImageFile?.name}</p>
                      <button type="button" onClick={resetImageSelection} className="w-fit rounded-full border border-outline-variant px-3 py-2 text-sm text-on-surface">
                        {labels.form.removeImage}
                      </button>
                    </div>
                  </div>
                ) : null}
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
