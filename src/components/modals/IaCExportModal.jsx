import React, { useState } from 'react';
import { X, Code2, Copy, Check } from 'lucide-react';
import { generateDockerCompose, generateTerraform } from '../../engine/iacExporter';

export function IaCExportModal({ nodes, onClose }) {
  const [format, setFormat] = useState('docker');
  const [copied, setCopied] = useState(false);

  const codeOutput =
    format === 'docker' ? generateDockerCompose(nodes) : generateTerraform(nodes);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Export Infrastructure-as-Code (IaC)
              </h2>
              <div className="text-[11px] text-zinc-500">
                Generate deployment manifests from your current canvas topology
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-[#0c0c0e] border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFormat('docker')}
              className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                format === 'docker'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              docker-compose.yml
            </button>
            <button
              onClick={() => setFormat('terraform')}
              className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                format === 'terraform'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              main.tf (AWS Terraform)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="h-7 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Manifest'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#09090b] font-mono text-xs text-zinc-300 leading-relaxed select-text">
          <pre>{codeOutput}</pre>
        </div>
      </div>
    </div>
  );
}