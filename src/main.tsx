import { StrictMode, useMemo, useState } from 'react';
import { McpHttpClient, type DiagnosticCheck, type McpCatalog, type McpTool } from './mcp/client';
import './styles.css';

type Capability = 'tools' | 'resources' | 'prompts';
type Server = { name: string; url: string; apiKey?: string; connected: boolean; tools: number; resources: number; prompts: number; catalog?: McpCatalog; error?: string };

const initialServers: Server[] = [];

function schemaFields(tool?: McpTool) {
  const properties = (tool?.inputSchema?.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = new Set(Array.isArray(tool?.inputSchema?.required) ? tool.inputSchema.required : []);
  return Object.entries(properties).map(([name, schema]) => ({ name, type: String(schema.type ?? 'string'), required: required.has(name), description: String(schema.description ?? '') }));
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }

function App() {
  const [servers, setServers] = useState(initialServers);
  const [selected, setSelected] = useState(0);
  const [capability, setCapability] = useState<Capability>('tools');
  const [showAdd, setShowAdd] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('Add an MCP server to discover its capabilities.');
  const [selectedTool, setSelectedTool] = useState<McpTool>();
  const [argumentsJson, setArgumentsJson] = useState('{}');
  const [result, setResult] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>();
  const [diagnosing, setDiagnosing] = useState(false);

  const active = servers[selected];
  const counts = useMemo(() => active ? { tools: active.tools, resources: active.resources, prompts: active.prompts } : { tools: 0, resources: 0, prompts: 0 }, [active]);
  const fields = schemaFields(selectedTool);
  const capabilityItems = active?.catalog?.[capability] ?? [];

  function openConnectionError(error: unknown) {
    const text = errorMessage(error);
    setConnectionError(text);
    setMessage(`Connection failed: ${text}`);
  }

  async function connectServer() {
    if (!serverName.trim() || !serverUrl.trim()) { setMessage('Server name and URL are required.'); return; }
    setBusy(true); setMessage('Connecting… checking MCP transport, authentication and CORS.'); setResult(undefined); setConnectionError(undefined); setDiagnostics(undefined);
    try {
      const client = new McpHttpClient(serverUrl.trim(), apiKey || undefined);
      const catalog = await client.connect();
      const server: Server = { name: serverName.trim(), url: serverUrl.trim(), apiKey: apiKey || undefined, connected: true, tools: catalog.tools.length, resources: catalog.resources.length, prompts: catalog.prompts.length, catalog };
      const nextIndex = servers.length;
      setServers((items) => [...items, server]); setSelected(nextIndex); setSelectedTool(catalog.tools[0]);
      setServerName(''); setServerUrl(''); setApiKey(''); setShowAdd(false);
      setMessage(`Connected successfully. ${catalog.tools.length} tools, ${catalog.resources.length} resources and ${catalog.prompts.length} prompts discovered.`);
    } catch (error) { openConnectionError(error); }
    finally { setBusy(false); }
  }

  async function runDiagnostics() {
    if (!serverUrl.trim()) return;
    setDiagnosing(true); setDiagnostics(undefined);
    try { setDiagnostics(await new McpHttpClient(serverUrl.trim(), apiKey || undefined).diagnose()); }
    catch (error) { setDiagnostics([{ name: 'Diagnostics', status: 'fail', detail: errorMessage(error) }]); }
    finally { setDiagnosing(false); }
  }

  async function executeTool() {
    if (!active?.catalog || !selectedTool) return;
    let args: Record<string, unknown>;
    try { args = JSON.parse(argumentsJson); } catch { setMessage('Arguments must be valid JSON.'); return; }
    setBusy(true); setMessage(`Executing ${selectedTool.name}…`);
    try { const client = new McpHttpClient(active.url, active.apiKey); await client.connect(); const response = await client.callTool(selectedTool.name, args); setResult(response.raw); setMessage('MCP tool executed. Raw JSON-RPC response is shown below.'); }
    catch (error) { setMessage(`Tool execution failed: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">C</div><div><strong>MCP Caply</strong><span>Model-free MCP client</span></div></div>
      <button className="add-button" onClick={() => { setShowAdd(true); setConnectionError(undefined); }}>+ Add MCP server</button>
      <div className="section-label">SERVERS</div>
      <div className="server-list">{servers.map((server, index) => <button className={`server-item ${selected === index ? 'active' : ''}`} key={`${server.name}-${index}`} onClick={() => setSelected(index)}><span className="status-dot connected" /><span className="server-copy"><strong>{server.name}</strong><small>Connected</small></span></button>)}{!servers.length && <div className="server-empty">No servers yet</div>}</div>
      <div className="sidebar-note">No model required.<br />You control the request and judgement.</div>
    </aside>

    <main className="content">
      <header className="topbar"><div><div className="eyebrow">MCP SERVER</div><h1>{active?.name ?? 'MCP Caply'}</h1><p>{active?.url ?? 'Connect a Streamable HTTP MCP server to begin.'}</p></div><button className="secondary" onClick={() => { setShowAdd(true); setConnectionError(undefined); }}>+ Connection</button></header>
      <section className="hero-card"><div><span className="pill">DIRECT MCP ACCESS</span><h2>Connect. Discover. Execute.</h2><p>Inspect MCP capabilities directly. No AI model interprets the request between you and the server.</p></div><button className="primary" onClick={() => { setShowAdd(true); setConnectionError(undefined); }}>Connect server</button></section>
      <section className="capability-grid">{(['tools', 'resources', 'prompts'] as Capability[]).map((item) => <button key={item} className={`capability-card ${capability === item ? 'selected' : ''}`} onClick={() => setCapability(item)}><span>{item.toUpperCase()}</span><strong>{counts[item]}</strong><small>Discovered from server</small></button>)}</section>
      <section className="workspace">
        <div className="workspace-head"><div><div className="eyebrow">EXPLORER</div><h2>{capability[0].toUpperCase() + capability.slice(1)}</h2></div><span className="protocol-badge">MCP</span></div>
        {!active ? <div className="empty-state"><div className="empty-icon">⌁</div><h3>No MCP server connected</h3><p>{message}</p><button className="primary" onClick={() => setShowAdd(true)}>Add server</button></div> : capability === 'tools' ? <div className="tool-layout">
          <div className="tool-list">{(capabilityItems as McpTool[]).map((tool) => <button className={`tool-item ${selectedTool?.name === tool.name ? 'active' : ''}`} key={tool.name} onClick={() => { setSelectedTool(tool); setArgumentsJson('{}'); setResult(undefined); }}><strong>{tool.name}</strong><span>{tool.description || 'No description provided.'}</span></button>)}</div>
          <div className="tool-editor"><div className="editor-head"><div><div className="eyebrow">TOOL</div><h3>{selectedTool?.name ?? 'Select a tool'}</h3></div><span className="protocol-badge">tools/call</span></div>{selectedTool ? <><p className="description">{selectedTool.description || 'No description provided by the MCP server.'}</p><div className="schema-box"><div className="eyebrow">REQUEST SCHEMA</div>{fields.length ? fields.map((field) => <div className="schema-row" key={field.name}><code>{field.name}</code><span>{field.type}{field.required ? ' · required' : ''}</span><small>{field.description}</small></div>) : <pre>{JSON.stringify(selectedTool.inputSchema ?? {}, null, 2)}</pre>}</div><label className="json-label">Arguments JSON<textarea value={argumentsJson} onChange={(e) => setArgumentsJson(e.target.value)} spellCheck={false} /></label><button className="primary" disabled={busy} onClick={executeTool}>{busy ? 'Executing…' : 'Execute tool'}</button>{result !== undefined && <div className="result-box"><div className="result-head"><span>RAW JSON-RPC RESPONSE</span><button className="secondary" onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))}>Copy</button></div><pre>{JSON.stringify(result, null, 2)}</pre></div>}</> : <div className="empty-state compact"><h3>No tool selected</h3><p>Choose a discovered tool.</p></div>}</div>
        </div> : <div className="list-view">{(capabilityItems as Array<{ name?: string; uri?: string; description?: string; title?: string }>).map((item, index) => <div className="list-row" key={item.name ?? item.uri ?? index}><strong>{item.name ?? item.uri}</strong><span>{item.title ?? item.description ?? 'No description provided.'}</span></div>)}{!capabilityItems.length && <div className="empty-state compact"><h3>No {capability} exposed</h3><p>The server did not advertise this primitive.</p></div>}</div>}
      </section>
    </main>

    {showAdd && <div className="modal-backdrop" onClick={() => !busy && setShowAdd(false)}><div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><div className="eyebrow">NEW CONNECTION</div><h2>{connectionError ? 'Connection failed' : 'Add MCP server'}</h2></div><button className="icon-button" disabled={busy} onClick={() => setShowAdd(false)}>×</button></div>
      {connectionError ? <div className="connection-error"><div className="error-title">Unable to connect</div><div className="error-message">{connectionError}</div><div className="diagnostics">{diagnostics?.map((check) => <div className={`diagnostic ${check.status}`} key={check.name}><span className="diagnostic-icon">{check.status === 'pass' ? '✓' : check.status === 'fail' ? '!' : '•'}</span><div><strong>{check.name}</strong><small>{check.detail}</small></div></div>)}</div><div className="modal-actions"><button className="secondary" disabled={diagnosing} onClick={runDiagnostics}>{diagnosing ? 'Running diagnostics…' : 'Run browser diagnostics'}</button><button className="primary" onClick={() => setConnectionError(undefined)}>Edit connection</button></div></div> : <><label>Server name<input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="GitHub MCP" disabled={busy} /></label><label>Streamable HTTP URL<input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://host.example/mcp" disabled={busy} /></label><label>Bearer API key <span className="optional">optional</span><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Held in memory only" disabled={busy} /></label><div className="security-note"><strong>Browser security boundary</strong><span>The MCP server must permit browser CORS and expose a browser-compatible transport. Caply does not proxy your credentials through its own backend.</span></div><div className="modal-actions"><button className="secondary" disabled={busy} onClick={() => setShowAdd(false)}>Cancel</button><button className="primary" disabled={busy} onClick={connectServer}>{busy ? 'Connecting…' : 'Connect & discover'}</button></div></>}
    </div></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
