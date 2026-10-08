export type ProviderKind = 'ollama' | 'openai-compatible' | 'llama.cpp' | 'lm-studio';

export type ModelSpec = {
  id: string;
  provider: ProviderKind;
  baseUrl: string;
  local: boolean;
  format?: 'gguf' | 'api' | 'unknown';
  capabilities: string[];
};

export type SkillManifest = {
  name: string;
  description: string;
  permissions: string[];
  risk: 'low' | 'medium' | 'high';
  path: string;
};

export type ConnectorManifest = {
  id: string;
  name: string;
  transport: 'mcp' | 'http' | 'stdio';
  capabilities: string[];
  requiresSecrets: boolean;
  mutatesData: boolean;
  approval: 'never' | 'on-request' | 'always';
};

export type Policy = {
  requireApproval: boolean;
  allowShell: boolean;
  allowNetwork: boolean;
  workspaceRoot: string;
  maxToolCalls: number;
};

export type ChatRequest = {
  message: string;
  mode: 'ask' | 'plan' | 'act' | 'autonomous' | 'review';
  model?: string;
};

export type ToolCall = {
  name: string;
  input: Record<string, unknown>;
  risk: 'low' | 'medium' | 'high';
};

export type PolicyDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

export function decide(policy: Policy, call: ToolCall): PolicyDecision {
  if (call.name === 'shell' && !policy.allowShell) {
    return { allowed: false, requiresApproval: false, reason: 'Shell execution is disabled by policy.' };
  }
  if (call.name.startsWith('network.') && !policy.allowNetwork) {
    return { allowed: false, requiresApproval: false, reason: 'Network access is disabled by policy.' };
  }
  const requiresApproval = policy.requireApproval || call.risk === 'high' || call.name === 'shell';
  return { allowed: true, requiresApproval, reason: requiresApproval ? 'User approval is required.' : 'Allowed by policy.' };
}

export function ggufModel(id: string, baseUrl = 'http://127.0.0.1:8080'): ModelSpec {
  return { id, provider: 'llama.cpp', baseUrl, local: true, format: 'gguf', capabilities: ['chat', 'completion'] };
}
