const fs = require('fs');

let app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

const target1 = `      broadcastCloudSync(payload) {
        if (typeof fetch === 'undefined') return;
        try {
          const room = App.getSyncRoom();
          const packet = {
            clientId: CLIENT_ID,
            ...payload
          };
          fetch('https://ntfy.sh/' + encodeURIComponent(room), {
            method: 'POST',
            headers: {
              'Title': 'BY.NVDILA Sync',
              'Priority': 'default'
            },
            body: JSON.stringify(packet)
          }).catch(function() {});
        } catch(e) {}
      },`;

const replacement1 = `      broadcastCloudSync(payload) {
        if (typeof fetch === 'undefined') return;
        try {
          const packet = {
            clientId: CLIENT_ID,
            ...payload
          };

          // 1. Localhost Native Sync: Broadcast directly to local server if running on HTTP
          if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
            fetch('/api/sync/broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(packet)
            }).catch(function() {});
          }

          // 2. Cloud Relay: Broadcast to ntfy for remote or standalone offline use
          const room = App.getSyncRoom();
          fetch('https://ntfy.sh/' + encodeURIComponent(room), {
            method: 'POST',
            headers: {
              'Title': 'BY.NVDILA Sync',
              'Priority': 'default'
            },
            body: JSON.stringify(packet)
          }).catch(function() {});
        } catch(e) {}
      },`;

const target2 = `        // 3. Connect real-time Server-Sent Events (SSE) via ntfy pub/sub relay
        try {
          if (typeof EventSource !== 'undefined' && typeof window !== 'undefined') {
            if (window._byNvdilaSSE) {
              try { window._byNvdilaSSE.close(); } catch(e) {}
            }
            const room = App.getSyncRoom();
            const sse = new EventSource('https://ntfy.sh/' + encodeURIComponent(room) + '/sse');
            window._byNvdilaSSE = sse;
            sse.onmessage = function(event) {
              try {
                if (!event || !event.data) return;
                const parsed = JSON.parse(event.data);
                if (parsed.event === 'message' && parsed.message) {
                  App.handleIncomingSync(parsed.message);
                }
              } catch(err) {}
            };
            sse.onerror = function() {};
          }
        } catch(e) {}

        // 4. Initial load: fetch recent state via json?poll=1&since=all
        try {
          if (typeof fetch !== 'undefined') {
            const room = App.getSyncRoom();
            fetch('https://ntfy.sh/' + encodeURIComponent(room) + '/json?poll=1&since=all', { cache: 'no-store' })
              .then(function(res) { return res.text(); })
              .then(function(text) {
                if (!text) return;
                const lines = text.trim().split('\\n');
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  try {
                    const item = JSON.parse(line);
                    if (item.event === 'message' && item.message) {
                      App.handleIncomingSync(item.message);
                    }
                  } catch(e) {}
                }
              })
              .catch(function() {});
          }
        } catch(e) {}`;

const replacement2 = `        // 3. Connect real-time Server-Sent Events (SSE) via localhost server or cloud relay
        try {
          if (typeof EventSource !== 'undefined' && typeof window !== 'undefined') {
            if (window._byNvdilaSSE) {
              try { window._byNvdilaSSE.close(); } catch(e) {}
            }
            const room = App.getSyncRoom();
            const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http');
            const sseUrl = isHttp ? '/api/sync/events' : ('https://ntfy.sh/' + encodeURIComponent(room) + '/sse');
            const sse = new EventSource(sseUrl);
            window._byNvdilaSSE = sse;
            sse.onmessage = function(event) {
              try {
                if (!event || !event.data) return;
                const parsed = JSON.parse(event.data);
                if (parsed.event === 'message' && parsed.message) {
                  App.handleIncomingSync(parsed.message);
                } else {
                  App.handleIncomingSync(parsed);
                }
              } catch(err) {}
            };
            sse.onerror = function() {};
          }
        } catch(e) {}

        // 4. Initial load: fetch recent state from Localhost API or cloud relay
        try {
          if (typeof fetch !== 'undefined') {
            if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
              fetch('/api/sync/data', { cache: 'no-store' })
                .then(function(res) { return res.json(); })
                .then(function(serverState) {
                  if (serverState && typeof serverState === 'object') {
                    if (serverState.data) App.handleIncomingSync({ data: serverState.data });
                    if (serverState.chats) App.handleIncomingSync({ chats: serverState.chats });
                    if (serverState.storeSettings) App.handleIncomingSync({ storeSettings: serverState.storeSettings });
                  }
                })
                .catch(function() {});
            }

            const room = App.getSyncRoom();
            fetch('https://ntfy.sh/' + encodeURIComponent(room) + '/json?poll=1&since=all', { cache: 'no-store' })
              .then(function(res) { return res.text(); })
              .then(function(text) {
                if (!text) return;
                const lines = text.trim().split('\\n');
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  try {
                    const item = JSON.parse(line);
                    if (item.event === 'message' && item.message) {
                      App.handleIncomingSync(item.message);
                    }
                  } catch(e) {}
                }
              })
              .catch(function() {});
          }
        } catch(e) {}`;

if (!app.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
if (!app.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}

app = app.replace(target1, replacement1);
app = app.replace(target2, replacement2);

fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', app, 'utf8');
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', app, 'utf8');
console.log('Successfully updated app.html and index.html! Bytes:', Buffer.byteLength(app, 'utf8'));
