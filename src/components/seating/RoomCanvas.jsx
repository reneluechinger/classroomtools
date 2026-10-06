import React, { useRef, useState, useCallback, useEffect } from 'react';
import { DoorOpen } from 'lucide-react';
import DeskShape from './DeskShape';

const DESK_W = 140;
const DESK_H = 80;
const LABEL_H = 20;

export default function RoomCanvas({
  tables = [],
  onUpdateTables,
  students = [],
  assignments = [],
  isEditorMode = false,
  onSeatDrop,
  isPrintMode = false,
  doors = [],
  onUpdateDoors,
}) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [draggingDoor, setDraggingDoor] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingSeat, setDraggingSeat] = useState(null);

  const CANVAS_W = isPrintMode ? 800 : 900;
  const CANVAS_H = isPrintMode ? 600 : 650;

  // Der Raum wird in festen Koordinaten (900×650) gezeichnet und als Ganzes
  // auf die verfügbare Breite skaliert. So passt er auf Beamer, Laptop und Handy.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CANVAS_W || 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [CANVAS_W]);

  const handleMouseDown = (e, tableId) => {
    if (!isEditorMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const table = tables.find(t => t.id === tableId);
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - table.x,
      y: (e.clientY - rect.top) * scaleY - table.y
    });
    setDragging(tableId);
  };

  const handleMouseMove = useCallback((e) => {
    if (isEditorMode && dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const x = Math.max(0, Math.min(CANVAS_W - DESK_W, (e.clientX - rect.left) * scaleX - dragOffset.x));
      const y = Math.max(LABEL_H, Math.min(CANVAS_H - DESK_H - LABEL_H, (e.clientY - rect.top) * scaleY - dragOffset.y));
      
      onUpdateTables(tables.map(t => t.id === dragging ? { ...t, x, y } : t));
    } else if (isEditorMode && draggingDoor) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const x = Math.max(0, Math.min(CANVAS_W - 40, (e.clientX - rect.left) * scaleX - dragOffset.x));
      const y = Math.max(0, Math.min(CANVAS_H - 40, (e.clientY - rect.top) * scaleY - dragOffset.y));
      
      onUpdateDoors?.(doors.map(d => d.id === draggingDoor ? { ...d, x, y } : d));
    }
  }, [dragging, draggingDoor, dragOffset, tables, doors, isEditorMode, onUpdateTables, onUpdateDoors, CANVAS_W, CANVAS_H]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDraggingDoor(null);
  }, []);

  useEffect(() => {
    if (dragging || draggingDoor) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, draggingDoor, handleMouseMove, handleMouseUp]);

  const handleRotate = (tableId, delta) => {
    if (!isEditorMode) return;
    onUpdateTables(tables.map(t =>
      t.id === tableId ? { ...t, rotation: ((t.rotation || 0) + delta + 360) % 360 } : t
    ));
  };

  const getStudentForSeat = (tableId, seatIndex) => {
    const assignment = assignments.find(a => a.tableId === tableId && a.seatIndex === seatIndex);
    if (!assignment) return null;
    return students.find(s => s.id === assignment.studentId) || null;
  };

  const handleSeatDragStart = (seatId) => {
    setDraggingSeat(seatId);
  };

  const handleSeatDropInternal = (fromSeatId, toSeatId) => {
    setDraggingSeat(null);
    onSeatDrop?.(fromSeatId, toSeatId);
  };

  const handleDoorMouseDown = (e, doorId) => {
    if (!isEditorMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const door = doors.find(d => d.id === doorId);
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - door.x,
      y: (e.clientY - rect.top) * scaleY - door.y
    });
    setDraggingDoor(doorId);
    e.stopPropagation();
  };

  return (
    <div
      ref={canvasRef}
      className={`relative border-2 border-dashed border-border rounded-xl bg-white dark:bg-slate-900 overflow-hidden ${isPrintMode ? '' : 'shadow-inner'}`}
      style={{
        width: '100%',
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        maxWidth: isPrintMode ? 800 : undefined
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className="absolute top-0 left-0"
        style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
      {/* Teacher area */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 flex items-center justify-center border-b border-border">
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Tafel / Lehrerpult</span>
      </div>

      {tables.map((table) => {
        const seatA = getStudentForSeat(table.id, 0);
        const seatB = getStudentForSeat(table.id, 1);
        
        return (
          <div
            key={table.id}
            className={`absolute ${isEditorMode ? 'cursor-move' : ''}`}
            style={{
              left: table.x,
              top: table.y,
              transform: `rotate(${table.rotation || 0}deg)`,
              transformOrigin: 'center center',
              zIndex: dragging === table.id ? 50 : 10,
              width: DESK_W,
              height: DESK_H + LABEL_H + 4,
            }}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
          >
            <DeskShape
              table={table}
              seatA={seatA}
              seatB={seatB}
              isEditorMode={isEditorMode}
              onSeatDrop={handleSeatDropInternal}
              onSeatDragStart={handleSeatDragStart}
              draggingSeat={draggingSeat}
              highlightSeats={!!draggingSeat}
              isPrintMode={isPrintMode}
            />
            
            {isEditorMode && (
              <div className="flex justify-center gap-1 mt-1">
                <button
                  className="text-xs bg-muted hover:bg-muted/80 rounded px-1.5 py-0.5 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); handleRotate(table.id, -15); }}
                >
                  ↺
                </button>
                <span className="text-xs text-muted-foreground px-1">
                  {table.rotation || 0}°
                </span>
                <button
                  className="text-xs bg-muted hover:bg-muted/80 rounded px-1.5 py-0.5 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); handleRotate(table.id, 15); }}
                >
                  ↻
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Doors */}
      {doors.map(door => {
        return (
          <div
            key={door.id}
            className={`absolute ${isEditorMode ? 'cursor-move' : ''}`}
            style={{
              left: door.x,
              top: door.y,
              width: 40,
              height: 60,
              zIndex: draggingDoor === door.id ? 50 : 5,
            }}
            onMouseDown={(e) => handleDoorMouseDown(e, door.id)}
          >
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 border-2 border-amber-500 rounded-lg dark:bg-amber-950/60">
              <DoorOpen className="w-6 h-6 text-amber-700" />
              <span className="text-[10px] font-bold text-amber-700">TÜR</span>
            </div>
          </div>
        );
      })}

      </div>

      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">{isEditorMode ? 'Klicke "Tisch hinzufügen" um zu beginnen' : 'Kein Raumlayout geladen'}</p>
        </div>
      )}
    </div>
  );
}