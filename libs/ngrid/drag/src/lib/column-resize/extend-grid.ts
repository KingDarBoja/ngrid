import { PblColumn } from '@pebula/ngrid';

declare module '@pebula/ngrid' {
  interface PblColumn {
    resize: boolean;
  }
}


declare module '@pebula/ngrid/core' {
  interface PblColumnDefinition {
    resize?: boolean;
  }
}

export function colResizeExtendGrid(): void {
  PblColumn.extendProperty('resize');
}
