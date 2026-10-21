import React, { useState, useRef, useId } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { filesService } from '../../services/filesService';
import { resolveImageUrl } from '../../services/apiClient';

interface FileUploadProps {
  onUploadSuccess: (url: string, filename: string) => void;
  accept?: string;
  label?: string;
  helperText?: string;
  initialUrl?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  label = 'Upload Image or Supporting Document',
  helperText = 'Supported formats: PNG, JPG, WebP, PDF (Up to 10 MB)',
  initialUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  const handleFile = async (file: File) => {
    setError(null);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (file.size > MAX_SIZE) {
      setError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }

    setIsUploading(true);
    try {
      const result = await filesService.uploadFile(file);
      setPreviewUrl(result.url);
      setUploadedName(file.name);
      onUploadSuccess(result.url, file.name);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // The drop zone is exposed as a real button so keyboard users can open the
  // file picker with Enter / Space as well as a click.
  const handleDropZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      openFileDialog();
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setUploadedName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = previewUrl?.endsWith('.pdf') || uploadedName?.endsWith('.pdf');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      {previewUrl ? (
        <div className="relative border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isPdf ? (
              <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
            ) : (
              <img
                src={resolveImageUrl(previewUrl)}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                }}
              />
            )}
            <div className="truncate">
              <p className="text-sm font-medium text-slate-800 truncate">
                {uploadedName || 'Uploaded File'}
              </p>
              <p className="text-xs text-emerald-600 flex items-center mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Ready for submission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label={uploadedName ? `Remove uploaded file ${uploadedName}` : 'Remove uploaded file'}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          {/*
           * The file input is kept as a sibling of the drop zone (never nested
           * inside it) so the interactive `role="button"` wrapper does not
           * contain another focusable control.
           */}
          <input
            id={inputId}
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept={accept}
            tabIndex={-1}
            className="sr-only"
          />

          <div
            role="button"
            tabIndex={0}
            aria-describedby={helpId}
            aria-invalid={error ? true : undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={openFileDialog}
            onKeyDown={handleDropZoneKeyDown}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                <Upload className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {isUploading ? (
                  <span className="text-brand-600 animate-pulse">Uploading file to server...</span>
                ) : (
                  <>
                    <span className="text-brand-600 hover:underline">Click to upload</span> or drag
                    and drop
                  </>
                )}
              </p>
              <p id={helpId} className="text-xs text-slate-500 mt-1">
                {helperText}
              </p>
            </div>
          </div>
        </>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="flex items-center text-rose-600 text-xs mt-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
