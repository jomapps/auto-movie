export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
  options?: string[]; // For select/enum types
}

export interface PromptTemplate {
  id: string;
  name: string;
  app: 'auto-movie' | 'story-service' | 'character-service' | 'brain-service';
  stage: 'concept' | 'development' | 'production' | 'post-production';
  feature: string;
  tags: string[];
  model: string;
  notes?: string;
  template: string;
  variableDefs: VariableDefinition[];
  outputSchema?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PromptExecution {
  id: string;
  templateId?: string;
  templateName?: string;
  app: string;
  stage: string;
  feature: string;
  projectId?: string;
  tags: string[];
  model: string;
  inputs: Record<string, any>;
  resolvedPrompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputRaw?: string;
  outputParsed?: Record<string, any>;
  errorMessage?: string;
  executionTime?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTestForm {
  templateId?: string;
  inputs: Record<string, any>;
  model: string;
  saveAsTemplate?: boolean;
  newTemplateName?: string;
}