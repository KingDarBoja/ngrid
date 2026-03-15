import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PblNgridModule } from '@pebula/ngrid';
import { PblNgridBlockUiModule } from '@pebula/ngrid/block-ui';

import { CommonCellTemplatesComponent } from './common-cell-templates/common-cell-templates.component';
import { SmokeTestsExample } from './smoke-tests.component';

@NgModule({
  imports: [
    CommonModule,
    CommonCellTemplatesComponent,
    PblNgridModule.withCommon([ { component: CommonCellTemplatesComponent } ]),
    PblNgridBlockUiModule,
    RouterModule.forChild([{path: '', component: SmokeTestsExample}]),
    SmokeTestsExample,
  ],
  exports: [SmokeTestsExample],
})
export class SmokeTestsExampleModule { }
