import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface DiffBlock {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

interface DiffViewerProps {
  oldText: string;
  newText: string;
  diffBlocks?: DiffBlock[];
}

export function DiffViewer({ oldText, newText, diffBlocks }: DiffViewerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Old Version */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-700">
            <Minus className="w-4 h-4" />
            <span>Old Version</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap">{oldText}</p>
          </div>
        </div>

        {/* New Version */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <Plus className="w-4 h-4" />
            <span>New Version</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap">{newText}</p>
          </div>
        </div>
      </div>

      {/* Detailed Diff Blocks */}
      {diffBlocks && diffBlocks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-gray-700">Detailed Changes:</h4>
          <div className="space-y-2">
            {diffBlocks.map((block, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  block.type === 'removed'
                    ? 'bg-red-50 border-red-200'
                    : block.type === 'added'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {block.type === 'removed' && <Minus className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />}
                {block.type === 'added' && <Plus className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />}
                <span
                  className={
                    block.type === 'removed'
                      ? 'text-red-900 line-through'
                      : block.type === 'added'
                      ? 'text-green-900'
                      : 'text-gray-700'
                  }
                >
                  {block.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
