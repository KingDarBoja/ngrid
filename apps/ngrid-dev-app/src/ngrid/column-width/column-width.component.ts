import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PblNgridModule, createDS, columnFactory } from '@pebula/ngrid';
import {
  Seller,
  StaticRestClientApi,
} from '@pebula/apps/dev-app-lib/client-api';

@Component({
  selector: 'pbl-column-width-example',
  imports: [CommonModule, PblNgridModule],
  template: `
    <pbl-ngrid
      [dataSource]="ds"
      [columns]="columns"
      class="fixed-height-grid-300"
    />
  `,
  styleUrls: ['./column-width.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnWidthExample {
  private clientApi = inject(StaticRestClientApi);

  columns = columnFactory()
    .table(
      { prop: 'id' },
      { prop: 'name' },
      { prop: 'email' },
      { prop: 'address' },
    )
    .build();

  ds = createDS<Seller>()
    .onTrigger(() => this.clientApi.getSellersAll())
    .create();
}
