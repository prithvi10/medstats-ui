import { useState, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function FileUploader({ files, onFilesChange, accept, maxFiles = 10 }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      const combined = [...files, ...dropped].slice(0, maxFiles);
      onFilesChange(combined);
    },
    [files, onFilesChange, maxFiles]
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const combined = [...files, ...selected].slice(0, maxFiles);
      onFilesChange(combined);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (name: string) => {
    if (name.match(/\.(xlsx?|csv)$/i)) return FileSpreadsheet;
    return FileText;
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        )}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Drop files here or <span className="text-brand-600">browse</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports .xlsx, .xls, .csv, .docx, .pdf (max {maxFiles} files)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept || '.xlsx,.xls,.csv,.docx,.pdf'}
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.name);
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Icon className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
