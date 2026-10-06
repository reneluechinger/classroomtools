import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { entities } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash as Trash2, DownloadSimple as Download, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DraggableWindow from './DraggableWindow';

export default function QRCodePanel({ currentUser, open, onClose }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [task, setTask] = useState('');
  const [preview, setPreview] = useState('');
  const [enlarged, setEnlarged] = useState(null);
  const queryClient = useQueryClient();

  const { data: savedCodes = [] } = useQuery({
    queryKey: ['qrcodes', currentUser?.email],
    queryFn: () => entities.QRCodeEntry.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
  });

  const createCode = useMutation({
    mutationFn: (data) => entities.QRCodeEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qrcodes'] }); toast.success('QR-Code gespeichert'); }
  });
  const deleteCode = useMutation({
    mutationFn: (id) => entities.QRCodeEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qrcodes'] }),
  });

  const handleGenerate = () => {
    let normalized = url.trim();
    if (!normalized) return;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    setPreview(normalized);
  };

  const handleSave = () => {
    if (!preview) return;
    createCode.mutate({ url: preview, label: label.trim() || preview, task: task.trim() });
    setUrl(''); setLabel(''); setTask(''); setPreview('');
  };

  const downloadQR = (value, name) => {
    const svg = document.getElementById(`qr-${value}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name || 'qrcode'}.svg`;
    a.click();
  };

  if (!open) return null;

  return (
    <DraggableWindow
      title="QR-Code"
      onClose={onClose}
      storageKey="qr_code_panel"
      defaultWidth={320}
      defaultHeight={520}
    >
      <div className={`h-full p-4 bg-background ${enlarged ? 'overflow-hidden flex flex-col' : 'overflow-y-auto space-y-3'}`}>

        {/* Enlarged view inside the panel */}
        {enlarged && (
          <div className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-primary h-full">
            <div className="flex justify-between w-full items-center mb-1 flex-shrink-0">
              <p className="text-xs font-semibold truncate flex-1">{enlarged.label || enlarged.url}</p>
              <button onClick={() => setEnlarged(null)} className="ml-2 p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              <QRCode value={enlarged.url} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }} />
            </div>
            {enlarged.task
              ? <p className="font-bold text-center flex-shrink-0 px-1 whitespace-pre-wrap" style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)' }}>{enlarged.task}</p>
              : <p className="text-xs text-muted-foreground break-all text-center flex-shrink-0">{enlarged.url}</p>
            }
          </div>
        )}

        {!enlarged && (
          <>
            <div className="space-y-2">
              <Input
                placeholder="URL eingeben (z.B. schulnetz.ch)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
              <Input
                placeholder="Beschriftung (optional)"
                value={label}
                onChange={e => setLabel(e.target.value)}
              />
              <textarea
                placeholder="Zusatzauftrag (optional)"
                value={task}
                onChange={e => setTask(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <Button size="sm" className="w-full" onClick={handleGenerate} disabled={!url.trim()}>
                QR-Code erstellen
              </Button>
            </div>

            {preview && (
              <div className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 border border-border">
                <div className="cursor-zoom-in" onClick={() => setEnlarged({ url: preview, label, task })}>
                  <QRCode id={`qr-${preview}`} value={preview} size={140} />
                </div>
                {task
                  ? <p className="text-sm font-semibold text-center">{task}</p>
                  : <p className="text-xs text-muted-foreground text-center break-all">{preview}</p>
                }
                <p className="text-xs text-primary/60">↑ Antippen zum Vergrössern</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadQR(preview, label || 'qrcode')}>
                    <Download className="w-3 h-3 mr-1" /> SVG
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={createCode.isPending}>Speichern</Button>
                </div>
              </div>
            )}

            {savedCodes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Gespeicherte Codes</p>
                <div className="space-y-3">
                  {savedCodes.map(code => (
                    <div key={code.id} className="bg-white rounded-lg p-2 border border-border flex flex-col items-center gap-1">
                      <div className="cursor-zoom-in" onClick={() => setEnlarged({ url: code.url, label: code.label, task: code.task })}>
                        <QRCode id={`qr-${code.url}`} value={code.url} size={100} />
                      </div>
                      <p className="text-xs font-medium text-center">{code.label || code.url}</p>
                      {code.task
                        ? <p className="text-xs font-semibold text-center">{code.task}</p>
                        : <p className="text-xs text-muted-foreground break-all text-center">{code.url}</p>
                      }
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => downloadQR(code.url, code.label)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteCode.mutate(code.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DraggableWindow>
  );
}