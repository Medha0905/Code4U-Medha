import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, PackagePlus, ImagePlus, X, Sparkles, Trash2, Pencil } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as menuApi from '../../services/menu';
import StatusPill from '../../components/StatusPill';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';

const emptyForm = {
  name: '', description: '', category: '', price: '', prepTimeMinutes: 10,
  openingStock: '', lowStockThreshold: 10, imageUrl: '',
};

export default function VendorMenu() {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new, else editing existing
  const [form, setForm] = useState(emptyForm);
  const [addOns, setAddOns] = useState([]); // [{ label, extraPrice }]
  const [uploading, setUploading] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // AI Menu Photo Extraction state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null); // null = not run yet
  const [confirmingExtraction, setConfirmingExtraction] = useState(false);
  const [uploadingRowIndex, setUploadingRowIndex] = useState(null);
  const aiFileInputRef = useRef(null);
  const rowFileInputRef = useRef(null);

  const load = () => shopsApi.getMyShop().then((s) => setItems(s.menuItems.filter((i) => i.isActive))).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAddOns([]);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name, description: item.description || '', category: item.category,
      price: item.price, prepTimeMinutes: item.prepTimeMinutes, imageUrl: item.imageUrl || '',
      openingStock: '', lowStockThreshold: item.inventory?.lowStockThreshold || 10,
    });
    setAddOns(item.customizations?.[0]?.options || []);
    setModalOpen(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await menuApi.uploadMenuImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  const addAddOnRow = () => setAddOns((prev) => [...prev, { label: '', extraPrice: '' }]);
  const updateAddOnRow = (i, key, value) => setAddOns((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeAddOnRow = (i) => setAddOns((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validAddOns = addOns.filter((a) => a.label.trim());
      const customizations = validAddOns.length
        ? [{ name: 'Add-ons', options: validAddOns.map((a) => ({ label: a.label.trim(), extraPrice: Number(a.extraPrice) || 0 })) }]
        : undefined;

      if (editingId) {
        await menuApi.updateMenuItem(editingId, {
          name: form.name, description: form.description, category: form.category,
          price: Number(form.price), prepTimeMinutes: Number(form.prepTimeMinutes) || 10,
          imageUrl: form.imageUrl, customizations,
        });
        toast.success('Menu item updated');
      } else {
        await menuApi.addMenuItem({
          ...form,
          price: Number(form.price),
          prepTimeMinutes: Number(form.prepTimeMinutes) || 10,
          openingStock: Number(form.openingStock || 0),
          lowStockThreshold: Number(form.lowStockThreshold),
          customizations,
        });
        toast.success('Menu item added');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setAddOns([]);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save item');
    } finally {
      setSaving(false);
    }
  };

  const submitRestock = async () => {
    try {
      await menuApi.restockItem(restockTarget.id, Number(restockAmount));
      toast.success('Stock updated');
      setRestockTarget(null);
      setRestockAmount('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restock');
    }
  };

  const confirmDelete = async () => {
    try {
      await menuApi.deleteMenuItem(deleteTarget.id);
      toast.success('Menu item deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete item');
    }
  };

  // ---- AI Menu Photo Extraction ----
  const handleAiFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setExtractedItems(null);
    try {
      const result = await menuApi.extractMenuFromPhoto(file);
      // AI only extracts name + price — prep time, stock, category, and photo
      // are entered by the vendor for each item, right here in review.
      setExtractedItems(result.suggestions.map((s) => ({
        name: s.name, price: s.price, category: '', prepTimeMinutes: '', openingStock: '',
        lowStockThreshold: 10, imageUrl: '', include: true,
      })));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read this photo');
    } finally {
      setExtracting(false);
    }
  };

  const updateExtractedRow = (i, key, value) => {
    setExtractedItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  };
  const removeExtractedRow = (i) => setExtractedItems((prev) => prev.filter((_, idx) => idx !== i));

  const uploadRowPhoto = async (i, file) => {
    setUploadingRowIndex(i);
    try {
      const url = await menuApi.uploadMenuImage(file);
      updateExtractedRow(i, 'imageUrl', url);
    } catch {
      toast.error('Could not upload photo for this item');
    } finally {
      setUploadingRowIndex(null);
    }
  };

  const confirmExtraction = async () => {
    const toCreate = extractedItems.filter((it) => it.include && it.name && it.price);
    const missingPrepTime = toCreate.some((it) => !it.prepTimeMinutes);
    if (toCreate.length === 0) return toast.error('Select at least one item to add');
    if (missingPrepTime) return toast.error('Enter a prep time for every item you\'re adding');

    setConfirmingExtraction(true);
    try {
      const createdItems = await menuApi.bulkCreateFromExtraction(toCreate);
      toast.success(`${createdItems.length} item(s) added from photo`);
      setAiModalOpen(false);
      setExtractedItems(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add items');
    } finally {
      setConfirmingExtraction(false);
    }
  };

  if (!items) return <div className="grid sm:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Menu</h1>
          <p className="text-ink-500 text-sm mt-1">Manage items, photos, add-ons, and stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAiModalOpen(true)}><Sparkles className="w-4 h-4" /> Upload menu photo (AI)</Button>
          <Button onClick={openAddModal}><Plus className="w-4 h-4" /> Add item</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Plus} title="No menu items yet" description="Add your first dish to start receiving orders." action={<Button onClick={openAddModal}>Add item</Button>} />
      ) : (
        <div className="card divide-y divide-cream-200">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cream-200 shrink-0 overflow-hidden flex items-center justify-center">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900">{item.name} <span className="text-ink-500 font-normal">· {item.category}</span></p>
                <p className="text-sm text-ink-500 mt-0.5">₹{Number(item.price).toFixed(0)} · {item.prepTimeMinutes}m prep · Stock: {item.inventory?.quantity ?? 0}</p>
                {item.customizations?.[0]?.options?.length > 0 && (
                  <p className="text-xs text-indigo-500 mt-1">{item.customizations[0].options.length} add-on option(s)</p>
                )}
              </div>
              <StatusPill status={item.availability} size="sm" />
              <button onClick={() => setRestockTarget(item)} className="btn-ghost !px-3" title="Restock">
                <PackagePlus className="w-4 h-4" />
              </button>
              <button onClick={() => openEditModal(item)} className="btn-ghost !px-3" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(item)} className="btn-ghost !px-3 text-rose-500" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setAddOns([]); setEditingId(null); }} title={editingId ? 'Edit menu item' : 'Add menu item'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Photo</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl bg-cream-200 border border-dashed border-cream-300 flex items-center justify-center overflow-hidden shrink-0"
              >
                {form.imageUrl ? <img src={form.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-ink-300" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileSelect} />
              <div>
                <Button type="button" variant="secondary" className="!py-1.5 text-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : form.imageUrl ? 'Change photo' : 'Upload photo'}
                </Button>
                <p className="text-xs text-ink-500 mt-1">JPG, PNG, or WEBP — up to 5MB.</p>
              </div>
            </div>
          </div>

          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Breakfast, Beverages…" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Prep time (min)" type="number" required min="1" value={form.prepTimeMinutes} onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })} />
          </div>
          {!editingId && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening stock" type="number" min="0" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} />
              <Input label="Low stock alert at" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Customization / add-ons (optional)</label>
              <button type="button" onClick={addAddOnRow} className="text-xs font-medium text-indigo-600">+ Add option</button>
            </div>
            <p className="text-xs text-ink-500 mb-2">e.g. "Extra cheese" +₹20, "Large size" +₹30 — students pick these when ordering.</p>
            <div className="space-y-2">
              {addOns.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input !py-1.5 flex-1"
                    placeholder="Option name (e.g. Extra cheese)"
                    value={row.label}
                    onChange={(e) => updateAddOnRow(i, 'label', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input !py-1.5 w-24"
                    placeholder="+₹"
                    value={row.extraPrice}
                    onChange={(e) => updateAddOnRow(i, 'extraPrice', e.target.value)}
                  />
                  <button type="button" onClick={() => removeAddOnRow(i)} className="text-ink-300 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving || uploading} className="w-full">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!restockTarget} onClose={() => setRestockTarget(null)} title={`Restock ${restockTarget?.name || ''}`}>
        <Input label="Add quantity" type="number" min="1" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} />
        <Button onClick={submitRestock} className="w-full mt-4">Update stock</Button>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.name || ''}?`}>
        <p className="text-sm text-ink-700 mb-4">This removes it from your menu immediately. Students won't be able to order it anymore.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button className="flex-1 !bg-rose-500 hover:!bg-rose-600" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal
        open={aiModalOpen}
        onClose={() => { setAiModalOpen(false); setExtractedItems(null); }}
        title="Upload menu photo (AI)"
      >
        {!extractedItems ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-indigo-500" />
            </div>
            <p className="text-sm text-ink-700 font-medium">Take or upload a clear photo of your physical menu</p>
            <p className="text-xs text-ink-500 mt-1.5 max-w-xs mx-auto">
              AI reads item names and prices. You'll add prep time, stock, category, and a photo for each item yourself before anything is saved.
            </p>
            <input ref={aiFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAiFileSelect} />
            <Button className="mt-5" onClick={() => aiFileInputRef.current?.click()} disabled={extracting}>
              {extracting ? 'Reading menu…' : 'Choose photo'}
            </Button>
            {extracting && <p className="text-xs text-ink-500 mt-3">This can take 10-20 seconds for a full menu photo.</p>}
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink-700 mb-3">
              Found {extractedItems.length} item(s) with name + price. Fill in the rest for each before adding.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {extractedItems.map((row, i) => (
                <div key={i} className={`p-3 rounded-xl border ${row.include ? 'border-cream-300' : 'border-cream-200 opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={row.include} onChange={(e) => updateExtractedRow(i, 'include', e.target.checked)} />
                    <button
                      type="button"
                      onClick={() => { rowFileInputRef.current._rowIndex = i; rowFileInputRef.current.click(); }}
                      className="w-10 h-10 rounded-lg bg-cream-200 border border-dashed border-cream-300 flex items-center justify-center overflow-hidden shrink-0"
                    >
                      {row.imageUrl ? <img src={row.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-3.5 h-3.5 text-ink-300" />}
                    </button>
                    <input className="input !py-1.5 flex-1 min-w-0" value={row.name} onChange={(e) => updateExtractedRow(i, 'name', e.target.value)} placeholder="Item name" />
                    <button onClick={() => removeExtractedRow(i)} className="text-ink-300 hover:text-rose-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <input type="number" className="input !py-1.5" value={row.price} onChange={(e) => updateExtractedRow(i, 'price', e.target.value)} placeholder="₹ Price" />
                    <input className="input !py-1.5" value={row.category} onChange={(e) => updateExtractedRow(i, 'category', e.target.value)} placeholder="Category" />
                    <input type="number" className="input !py-1.5" value={row.prepTimeMinutes} onChange={(e) => updateExtractedRow(i, 'prepTimeMinutes', e.target.value)} placeholder="Prep (min)" />
                    <input type="number" className="input !py-1.5" value={row.openingStock} onChange={(e) => updateExtractedRow(i, 'openingStock', e.target.value)} placeholder="Stock" />
                  </div>
                  {uploadingRowIndex === i && <p className="text-xs text-ink-500 mt-1">Uploading photo…</p>}
                </div>
              ))}
            </div>
            <input
              ref={rowFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                const idx = rowFileInputRef.current._rowIndex;
                if (file && idx != null) uploadRowPhoto(idx, file);
                e.target.value = '';
              }}
            />
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setExtractedItems(null)}>Try another photo</Button>
              <Button className="flex-1" onClick={confirmExtraction} disabled={confirmingExtraction}>
                {confirmingExtraction ? 'Adding…' : `Add ${extractedItems.filter((i) => i.include).length} item(s)`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
