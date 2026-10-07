import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Plus, Printer, DollarSign, Trash2, X, Building2 } from 'lucide-react';

export const InvoicesView = () => {
  const { user, activeClinic } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState([
    { description: 'Consultation Fee', quantity: 1, unitPrice: 100 }
  ]);

  // Payment Form State
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, patRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/patients')
      ]);

      if (invRes.success) setInvoices(invRes.data);
      if (patRes.success) setPatients(patRes.data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub + (Number(taxAmount) || 0) - (Number(discountAmount) || 0));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/invoices', {
        patientId,
        items,
        taxAmount: Number(taxAmount),
        discountAmount: Number(discountAmount)
      });

      if (res.success) {
        setShowCreateModal(false);
        setPatientId('');
        setItems([{ description: 'Consultation Fee', quantity: 1, unitPrice: 100 }]);
        setTaxAmount(0);
        setDiscountAmount(0);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to generate invoice.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/invoices/${paymentModalInvoice._id}/payment`, {
        amountPaid: Number(amountPaid),
        paymentMethod
      });

      if (res.success) {
        setPaymentModalInvoice(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Payment recording failed.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">Paid</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">Partial Payment</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300">Unpaid / Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Clinic Invoices & Itemized Billing</h1>
          <p className="text-xs text-zinc-500">Generate patient bills, record payments, and issue payment receipts.</p>
        </div>

        {(user?.role === 'RECEPTIONIST' || user?.role === 'CLINIC_ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
          >
            <Plus size={15} />
            Generate New Invoice
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Paid Amount</th>
              <th className="p-3">Payment Status</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">Loading invoices...</td>
              </tr>
            ) : invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-zinc-50">
                  <td className="p-3 font-mono font-bold text-emerald-800">{inv.invoiceNumber}</td>
                  <td className="p-3 font-semibold text-zinc-900">{inv.patientId?.fullName || 'Patient'}</td>
                  <td className="p-3 font-mono font-bold text-zinc-900">${inv.totalAmount.toFixed(2)}</td>
                  <td className="p-3 font-mono text-emerald-700 font-semibold">${inv.paidAmount.toFixed(2)}</td>
                  <td className="p-3">{getStatusBadge(inv.paymentStatus)}</td>
                  <td className="p-3 font-mono text-zinc-500">{inv.issueDate}</td>
                  <td className="p-3 text-right flex items-center justify-end gap-2">
                    {inv.paymentStatus !== 'PAID' && (user?.role === 'RECEPTIONIST' || user?.role === 'CLINIC_ADMIN') && (
                      <button
                        onClick={() => {
                          setPaymentModalInvoice(inv);
                          setAmountPaid((inv.totalAmount - inv.paidAmount).toFixed(2));
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <DollarSign size={13} /> Collect Payment
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer size={13} /> View Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">No invoices generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-base font-bold text-zinc-900">Generate Itemized Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-700 block mb-1">Select Patient *</label>
                <select
                  required
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} ({p.patientCode})</option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-800">Invoice Charges & Services</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-emerald-700 hover:underline font-semibold text-[11px]"
                  >
                    + Add Charge Item
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Service Description (e.g. ECG Test)"
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      className="p-2 border border-zinc-300 rounded flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      className="p-2 border border-zinc-300 rounded w-16"
                    />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Price ($)"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="p-2 border border-zinc-300 rounded w-24"
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-600 p-1">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Tax Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={e => setTaxAmount(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Discount Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Invoice Summary Box */}
              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded space-y-1 font-mono text-right text-xs">
                <div>Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                <div>Tax (+): ${Number(taxAmount).toFixed(2)}</div>
                <div>Discount (-): ${Number(discountAmount).toFixed(2)}</div>
                <div className="text-sm font-bold text-zinc-900 border-t border-zinc-300 pt-1 mt-1">
                  Total Bill Amount: ${calculateTotal().toFixed(2)}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">
              Record Payment for {paymentModalInvoice.invoiceNumber}
            </h2>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-700 block mb-1">Amount to Collect ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="INSURANCE">Insurance Claim</option>
                  <option value="ONLINE_TRANSFER">Online Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-xl p-8 space-y-6">
            <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-4">
              <div>
                <h1 className="text-xl font-bold text-emerald-900 tracking-tight flex items-center gap-2">
                  <Building2 size={20} className="text-emerald-700" />
                  {activeClinic?.name || 'Apex Health Clinic'}
                </h1>
                <div className="text-xs text-zinc-600 mt-1">{activeClinic?.address}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono text-emerald-800">{selectedInvoice.invoiceNumber}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">Date: {selectedInvoice.issueDate}</div>
              </div>
            </div>

            <div className="text-xs bg-zinc-50 p-3 border border-zinc-200 rounded">
              <div><strong>BILLED TO:</strong> {selectedInvoice.patientId?.fullName} ({selectedInvoice.patientId?.patientCode})</div>
              <div><strong>PAYMENT STATUS:</strong> <span className="font-bold uppercase text-emerald-800">{selectedInvoice.paymentStatus}</span></div>
            </div>

            <table className="w-full text-left text-xs border border-zinc-300">
              <thead className="bg-zinc-100 border-b border-zinc-300 font-bold">
                <tr>
                  <th className="p-2 border-r border-zinc-300">Description</th>
                  <th className="p-2 border-r border-zinc-300">Qty</th>
                  <th className="p-2 border-r border-zinc-300">Unit Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-300">
                {selectedInvoice.items?.map((it, i) => (
                  <tr key={i}>
                    <td className="p-2 border-r border-zinc-300 font-medium">{it.description}</td>
                    <td className="p-2 border-r border-zinc-300 font-mono">{it.quantity}</td>
                    <td className="p-2 border-r border-zinc-300 font-mono">${it.unitPrice.toFixed(2)}</td>
                    <td className="p-2 font-mono text-right font-bold">${it.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs font-mono text-right space-y-1">
              <div>Subtotal: ${selectedInvoice.subtotal?.toFixed(2)}</div>
              <div>Tax: +${selectedInvoice.taxAmount?.toFixed(2)}</div>
              <div>Discount: -${selectedInvoice.discountAmount?.toFixed(2)}</div>
              <div className="text-sm font-bold text-zinc-900 border-t border-zinc-300 pt-1 mt-1">
                Total Bill: ${selectedInvoice.totalAmount?.toFixed(2)}
              </div>
              <div className="text-emerald-800 font-bold">Amount Paid: ${selectedInvoice.paidAmount?.toFixed(2)}</div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 no-print">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-xs text-zinc-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
