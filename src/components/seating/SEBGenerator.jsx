import React, { useState } from 'react';
import { uploadSebFile } from '@/api/storage';
import { toast } from 'sonner';
import { DownloadSimple as Download, CircleNotch as Loader2, Copy, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRCode from 'react-qr-code';
import DraggableWindow from './DraggableWindow';

const SEB_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>URLFilterEnable</key>
    <false />
    <key>URLFilterEnableContentFilter</key>
    <false />
    <key>URLFilterIgnoreList</key>
    <array></array>
    <key>URLFilterMessage</key>
    <integer>0</integer>
    <key>URLFilterRules</key>
    <array></array>
    <key>aacDnsPrePinning</key>
    <false />
    <key>additionalDictionaries</key>
    <array></array>
    <key>additionalResources</key>
    <array></array>
    <key>allowApplicationLog</key>
    <false />
    <key>allowAudioCapture</key>
    <false />
    <key>allowBrowsingBackForward</key>
    <false />
    <key>allowCustomDownUploadLocation</key>
    <false />
    <key>allowDeveloperConsole</key>
    <false />
    <key>allowDictation</key>
    <false />
    <key>allowDictionaryLookup</key>
    <false />
    <key>allowDisplayMirroring</key>
    <false />
    <key>allowDownUploads</key>
    <true />
    <key>allowDownloads</key>
    <true />
    <key>allowFind</key>
    <false />
    <key>allowFlashFullscreen</key>
    <false />
    <key>allowQuit</key>
    <true />
    <key>allowScreenCapture</key>
    <false />
    <key>allowScreenSharing</key>
    <false />
    <key>allowShareSheet</key>
    <false />
    <key>allowSiri</key>
    <false />
    <key>allowSpellCheck</key>
    <false />
    <key>allowSwitchToApplications</key>
    <false />
    <key>allowUploads</key>
    <false />
    <key>allowUserSwitching</key>
    <true />
    <key>allowVideoCapture</key>
    <false />
    <key>allowVirtualMachine</key>
    <false />
    <key>allowWindowCapture</key>
    <false />
    <key>allowWlan</key>
    <false />
    <key>audioControlEnabled</key>
    <false />
    <key>audioMute</key>
    <false />
    <key>audioSetVolumeLevel</key>
    <false />
    <key>audioVolumeLevel</key>
    <integer>25</integer>
    <key>autoQuitApplications</key>
    <true />
    <key>blockPopUpWindows</key>
    <false />
    <key>blockScreenShotsLegacy</key>
    <false />
    <key>browserConnectionErrorReload</key>
    <false />
    <key>browserExamKey</key>
    <string />
    <key>browserMediaAutoplay</key>
    <true />
    <key>browserMediaAutoplayAudio</key>
    <true />
    <key>browserMediaAutoplayVideo</key>
    <true />
    <key>browserMediaCaptureCamera</key>
    <false />
    <key>browserMediaCaptureMicrophone</key>
    <false />
    <key>browserMediaCaptureScreen</key>
    <false />
    <key>browserScreenKeyboard</key>
    <false />
    <key>browserShowFileSystemElementPath</key>
    <false />
    <key>browserURLSalt</key>
    <true />
    <key>browserUserAgent</key>
    <string>LernpassPlus/Seb</string>
    <key>browserWindowAllowAddressBar</key>
    <false />
    <key>browserWindowAllowReload</key>
    <true />
    <key>browserWindowShowURL</key>
    <integer>0</integer>
    <key>browserWindowTitleSuffix</key>
    <string />
    <key>browserWindowWebView</key>
    <integer>3</integer>
    <key>clipboardPolicy</key>
    <integer>2</integer>
    <key>createNewDesktop</key>
    <true />
    <key>defaultPageZoomLevel</key>
    <real>1</real>
    <key>defaultTextZoomLevel</key>
    <real>1</real>
    <key>detectStoppedProcess</key>
    <true />
    <key>displayAlwaysOn</key>
    <true />
    <key>downloadAndOpenSebConfig</key>
    <false />
    <key>enableAltTab</key>
    <true />
    <key>enableBrowserWindowToolbar</key>
    <true />
    <key>enableEsc</key>
    <true />
    <key>enableJavaScript</key>
    <true />
    <key>enableLogging</key>
    <true />
    <key>enablePlugIns</key>
    <true />
    <key>enablePrivateClipboard</key>
    <true />
    <key>enableRightMouse</key>
    <true />
    <key>enableSebBrowser</key>
    <true />
    <key>examSessionClearCookiesOnEnd</key>
    <true />
    <key>examSessionClearCookiesOnStart</key>
    <true />
    <key>examSessionReconfigureAllow</key>
    <false />
    <key>hashedAdminPassword</key>
    <string>{{HASHED_ADMIN_PASSWORD}}</string>
    <key>hashedQuitPassword</key>
    <string>{{HASHED_QUIT_PASSWORD}}</string>
    <key>hideBrowserWindowToolbar</key>
    <true />
    <key>ignoreQuitPassword</key>
    <true />
    <key>mainBrowserWindowHeight</key>
    <string>100%</string>
    <key>mainBrowserWindowPositioning</key>
    <integer>1</integer>
    <key>mainBrowserWindowWidth</key>
    <string>100%</string>
    <key>mobileEnableASAM</key>
    <true />
    <key>mobilePreventAutoLock</key>
    <true />
    <key>mobileShowSettings</key>
    <false />
    <key>monitorProcesses</key>
    <true />
    <key>newBrowserWindowAllowAddressBar</key>
    <false />
    <key>newBrowserWindowAllowReload</key>
    <true />
    <key>newBrowserWindowByLinkBlockForeign</key>
    <false />
    <key>newBrowserWindowByLinkPolicy</key>
    <integer>2</integer>
    <key>newBrowserWindowByLinkPositioning</key>
    <integer>2</integer>
    <key>newBrowserWindowByScriptPolicy</key>
    <integer>2</integer>
    <key>originatorVersion</key>
    <string>SEB_iOS_3.4.1_15437</string>
    <key>quitURL</key>
    <string>https://extranet.lernpassplus.ch/Lernende/Extranet/CloseSEB</string>
    <key>quitURLConfirm</key>
    <false />
    <key>removeBrowserProfile</key>
    <true />
    <key>removeLocalStorage</key>
    <false />
    <key>sendBrowserExamKey</key>
    <true />
    <key>showApplicationLogButton</key>
    <false />
    <key>showBackToStartButton</key>
    <true />
    <key>showMenuBar</key>
    <false />
    <key>showNavigationButtons</key>
    <false />
    <key>showProctoringViewButton</key>
    <true />
    <key>showQuitButton</key>
    <true />
    <key>showReloadButton</key>
    <false />
    <key>showReloadWarning</key>
    <true />
    <key>showScrollLockButton</key>
    <true />
    <key>showSideMenu</key>
    <false />
    <key>showTaskBar</key>
    <true />
    <key>showTime</key>
    <true />
    <key>startURL</key>
    <string>{{ZIEL_URL}}</string>
    <key>systemAlwaysOn</key>
    <true />
    <key>tabFocusesLinks</key>
    <true />
  </dict>
</plist>`;

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  // Strip any existing protocol, then prefix with sebs:// for SEB
  return trimmed.replace(/^(sebs?:\/\/|https?:\/\/)/i, '');
}

function toHttpsUrl(raw) {
  return 'https://' + raw;
}

function makeFilename(raw) {
  // raw has no protocol, e.g. "www.kinomadlen.ch/page"
  return raw.split('/')[0].replace(/^www\./, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export default function SEBGenerator({ open, onClose }) {
  const [url, setUrl] = useState('');
  const [adminPassword, setAdminPassword] = useState('Learn2quit!');
  const [quitPassword, setQuitPassword] = useState('Learn2quit!');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    const raw = normalizeUrl(url);
    const httpsUrl = toHttpsUrl(raw);
    const name = makeFilename(raw);
    const dateiname = `${name}.seb`;
    const hashedAdmin = await sha256Hex(adminPassword || '');
    const hashedQuit = await sha256Hex(quitPassword || '');
    const xml_content = SEB_XML_TEMPLATE
      .replace('{{ZIEL_URL}}', httpsUrl)
      .replace('{{HASHED_ADMIN_PASSWORD}}', hashedAdmin)
      .replace('{{HASHED_QUIT_PASSWORD}}', hashedQuit);

    const blob = new Blob([xml_content], { type: 'application/octet-stream' });
    const file = new File([blob], dateiname);
    try {
      const file_url = await uploadSebFile(file);
      setResult({ dateiname, httpsUrl, qr_seb_link: file_url, xml_content, file_url });
    } catch {
      toast.error('Die SEB-Datei konnte nicht hochgeladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(result.xml_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.xml_content], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = result.dateiname;
    a.click();
  };

  if (!open) return null;

  return (
    <DraggableWindow
      title="Safe Exam Browser"
      onClose={onClose}
      storageKey="seb_generator"
      defaultWidth={340}
      defaultHeight={520}
    >
      <div className="h-full overflow-y-auto p-4 space-y-3 bg-background">
        <p className="text-xs text-muted-foreground">
          Gib eine URL ein – es wird eine fertige <code>.seb</code>-Konfigurationsdatei für iPads generiert.
        </p>
        
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-primary">Anleitung für Schüler:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>QR-Code mit iPad-Kamera oder direkt in SEB scannen</li>
            <li>Test beenden: <code className="bg-background px-1 rounded">+</code> drücken, dann <code className="bg-background px-1 rounded">−</code>, danach lange auf Ausschalten halten</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="z.B. www.lernpass.ch"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="text-sm"
          />
          <Button size="sm" onClick={handleGenerate} disabled={!url.trim() || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Los'}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Admin-Passwort</label>
            <Input
              type="text"
              placeholder="Admin-Passwort"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Quit-Passwort</label>
            <Input
              type="text"
              placeholder="Quit-Passwort"
              value={quitPassword}
              onChange={e => setQuitPassword(e.target.value)}
              className="text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Passwörter werden als SHA256-Hash in die .seb-Datei geschrieben.
          </p>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Dateiname</p>
              <p className="text-sm font-mono font-semibold">{result.dateiname}</p>
            </div>

            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">SEB-Link (für iPad)</p>
              <p className="text-xs font-mono break-all text-primary">{result.qr_seb_link}</p>
              <div className="flex justify-center pt-1">
                <div className="bg-white p-2 rounded-lg w-full">
                  <QRCode value={result.qr_seb_link} style={{ width: '100%', height: 'auto' }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                QR-Code mit dem iPad scannen, um SEB zu starten
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="w-3 h-3 mr-1" /> .seb
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={handleCopyXml}>
                {copied ? <Check className="w-3 h-3 mr-1 text-green-600" /> : <Copy className="w-3 h-3 mr-1" />}
                XML
              </Button>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}