import React from 'react';
import { FileText, Clock } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  last_modified: string;
}

interface DocListProps {
  documents: Document[];
  selectedDocId: string | null;
  onSelectDoc: (docId: string) => void;
}

export function DocList({ documents, selectedDocId, onSelectDoc }: DocListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocs).map(([category, docs]) => (
        <div key={category}>
          <h3 className="text-gray-500 mb-2 px-3">{category}</h3>
          <div className="space-y-1">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  selectedDocId === doc.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 truncate">{doc.name}</div>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(doc.last_modified)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
