import type { ReactNode } from 'react';
import layout from '../../../styles/layouts/panelLayout.module.css';

interface ToolsGridProps {
  columns: number;
  children: ReactNode;
}

export function ToolsGrid({ columns, children }: ToolsGridProps) {
  return (
    <div className={layout.toolsGrid} data-cols={String(columns)}>
      {children}
    </div>
  );
}

export function MapTypeGrid({ columns = 2, children }: { columns?: number; children: ReactNode }) {
  return (
    <div className={layout.mapTypeGrid} data-cols={String(columns)}>
      {children}
    </div>
  );
}
