import React, { useMemo } from 'react';
import { Invoice, ToggleableField } from '../types';
import { BUSINESS_DETAILS } from '../constants';
import { format } from 'date-fns';
import { Globe, Instagram, Phone } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const subtotal = useMemo(() => {
    if (invoice.enableManualTotal) {
      return invoice.manualTotal;
    }
    return invoice.items.reduce((acc, item) => {
      const duration = item.days || 1;
      return acc + (item.quantity * item.rate * duration);
    }, 0);
  }, [invoice.items, invoice.enableManualTotal, invoice.manualTotal]);

  const discountAmount = useMemo(() => {
    if (invoice.discountType === 'percentage') {
      return (subtotal * invoice.discount) / 100;
    }
    return invoice.discount;
  }, [subtotal, invoice.discount, invoice.discountType]);

  const taxAmount = invoice.taxEnabled ? (subtotal * invoice.taxRate) / 100 : 0;
  const total = subtotal + taxAmount - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
        return format(new Date(dateStr), 'dd MMM yyyy');
    } catch (e) {
        return dateStr;
    }
  };

  const hasProjectDetails = (Object.values(invoice.project) as ToggleableField[]).some(f => f.enabled && f.value);

  // Helper to determine if we show item rates columns
  const showRates = !invoice.enableManualTotal && invoice.showLineItemRates;

  return (
    <div id="invoice-preview" className="bg-white w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] mx-auto relative flex flex-col font-sans text-black box-border">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start mb-8">
         {/* Left: Identity */}
         <div className="flex flex-col w-1/2">
             {invoice.logo ? (
                 <img src={invoice.logo} alt="Saraab" className="h-[80px] object-contain object-left mb-4" />
             ) : (
                 <div className="mb-4 flex flex-col">
                     <h1 className="font-serif text-5xl tracking-widest uppercase leading-none m-0 pb-2">Saraab</h1>
                     <p className="text-[10px] tracking-[0.5em] text-gray-500 uppercase leading-none m-0">Prop Shop</p>
                 </div>
             )}
             
             <div className="text-[10px] text-gray-500 leading-relaxed max-w-xs mt-2 space-y-1">
                 <p className="font-bold text-black uppercase text-xs mb-2 tracking-widest">{BUSINESS_DETAILS.name}</p>
                 <p className="whitespace-pre-wrap opacity-80">{BUSINESS_DETAILS.address}</p>
                 <div className="flex flex-col gap-1.5 mt-3 opacity-100 text-black font-medium">
                     <span className="flex items-center gap-2"><Phone size={12} className="text-gray-400"/> {BUSINESS_DETAILS.phone}</span>
                     <span className="flex items-center gap-2"><Globe size={12} className="text-gray-400"/> saraab.in</span>
                     <span className="flex items-center gap-2"><Instagram size={12} className="text-gray-400"/> @saraabpropshop</span>
                 </div>
             </div>
         </div>

         {/* Right: Invoice Meta */}
         <div className="w-1/2 flex flex-col items-end text-right">
             <h2 className="text-5xl font-light uppercase tracking-[0.1em] text-gray-300 mb-8 font-serif">Invoice</h2>
             <div className="flex flex-col gap-2 min-w-[220px]">
                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                     <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Invoice No</span>
                     <span className="font-mono font-bold text-lg">{invoice.id}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                     <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Date</span>
                     <span className="font-mono font-bold text-sm">{formatDate(invoice.date)}</span>
                 </div>
             </div>
         </div>
      </div>

      <hr className="border-t-2 border-black mb-10" />

      {/* INFORMATION GRID */}
      <div className="grid grid-cols-2 gap-16 mb-12">
          
          {/* Column 1: Client Details */}
          <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-black inline-block"></span> 
                  Billed To
              </h3>
              <div className="text-sm space-y-2">
                  {invoice.client.name.enabled && <div className="font-serif text-2xl font-medium leading-tight">{invoice.client.name.value || 'Client Name'}</div>}
                  
                  {invoice.client.address.enabled && (
                    <div className="whitespace-pre-wrap text-xs text-gray-600 leading-relaxed max-w-[90%]">
                        {invoice.client.address.value}
                    </div>
                  )}
                  
                  {(invoice.client.phone.enabled || invoice.client.email.enabled || invoice.client.gstin.enabled) && (
                    <div className="pt-4 flex flex-col gap-1 text-xs text-gray-500">
                        {invoice.client.phone.enabled && invoice.client.phone.value && <div className="flex gap-2"><span className="w-10 text-gray-300 uppercase font-bold text-[9px] tracking-wider pt-0.5">Phone</span> <span className="text-black">{invoice.client.phone.value}</span></div>}
                        {invoice.client.email.enabled && invoice.client.email.value && <div className="flex gap-2"><span className="w-10 text-gray-300 uppercase font-bold text-[9px] tracking-wider pt-0.5">Email</span> <span className="text-black">{invoice.client.email.value}</span></div>}
                        {invoice.client.gstin.enabled && invoice.client.gstin.value && (
                            <div className="mt-2 font-mono text-[10px] text-black bg-gray-50 border border-gray-100 inline-block px-2 py-1 rounded w-max">
                                GSTIN: {invoice.client.gstin.value}
                            </div>
                        )}
                    </div>
                  )}
              </div>
          </div>

          {/* Column 2: Logistics & Project */}
          <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-300 inline-block"></span> 
                  Details
              </h3>
              
              <div className="space-y-6">
                  {/* Logistics Box */}
                  <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-white p-3">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-1 tracking-wider">Pickup</span>
                          <span className="font-semibold block text-sm">{formatDate(invoice.dates.pickup)}</span>
                          <span className="text-[9px] text-gray-500 uppercase font-bold mt-1">{invoice.dates.pickupSlot}</span>
                      </div>
                      <div className="bg-white p-3">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-1 tracking-wider">Return</span>
                          <span className="font-semibold block text-sm">{formatDate(invoice.dates.return)}</span>
                          <span className="text-[9px] text-gray-500 uppercase font-bold mt-1">{invoice.dates.returnSlot}</span>
                      </div>
                  </div>

                  {/* Project Info List */}
                  {hasProjectDetails && (
                      <div className="text-xs space-y-2">
                          {invoice.project.brandName.enabled && (
                            <div className="flex justify-between border-b border-dashed border-gray-200 pb-1.5">
                                <span className="text-gray-400 font-medium">Brand</span>
                                <span className="font-bold text-right">{invoice.project.brandName.value}</span>
                            </div>
                          )}
                          {invoice.project.productionHouse.enabled && (
                            <div className="flex justify-between border-b border-dashed border-gray-200 pb-1.5">
                                <span className="text-gray-400 font-medium">Production</span>
                                <span className="font-bold text-right">{invoice.project.productionHouse.value}</span>
                            </div>
                          )}
                          {(invoice.project.productionDesigner.enabled || invoice.project.artDirector.enabled) && (
                            <div className="flex justify-between pt-1">
                                <span className="text-gray-400 font-medium">Creatives</span>
                                <div className="text-right font-bold">
                                    {invoice.project.productionDesigner.enabled && <span>{invoice.project.productionDesigner.value} (PD)</span>}
                                    {invoice.project.productionDesigner.enabled && invoice.project.artDirector.enabled && <span>, </span>}
                                    {invoice.project.artDirector.enabled && <span>{invoice.project.artDirector.value} (AD)</span>}
                                </div>
                            </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b-2 border-black">
                   <th className="py-3 pl-2 text-[9px] font-bold uppercase tracking-widest w-12 text-gray-500">#</th>
                   <th className="py-3 text-[9px] font-bold uppercase tracking-widest text-gray-500">Item Description</th>
                   <th className="py-3 text-[9px] font-bold uppercase tracking-widest text-right w-20 text-gray-500">Days</th>
                   <th className="py-3 text-[9px] font-bold uppercase tracking-widest text-right w-20 text-gray-500">Qty</th>
                   {showRates && (
                       <>
                           <th className="py-3 text-[9px] font-bold uppercase tracking-widest text-right w-28 text-gray-500">Rate</th>
                           <th className="py-3 pr-2 text-[9px] font-bold uppercase tracking-widest text-right w-32 text-gray-500">Amount</th>
                       </>
                   )}
               </tr>
            </thead>
            <tbody className="text-sm">
                {invoice.items.map((item, index) => {
                    const days = item.days || 1;
                    const lineTotal = item.quantity * item.rate * days;
                    return (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0 group hover:bg-gray-50 transition-colors">
                            <td className="py-2 pl-2 font-mono text-[10px] text-gray-400 align-top">{String(index + 1).padStart(2, '0')}</td>
                            <td className="py-2 pr-4 font-medium text-gray-900 align-top leading-relaxed">{item.description}</td>
                            <td className="py-2 text-right text-gray-600 align-top">{days}</td>
                            <td className="py-2 text-right text-gray-600 align-top">{item.quantity}</td>
                            {showRates && (
                                <>
                                    <td className="py-2 text-right text-gray-500 font-mono text-xs align-top">{formatCurrency(item.rate)}</td>
                                    <td className="py-2 pr-2 text-right font-bold text-black font-mono text-sm align-top">{formatCurrency(lineTotal)}</td>
                                </>
                            )}
                        </tr>
                    );
                })}
            </tbody>
          </table>
      </div>

      {/* FOOTER SECTION */}
      <div className="mt-auto pt-6 break-inside-avoid">
          <div className="flex justify-between items-start gap-12 border-t-2 border-black pt-8">
              
              {/* Left: Terms & Conditions & Bank Details */}
              <div className="w-1/2">
                   <h4 className="text-[9px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-black rounded-full"></span> Terms & Conditions
                   </h4>
                   <div className="text-[10px] leading-relaxed text-gray-500 pl-3 border-l-2 border-gray-100">
                       {invoice.notes ? (
                           <p className="whitespace-pre-line">{invoice.notes}</p>
                       ) : (
                           <ul className="list-disc pl-3 space-y-1">
                               <li>Payment: 100% advance payment is required.</li>
                               <li>Rental Period: Charges are applied on a 24-hour basis.</li>
                               <li>Damages: Any damage or loss will be deducted from the security deposit at full replacement cost.</li>
                           </ul>
                       )}
                   </div>
                   
                   {invoice.deliveryLocation.enabled && invoice.deliveryLocation.value && (
                       <div className="mt-6 pt-4 border-t border-gray-100">
                           <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Shoot Location</span>
                           <span className="text-xs font-medium">{invoice.deliveryLocation.value}</span>
                       </div>
                   )}

                   {/* Bank Details */}
                   <div className="mt-6 pt-4 border-t border-gray-100">
                       <h4 className="text-[9px] font-bold uppercase tracking-widest text-black mb-2 flex items-center gap-2">
                           <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Bank Details
                       </h4>
                       <div className="text-[10px] text-gray-500 space-y-0.5 font-mono">
                           <div className="flex gap-2">
                               <span className="text-gray-400 w-16">Account Name</span>
                               <span className="text-black font-semibold">{BUSINESS_DETAILS.bankDetails.accountName}</span>
                           </div>
                           <div className="flex gap-2">
                               <span className="text-gray-400 w-16">Bank</span>
                               <span className="text-black">{BUSINESS_DETAILS.bankDetails.bankName}</span>
                           </div>
                           <div className="flex gap-2">
                               <span className="text-gray-400 w-16">A/C No.</span>
                               <span className="text-black tracking-wide">{BUSINESS_DETAILS.bankDetails.accountNumber}</span>
                           </div>
                           <div className="flex gap-2">
                               <span className="text-gray-400 w-16">IFSC</span>
                               <span className="text-black">{BUSINESS_DETAILS.bankDetails.ifsc}</span>
                           </div>
                           <div className="flex gap-2">
                               <span className="text-gray-400 w-16">Branch</span>
                               <span className="text-black">{BUSINESS_DETAILS.bankDetails.branch}</span>
                           </div>
                       </div>
                   </div>
              </div>

              {/* Right: Totals & Signature */}
              <div className="w-5/12">
                   <div className="space-y-3 pb-6 border-b border-gray-100">
                       <div className="flex justify-between text-xs items-center">
                           <span className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Subtotal</span>
                           <span className="font-mono font-bold text-base">{formatCurrency(subtotal)}</span>
                       </div>
                       
                       {invoice.discount > 0 && (
                           <div className="flex justify-between text-xs items-center text-emerald-700">
                               <span className="font-medium tracking-wide uppercase text-[10px]">
                                   Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}
                               </span>
                               <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                           </div>
                       )}
                       
                       {invoice.taxEnabled && (
                           <div className="flex justify-between text-xs items-center">
                               <span className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">GST ({invoice.taxRate}%)</span>
                               <span className="font-mono font-bold text-base">{formatCurrency(taxAmount)}</span>
                           </div>
                       )}

                       {invoice.securityDeposit > 0 && (
                           <div className="flex justify-between text-xs items-center">
                               <span className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Refundable Security</span>
                               <span className="font-mono font-bold text-base">{formatCurrency(invoice.securityDeposit)}</span>
                           </div>
                       )}
                   </div>
                   
                   <div className="flex justify-between items-center py-5">
                       <span className="font-serif text-2xl font-bold">Total</span>
                       <span className="font-mono text-2xl font-bold">{formatCurrency(total + (invoice.securityDeposit || 0))}</span>
                   </div>

                   {/* Signature Block */}
                   <div className="mt-10 text-right">
                       <div className="h-16 mb-2 flex justify-end items-end">
                           {invoice.signature ? (
                               <img src={invoice.signature} alt="Sig" className="h-14 w-auto mix-blend-multiply -rotate-2" />
                           ) : (
                               <div className="h-px w-32 bg-gray-300 ml-auto"></div>
                           )}
                       </div>
                       <div className="text-[9px] font-bold uppercase tracking-widest text-black">Authorized Signatory</div>
                       <div className="text-[8px] text-gray-400 uppercase mt-0.5 tracking-wider">Saraab Prop Shop</div>
                   </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default InvoicePreview;