import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Database,
  ArrowRight
} from 'lucide-react';
import { uploadCustomCSV } from '../services/api';

export default function DataUploadModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv')) {
        setErrorMsg('Please upload a valid .csv file.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setErrorMsg('Please upload a valid .csv file.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadCustomCSV(selectedFile);
      setSuccessInfo(res);
      setTimeout(() => {
        onUploadSuccess(res.profile);
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload and train on dataset');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "timestamp,demand_kw,temperature_c\n" +
      "2026-08-01 00:00:00,312.4,18.5\n" +
      "2026-08-01 01:00:00,295.1,17.8\n" +
      "2026-08-01 02:00:00,284.0,17.2\n" +
      "2026-08-01 03:00:00,280.5,16.9\n" +
      "2026-08-01 04:00:00,289.2,16.8\n" +
      "2026-08-01 05:00:00,315.6,17.5\n" +
      "2026-08-01 06:00:00,380.0,19.2\n" +
      "2026-08-01 07:00:00,490.2,21.5\n" +
      "2026-08-01 08:00:00,610.8,24.0\n" +
      "2026-08-01 09:00:00,695.4,26.5\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_electricity_consumption.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Upload Custom Electricity Dataset
              </h2>
              <p className="text-xs text-slate-400">
                Train a custom time-series forecasting model on your own meter readings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div className="mt-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive 
                ? 'border-brand-400 bg-brand-500/5' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />

            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">
              Drag & drop your CSV file here, or{' '}
              <label htmlFor="csv-upload" className="text-brand-400 hover:underline cursor-pointer font-semibold">
                browse files
              </label>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Required columns: <code className="text-slate-300 font-mono">timestamp</code>, <code className="text-slate-300 font-mono">demand_kw</code> (min 168 rows)
            </p>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/30 text-xs font-mono">
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Sample template button */}
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-1">
            <span>Need a formatted CSV template?</span>
            <button
              onClick={handleDownloadSample}
              className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV
            </button>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Ingested {successInfo.rows_ingested} records! Custom model trained with R²={(successInfo.metrics?.r2*100).toFixed(1)}%. Switching view...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              !selectedFile || isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-md shadow-brand-500/20'
            }`}
          >
            {isUploading ? (
              <span>Training Model...</span>
            ) : (
              <>
                <span>Upload & Train Model</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
