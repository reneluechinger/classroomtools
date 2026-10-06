import React from 'react';
import { GraduationCap } from '@phosphor-icons/react';
import EntityPicker from './EntityPicker';

export default function ClassSelector({ classes, selectedClassId, ...rest }) {
  return (
    <EntityPicker
      items={classes}
      selectedId={selectedClassId}
      icon={GraduationCap}
      color="blue"
      noun="Klasse"
      placeholder="Klasse wählen"
      createPlaceholder="z.B. 2a"
      describe={(c) => `${c.students?.length || 0}`}
      {...rest}
    />
  );
}
