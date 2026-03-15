import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';

import { PblNgridModule } from '@pebula/ngrid';
import { PblNgridBlockUiModule } from '@pebula/ngrid/block-ui';

@Component({
  selector: 'pbl-common-cell-templates',
  templateUrl: './common-cell-templates.component.html',
  styleUrls: ['./common-cell-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PblNgridModule,
    PblNgridBlockUiModule,
  ],
})
export class CommonCellTemplatesComponent {}
