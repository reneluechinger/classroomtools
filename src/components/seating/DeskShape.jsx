import React from 'react';

export default function DeskShape({ 
  table, 
  seatA, 
  seatB, 
  isEditorMode = false,
  onSeatDrop,
  onSeatDragStart,
  draggingSeat,
  highlightSeats = false,
  isPrintMode = false
}) {
  const DESK_W = 140;
  const DESK_H = 80;
  
  // Dezente Farbtöne, farbiger Strich unten zeigt das Geschlecht
  const genderColor = (gender) => {
    if (gender === 'w') return { bg: 'bg-[#FF2D55]/[0.07] dark:bg-[#FF2D55]/[0.16]', bar: 'bg-[#FF2D55]' };
    if (gender === 'm') return { bg: 'bg-[#007AFF]/[0.07] dark:bg-[#0A84FF]/[0.18]', bar: 'bg-[#007AFF]' };
    return { bg: 'bg-[#AF52DE]/[0.08] dark:bg-[#AF52DE]/[0.18]', bar: 'bg-[#AF52DE]' };
  };

  const renderSeat = (student, seatIndex) => {
    const isLeft = seatIndex === 0;
    const colors = student ? genderColor(student.gender) : { bg: 'bg-muted', bar: '' };
    const seatId = `${table.id}-${seatIndex}`;
    const isDropTarget = highlightSeats && draggingSeat !== seatId;
    
    return (
      <div
        className={`
          relative ${isLeft ? 'border-r border-border' : ''}
          ${colors.bg}
          flex flex-col items-center justify-center
          transition-all duration-150
          ${isDropTarget ? 'ring-2 ring-inset ring-primary/70' : ''}
          ${draggingSeat === seatId ? 'opacity-40' : ''}
          ${!isEditorMode && !isPrintMode ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{ width: DESK_W / 2, height: DESK_H }}
        draggable={!isEditorMode && !isPrintMode && !!student}
        onDragStart={(e) => {
          if (isEditorMode || isPrintMode || !student) return;
          e.dataTransfer.setData('text/plain', seatId);
          onSeatDragStart?.(seatId);
        }}
        onDragOver={(e) => {
          if (isEditorMode || isPrintMode) return;
          e.preventDefault();
        }}
        onDrop={(e) => {
          if (isEditorMode || isPrintMode) return;
          e.preventDefault();
          e.stopPropagation();
          const fromSeatId = e.dataTransfer.getData('text/plain');
          onSeatDrop?.(fromSeatId, seatId);
        }}
      >
        {student ? (
          <>
            <span className={`font-semibold ${isPrintMode ? 'text-base' : 'text-[15px]'} leading-tight px-1.5 w-full text-center truncate block`}>
              {student.firstName}
            </span>
            <span className={`text-muted-foreground ${isPrintMode ? 'text-sm' : 'text-[12px]'} leading-tight px-1.5 w-full text-center truncate block`}>
              {student.lastName}
            </span>
            <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full ${colors.bar}`} />
          </>
        ) : (
          <span className="text-muted-foreground/50 text-xs">frei</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[11px] font-semibold text-muted-foreground tabular-nums ${isPrintMode ? 'text-sm' : ''}`}>
        {table.number}
      </span>
      <div
        className="flex rounded-[14px] overflow-hidden bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ width: DESK_W, height: DESK_H }}
      >
        {renderSeat(seatA, 0)}
        {renderSeat(seatB, 1)}
      </div>
    </div>
  );
}