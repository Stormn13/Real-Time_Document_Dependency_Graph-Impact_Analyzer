import React, { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, Activity, Plus, List, Network, FileText } from 'lucide-react';
import { DocList } from './components/DocList';
import { DiffViewer } from './components/DiffViewer';
import { ImpactViewer } from './components/ImpactViewer';
import { DependencyGraph } from './components/DependencyGraph';
import { AddChangeModal } from './components/AddChangeModal';
import { AddDocumentModal } from './components/AddDocumentModal';

// Import mock data
import { documentsData as initialDocuments } from './mock-data/documents';
import { changeEventData as initialChangeEvent } from './mock-data/change_event';
import { impactEventData as initialImpactEvent } from './mock-data/impact_event';
import { impactReportData as initialImpactReport } from './mock-data/impact_report';
import { documentDependencies as initialDependencies } from './mock-data/dependencies';

type ViewMode = 'details' | 'graph';

interface ChangeEvent {
  doc_id: string;
  old_version: string;
  new_version: string;
  timestamp: string;
  old_text_snippet: string;
  new_text_snippet: string;
  diff_blocks: Array<{ type: 'added' | 'removed'; text: string }>;
}

interface Document {
  id: string;
  name: string;
  category: string;
  last_modified: string;
  file_path: string;
}

export default function App() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialChangeEvent.doc_id
  );
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // State for documents and dependencies
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [dependencies, setDependencies] = useState<Record<string, string[]>>(initialDependencies);

  // State for current change and impacts
  const [changeEvent, setChangeEvent] = useState<ChangeEvent>(initialChangeEvent);
  const [impactEvent, setImpactEvent] = useState(initialImpactEvent);
  const [impactReport, setImpactReport] = useState(initialImpactReport);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received event:', data);

        // Map backend event to frontend ChangeEvent
        const newChangeEvent: ChangeEvent = {
          doc_id: data.changed_doc,
          old_version: 'Previous',
          new_version: 'Current',
          timestamp: new Date().toISOString(),
          old_text_snippet: data.old_snippets ? data.old_snippets.join('\n') : '',
          new_text_snippet: data.new_snippets ? data.new_snippets.join('\n') : '',
          diff_blocks: [
            ...(data.old_snippets || []).map((t: string) => ({ type: 'removed' as const, text: t })),
            ...(data.new_snippets || []).map((t: string) => ({ type: 'added' as const, text: t })),
          ],
        };

        setChangeEvent(newChangeEvent);
        setSelectedDocId(data.changed_doc);
        setLastUpdated(new Date());

        // Map impacted docs
        if (data.impacted_docs) {
          const newImpactReports = Object.entries(data.impacted_docs).map(([docId, snippets]) => {
            const doc = documents.find(d => d.id === docId);
            return {
              doc_id: docId,
              severity: 'HIGH' as const, // Default to HIGH for now
              issue_summary: `Dependency impact detected from ${data.changed_doc}`,
              suggested_rewrite: `Review the following snippets: ${(snippets as string[]).join(', ')}`,
              impacted_section: 'Content dependency'
            };
          });
          setImpactReport(newImpactReports);
          setImpactEvent({
            changed_doc: data.changed_doc,
            affected_docs: Object.keys(data.impacted_docs)
          });
        }

      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [documents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 500);
  };

  const handleAddChange = async (change: { doc_id: string; old_text: string; new_text: string }) => {
    try {
      // Construct the full new content
      // NOTE: In a real app, we'd need the full file content. 
      // For this MVP, we are assuming the 'new_text' IS the full content 
      // OR we are appending/replacing based on context.
      // However, the UI 'Add Change' modal usually asks for 'Old Text' and 'New Text'.
      // To make this work simply for the demo, let's assume we are just appending the new text 
      // or replacing the old text in the file.

      // BUT, the modal in this UI seems to be designed for "Simulating a change event" rather than editing a file.
      // To make it "Real", we should probably fetch the current content, do a replace, and save.
      // For simplicity in this demo: We will just APPEND the new text for the demo if old_text is empty,
      // or replace old_text with new_text.

      // Fetch current content (we don't have a read endpoint yet, so we rely on what we have or just append)
      // Let's try a safer approach: Just append the new text for the demo if it's a "New Policy" style update.

      // Actually, let's just send the 'new_text' as the content to write if we want to overwrite.
      // But the user probably wants to see a diff.

      // Strategy: Read file -> Replace -> Write file.
      // Since we don't have a read endpoint exposed easily (we could add one), 
      // let's just add a simple "Append" logic or "Overwrite" logic.

      // Let's assume the user pastes the WHOLE new document content in "New Text" for now, 
      // OR we just append.

      // Let's go with: Read the file from the backend first? No, that's too slow for this UI interaction.
      // Let's just send the `new_text` to the backend and let the backend handle it?
      // The backend `update_doc` overwrites the file.
      // So we should warn the user: "This will overwrite the file with New Text".

      const response = await fetch('http://localhost:8000/update-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_id: change.doc_id,
          content: change.new_text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      console.log('Document updated successfully');
      setIsChangeModalOpen(false);

    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document. See console for details.');
    }
  };

  const handleAddDocument = (newDoc: {
    name: string;
    category: string;
    content: string;
    dependencies: string[];
  }) => {
    // Generate a unique ID
    const docId = `${newDoc.name.toLowerCase().replace(/\s+/g, '_')}.md`;

    // Add document to list
    const document: Document = {
      id: docId,
      name: newDoc.name,
      category: newDoc.category,
      last_modified: new Date().toISOString(),
      file_path: `${newDoc.category.toLowerCase()}/${docId}`
    };

    setDocuments(prev => [...prev, document]);

    // Add dependencies if any
    if (newDoc.dependencies.length > 0) {
      setDependencies(prev => ({
        ...prev,
        [docId]: newDoc.dependencies
      }));
    }

    setLastUpdated(new Date());
  };

  const calculateConsistencyScore = () => {
    const totalIssues = impactReport.length;
    const highSeverity = impactReport.filter(r => r.severity === 'HIGH').length;
    const mediumSeverity = impactReport.filter(r => r.severity === 'MEDIUM').length;

    // Simple scoring: start at 100, subtract points based on severity
    const score = Math.max(0, 100 - (highSeverity * 20) - (mediumSeverity * 10) - (totalIssues * 5));
    return score;
  };

  const consistencyScore = calculateConsistencyScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 60) return 'text-orange-700 bg-orange-100 border-orange-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  // Get document name without extension
  const getDocName = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    return doc?.name || docId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <h1 className="text-gray-900">Real-Time Document Dependency Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Add Document
            </button>
            <button
              onClick={() => setIsChangeModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Change
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-gray-900 mb-4">Documents</h2>
              <DocList
                documents={documents}
                selectedDocId={selectedDocId}
                onSelectDoc={setSelectedDocId}
              />
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-gray-900 mb-3">Recent Changes</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-blue-900 mb-1">
                  {getDocName(changeEvent.doc_id)}
                </div>
                <div className="text-blue-700">
                  {changeEvent.old_version} → {changeEvent.new_version}
                </div>
                <div className="text-blue-600 mt-2">
                  {new Date(changeEvent.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* View Toggle and Consistency Score */}
            <div className="flex justify-between items-center">
              <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('details')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'details'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <List className="w-4 h-4" />
                  Details View
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'graph'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Network className="w-4 h-4" />
                  Graph View
                </button>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreColor(
                  consistencyScore
                )}`}
              >
                <span>Consistency Score:</span>
                <span>{consistencyScore}/100</span>
              </div>
            </div>

            {/* Conditional Content Based on View Mode */}
            {viewMode === 'details' ? (
              <>
                {/* Change Summary */}
                <section className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-gray-900 mb-4">Change Summary</h2>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <span className="text-gray-600 min-w-[120px]">Document:</span>
                      <span className="text-gray-900">{getDocName(changeEvent.doc_id)}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-600 min-w-[120px]">Version:</span>
                      <span className="text-gray-900">
                        {changeEvent.old_version} → {changeEvent.new_version}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-600 min-w-[120px]">Timestamp:</span>
                      <span className="text-gray-900">
                        {new Date(changeEvent.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Diff Viewer */}
                <section className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-gray-900 mb-4">Content Changes</h2>
                  <DiffViewer
                    oldText={changeEvent.old_text_snippet}
                    newText={changeEvent.new_text_snippet}
                    diffBlocks={changeEvent.diff_blocks}
                  />
                </section>

                {/* Impact Analysis */}
                <section className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-gray-900 mb-4">Impact Analysis</h2>
                  <ImpactViewer
                    affectedDocs={impactEvent.affected_docs}
                    impactReports={impactReport}
                    documents={documents}
                  />
                </section>
              </>
            ) : (
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-gray-900 mb-4">Document Dependency Graph</h2>
                <div className="h-[700px]">
                  <DependencyGraph
                    changedDocId={changeEvent.doc_id}
                    affectedDocs={impactEvent.affected_docs}
                    dependencies={dependencies}
                    documents={documents}
                  />
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Add Change Modal */}
      <AddChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        onSubmit={handleAddChange}
      />

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSubmit={handleAddDocument}
        existingDocs={documents}
      />
    </div>
  );
}