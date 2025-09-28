'use client';

import { useState, useEffect } from 'react';
import { VariableDefinition } from '@/types/prompts';

interface DynamicFormProps {
  variableDefs: VariableDefinition[];
  initialValues?: Record<string, any>;
  onInputChange: (inputs: Record<string, any>) => void;
}

export function DynamicForm({ variableDefs, initialValues = {}, onInputChange }: DynamicFormProps) {
  const [inputs, setInputs] = useState<Record<string, any>>(initialValues);

  useEffect(() => {
    // Initialize with default values
    const defaultInputs = variableDefs.reduce((acc, def) => {
      if (initialValues[def.name] !== undefined) {
        acc[def.name] = initialValues[def.name];
      } else if (def.defaultValue !== undefined) {
        acc[def.name] = def.defaultValue;
      } else {
        acc[def.name] = def.type === 'boolean' ? false : 
                       def.type === 'number' ? 0 : 
                       def.type === 'array' ? [] : 
                       def.type === 'object' ? {} : '';
      }
      return acc;
    }, {} as Record<string, any>);
    
    setInputs(defaultInputs);
    onInputChange(defaultInputs);
  }, [variableDefs, initialValues]);

  const handleInputChange = (name: string, value: any) => {
    const newInputs = { ...inputs, [name]: value };
    setInputs(newInputs);
    onInputChange(newInputs);
  };

  const renderField = (def: VariableDefinition) => {
    const value = inputs[def.name] || '';
    const fieldId = `field-${def.name}`;
    
    const baseClasses = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent";

    switch (def.type) {
      case 'string':
        if (def.options && def.options.length > 0) {
          return (
            <select
              id={fieldId}
              value={value}
              onChange={(e) => handleInputChange(def.name, e.target.value)}
              className={baseClasses}
              required={def.required}
            >
              <option value="">Select {def.name}</option>
              {def.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(def.name, e.target.value)}
            placeholder={def.description || `Enter ${def.name}...`}
            className={`${baseClasses} min-h-[100px] resize-vertical`}
            required={def.required}
          />
        );
        
      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(def.name, parseFloat(e.target.value) || 0)}
            placeholder={def.description || `Enter ${def.name}...`}
            className={baseClasses}
            required={def.required}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              id={fieldId}
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(def.name, e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor={fieldId} className="ml-2 text-sm text-slate-300">
              {def.description || def.name}
            </label>
          </div>
        );
        
      case 'array':
        return (
          <div className="space-y-2">
            <textarea
              id={fieldId}
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={(e) => {
                const arrayValue = e.target.value.split('\n').filter(line => line.trim());
                handleInputChange(def.name, arrayValue);
              }}
              placeholder={def.description || 'Enter one item per line...'}
              className={`${baseClasses} min-h-[100px] resize-vertical`}
              required={def.required}
            />
            <p className="text-xs text-slate-400">Enter one item per line</p>
          </div>
        );
        
      case 'object':
        return (
          <textarea
            id={fieldId}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const objectValue = JSON.parse(e.target.value);
                handleInputChange(def.name, objectValue);
              } catch {
                handleInputChange(def.name, e.target.value);
              }
            }}
            placeholder={def.description || 'Enter valid JSON...'}
            className={`${baseClasses} min-h-[100px] resize-vertical font-mono text-sm`}
            required={def.required}
          />
        );
        
      default:
        return (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(def.name, e.target.value)}
            placeholder={def.description || `Enter ${def.name}...`}
            className={baseClasses}
            required={def.required}
          />
        );
    }
  };

  if (variableDefs.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <p className="text-slate-400">No variables defined for this template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {variableDefs.map((def) => (
        <div key={def.name} className="space-y-2">
          <label 
            htmlFor={`field-${def.name}`}
            className={`block text-sm font-medium text-slate-300 ${
              def.required ? "after:content-['*'] after:ml-1 after:text-red-400" : ''
            }`}
          >
            {def.name}
            {def.required && <span className="sr-only">(required)</span>}
          </label>
          
          {def.description && def.type !== 'boolean' && (
            <p className="text-sm text-slate-400">{def.description}</p>
          )}
          
          {renderField(def)}
          
          {def.defaultValue !== undefined && (
            <p className="text-xs text-slate-500">
              Default: {typeof def.defaultValue === 'object' 
                ? JSON.stringify(def.defaultValue) 
                : def.defaultValue.toString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}