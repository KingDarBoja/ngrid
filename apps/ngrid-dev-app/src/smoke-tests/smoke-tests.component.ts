import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PblNgridModule, createDS, columnFactory } from '@pebula/ngrid';
import { PblNgridBlockUiModule } from '@pebula/ngrid/block-ui';
import {
  Seller,
  StaticRestClientApi,
} from '@pebula/apps/dev-app-lib/client-api';

import { CommonCellTemplatesComponent } from './common-cell-templates/common-cell-templates.component';

@Component({
  selector: 'pbl-smoke-example',
  imports: [
    CommonModule,
    PblNgridBlockUiModule,
    PblNgridModule,
    // CommonCellTemplatesComponent,
  ],
  template: `
    <pbl-ngrid
      class="fixed-height-grid-500"
      [dataSource]="ds"
      [columns]="columns"
      #blockUi="blockUi"
      blockUi="true"
    >
      <div *pblNgridCellDef="'email'; let value = value">
        <u>
          <strong>{{ value }}</strong>
        </u>
      </div>
    </pbl-ngrid>
  `,
  styleUrls: ['./smoke-tests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // If ngrid needs the common templates via the old withCommon logic
    // in a standalone way, we use the registry service or the provided function:
    PblNgridModule.withCommon([{ component: CommonCellTemplatesComponent }])
      .providers,
  ],
})
export class SmokeTestsExample {
  private clientApi = inject(StaticRestClientApi);
  columns = columnFactory()
    .table(
      { prop: 'id' },
      { prop: 'name' },
      { prop: 'email' },
      { prop: 'rating', type: 'starRatings' },
    )
    .build();

  ds = createDS<Seller>()
    .onTrigger(() => this.clientApi.getSellersAll())
    .create();
}
