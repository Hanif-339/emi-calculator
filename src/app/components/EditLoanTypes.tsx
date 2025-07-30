"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoanType {
  id: string;
  name: string;
  interestRate: number;
  tenure: number; 
}

interface EditingLoan {
  id: string;
  name: string;
  interestRate: number;
  tenure: number; 
}

const EditLoanTypes: React.FC = () => {
  const router = useRouter();
  

  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLoanName, setNewLoanName] = useState('');
  const [newInterestRate, setNewInterestRate] = useState<number>(10.0);
  const [newTenure, setNewTenure] = useState<number>(240); 
  const [editingLoan, setEditingLoan] = useState<EditingLoan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');


  const getYearsFromMonths = (months: number): string => {
    return Math.floor(months / 12).toString();
  };

  const getMonthsRemainder = (months: number): string => {
    return (months % 12).toString();
  };


  const handleNewTenureYearsChange = (years: string) => {
    const numYears = parseFloat(years) || 0;
    const remainderMonths = newTenure % 12;
    const totalMonths = (numYears * 12) + remainderMonths;
    setNewTenure(totalMonths);
  };

  const handleNewTenureMonthsChange = (months: string) => {
    const numMonths = parseFloat(months) || 0;
    const years = Math.floor(newTenure / 12);
    const totalMonths = (years * 12) + numMonths;
    setNewTenure(totalMonths);
  };

  const handleEditTenureYearsChange = (years: string) => {
    if (!editingLoan) return;
    const numYears = parseFloat(years) || 0;
    const remainderMonths = editingLoan.tenure % 12;
    const totalMonths = (numYears * 12) + remainderMonths;
    setEditingLoan({ ...editingLoan, tenure: totalMonths });
  };

  const handleEditTenureMonthsChange = (months: string) => {
    if (!editingLoan) return;
    const numMonths = parseFloat(months) || 0;
    const years = Math.floor(editingLoan.tenure / 12);
    const totalMonths = (years * 12) + numMonths;
    setEditingLoan({ ...editingLoan, tenure: totalMonths });
  };

  // Default loan types with interest rates and tenure
  const defaultLoanTypes: LoanType[] = [
    { id: 'home-loan', name: 'Home Loan', interestRate: 8.5, tenure: 240 }, // 20 years
    { id: 'car-loan', name: 'Car Loan', interestRate: 9.5, tenure: 84 }, // 7 years
    { id: 'personal-loan', name: 'Personal Loan', interestRate: 12.0, tenure: 60 }, // 5 years
    { id: 'business-loan', name: 'Business Loan', interestRate: 11.0, tenure: 120 }, // 10 years
    { id: 'education-loan', name: 'Education Loan', interestRate: 7.5, tenure: 180 } // 15 years
  ];


  const migrateLoanType = (loan: any): LoanType => {
    if (isValidLoanType(loan)) {
      return loan;
    }


    if (typeof loan === 'object' && loan.id && loan.name) {
      const defaultLoan = defaultLoanTypes.find(d => d.id === loan.id);
      return {
        id: loan.id,
        name: loan.name,
        interestRate: loan.interestRate || defaultLoan?.interestRate || 10.0,
        tenure: loan.tenure || loan.tenureMonths || defaultLoan?.tenure || 240 // Handle both property names
      };
    }


    return {
      id: 'unknown-' + Date.now(),
      name: 'Unknown Loan',
      interestRate: 10.0,
      tenure: 240
    };
  };

  // Validate loan type object
  const isValidLoanType = (loanType: any): loanType is LoanType => {
    return (
      typeof loanType === 'object' &&
      loanType !== null &&
      typeof loanType.id === 'string' &&
      typeof loanType.name === 'string' &&
      typeof loanType.interestRate === 'number' &&
      typeof loanType.tenure === 'number' &&
      loanType.id.trim().length > 0 &&
      loanType.name.trim().length > 0 &&
      loanType.interestRate > 0 &&
      loanType.interestRate <= 100 &&
      loanType.tenure > 0
    );
  };

  // Load loan types from localStorage on component mount
  useEffect(() => {
    const savedLoanTypes = localStorage.getItem('loanTypes');
    if (savedLoanTypes) {
      try {
        const parsed = JSON.parse(savedLoanTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate legacy data
          const migratedTypes = parsed.map(loan => migrateLoanType(loan));
          setLoanTypes(migratedTypes);
        } else {
          // If parsed data is invalid, use defaults
          setLoanTypes(defaultLoanTypes);
          localStorage.setItem('loanTypes', JSON.stringify(defaultLoanTypes));
        }
      } catch (err) {
        console.error('Error loading saved loan types:', err);
        // If parsing fails, use defaults
        setLoanTypes(defaultLoanTypes);
        localStorage.setItem('loanTypes', JSON.stringify(defaultLoanTypes));
      }
    } else {
      // If no saved data, use defaults
      setLoanTypes(defaultLoanTypes);
      localStorage.setItem('loanTypes', JSON.stringify(defaultLoanTypes));
    }
    setIsLoading(false);
  }, []);


  useEffect(() => {
    if (!isLoading && loanTypes.length > 0) {
      localStorage.setItem('loanTypes', JSON.stringify(loanTypes));
    }
  }, [loanTypes, isLoading]);

  // Generate a unique ID for new loan types
  const generateId = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  };

  // Validate loan data
  const validateLoanData = (name: string, interestRate: number, tenure: number, excludeId?: string): boolean => {
    if (!name.trim()) {
      setError('Loan name cannot be empty');
      return false;
    }
    
    if (name.trim().length < 2) {
      setError('Loan name must be at least 2 characters long');
      return false;
    }

    if (loanTypes.some(loan => loan.id !== excludeId && loan.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A loan type with this name already exists');
      return false;
    }

    if (interestRate <= 0 || interestRate > 100) {
      setError('Interest rate must be between 0.01% and 100%');
      return false;
    }

    if (tenure <= 0) {
      setError('Tenure must be greater than 0 months');
      return false;
    }

    setError('');
    return true;
  };

  // Add new loan type
  const handleAddLoan = () => {
    if (!validateLoanData(newLoanName, newInterestRate, newTenure)) return;

    const newLoan: LoanType = {
      id: generateId(newLoanName),
      name: newLoanName.trim(),
      interestRate: newInterestRate,
      tenure: newTenure 
    };

    setLoanTypes(prev => [...prev, newLoan]);
    setNewLoanName('');
    setNewInterestRate(10.0);
    setNewTenure(240); 
    setShowAddForm(false);
    setError('');
  };

  // Delete loan type
  const handleDeleteLoan = (id: string) => {
    if (loanTypes.length <= 1) {
      setError('Cannot delete the last loan type');
      return;
    }

    if (confirm('Are you sure you want to delete this loan type?')) {
      setLoanTypes(prev => prev.filter(loan => loan.id !== id));
      setError('');
    }
  };

  // Start editing a loan
  const handleStartEdit = (loan: LoanType) => {
    setEditingLoan({ 
      id: loan.id, 
      name: loan.name,
      interestRate: loan.interestRate,
      tenure: loan.tenure 
    });
    setError('');
  };

  // Save edited loan
  const handleSaveEdit = () => {
    if (!editingLoan) return;

    if (!validateLoanData(editingLoan.name, editingLoan.interestRate, editingLoan.tenure, editingLoan.id)) {
      return;
    }

    setLoanTypes(prev => 
      prev.map(loan => 
        loan.id === editingLoan.id 
          ? { 
              ...loan, 
              name: editingLoan.name.trim(),
              interestRate: editingLoan.interestRate,
              tenure: editingLoan.tenure 
            }
          : loan
      )
    );
    
    setEditingLoan(null);
    setError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingLoan(null);
    setError('');
  };

  // Cancel adding new loan
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewLoanName('');
    setNewInterestRate(10.0);
    setNewTenure(240); 
    setError('');
  };

  // Go back to main calculator
  const handleGoBack = () => {
    router.push('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Manage Loan Types</h1>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            ← Back to Calculator
          </button>
        </div>
        <p className="text-gray-600">Add, edit, or remove loan types with their default interest rates and tenure for your EMI calculator.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Add New Loan Type Section */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add New Loan Type</h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              + Add Loan Type
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Name *
                </label>
                <input
                  type="text"
                  value={newLoanName}
                  onChange={(e) => setNewLoanName(e.target.value)}
                  placeholder="e.g., Vehicle Loan"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (% per annum) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="100"
                  value={newInterestRate === 0 ? '' : newInterestRate}
                  onChange={(e) => setNewInterestRate(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 8.5"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Tenure Input Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Tenure *</label>                
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Years</label>
                  <input
                    type="number"
                    value={getYearsFromMonths(newTenure)}
                    onChange={(e) => handleNewTenureYearsChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Years"
                    min="0"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Months</label>
                  <input
                    type="number"
                    value={getMonthsRemainder(newTenure)}
                    onChange={(e) => handleNewTenureMonthsChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Months"
                    min="0"
                    max="11"
                  />
                </div>                  
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total: {newTenure} months
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddLoan}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
              >
                ✓ Save Loan Type
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Loan Types */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Existing Loan Types ({loanTypes.length})
        </h2>

        {loanTypes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No loan types available</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 mx-auto"
            >
              + Add First Loan Type
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {loanTypes.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-white border border-gray-200 rounded-md hover:shadow-sm transition-shadow"
              >
                {editingLoan?.id === loan.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loan Name *
                        </label>
                        <input
                          type="text"
                          value={editingLoan.name}
                          onChange={(e) => setEditingLoan({ ...editingLoan, name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Interest Rate (%) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          max="100"
                          value={editingLoan.interestRate === 0 ? '' : editingLoan.interestRate}
                          onChange={(e) => setEditingLoan({ ...editingLoan, interestRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Edit Tenure Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Tenure *</label>                
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Years</label>
                          <input
                            type="number"
                            value={getYearsFromMonths(editingLoan.tenure)}
                            onChange={(e) => handleEditTenureYearsChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Years"
                            min="0"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Months</label>
                          <input
                            type="number"
                            value={getMonthsRemainder(editingLoan.tenure)}
                            onChange={(e) => handleEditTenureMonthsChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Months"
                            min="0"
                            max="11"
                          />
                        </div>                  
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {editingLoan.tenure} months
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{loan.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Interest Rate:</span> {loan.interestRate}% p.a.
                        </div>
                        <div>
                          <span className="font-medium">Default Tenure:</span> {Math.floor(loan.tenure / 12)}y {loan.tenure % 12}m ({loan.tenure} months)
                        </div>
                        <div>
                          <span className="font-medium">ID:</span> {loan.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(loan)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        disabled={loanTypes.length <= 1}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditLoanTypes;