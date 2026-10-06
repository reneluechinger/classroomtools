import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, X } from '@phosphor-icons/react';
import RoomCanvas from './RoomCanvas';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function PrintView({ tables, students, assignments, className, layoutName, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sitzplan - ${esc(className)} - ${esc(layoutName)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 24px; font-weight: 700; }
            .header p { font-size: 14px; color: #666; margin-top: 4px; }
            .canvas-wrapper { display: flex; justify-content: center; }
            .desk { position: absolute; }
            .desk-inner { display: flex; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
            .seat { width: 70px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #ddd; font-size: 11px; }
            .seat-left { border-radius: 8px 0 0 8px; border-right: none; }
            .seat-right { border-radius: 0 8px 8px 0; border-left: none; }
            .seat-m { background: #eff6ff; color: #1d4ed8; }
            .seat-w { background: #fdf2f8; color: #be185d; }
            .seat-d { background: #faf5ff; color: #7c3aed; }
            .seat-empty { background: #f3f4f6; color: #9ca3af; }
            .desk-label { text-align: center; font-size: 11px; font-weight: 700; color: #666; margin-bottom: 2px; }
            .name { font-weight: 600; font-size: 11px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
            .teacher-bar { background: #f8f8f8; text-align: center; font-size: 11px; color: #999; padding: 4px; border-bottom: 1px solid #eee; text-transform: uppercase; letter-spacing: 1px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${esc(className)}</h1>
            <p>${esc(layoutName)} · ${new Date().toLocaleDateString('de-DE')}</p>
          </div>
          <div class="canvas-wrapper">
            <div style="position: relative; width: 760px; height: 560px; border: 2px dashed #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div class="teacher-bar">Tafel / Lehrerpult</div>
              ${tables.map(table => {
                const seatA = assignments.find(a => a.tableId === table.id && a.seatIndex === 0);
                const seatB = assignments.find(a => a.tableId === table.id && a.seatIndex === 1);
                const studentA = seatA ? students.find(s => s.id === seatA.studentId) : null;
                const studentB = seatB ? students.find(s => s.id === seatB.studentId) : null;
                
                const leftPct = (table.x / 900) * 100;
                const topPct = (table.y / 650) * 100;
                
                const seatHtml = (student, side) => {
                  const cls = student ? `seat-${student.gender}` : 'seat-empty';
                  const sideClass = side === 'left' ? 'seat-left' : 'seat-right';
                  return `<div class="seat ${cls} ${sideClass}">
                    ${student ? `<span class="name">${esc(student.firstName)}</span><span>${esc(student.lastName)}</span>` : '—'}
                  </div>`;
                };

                return `<div class="desk" style="left:${leftPct}%;top:${topPct}%;transform:rotate(${table.rotation||0}deg);transform-origin:center center;width:140px;">
                  <div class="desk-label">T${table.number}</div>
                  <div class="desk-inner">${seatHtml(studentA, 'left')}${seatHtml(studentB, 'right')}</div>
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="footer">
            Erstellt am ${new Date().toLocaleDateString('de-DE')} · ${students.length} Schüler · ${tables.length} Tische
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Druckvorschau</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Drucken / PDF
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-bold">{className}</h3>
          <p className="text-sm text-muted-foreground">{layoutName} · {new Date().toLocaleDateString('de-DE')}</p>
        </div>

        <div ref={printRef}>
          <RoomCanvas
            tables={tables}
            students={students}
            assignments={assignments}
            isEditorMode={false}
            isPrintMode={true}
            onUpdateTables={() => {}}
          />
        </div>
      </div>
    </div>
  );
}