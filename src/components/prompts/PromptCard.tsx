'use client';

import Link from 'next/link';
import { PromptTemplate } from '@/types/prompts';

interface PromptCardProps {
  template: PromptTemplate;
  onTest?: (templateId: string) => void;
  onEdit?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  onDuplicate?: (templateId: string) => void;
}

export function PromptCard({ template, onTest, onEdit, onDelete, onDuplicate }: PromptCardProps) {
  const handleTest = (e: React.MouseEvent) => {
    e.preventDefault();
    onTest?.(template.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(template.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete?.(template.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    onDuplicate?.(template.id);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/prompts/templates/${template.id}`}
            className="text-lg font-semibold text-white hover:text-purple-400 transition-colors"
          >
            {template.name}
          </Link>
          <div className="flex items-center space-x-2 mt-1">
            <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
              {template.app}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
              {template.stage}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
              {template.feature}
            </span>
          </div>
        </div>
        
        {/* Actions Dropdown */}
        <div className="relative group">
          <button className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          
          <div className="absolute right-0 top-6 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="py-1">
              <button onClick={handleTest} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white">
                Test Template
              </button>
              <button onClick={handleEdit} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white">
                Edit
              </button>
              <button onClick={handleDuplicate} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white">
                Duplicate
              </button>
              <hr className="border-slate-600 my-1" />
              <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600 hover:text-red-300">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-slate-700 text-slate-400 rounded">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Model & Variables */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Model:</span>
          <span className="text-slate-300 font-mono">{template.model}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Variables:</span>
          <span className="text-slate-300">{template.variableDefs.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Version:</span>
          <span className="text-slate-300">v{template.version}</span>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-900 rounded p-3 mb-4">
        <p className="text-xs text-slate-400 mb-1">Template Preview:</p>
        <p className="text-sm text-slate-300 line-clamp-3">
          {template.template.substring(0, 150)}...
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
        <Link 
          href={`/prompts/test?templateId=${template.id}`}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
        >
          Test
        </Link>
      </div>
    </div>
  );
}