import React, { useEffect, useRef } from 'react';

interface DependencyGraphProps {
  changedDocId?: string;
  affectedDocs?: string[];
  dependencies: Record<string, string[]>;
  documents: Array<{ id: string; name: string; category: string }>;
}

export function DependencyGraph({ changedDocId, affectedDocs = [], dependencies, documents }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create node positions
    const nodes: Record<string, { x: number; y: number; name: string }> = {};
    const allDocIds = new Set<string>();
    
    // Collect all unique document IDs
    Object.entries(dependencies).forEach(([source, targets]) => {
      allDocIds.add(source);
      targets.forEach(target => allDocIds.add(target));
    });

    // Calculate positions in a circular layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const docsArray = Array.from(allDocIds);
    
    docsArray.forEach((docId, index) => {
      const angle = (index / docsArray.length) * 2 * Math.PI - Math.PI / 2;
      const doc = documents.find(d => d.id === docId);
      nodes[docId] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        name: doc?.name || docId
      };
    });

    // Draw edges
    ctx.lineWidth = 2;
    Object.entries(dependencies).forEach(([source, targets]) => {
      targets.forEach(target => {
        const sourceNode = nodes[source];
        const targetNode = nodes[target];
        if (!sourceNode || !targetNode) return;

        // Determine edge color
        const isActiveEdge = source === changedDocId && affectedDocs.includes(target);
        ctx.strokeStyle = isActiveEdge ? '#ef4444' : '#d1d5db';
        ctx.lineWidth = isActiveEdge ? 3 : 2;

        // Draw arrow
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust start and end points to account for node radius
        const nodeRadius = 30;
        const startX = sourceNode.x + nodeRadius * Math.cos(angle);
        const startY = sourceNode.y + nodeRadius * Math.sin(angle);
        const endX = targetNode.x - nodeRadius * Math.cos(angle);
        const endY = targetNode.y - nodeRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      });
    });

    // Draw nodes
    Object.entries(nodes).forEach(([docId, node]) => {
      const isChanged = docId === changedDocId;
      const isAffected = affectedDocs.includes(docId);
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
      
      if (isChanged) {
        ctx.fillStyle = '#3b82f6';
      } else if (isAffected) {
        ctx.fillStyle = '#ef4444';
      } else {
        ctx.fillStyle = '#6b7280';
      }
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const maxWidth = 120;
      const words = node.name.split(' ');
      let line = '';
      let y = node.y + 40;
      
      words.forEach((word, i) => {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, node.x, y);
          line = word;
          y += 16;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, node.x, y);
    });

    // Draw legend
    const legendX = 20;
    const legendY = height - 80;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(legendX - 10, legendY - 10, 200, 80);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 10, 200, 80);

    // Legend items
    const legendItems = [
      { color: '#3b82f6', label: 'Changed Document' },
      { color: '#ef4444', label: 'Affected Document' },
      { color: '#6b7280', label: 'Other Document' }
    ];

    legendItems.forEach((item, i) => {
      ctx.beginPath();
      ctx.arc(legendX, legendY + i * 25, 8, 0, 2 * Math.PI);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1f2937';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, legendX + 20, legendY + i * 25);
    });

  }, [changedDocId, affectedDocs, dependencies, documents]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="max-w-full"
      />
    </div>
  );
}