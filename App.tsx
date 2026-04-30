import React, { useState, useEffect } from 'react';
import { Invoice, Expense, TimeSlot, ToggleableField } from './types';
import { DEFAULT_TAX_RATE, BUSINESS_DETAILS } from './constants';
import InvoiceEditor from './components/InvoiceEditor';
import InvoicePreview from './components/InvoicePreview';
import AnalyticsModal, { AnalyticsTab } from './components/AnalyticsModal';
import LoginPage from './components/LoginPage';
import { Printer, Copy, Check, Save, FolderOpen, Plus, Receipt, BarChart2, Download, Upload, FileText, TrendingUp, LogOut } from 'lucide-react';
import * as db from './lib/db';

const AUTH_KEY = 'saraab_auth_user';

const storageKey = (username: string, key: string) => `${key}_${username}`;

const migrateDataToUser = (username: string) => {
  const KEYS = ['saraab_invoices', 'saraab_expenses', 'saraab_branding_defaults'];
  const MIGRATED_FLAG = `saraab_migrated_${username}`;
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  KEYS.forEach(key => {
    const existing = localStorage.getItem(key);
    const userKey = storageKey(username, key);
    if (existing && !localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, existing);
    }
  });
  localStorage.setItem(MIGRATED_FLAG, '1');
};
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const createToggleField = (value = '', enabled = true) => ({ value, enabled });

// S. Gupta signature (real scan)
const EMBEDDED_SIGNATURE = "data:image/png;base64,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";

const getEmptyInvoice = (id = '001', username?: string): Invoice => {
  let logo = null;
  let signature = EMBEDDED_SIGNATURE;

  // Try to load user-saved defaults from LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const key = username
        ? storageKey(username, 'saraab_branding_defaults')
        : 'saraab_branding_defaults';
      const savedDefaults = localStorage.getItem(key);
      if (savedDefaults) {
        const parsed = JSON.parse(savedDefaults);
        if (parsed.logo) logo = parsed.logo;
        if (parsed.signature) signature = parsed.signature;
      }
    } catch (e) {
      console.error("Failed to load branding defaults", e);
    }
  }

  return {
    id,
    date: new Date().toISOString().split('T')[0],
    
    client: {
      name: createToggleField('', true),
      phone: createToggleField('', true),
      email: createToggleField('', true),
      address: createToggleField('', true),
      pan: createToggleField('', true),
      gstin: createToggleField('', true),
    },
    
    project: {
      productionHouse: createToggleField('', false),
      productionDesigner: createToggleField('', false),
      artDirector: createToggleField('', false),
      brandName: createToggleField('', false),
    },

    dates: {
      pickup: new Date().toISOString().split('T')[0],
      pickupSlot: 'Morning',
      return: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      returnSlot: 'Evening',
    },

    deliveryLocation: createToggleField('', false),

    items: [
      { id: '1', description: 'Hand-Carved Wooden Table', quantity: 1, rate: 1200, days: 3 }
    ],
    enableManualTotal: false,
    manualTotal: 0,
    showLineItemRates: true,
    taxEnabled: false,
    taxRate: DEFAULT_TAX_RATE,
    discount: 0,
    discountType: 'amount',
    securityDeposit: 0,
    notes: 'Payment: 100% advance payment is required.\nRental Period: Charges are applied on a 24-hour basis.\nSecurity Deposit: Refundable upon safe return.\nDamages: Any damage or loss will be deducted from the security deposit at full replacement cost.',
    logo: logo,
    signature: signature
  };
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem(AUTH_KEY));

  const handleLogin = (username: string) => {
    migrateDataToUser(username);
    localStorage.setItem(AUTH_KEY, username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppMain currentUser={currentUser} onLogout={handleLogout} />;
};

interface AppMainProps {
  currentUser: string;
  onLogout: () => void;
}

const AppMain: React.FC<AppMainProps> = ({ currentUser, onLogout }) => {
  const [invoice, setInvoice] = useState<Invoice>(getEmptyInvoice('001', currentUser));
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [isMobile, setIsMobile] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Storage State
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('invoices');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      const targetWidth = 794;
      const padding = 32;
      const availableWidth = width - padding;
      if (availableWidth < targetWidth) {
        setPreviewScale(availableWidth / targetWidth);
      } else {
        setPreviewScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Load all data — each piece independently so one failure can't block others
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      // Migration runs silently — never blocks loading
      db.migrateLocalToSupabase(currentUser).catch(() => {});

      // Load invoices
      let invoices: Invoice[] = [];
      try {
        invoices = await db.loadInvoices(currentUser);
      } catch (err: any) {
        console.error('Invoice load error:', err);
        setLoadError(`Could not load invoices: ${err?.message ?? err}`);
      }

      // Load expenses (non-critical — don't block if it fails)
      let loadedExpenses: Expense[] = [];
      try {
        loadedExpenses = await db.loadExpenses(currentUser);
      } catch (err) {
        console.error('Expense load error:', err);
      }

      // Load branding (non-critical)
      let branding: { logo: string | null; signature: string | null } | null = null;
      try {
        branding = await db.loadBranding(currentUser);
      } catch (err) {
        console.error('Branding load error:', err);
      }

      setSavedInvoices(invoices);
      setExpenses(loadedExpenses);

      if (invoices.length > 0) {
        const sorted = [...invoices].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        const latest = sorted[0];
        const loaded: Invoice = {
          ...latest,
          discountType: latest.discountType || 'amount',
          securityDeposit: latest.securityDeposit || 0,
          showLineItemRates: latest.showLineItemRates !== undefined ? latest.showLineItemRates : true,
        };
        if (branding?.logo) loaded.logo = branding.logo;
        if (branding?.signature) loaded.signature = branding.signature;
        setInvoice(loaded);
      } else {
        const emptyInv = getEmptyInvoice('001', currentUser);
        if (branding?.logo) emptyInv.logo = branding.logo;
        if (branding?.signature) emptyInv.signature = branding.signature;
        setInvoice(emptyInv);
      }

      setIsLoading(false);
    };
    loadData();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrint = () => {
    setView('preview');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    
    const input = document.getElementById('invoice-preview');
    if (!input) {
      alert("Please switch to Preview mode first.");
      setView('preview');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Create a clone of the preview element to render off-screen without scaling issues
      const clone = input.cloneNode(true) as HTMLElement;
      
      // Reset styles to ensure A4 dimensions and visibility
      clone.style.transform = 'none';
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.height = 'auto';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.backgroundColor = 'white';
      clone.style.margin = '0';
      clone.style.padding = '15mm'; // Enforce padding
      
      document.body.appendChild(clone);

      // Wait for images to load within the clone
      const images = Array.from(clone.getElementsByTagName('img'));
      await Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
          });
      }));
      
      // Small delay to ensure fonts and layout are stable
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Sanitize filename
      const clientName = (invoice.client.name.value || 'Unknown Client').replace(/[^a-z0-9 \-_]/gi, '').trim();
      const filename = `Saraab Invoice - ${invoice.id} - ${clientName} - ${invoice.date}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // --- Storage Handlers ---

  const handleSaveInvoice = async () => {
    const updatedList = [...savedInvoices];
    const existingIndex = updatedList.findIndex(inv => inv.id === invoice.id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = invoice;
    } else {
      updatedList.push(invoice);
    }
    setSavedInvoices(updatedList);
    try {
      await db.saveInvoice(currentUser, invoice, updatedList);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveDefaults = async () => {
    try {
      await db.saveBranding(currentUser, invoice.logo, invoice.signature);
      alert("Branding (Logo & Signature) saved as default!\n\nNew invoices will now automatically use these images.");
    } catch (err) {
      console.error('Save branding failed:', err);
      alert("Failed to save branding defaults. Please try again.");
    }
  };

  const handleNewInvoice = () => {
    // Generate next ID
    let nextId = 1;
    if (savedInvoices.length > 0) {
        const ids = savedInvoices.map(inv => parseInt(inv.id)).filter(n => !isNaN(n));
        if (ids.length > 0) nextId = Math.max(...ids) + 1;
    }
    const nextIdStr = nextId.toString().padStart(3, '0');

    if (window.confirm("Start a new invoice? Any unsaved changes to the current invoice will be lost.")) {
        setInvoice(getEmptyInvoice(nextIdStr, currentUser));
        setView('edit');
    }
  };

  const handleLoadInvoice = (inv: Invoice) => {
      if (window.confirm(`Load invoice #${inv.id}? Unsaved changes to current invoice will be lost.`)) {
          // Ensure new fields exist for older saves
          const loadedInvoice = {
            ...inv,
            discountType: inv.discountType || 'amount',
            securityDeposit: inv.securityDeposit || 0,
            showLineItemRates: inv.showLineItemRates !== undefined ? inv.showLineItemRates : true
          };
          setInvoice(loadedInvoice);
          setShowAnalytics(false);
          setView('edit');
      }
  };

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Invoice #${id}?`)) {
      const updated = savedInvoices.filter(inv => inv.id !== id);
      setSavedInvoices(updated);
      try {
        await db.deleteInvoice(currentUser, id, updated);
      } catch (err) {
        console.error('Delete invoice failed:', err);
      }
    }
  };

  // --- Expense Handlers ---

  const handleAddExpense = async (exp: Expense) => {
    const updated = [...expenses, exp];
    setExpenses(updated);
    try {
      await db.saveExpense(currentUser, exp, updated);
    } catch (err) {
      console.error('Save expense failed:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    try {
      await db.deleteExpense(currentUser, id, updated);
    } catch (err) {
      console.error('Delete expense failed:', err);
    }
  };

  // --- Local File Handlers ---

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(invoice, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Sanitize filename
    const clientName = (invoice.client.name.value || 'Unknown Client').replace(/[^a-z0-9 \-_]/gi, '').trim();
    const filename = `Saraab Invoice - ${invoice.id} - ${clientName} - ${invoice.date}.json`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    } else {
        console.error("File input ref is null");
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Import triggered");
    const file = e.target.files?.[0];
    if (!file) {
        console.log("No file selected");
        return;
    }
    
    console.log("File selected:", file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
            throw new Error("File is empty");
        }

        const json = JSON.parse(content);
        console.log("JSON parsed successfully", json);
        
        // Basic validation checking for essential fields
        if (json.id && Array.isArray(json.items) && json.client) {
             if (window.confirm("Importing this file will overwrite your current workspace. Continue?")) {
                 setInvoice({
                   ...json,
                   discountType: json.discountType || 'amount',
                   securityDeposit: json.securityDeposit || 0,
                   showLineItemRates: json.showLineItemRates !== undefined ? json.showLineItemRates : true
                 });
                 alert("Invoice imported successfully!");
             }
        } else {
            console.error("Invalid JSON structure:", json);
            alert("The selected file does not appear to be a valid Saraab Invoice JSON. Missing required fields (id, items, or client).");
        }
      } catch (err) {
        console.error("Import Error", err);
        alert(`Failed to parse the file. Error: ${(err as Error).message}`);
      } finally {
        // Reset input value to allow re-selecting the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
        console.error("FileReader error");
        alert("Failed to read the file.");
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    reader.readAsText(file);
  };

  // --- End Storage Handlers ---

  const handleCopySheets = async () => {
    // Calculate totals based on mode
    let subtotal = 0;
    if (invoice.enableManualTotal) {
      subtotal = invoice.manualTotal;
    } else {
      subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate * (item.days || 1)), 0);
    }
    
    const discountAmount = invoice.discountType === 'percentage' 
      ? (subtotal * invoice.discount) / 100 
      : invoice.discount;

    const tax = invoice.taxEnabled ? (subtotal * invoice.taxRate) / 100 : 0;
    const total = subtotal + tax - discountAmount + (invoice.securityDeposit || 0);

    // Construct a clean HTML Table for Google Sheets
    const showRates = !invoice.enableManualTotal && invoice.showLineItemRates;

    const sheetContent = `
      <table border="1" style="font-family: Arial; border-collapse: collapse;">
        <tr><td colspan="6" style="font-size: 18px; font-weight: bold; background-color: #000; color: #fff;">INVOICE - ${BUSINESS_DETAILS.name.toUpperCase()}</td></tr>
        <tr><td>Invoice No:</td><td colspan="5" style="text-align:left">${invoice.id}</td></tr>
        <tr><td>Date:</td><td colspan="5" style="text-align:left">${invoice.date}</td></tr>
        <tr><td colspan="6"></td></tr>
        
        <tr><td colspan="6" style="font-weight: bold; background-color: #eee;">CLIENT DETAILS</td></tr>
        <tr><td>Name:</td><td colspan="5">${invoice.client.name.value}</td></tr>
        <tr><td>Address:</td><td colspan="5">${invoice.client.address.value}</td></tr>
        <tr><td colspan="6"></td></tr>
        
        <tr><td colspan="6" style="font-weight: bold; background-color: #eee;">PROJECT DETAILS</td></tr>
        ${invoice.project.productionHouse.value ? `<tr><td>Production House:</td><td colspan="5">${invoice.project.productionHouse.value}</td></tr>` : ''}
        ${invoice.project.brandName.value ? `<tr><td>Brand:</td><td colspan="5">${invoice.project.brandName.value}</td></tr>` : ''}
        ${invoice.project.productionDesigner.value ? `<tr><td>Production Designer:</td><td colspan="5">${invoice.project.productionDesigner.value}</td></tr>` : ''}
        ${invoice.project.artDirector.value ? `<tr><td>Art Director:</td><td colspan="5">${invoice.project.artDirector.value}</td></tr>` : ''}
        <tr><td colspan="6"></td></tr>

        <tr><td colspan="6" style="font-weight: bold; background-color: #eee;">LOGISTICS</td></tr>
        <tr><td>Pickup:</td><td colspan="2">${invoice.dates.pickup} (${invoice.dates.pickupSlot})</td><td>Return:</td><td colspan="2">${invoice.dates.return} (${invoice.dates.returnSlot})</td></tr>
        ${invoice.deliveryLocation.value ? `<tr><td>Shoot Location:</td><td colspan="5">${invoice.deliveryLocation.value}</td></tr>` : ''}
        <tr><td colspan="6"></td></tr>

        <tr style="background-color: #f3f3f3; font-weight: bold;">
          <td>#</td>
          <td>Item Description</td>
          <td>Days</td>
          <td>Qty</td>
          ${showRates ? `<td>Rate</td><td>Amount</td>` : ''}
        </tr>
        ${invoice.items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.description}</td>
            <td>${item.days || 1}</td>
            <td>${item.quantity}</td>
            ${showRates ? `
              <td>${item.rate}</td>
              <td>${(item.quantity * item.rate * (item.days || 1)).toFixed(2)}</td>
            ` : ''}
          </tr>
        `).join('')}
        
        <tr><td colspan="6"></td></tr>
        <tr>
          <td colspan="5" align="right" style="font-weight: bold;">Subtotal</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
        ${invoice.discount > 0 ? `
          <tr>
            <td colspan="5" align="right">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}</td>
            <td>-${discountAmount.toFixed(2)}</td>
          </tr>
        ` : ''}
        ${invoice.taxEnabled ? `
          <tr>
            <td colspan="5" align="right">GST (${invoice.taxRate}%)</td>
            <td>${tax.toFixed(2)}</td>
          </tr>
        ` : ''}
        ${invoice.securityDeposit > 0 ? `
          <tr>
            <td colspan="5" align="right">Refundable Security Deposit</td>
            <td>${invoice.securityDeposit.toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr>
          <td colspan="5" align="right" style="font-weight: bold; font-size: 14px;">TOTAL</td>
          <td style="font-weight: bold; font-size: 14px;">${total.toFixed(2)}</td>
        </tr>
        
        <tr><td colspan="6"></td></tr>
        <tr><td colspan="6" style="font-weight: bold; background-color: #eee;">BANK DETAILS</td></tr>
        <tr><td>Name:</td><td colspan="5">${BUSINESS_DETAILS.bankDetails.accountName}</td></tr>
        <tr><td>Bank:</td><td colspan="5">${BUSINESS_DETAILS.bankDetails.bankName}</td></tr>
        <tr><td>A/C No:</td><td colspan="5" style="mso-number-format:'\@'">${BUSINESS_DETAILS.bankDetails.accountNumber}</td></tr>
        <tr><td>IFSC:</td><td colspan="5">${BUSINESS_DETAILS.bankDetails.ifsc}</td></tr>
        <tr><td>Branch:</td><td colspan="5">${BUSINESS_DETAILS.bankDetails.branch}</td></tr>
      </table>
    `;

    try {
      const type = "text/html";
      const blob = new Blob([sheetContent], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      alert("Invoice data copied! \n\nOpen Google Sheets and press Ctrl+V (or Cmd+V) to paste the formatted table.");
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert("Failed to copy to clipboard. Please allow clipboard access.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <span className="text-white text-xl tracking-[0.4em] font-bold">SARAAB</span>
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-gray-900">
      {loadError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between no-print">
          <span className="text-red-700 text-xs font-medium">⚠ {loadError}</span>
          <button onClick={() => window.location.reload()} className="text-red-700 text-xs underline ml-4">Retry</button>
        </div>
      )}
      <style>{`
        /* ── iPad: side-by-side from 768px ── */
        @media (min-width: 768px) {
            .app-container {
                display: flex;
                align-items: flex-start;
                gap: 24px;
                padding: 16px;
                max-width: 1600px;
                margin: 0 auto;
            }
            .builder-panel { flex: 1; min-width: 340px; }
            .preview-panel {
                position: sticky;
                top: 72px;
                flex: 0 0 auto;
                width: min(50vw, calc(210mm + 21px));
                height: calc(100vh - 88px);
                overflow-y: auto;
                padding-left: 16px;
                border-left: 1px solid #eee;
                scrollbar-width: thin;
            }
        }

        /* ── Desktop: full A4 preview from 1024px ── */
        @media (min-width: 1024px) {
            .app-container { gap: 40px; padding: 20px; }
            .builder-panel { min-width: 400px; }
            .preview-panel {
                top: 84px;
                width: auto;
                flex: 0 0 calc(210mm + 21px);
                height: calc(100vh - 104px);
                padding-left: 20px;
            }
        }

        @media print {
            .app-container {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .preview-panel {
                position: static !important;
                height: auto !important;
                overflow: visible !important;
                flex: none !important;
                display: block !important;
                border: none !important;
                padding: 0 !important;
                width: 100% !important;
            }
            /* Override inline styles for the preview wrapper */
            .print-preview-wrapper {
                transform: none !important;
                height: auto !important;
                width: 100% !important;
                margin: 0 !important;
                overflow: visible !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
        }
      `}</style>
      
      {/* Hidden Input for File Upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        id="import-file-input" 
        accept=".json,application/json" 
        className="hidden" 
        onChange={handleImportJSON} 
      />

      <nav className="bg-black text-white shadow-xl sticky top-0 z-50 no-print" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-2">
            <div className="flex items-center gap-4 min-w-max">
              <span className="logo-text text-xl tracking-[0.2em] font-bold">SARAAB</span>
            </div>

            {/* Action Buttons with Horizontal Scroll for Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 pb-1 sm:pb-0 pl-4 mask-fade-left">
              
              {/* New — hidden on mobile, bottom nav handles it */}
              <button
                onClick={handleNewInvoice}
                className="hidden md:flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="Create New Invoice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>

              {/* Open/History — hidden on mobile, bottom nav handles it */}
              <button
                onClick={() => { setAnalyticsTab('invoices'); setShowAnalytics(true); }}
                className="hidden md:flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="Invoice History"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Open</span>
                {savedInvoices.length > 0 && (
                  <span className="bg-white text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {savedInvoices.length > 99 ? '99+' : savedInvoices.length}
                  </span>
                )}
              </button>

              {/* Expenses — visible on all sizes, icon-only on mobile */}
              <button
                onClick={() => { setAnalyticsTab('expenses'); setShowAnalytics(true); }}
                className="flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="Track Expenses"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Expenses</span>
              </button>

              {/* P&L — visible on all sizes, icon-only on mobile */}
              <button
                onClick={() => { setAnalyticsTab('pnl'); setShowAnalytics(true); }}
                className="flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="P&L Graph"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">P&amp;L</span>
              </button>

              {/* Save — hidden on mobile, bottom nav handles it */}
              <button
                onClick={handleSaveInvoice}
                className={`hidden md:flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest border whitespace-nowrap ${saveStatus === 'saved' ? 'bg-green-600 border-green-600 text-white' : saveStatus === 'error' ? 'bg-red-700 border-red-700 text-white' : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}
                title="Save Invoice"
              >
                {saveStatus === 'saved' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}</span>
              </button>

              {/* Import/Export — icon-only on mobile */}
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="Download Invoice File (.json)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-white border border-gray-700 whitespace-nowrap"
                title="Upload Invoice File (.json)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Import</span>
              </button>

              <div className="h-6 w-px bg-gray-700 mx-1 hidden sm:block"></div>

              <button
                onClick={handleCopySheets}
                className={`hidden sm:flex items-center gap-2 text-[10px] border border-gray-800 px-4 py-2 rounded-lg transition font-bold uppercase tracking-widest whitespace-nowrap ${copied ? 'bg-green-600 text-white border-green-600' : 'bg-gray-900 hover:bg-white hover:text-black'}`}
                title="Copy formatted table for Excel/Sheets"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden xl:inline">{copied ? 'Copied!' : 'Copy to Sheets'}</span>
              </button>

              {/* Print/PDF — hidden on mobile (bottom nav has PDF) */}
              <button
                onClick={handlePrint}
                className="hidden md:flex items-center gap-2 text-[10px] bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition font-bold uppercase tracking-widest whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">PDF / Print</span>
              </button>

              {/* Download PDF — hidden on mobile (bottom nav has PDF) */}
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className={`hidden md:flex items-center gap-2 text-[10px] bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition font-bold uppercase tracking-widest whitespace-nowrap ml-2 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Download as PDF file"
              >
                <FileText className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-pulse' : ''}`} />
                <span className="hidden xl:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>

            {/* Logout */}
            <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-gray-800">
              <span className="text-gray-600 text-[10px] uppercase tracking-widest hidden lg:block">{currentUser}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-[10px] hover:bg-red-900/40 border border-transparent hover:border-red-700/50 px-3 py-2 rounded-lg transition font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 whitespace-nowrap"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="app-container px-3 sm:px-5 md:px-0 py-4 md:py-0 pb-24 md:pb-0 print:p-0 print:m-0 print:w-full print:block">
        {/* Mobile Toggle */}
        <div className="md:hidden mb-4 sticky top-16 z-30 flex rounded-xl bg-gray-200 p-1 no-print shadow-inner">
          <button
            onClick={() => setView('edit')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === 'edit' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setView('preview')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === 'preview' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
          >
            Preview
          </button>
        </div>

        {/* Builder Panel (Inputs) */}
        <div className={`builder-panel ${isMobile && view !== 'edit' ? 'hidden' : 'block'} no-print`}>
           <div className="mb-5 sm:mb-8">
             <h1 className="text-2xl sm:text-4xl font-serif text-gray-900 italic">Invoice Builder</h1>
             <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1.5 ml-0.5">Prop Shop Management Suite</p>
           </div>
           <InvoiceEditor invoice={invoice} setInvoice={setInvoice} onSaveDefaults={handleSaveDefaults} />
        </div>

        {/* Preview Panel (Sticky) */}
        <div className={`preview-panel ${isMobile && view !== 'preview' ? 'hidden' : 'block'}`}>
           <div className="mb-4 flex justify-between items-center no-print px-2 w-full mt-0">
               <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Preview</h2>
               <span className="text-[9px] uppercase font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded">A4 • 210mm x 297mm</span>
           </div>

           <div className="w-full flex justify-center md:block">
               <div 
                 style={{ 
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    height: previewScale < 1 ? `calc(297mm * ${previewScale})` : undefined,
                    marginBottom: '20px'
                 }}
                 className="print-preview-wrapper overflow-hidden shadow-2xl rounded-sm w-[210mm] origin-top-center print:shadow-none print:w-full print:rounded-none print:m-0 print:overflow-visible print:transform-none transition-transform duration-200"
               >
                  <InvoicePreview invoice={invoice} />
               </div>
           </div>
        </div>
      </main>

      {showAnalytics && (
        <AnalyticsModal
          savedInvoices={savedInvoices}
          expenses={expenses}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onLoadInvoice={handleLoadInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onClose={() => setShowAnalytics(false)}
          initialTab={analyticsTab}
        />
      )}

      {/* ── Phone bottom nav (hidden on md+) ── */}
      <div
        className="fixed bottom-0 inset-x-0 md:hidden bg-black border-t border-gray-800 flex z-40 no-print"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          onClick={handleNewInvoice}
          className="flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-gray-500 active:text-white transition min-h-[52px]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-widest">New</span>
        </button>
        <button
          onClick={() => { setAnalyticsTab('invoices'); setShowAnalytics(true); }}
          className="flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-gray-500 active:text-white transition relative min-h-[52px]"
        >
          <FolderOpen className="w-5 h-5" />
          {savedInvoices.length > 0 && (
            <span className="absolute top-2 right-[calc(50%-18px)] translate-x-5 bg-white text-black text-[8px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none">
              {savedInvoices.length > 99 ? '99+' : savedInvoices.length}
            </span>
          )}
          <span className="text-[9px] uppercase tracking-widest">Open</span>
        </button>
        <button
          onClick={handleSaveInvoice}
          className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 transition min-h-[52px] ${saveStatus === 'saved' ? 'text-green-400' : saveStatus === 'error' ? 'text-red-400' : 'text-gray-500 active:text-white'}`}
        >
          {saveStatus === 'saved' ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          <span className="text-[9px] uppercase tracking-widest">{saveStatus === 'saved' ? 'Saved' : 'Save'}</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-gray-500 active:text-white transition disabled:opacity-30 min-h-[52px]"
        >
          <FileText className={`w-5 h-5 ${isGeneratingPDF ? 'animate-pulse' : ''}`} />
          <span className="text-[9px] uppercase tracking-widest">{isGeneratingPDF ? '...' : 'PDF'}</span>
        </button>
      </div>
    </div>
  );
};

export default App;