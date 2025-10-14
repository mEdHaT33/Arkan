import React, { useState, useEffect } from 'react';
import '../styles/ExcelImportPage.css';

const ExcelImportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('https://arkanaltafawuq.com/arkan-system/excel_import.php');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/csv'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (!allowedTypes.includes(file.type) && fileExtension !== 'csv') {
        setError('Please select a valid CSV file (.csv)');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) {
      setError('Please select a file and import type');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('excel_file', selectedFile);
    formData.append('import_type', importType);
    if (skipDuplicates) {
      formData.append('skip_duplicates', '1');
    }

    try {
      const response = await fetch('https://arkanaltafawuq.com/arkan-system/excel_import.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setSelectedFile(null);
        setImportType('');
        // Reset file input
        document.getElementById('excel-file').value = '';
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type) => {
    if (!templates[type]) return;

    const headers = templates[type].headers;
    const csvContent = headers.join(',') + '\n';
    
    // Create a simple CSV template with sample data
    const sampleData = headers.map(header => {
      switch (header) {
        case 'item_code': return 'ITEM001';
        case 'item_name': return 'Sample Item';
        case 'type': return 'client';
        case 'direction': return 'in';
        case 'party_type': return 'client';
        case 'txn_date': return '2024-01-01';
        case 'amount': return '100.00';
        case 'quantity': return '10';
        case 'balance': return '0.00';
        case 'username': return 'john_doe';
        case 'password': return 'password123';
        case 'role': return 'user';
        case 'email': return 'john@example.com';
        case 'phone': return '+1234567890';
        case 'status': return 'active';
        case 'unit': return 'pcs';
        case 'purchase_price': return '50.00';
        case 'selling_price': return '75.00';
        case 'category': return 'General';
        case 'category_kind': return 'income';
        case 'account_type': return 'bank';
        case 'method': return 'cash';
        case 'reference': return 'REF001';
        case 'note': return 'Sample note';
        case 'created_by': return 'admin';
        case 'party_id': return '1';
        case 'supplier_id': return '1';
        case 'reorder_level': return '5';
        case 'location': return 'Warehouse A';
        case 'address': return '123 Main St';
        default: return 'sample';
      }
    }).join(',') + '\n';

    const fullContent = csvContent + sampleData;
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="excel-import-container">
      <div className="excel-import-header">
        <h2>CSV Data Import</h2>
        <p>Import your existing data from CSV files into the system</p>
      </div>

      <div className="excel-import-form">
        <div className="form-section">
          <h3>1. Select Import Type</h3>
          <div className="import-types">
            {Object.entries(templates).map(([type, template]) => (
              <div key={type} className="import-type-card">
                <div className="import-type-header">
                  <input
                    type="radio"
                    id={type}
                    name="importType"
                    value={type}
                    checked={importType === type}
                    onChange={(e) => setImportType(e.target.value)}
                  />
                  <label htmlFor={type}>
                    <strong>{type.replace('_', ' ').toUpperCase()}</strong>
                  </label>
                </div>
                <p className="import-type-description">{template.description}</p>
                <div className="import-type-actions">
                  <button
                    type="button"
                    className="btn-template"
                    onClick={() => downloadTemplate(type)}
                  >
                    Download Template
                  </button>
                </div>
                {importType === type && (
                  <div className="template-headers">
                    <h4>Required Columns:</h4>
                    <div className="headers-list">
                      {template.headers.map((header, index) => (
                        <span key={index} className="header-tag">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>2. Upload CSV File</h3>
          <div className="file-upload-area">
            <input
              type="file"
              id="excel-file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="excel-file" className="file-upload-label">
              {selectedFile ? selectedFile.name : 'Choose CSV File (.csv)'}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>3. Import Options</h3>
          <div className="import-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Skip duplicate records (recommended)
            </label>
          </div>
        </div>

        <div className="form-section">
          <button
            type="button"
            className="btn-import"
            onClick={handleImport}
            disabled={loading || !selectedFile || !importType}
          >
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="import-result">
            <h3>Import Results</h3>
            <div className="result-stats">
              <div className="stat-item success">
                <span className="stat-number">{result.imported}</span>
                <span className="stat-label">Imported</span>
              </div>
              <div className="stat-item warning">
                <span className="stat-number">{result.skipped}</span>
                <span className="stat-label">Skipped</span>
              </div>
              <div className="stat-item error">
                <span className="stat-number">{result.errors.length}</span>
                <span className="stat-label">Errors</span>
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="error-details">
                <h4>Errors:</h4>
                <ul>
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="import-help">
        <h3>Import Instructions</h3>
        <ol>
          <li>Choose the type of data you want to import</li>
          <li>Download the template to see the required column format</li>
          <li>Fill your CSV file with data matching the template</li>
          <li>Upload your CSV file and configure import options</li>
          <li>Click "Start Import" to process your data</li>
        </ol>
        
        <div className="help-tips">
          <h4>Tips:</h4>
          <ul>
            <li>Make sure your CSV file has headers in the first row</li>
            <li>Required fields must be filled for each row</li>
            <li>Dates should be in YYYY-MM-DD format</li>
            <li>Numbers should not contain currency symbols</li>
            <li>Enable "Skip duplicates" to avoid importing existing records</li>
            <li>Save your Excel file as CSV format before uploading</li>
            <li>If you get "Missing headers" error, try saving as "CSV UTF-8 (Comma delimited)" instead</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportPage;
