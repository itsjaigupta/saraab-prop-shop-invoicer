import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, Wand2, Eye, EyeOff, Upload, Hash, Percent, Tag, PenLine, Calculator, ArrowRight, RotateCcw, Save } from 'lucide-react';
import { enhanceItemDescription } from '../services/geminiService';

interface InvoiceEditorProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  onSaveDefaults: () => void;
}

const FieldInput = ({ 
  label, 
  value, 
  enabled, 
  onChangeValue, 
  onToggle, 
  placeholder,
  type = "text"
}: { 
  label: string, 
  value: string, 
  enabled: boolean, 
  onChangeValue: (val: string) => void, 
  onToggle: (val: boolean) => void,
  placeholder?: string,
  type?: string
}) => (
  <div className="flex items-end gap-2 mb-4">
    <div className="flex-grow">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className={`w-full border rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-black outline-none transition ${!enabled ? 'bg-gray-50 text-gray-300 border-gray-100' : 'border-gray-200 bg-white'}`}
        placeholder={placeholder}
        disabled={!enabled}
      />
    </div>
    <button 
      onClick={() => onToggle(!enabled)}
      className={`p-3 rounded-lg border transition ${enabled ? 'bg-white text-black border-black' : 'bg-gray-50 text-gray-300 border-gray-200'}`}
      title={enabled ? "Show on invoice" : "Hide from invoice"}
    >
      {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  </div>
);

const FieldTextarea = ({ 
  label, 
  value, 
  enabled, 
  onChangeValue, 
  onToggle, 
  placeholder,
  rows = 2
}: { 
  label: string, 
  value: string, 
  enabled: boolean, 
  onChangeValue: (val: string) => void, 
  onToggle: (val: boolean) => void,
  placeholder?: string,
  rows?: number
}) => (
  <div className="flex items-start gap-2 mb-4">
    <div className="flex-grow">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className={`w-full border rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-black outline-none transition ${!enabled ? 'bg-gray-50 text-gray-300 border-gray-100' : 'border-gray-200 bg-white'}`}
        placeholder={placeholder}
        disabled={!enabled}
        rows={rows}
      />
    </div>
    <button 
      onClick={() => onToggle(!enabled)}
      className={`p-3 rounded-lg border mt-[18px] transition ${enabled ? 'bg-white text-black border-black' : 'bg-gray-50 text-gray-300 border-gray-200'}`}
      title={enabled ? "Show on invoice" : "Hide from invoice"}
    >
      {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  </div>
);

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoice, setInvoice, onSaveDefaults }) => {
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const updateToggleField = (
    section: 'client' | 'project' | 'deliveryLocation',
    field: string,
    key: 'value' | 'enabled',
    newValue: any
  ) => {
    if (section === 'deliveryLocation') {
      setInvoice(prev => ({
        ...prev,
        deliveryLocation: { ...prev.deliveryLocation, [key]: newValue }
      }));
      return;
    }
    
    setInvoice(prev => ({
      ...prev,
      [section]: {
        ...prev[section as 'client' | 'project'],
        [field]: { 
          ...(prev[section as 'client' | 'project'] as any)[field], 
          [key]: newValue 
        }
      }
    }));
  };

  const handleDateChange = (field: keyof typeof invoice.dates, value: string) => {
    setInvoice(prev => ({
      ...prev,
      dates: { ...prev.dates, [field]: value }
    }));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 11),
      description: '',
      quantity: 1,
      rate: 0,
      days: 1
    };
    setInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handleAiEnhance = async (id: string, currentText: string) => {
    if (!currentText) return;
    setLoadingAi(id);
    const enhanced = await enhanceItemDescription(currentText);
    handleItemChange(id, 'description', enhanced);
    setLoadingAi(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice(prev => ({ ...prev, signature: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Smart suggestions for Invoice ID
  const nextInvoiceIds = useMemo(() => {
    const currentId = invoice.id || '001';
    // Match trailing number
    const match = currentId.match(/(\d+)$/);
    
    if (match) {
        const numStr = match[1];
        const num = parseInt(numStr, 10);
        const prefix = currentId.substring(0, currentId.length - numStr.length);
        const len = numStr.length;
        
        return [1, 2, 3].map(i => {
            const nextNum = num + i;
            return `${prefix}${nextNum.toString().padStart(len, '0')}`;
        });
    }
    
    // If no numbers, try appending numbers
    return [`${currentId}01`, `${currentId}02`, `${currentId}03`];
  }, [invoice.id]);

  return (
    <div className="space-y-10 pb-20">
      {/* Branding Section */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">0. Branding & Authenticity</h2>
        
        {/* Set Defaults Button */}
        <button 
          onClick={onSaveDefaults}
          className="absolute top-8 right-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black border border-black px-3 py-1.5 rounded-lg hover:bg-black hover:text-white transition"
          title="Save current Logo & Signature as default for future invoices"
        >
            <Save className="w-3.5 h-3.5" /> Set as Default
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Shop Logo</label>
              <div className="flex items-center gap-4">
                 <div className="w-24 h-16 border border-dashed border-gray-200 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden group relative">
                   {invoice.logo ? (
                     <img src={invoice.logo} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                   ) : (
                     <div className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Logo</div>
                   )}
                 </div>
                 <label className="cursor-pointer bg-black text-white px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition flex items-center gap-2">
                   <Upload className="w-3.5 h-3.5" />
                   Upload
                   <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                 </label>
              </div>
           </div>
           
           <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Authorized Signature</label>
              <div className="flex items-center gap-4">
                 <div className="w-24 h-16 border border-dashed border-gray-200 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden group relative">
                   {invoice.signature ? (
                     <img src={invoice.signature} alt="Signature" className="max-w-full max-h-full object-contain p-1 mix-blend-multiply" />
                   ) : (
                     <div className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Sign</div>
                   )}
                 </div>
                 <label className="cursor-pointer bg-white border border-black text-black px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition flex items-center gap-2">
                   <PenLine className="w-3.5 h-3.5" />
                   Upload
                   <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                 </label>
              </div>
           </div>
        </div>
      </section>

      {/* Invoice Sequence & Date */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">1. Document Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                <Hash className="w-3 h-3" /> Invoice Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                  <input 
                    type="text" 
                    value={invoice.id} 
                    onChange={(e) => setInvoice(prev => ({ ...prev, id: e.target.value }))} 
                    placeholder="001"
                    className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-black outline-none font-mono" 
                  />
                  {invoice.id !== '001' && (
                     <button 
                       onClick={() => setInvoice(prev => ({ ...prev, id: '001' }))}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition"
                       title="Reset to 001"
                     >
                       <RotateCcw className="w-3 h-3" />
                     </button>
                  )}
              </div>
              
              {nextInvoiceIds.map((id) => (
                  <button 
                    key={id}
                    onClick={() => setInvoice(prev => ({ ...prev, id }))}
                    className="bg-white border border-dashed border-gray-300 px-3 rounded-lg text-[10px] font-bold hover:border-black hover:bg-gray-50 transition min-w-[3rem] text-gray-500 hover:text-black"
                    title={`Set Invoice # to ${id}`}
                  >
                    {id}
                  </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 ml-1">
               Next Suggestions: {nextInvoiceIds.join(', ')}
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Billing Date</label>
            <input type="date" name="date" value={invoice.date} onChange={handleInvoiceChange} className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-black outline-none" />
          </div>
        </div>
      </section>

      {/* Client Section */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">2. Client Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FieldInput
            label="Client Name"
            value={invoice.client.name.value}
            enabled={invoice.client.name.enabled}
            onChangeValue={(v) => updateToggleField('client', 'name', 'value', v)}
            onToggle={(v) => updateToggleField('client', 'name', 'enabled', v)}
          />
          <FieldInput
            label="Contact Number"
            value={invoice.client.phone.value}
            enabled={invoice.client.phone.enabled}
            onChangeValue={(v) => updateToggleField('client', 'phone', 'value', v)}
            onToggle={(v) => updateToggleField('client', 'phone', 'enabled', v)}
          />
           <div className="md:col-span-2">
            <FieldTextarea
              label="Billing Address"
              value={invoice.client.address.value}
              enabled={invoice.client.address.enabled}
              onChangeValue={(v) => updateToggleField('client', 'address', 'value', v)}
              onToggle={(v) => updateToggleField('client', 'address', 'enabled', v)}
              rows={3}
            />
          </div>
          <FieldInput label="Email" value={invoice.client.email.value} enabled={invoice.client.email.enabled} onChangeValue={(v) => updateToggleField('client', 'email', 'value', v)} onToggle={(v) => updateToggleField('client', 'email', 'enabled', v)} />
          <FieldInput label="GSTIN" value={invoice.client.gstin.value} enabled={invoice.client.gstin.enabled} onChangeValue={(v) => updateToggleField('client', 'gstin', 'value', v)} onToggle={(v) => updateToggleField('client', 'gstin', 'enabled', v)} />
        </div>
      </section>

      {/* Project Details Section (New) */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">3. Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldInput
            label="Production House"
            value={invoice.project.productionHouse.value}
            enabled={invoice.project.productionHouse.enabled}
            onChangeValue={(v) => updateToggleField('project', 'productionHouse', 'value', v)}
            onToggle={(v) => updateToggleField('project', 'productionHouse', 'enabled', v)}
          />
          <FieldInput
            label="Brand Name"
            value={invoice.project.brandName.value}
            enabled={invoice.project.brandName.enabled}
            onChangeValue={(v) => updateToggleField('project', 'brandName', 'value', v)}
            onToggle={(v) => updateToggleField('project', 'brandName', 'enabled', v)}
          />
          <FieldInput
            label="Production Designer (PD)"
            value={invoice.project.productionDesigner.value}
            enabled={invoice.project.productionDesigner.enabled}
            onChangeValue={(v) => updateToggleField('project', 'productionDesigner', 'value', v)}
            onToggle={(v) => updateToggleField('project', 'productionDesigner', 'enabled', v)}
          />
          <FieldInput
            label="Art Director (AD)"
            value={invoice.project.artDirector.value}
            enabled={invoice.project.artDirector.enabled}
            onChangeValue={(v) => updateToggleField('project', 'artDirector', 'value', v)}
            onToggle={(v) => updateToggleField('project', 'artDirector', 'enabled', v)}
          />
        </div>
      </section>

      {/* Rental Schedule */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">4. Rental Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-3">Outgoing (Pickup)</label>
                <div className="space-y-3">
                   <input type="date" value={invoice.dates.pickup} onChange={(e) => handleDateChange('pickup', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-base md:text-sm" />
                   <div className="flex flex-wrap gap-2">
                       {['Morning', 'Afternoon', 'Evening', 'Night'].map(s => (
                           <button 
                            key={s} 
                            onClick={() => handleDateChange('pickupSlot', s)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${invoice.dates.pickupSlot === s ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-400'}`}
                           >
                               {s}
                           </button>
                       ))}
                   </div>
                </div>
             </div>
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-3">Incoming (Return)</label>
                <div className="space-y-3">
                   <input type="date" value={invoice.dates.return} onChange={(e) => handleDateChange('return', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-base md:text-sm" />
                   <div className="flex flex-wrap gap-2">
                       {['Morning', 'Afternoon', 'Evening', 'Night'].map(s => (
                           <button 
                            key={s} 
                            onClick={() => handleDateChange('returnSlot', s)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${invoice.dates.returnSlot === s ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-400'}`}
                           >
                               {s}
                           </button>
                       ))}
                   </div>
                </div>
             </div>
        </div>
      </section>

      {/* Prop Items */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-end border-b pb-4 mb-6">
             <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black">5. Itemized Props</h2>
             <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Manual Total Mode</span>
                      <button 
                        onClick={() => setInvoice(prev => ({ ...prev, enableManualTotal: !prev.enableManualTotal }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${invoice.enableManualTotal ? 'bg-black' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${invoice.enableManualTotal ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                 </div>
                 
                 {!invoice.enableManualTotal && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Show Rates in Invoice</span>
                        <button 
                          onClick={() => setInvoice(prev => ({ ...prev, showLineItemRates: !prev.showLineItemRates }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${invoice.showLineItemRates ? 'bg-black' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${invoice.showLineItemRates ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                 )}
             </div>
        </div>

        {invoice.enableManualTotal && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-yellow-700 mb-1 flex items-center gap-2">
                       <Calculator className="w-3.5 h-3.5" /> Manual Subtotal (₹)
                   </label>
                   <p className="text-[10px] text-yellow-600">Individual item rates are ignored.</p>
                </div>
                <input 
                  type="number" 
                  value={invoice.manualTotal} 
                  onChange={(e) => setInvoice(prev => ({ ...prev, manualTotal: parseFloat(e.target.value) || 0 }))} 
                  className="w-40 border border-yellow-300 rounded-lg p-3 text-lg font-bold text-right focus:ring-1 focus:ring-yellow-500 outline-none" 
                  placeholder="0.00"
                />
            </div>
        )}

        <div className="space-y-6">
          {invoice.items.map((item, index) => (
            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-6 rounded-xl relative group border border-transparent hover:border-gray-200 transition">
              <span className="text-[10px] font-bold font-mono text-gray-300 absolute left-2 top-2">{index + 1}</span>
              <div className="flex-grow w-full md:w-auto">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Prop Description</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                    placeholder="Enter prop name..." 
                    className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-black outline-none" 
                  />
                  <button onClick={() => handleAiEnhance(item.id, item.description)} disabled={!item.description || loadingAi === item.id} className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:scale-110 transition disabled:opacity-20" title="Enhance with AI">
                    <Wand2 className={`w-4 h-4 ${loadingAi === item.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="w-16">
                   <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Days</label>
                   <input type="number" value={item.days} onChange={(e) => handleItemChange(item.id, 'days', parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-center" />
                </div>
                <div className="w-16">
                   <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Qty</label>
                   <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-center" />
                </div>
                {!invoice.enableManualTotal && (
                    <div className="flex-grow md:w-28">
                       <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Rate (₹)</label>
                       <input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-right font-mono" />
                    </div>
                )}
              </div>
              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 p-2 md:mt-5 self-end md:self-auto"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-8 flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl hover:border-black hover:text-black transition">
          <Plus className="w-4 h-4" /> Add Another Item
        </button>
      </section>

      {/* Summary & Logic */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">6. Summary & Tax</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Terms & Notes</label>
            <textarea name="notes" value={invoice.notes} onChange={handleInvoiceChange} rows={6} className="w-full border border-gray-200 rounded-xl p-4 text-xs italic leading-relaxed" placeholder="Payment terms, breakage policy..." />
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-black" />
                  <label className="text-xs font-bold uppercase tracking-widest text-black">GST (18%)</label>
              </div>
              <button 
                onClick={() => setInvoice(prev => ({ ...prev, taxEnabled: !prev.taxEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${invoice.taxEnabled ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${invoice.taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Discount
                    </label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button 
                           onClick={() => setInvoice(prev => ({...prev, discountType: 'amount'}))}
                           className={`px-2 py-1 text-[9px] font-bold rounded transition ${invoice.discountType === 'amount' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >₹</button>
                        <button 
                           onClick={() => setInvoice(prev => ({...prev, discountType: 'percentage'}))}
                           className={`px-2 py-1 text-[9px] font-bold rounded transition ${invoice.discountType === 'percentage' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >%</button>
                    </div>
                </div>
                <input 
                    type="number" 
                    value={invoice.discount} 
                    onChange={(e) => setInvoice(prev => ({...prev, discount: parseFloat(e.target.value) || 0}))} 
                    className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-right font-mono" 
                    placeholder="0" 
                />
              </div>
              
              {invoice.taxEnabled && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Adjust Tax Rate (%)</label>
                  <input type="number" value={invoice.taxRate} onChange={(e) => setInvoice(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))} className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-right font-mono" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Refundable Security Deposit (₹)</label>
                <input 
                    type="number" 
                    value={invoice.securityDeposit} 
                    onChange={(e) => setInvoice(prev => ({...prev, securityDeposit: parseFloat(e.target.value) || 0}))} 
                    className="w-full border border-gray-200 rounded-lg p-3 text-base md:text-sm text-right font-mono" 
                    placeholder="0" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black mb-6 border-b pb-4">7. Delivery / Shoot Location</h2>
        <FieldTextarea
          label="Shoot / Delivery Location"
          value={invoice.deliveryLocation.value}
          enabled={invoice.deliveryLocation.enabled}
          onChangeValue={(v) => updateToggleField('deliveryLocation', '', 'value', v)}
          onToggle={(v) => updateToggleField('deliveryLocation', '', 'enabled', v)}
          placeholder="Studio name or site address..."
        />
      </section>
    </div>
  );
};

export default InvoiceEditor;