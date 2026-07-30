import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, PackagePlus, ImagePlus, X, Sparkles, Trash2 } from 'lucide-react';
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
  const [form, setForm] = useState(emptyForm);
  const [addOns, setAddOns] = useState([]); // [{ label, extraPrice }]
  const [uploading, setUploading] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // AI Menu Photo Extraction state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null); // null = not run yet
  const [confirmingExtraction, setConfirmingExtraction] = useState(false);
  const aiFileInputRef = useRef(null);

  const load = () => shopsApi.getMyShop().then((s) => setItems(s.menuItems)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

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

      await menuApi.addMenuItem({
        ...form,
        price: Number(form.price),
        prepTimeMinutes: Number(form.prepTimeMinutes) || 10,
        openingStock: Number(form.openingStock || 0),
        lowStockThreshold: Number(form.lowStockThreshold),
        customizations,
      });
      toast.success('Menu item added');
      setModalOpen(false);
      setForm(emptyForm);
      setAddOns([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add item');
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

  // ---- AI Menu Photo Extraction ----
  const handleAiFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setExtractedItems(null);
    try {
      const result = await menuApi.extractMenuFromPhoto(file);
      setExtractedItems(result.suggestions.map((s) => ({ ...s, openingStock: '', include: true })));
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

  const confirmExtraction = async () => {
    const toCreate = extractedItems.filter((it) => it.include && it.name && it.price);
    if (toCreate.length === 0) return toast.error('Select at least one item to add');
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
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add item</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Plus} title="No menu items yet" description="Add your first dish to start receiving orders." action={<Button onClick={() => setModalOpen(true)}>Add item</Button>} />
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
              <button onClick={() => setRestockTarget(item)} className="btn-ghost !px-3">
                <PackagePlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setAddOns([]); }} title="Add menu item">
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
            <Input label="Prep time (min)" type="number" min="1" value={form.prepTimeMinutes} onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening stock" type="number" min="0" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} />
            <Input label="Low stock alert at" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          </div>

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

          <Button type="submit" disabled={saving || uploading} className="w-full">{saving ? 'Saving…' : 'Add item'}</Button>
        </form>
      </Modal>

      <Modal open={!!restockTarget} onClose={() => setRestockTarget(null)} title={`Restock ${restockTarget?.name || ''}`}>
        <Input label="Add quantity" type="number" min="1" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} />
        <Button onClick={submitRestock} className="w-full mt-4">Update stock</Button>
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
              AI will read the item names and prices and pre-fill your menu — you'll review everything before it's added.
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
              Found {extractedItems.length} item(s). Uncheck or edit anything that's wrong before adding.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {extractedItems.map((row, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${row.include ? 'border-cream-300' : 'border-cream-200 opacity-50'}`}>
                  <input type="checkbox" checked={row.include} onChange={(e) => updateExtractedRow(i, 'include', e.target.checked)} />
                  <input className="input !py-1.5 flex-1 min-w-0" value={row.name} onChange={(e) => updateExtractedRow(i, 'name', e.target.value)} placeholder="Item name" />
                  <input className="input !py-1.5 w-20" value={row.category} onChange={(e) => updateExtractedRow(i, 'category', e.target.value)} placeholder="Category" />
                  <input type="number" className="input !py-1.5 w-20" value={row.price} onChange={(e) => updateExtractedRow(i, 'price', e.target.value)} placeholder="₹" />
                  <button onClick={() => removeExtractedRow(i)} className="text-ink-300 hover:text-rose-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
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
