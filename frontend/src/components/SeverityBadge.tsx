import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const getStyles = () => {
    switch (severity) {
      case 'HIGH':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'MEDIUM':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-300',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'LOW':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: <Info className="w-4 h-4" />
        };
    }
  };

  const styles = getStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {styles.icon}
      <span>{severity}</span>
    </span>
  );
}
