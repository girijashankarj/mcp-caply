import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Capability = 'tools' | 'resources' | 'prompts';

type Server = {
  name: string;
  url: string;
  connected: boolean;
  tools: number;
  resources: number;
  prompts: number;
};

const initialServers: Server[] = [
  { name: 'Demo MCP', url: 'https://example.com/mcp', connected: false, tools: 0, resources: 0, prompts: 0 },
];

function App() {
  const [servers, setServers] = useState(initialServers);
  const [selected, setSelected] = useState(0);
  const [capability, setCapability] = useState<Capability>('tools');
  const [showAdd, setShowAdd] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('Connect an MCP server to discover its capabilities.');

  const active = servers[selected];
  const counts = useMemo(() => active ?? initialServers[0], [active]);

  function addServer() {
    if (!serverName.trim() || !serverUrl.trim()) {
      setMessage('Server name and URL are required.');
      return;
    }

    // V1 keeps credentials in memory only. The actual MCP transport adapter
    // will be added after we validate the server's transport/auth flow.
    setServers((items) => [
      ...items,
      { name: serverName.trim(), url: serverUrl.trim(), connected: false, tools: 0, resources: 0, prompts: 0 },
    ]);
    setSelected(servers.length);
    setServerName('');
    setServerUrl('');
    setApiKey('');
    setShowAdd(false);
    setMessage('Server saved locally. Transport connection is the next adapter milestone.');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>MCP Caply</strong>
            <span>Model-free MCP client</span>
          </div>
        </div>

        <button className="add-button" onClick={() => setShowAdd(true)}>+ Add MCP server</button>

        <div className="section-label">SERVERS</div>
        <div className="server-list">
          {servers.map((server, index) => (
            <button
              className={`server-item ${selected === index ? 'active' : ''}`}
              key={`${server.name}-${index}`}
              onClick={() => setSelected(index)}
            >
              <span className={`status-dot ${server.connected ? 'connected' : ''}`} />
              <span className="server-copy">
                <strong>{server.name}</strong>
                <small>{server.connected ? 'Connected' : 'Not connected'}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-note">
          No model required.<br />You control the request and judgement.
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">MCP SERVER</div>
            <h1>{active?.name ?? 'MCP server'}</h1>
            <p>{active?.url ?? 'Add a server to begin.'}</p>
          </div>
          <button className="secondary" onClick={() => setShowAdd(true)}>Manage connection</button>
        </header>

        <section className="hero-card">
          <div>
            <span className="pill">DIRECT MCP ACCESS</span>
            <h2>Connect. Discover. Execute.</h2>
            <p>Inspect MCP capabilities directly without an AI model interpreting the request for you.</p>
          </div>
          <button className="primary" onClick={() => setShowAdd(true)}>Connect server</button>
        </section>

        <section className="capability-grid">
          {(['tools', 'resources', 'prompts'] as Capability[]).map((item) => (
            <button
              key={item}
              className={`capability-card ${capability === item ? 'selected' : ''}`}
              onClick={() => setCapability(item)}
            >
              <span>{item.toUpperCase()}</span>
              <strong>{counts[item]}</strong>
              <small>Discoverable capabilities</small>
            </button>
          ))}
        </section>

        <section className="workspace">
          <div className="workspace-head">
            <div>
              <div className="eyebrow">EXPLORER</div>
              <h2>{capability[0].toUpperCase() + capability.slice(1)}</h2>
            </div>
            <span className="protocol-badge">MCP</span>
          </div>

          <div className="empty-state">
            <div className="empty-icon">{capability === 'tools' ? '↗' : capability === 'resources' ? '◫' : '✦'}</div>
            <h3>{active?.connected ? 'Capabilities discovered' : 'No capabilities discovered yet'}</h3>
            <p>{message}</p>
            <button className="primary" onClick={() => setShowAdd(true)}>Configure connection</button>
          </div>
        </section>
      </main>

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">NEW CONNECTION</div>
                <h2>Add MCP server</h2>
              </div>
              <button className="icon-button" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <label>Server name<input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="GitHub MCP" /></label>
            <label>Server URL<input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://host.example/mcp" /></label>
            <label>API key <span className="optional">optional</span><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Stored only for this session in V1" /></label>
            <div className="security-note"><strong>Security boundary</strong><span>Authentication, scopes and key validity belong to the MCP server. Caply only invokes the protocol.</span></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary" onClick={addServer}>Add server</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
