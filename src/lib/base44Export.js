// Dieses Skript läuft NICHT in unserer App, sondern als Lesezeichen
// auf der Seite der base44-App, während man dort eingeloggt ist.
// Es liest die eigenen Daten über die base44-API und lädt sie als JSON herunter.
// Es muss vollständig in sich geschlossen sein (keine Imports, keine Variablen von aussen).
export function base44ExportScript() {
  (async () => {
    const ENTITIES = ['SchoolClass', 'RoomLayout', 'SeatingPlan', 'TallyEntry', 'QRCodeEntry', 'AppSettings'];
    try {
      let appId = localStorage.getItem('base44_app_id');
      if (!appId) appId = prompt('App-ID nicht gefunden. Bitte die base44 App-ID eingeben (steht in der Adresszeile des base44-Editors):');
      if (!appId) return;
      const token = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
      const headers = { 'X-App-Id': appId };
      if (token) headers.Authorization = 'Bearer ' + token;
      const get = async (path) => {
        const res = await fetch('/api/apps/' + appId + '/entities/' + path, { headers, credentials: 'include' });
        if (!res.ok) throw new Error(path + ': HTTP ' + res.status);
        return res.json();
      };
      const me = await get('User/me');
      if (!me || !me.email) throw new Error('Nicht eingeloggt');
      const out = {};
      for (const name of ENTITIES) {
        const q = encodeURIComponent(JSON.stringify({ created_by: me.email }));
        out[name] = await get(name + '?q=' + q + '&limit=10000');
      }
      const payload = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        userEmail: me.email,
        source: 'base44',
        appId,
        entities: out,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'base44-export-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      const n = ENTITIES.map((k) => k + ': ' + out[k].length).join('\n');
      alert('Export fertig für ' + me.email + '\n\n' + n + '\n\nDie Datei liegt in deinem Download-Ordner.');
    } catch (e) {
      alert('Export fehlgeschlagen: ' + e.message + '\n\nBist du in der base44-App eingeloggt und hast das Lesezeichen auf der App-Seite (nicht im Editor) angeklickt?');
    }
  })();
}

export const exportScriptSource = `(${base44ExportScript.toString()})();`;
export const bookmarkletHref = 'javascript:' + encodeURIComponent(exportScriptSource);
