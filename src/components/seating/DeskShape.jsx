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
  
  const genderColor = (gender) => {
    if (gender === 'w') return { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' };
    if (gender === 'm') return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' };
    return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' };
  };

  const renderSeat = (student, seatIndex) => {
    const isLeft = seatIndex === 0;
    const colors = student ? genderColor(student.gender) : { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
    const seatId = `${table.id}-${seatIndex}`;
    const isDropTarget = highlightSeats && draggingSeat !== seatId;
    
    return (
      <div
        className={`
          ${isLeft ? 'rounded-l-lg border-r-0' : 'rounded-r-lg border-l-0'}
          ${colors.bg} ${colors.border} border
          flex flex-col items-center justify-center
          transition-all duration-150
          ${isDropTarget ? 'ring-2 ring-primary ring-offset-1' : ''}
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
            <span className={`${colors.text} font-bold ${isPrintMode ? 'text-base' : 'text-sm'} leading-tight text-center px-1 w-full text-center truncate block`}>
              {student.firstName}
            </span>
            <span className={`${colors.text} ${isPrintMode ? 'text-sm' : 'text-xs'} leading-tight text-center px-1 w-full text-center truncate block`}>
              {student.lastName}
            </span>
          </>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xs font-bold text-muted-foreground ${isPrintMode ? 'text-sm' : ''}`}>
        T{table.number}
      </span>
      <div
        className="flex rounded-lg shadow-sm"
        style={{ width: DESK_W, height: DESK_H }}
      >
        {renderSeat(seatA, 0)}
        {renderSeat(seatB, 1)}
      </div>
    </div>
  );
}