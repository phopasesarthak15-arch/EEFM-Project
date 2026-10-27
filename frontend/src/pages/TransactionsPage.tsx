import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Transaction,
  TransactionCreate,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  ArrowUpDown,
  Check,
  X,
  AlertCircle,
  FileText
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { refreshCount, triggerRefresh } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderBy, setOrderBy] = useState<'date' | 'amount'>('date');
  const [orderDir, setOrderDir] = useState<'desc' | 'asc'>('desc');

  // Add/Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TransactionCreate>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 100,
    transaction_type: 'expense',
    category: 'Food and Mess',
    payment_method: 'UPI',
    notes: '',
    is_recurring: false
  });

  // Delete Confirmation Modal
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // CSV Import Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        category: categoryFilter || undefined,
        transaction_type: typeFilter || undefined,
        search: search || undefined,
        order_by: orderBy,
        order_dir: orderDir
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, categoryFilter, startDate, endDate, orderBy, orderDir, refreshCount]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 150,
      transaction_type: 'expense',
      category: 'Food and Mess',
      payment_method: 'UPI',
      notes: '',
      is_recurring: false
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      transaction_type: tx.transaction_type,
      category: tx.category,
      payment_method: tx.payment_method,
      notes: tx.notes || '',
      is_recurring: tx.is_recurring
    });
    setEditModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTransaction(editingId, formData);
      } else {
        await api.createTransaction(formData);
      }
      setEditModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error saving transaction');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteTransaction(deleteId);
      setDeleteId(null);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting transaction');
    }
  };

  const handleExportCSV = () => {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    if (categoryFilter) query.append('category', categoryFilter);
    if (typeFilter) query.append('transaction_type', typeFilter);
    if (search) query.append('search', search);

    window.open(`/api/transactions/export-csv?${query.toString()}`, '_blank');
  };

  const handleCSVFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    try {
      const res = await api.previewCSV(file);
      setPreviewResult(res);
    } catch (err: any) {
      alert(err.message || 'Error previewing CSV file');
    }
  };

  const handleCommitImport = async () => {
    if (!previewResult?.all_valid_rows?.length) return;
    setImporting(true);
    try {
      await api.commitCSV(previewResult.all_valid_rows);
      setCsvModalOpen(false);
      setCsvFile(null);
      setPreviewResult(null);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error importing CSV records');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transaction Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete financial ledger with filtering, sorting, CSV import/export, and instant recalculation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <input
              type="date"
              placeholder="From Date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <input
              type="date"
              placeholder="To Date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Sorting options */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <button
              onClick={() => setOrderBy('date')}
              className={`px-2 py-0.5 rounded font-semibold ${orderBy === 'date' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
            >
              Date
            </button>
            <button
              onClick={() => setOrderBy('amount')}
              className={`px-2 py-0.5 rounded font-semibold ${orderBy === 'amount' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
            >
              Amount
            </button>
            <button
              onClick={() => setOrderDir(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 text-teal-600 font-semibold px-2 py-0.5 rounded hover:bg-teal-50"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {orderDir === 'desc' ? 'Descending' : 'Ascending'}
            </button>
          </div>

          <div>
            Showing <span className="font-bold text-slate-800">{transactions.length}</span> record(s)
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading transactions...</div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{tx.description}</div>
                      {tx.notes && <div className="text-[11px] text-slate-400 font-normal">{tx.notes}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        tx.transaction_type === 'income'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tx.payment_method}</td>
                    <td className={`py-3 px-4 text-right font-bold whitespace-nowrap text-sm ${
                      tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.transaction_type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          title="Edit transaction"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          title="Delete transaction"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No transactions match the selected filters.
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingId ? 'Edit Transaction' : 'Create Transaction'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter verified financial details
            </p>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'expense', category: 'Food and Mess' })}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      formData.transaction_type === 'expense'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'income', category: 'Pocket Money' })}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      formData.transaction_type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {(formData.transaction_type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="UPI">UPI (GPay/Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Monthly Recurring</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this transaction? All dashboard metrics, budget spending, and analytics will be automatically recalculated.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal with Preview */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Import Transactions via CSV</h3>
              <button onClick={() => setCsvModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Upload a CSV file containing transaction records. Required columns: <code>Date, Description, Amount, Type, Category</code>.
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVFileChange}
                  className="hidden"
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Choose CSV File
                </button>
                {csvFile && <div className="text-xs text-slate-700 mt-2 font-medium">{csvFile.name}</div>}
              </div>

              {previewResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      ✓ Valid Rows: {previewResult.valid_count}
                    </span>
                    {previewResult.error_count > 0 && (
                      <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded">
                        ✗ Errors: {previewResult.error_count}
                      </span>
                    )}
                  </div>

                  {previewResult.errors?.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 max-h-32 overflow-y-auto text-xs text-rose-800 space-y-1">
                      <div className="font-bold">Validation Warnings:</div>
                      {previewResult.errors.map((err: string, i: number) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  )}

                  {previewResult.valid_preview?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">Sample Preview (First 5 Rows):</div>
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="p-2">Date</th>
                              <th className="p-2">Description</th>
                              <th className="p-2">Type</th>
                              <th className="p-2">Category</th>
                              <th className="p-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewResult.valid_preview.slice(0, 5).map((r: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2">{r.date}</td>
                                <td className="p-2 font-medium">{r.description}</td>
                                <td className="p-2 uppercase font-bold text-[10px]">{r.transaction_type}</td>
                                <td className="p-2">{r.category}</td>
                                <td className="p-2 text-right font-bold">{formatINR(r.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCsvModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={!previewResult?.valid_count || importing}
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${previewResult?.valid_count || 0} Records`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
