import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { documentsData } from '../mock-data/documents';

interface AddChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (change: {
    doc_id: string;
    old_text: string;
    new_text: string;
  }) => void;
}

interface Document {
  id: string;
  name: string;
}

export function AddChangeModal({ isOpen, onClose, onSubmit }: AddChangeModalProps) {
  const [selectedDoc, setSelectedDoc] = useState('');
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !oldText || !newText) return;

    onSubmit({
      doc_id: selectedDoc,
      old_text: oldText,
      new_text: newText
    });

    // Reset form
    setSelectedDoc('');
    setOldText('');
    setNewText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Add New Document Change</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Select Document <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a document...</option>
              {documentsData.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Old Text */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Old Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Enter the original text..."
              required
            />
          </div>

          {/* New Text */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              New Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Enter the updated text..."
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}