import React from 'react';
import { FileWarning, Lightbulb, AlertTriangle } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';

interface ImpactReport {
  doc_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  issue_summary: string;
  suggested_rewrite: string;
  impacted_section: string;
}

interface ImpactViewerProps {
  affectedDocs: string[];
  impactReports: ImpactReport[];
  documents: Array<{ id: string; name: string; category: string }>;
}

export function ImpactViewer({ affectedDocs, impactReports, documents }: ImpactViewerProps) {
  const highSeverityCount = impactReports.filter(r => r.severity === 'HIGH').length;
  const mediumSeverityCount = impactReports.filter(r => r.severity === 'MEDIUM').length;
  const lowSeverityCount = impactReports.filter(r => r.severity === 'LOW').length;

  // Get document name without extension
  const getDocName = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    return doc?.name || docId;
  };

  return (
    <div className="space-y-6">
      {/* Affected Documents Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileWarning className="w-5 h-5 text-gray-700" />
          <h3 className="text-gray-900">Affected Documents ({affectedDocs.length})</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {affectedDocs.map((doc, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700"
            >
              {getDocName(doc)}
            </span>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-700" />
          <h3 className="text-orange-900">Impact Summary</h3>
        </div>
        <div className="flex gap-4 text-orange-900">
          <span>{highSeverityCount} High</span>
          <span className="text-orange-700">•</span>
          <span>{mediumSeverityCount} Medium</span>
          <span className="text-orange-700">•</span>
          <span>{lowSeverityCount} Low</span>
        </div>
      </div>

      {/* Detailed Impact Reports */}
      <div className="space-y-4">
        <h3 className="text-gray-900">Inconsistencies Detected:</h3>
        {impactReports.map((report, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-gray-900 mb-1">{getDocName(report.doc_id)}</h4>
                <p className="text-gray-600">{report.impacted_section}</p>
              </div>
              <SeverityBadge severity={report.severity} />
            </div>

            {/* Issue */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Issue:</span>
              </div>
              <p className="text-gray-800 pl-6">{report.issue_summary}</p>
            </div>

            {/* Suggested Fix */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-700">
                <Lightbulb className="w-4 h-4" />
                <span>AI Suggestion:</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 ml-6">
                <p className="text-blue-900">{report.suggested_rewrite}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}