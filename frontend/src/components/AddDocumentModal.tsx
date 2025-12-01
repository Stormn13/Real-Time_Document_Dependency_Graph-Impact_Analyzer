import React, { useState } from 'react';
import { X, FileText, Plus } from 'lucide-react';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (document: {
    name: string;
    category: string;
    content: string;
    dependencies: string[];
  }) => void;
  existingDocs: Array<{ id: string; name: string; category: string }>;
}

export function AddDocumentModal({ isOpen, onClose, onSubmit, existingDocs }: AddDocumentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  if (!isOpen) return null;

  // Get unique categories from existing documents
  const existingCategories = Array.from(new Set(existingDocs.map(doc => doc.category)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!category && !customCategory) || !content) return;

    onSubmit({
      name,
      category: useCustomCategory ? customCategory : category,
      content,
      dependencies: selectedDependencies
    });

    // Reset form
    setName('');
    setCategory('');
    setContent('');
    setSelectedDependencies([]);
    setCustomCategory('');
    setUseCustomCategory(false);
    onClose();
  };

  const toggleDependency = (docId: string) => {
    setSelectedDependencies(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Add New Company Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Name */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Employee Handbook"
              required
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            
            {!useCustomCategory ? (
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!useCustomCategory}
                >
                  <option value="">Select a category...</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomCategory(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  + Create new category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new category name..."
                  required={useCustomCategory}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomCategory(false);
                    setCustomCategory('');
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Choose existing category
                </button>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Document Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
              placeholder="Enter the document content here..."
              required
            />
            <p className="text-gray-500">
              Add the full text of your document. This will be used for dependency analysis.
            </p>
          </div>

          {/* Dependencies Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700">
              Document Dependencies (Optional)
            </label>
            <p className="text-gray-500 mb-3">
              Select documents that should be checked when this document changes
            </p>
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
              {existingDocs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents available yet</p>
              ) : (
                <div className="space-y-2">
                  {existingDocs.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(doc.id)}
                        onChange={() => toggleDependency(doc.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-gray-900">{doc.name}</div>
                        <div className="text-gray-500">{doc.category}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
