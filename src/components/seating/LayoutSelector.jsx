import React from 'react';
import { DoorOpen } from '@phosphor-icons/react';
import EntityPicker from './EntityPicker';

export default function LayoutSelector({ layouts, selectedLayoutId, ...rest }) {
  return (
    <EntityPicker
      items={layouts}
      selectedId={selectedLayoutId}
      icon={DoorOpen}
      color="orange"
      noun="Zimmer"
      placeholder="Zimmer wählen"
      createPlaceholder="z.B. Zimmer 204"
      describe={(l) => `${l.tables?.length || 0} Tische`}
      {...rest}
    />
  );
}
