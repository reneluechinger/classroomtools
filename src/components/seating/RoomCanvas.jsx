import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';
import DeskShape from './DeskShape';
import DoorSymbol, { DOOR_SIZE } from './DoorSymbol';

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
      const x = Math.max(0, Math.min(CANVAS_W - DOOR_SIZE, (e.clientX - rect.left) * scaleX - dragOffset.x));
      const y = Math.max(0, Math.min(CANVAS_H - DOOR_SIZE, (e.clientY - rect.top) * scaleY - dragOffset.y));
      
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

  const handleRotateDoor = (doorId, delta) => {
    if (!isEditorMode) return;
    onUpdateDoors?.(doors.map(d =>
      d.id === doorId ? { ...d, rotation: ((d.rotation || 0) + delta + 360) % 360 } : d
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
      className={`relative rounded-2xl bg-card overflow-hidden ${isPrintMode ? 'border border-border' : 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]'}`}
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
      {/* Punktraster als Hilfe beim Platzieren */}
      {isEditorMode && (
        <div
          className="absolute inset-0 text-foreground/[0.12]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }}
        />
      )}
      {/* Wandtafel */}
      <div className="absolute left-1/2 -translate-x-1/2 top-3 w-[340px] h-7 rounded-full bg-[#2C3E35] dark:bg-[#3A4A42] shadow-inner flex items-center justify-center">
        <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/70">Wandtafel</span>
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
              <RotateControls
                angle={table.rotation || 0}
                onLeft={() => handleRotate(table.id, -15)}
                onRight={() => handleRotate(table.id, 15)}
              />
            )}
          </div>
        );
      })}

      {/* Türen */}
      {doors.map(door => (
        <div
          key={door.id}
          className={`absolute ${isEditorMode ? 'cursor-move' : ''}`}
          style={{ left: door.x, top: door.y, width: DOOR_SIZE, zIndex: draggingDoor === door.id ? 50 : 5 }}
          onMouseDown={(e) => handleDoorMouseDown(e, door.id)}
        >
          <DoorSymbol rotation={door.rotation || 0} />
          {isEditorMode && (
            <RotateControls
              angle={door.rotation || 0}
              onLeft={() => handleRotateDoor(door.id, -90)}
              onRight={() => handleRotateDoor(door.id, 90)}
            />
          )}
        </div>
      ))}
      </div>

      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-[15px]">{isEditorMode ? 'Mit «Tische +» den ersten Tisch hinzufügen' : 'Noch keine Tische in diesem Zimmer'}</p>
        </div>
      )}
    </div>
  );
}
function RotateControls({ angle, onLeft, onRight }) {
  const btn = 'w-6 h-6 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary';
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1.5">
      <button type="button" className={btn} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onLeft(); }} aria-label="Nach links drehen">
        <ArrowCounterClockwise size={12} weight="bold" />
      </button>
      <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-center">{angle}°</span>
      <button type="button" className={btn} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRight(); }} aria-label="Nach rechts drehen">
        <ArrowClockwise size={12} weight="bold" />
      </button>
    </div>
  );
}
