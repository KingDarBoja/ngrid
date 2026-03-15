import { NgModule } from '@angular/core';
import { PblDocsAppSharedModule } from '@pebula/apps/docs-app-lib';

@NgModule({
  imports: [PblDocsAppSharedModule],
  exports: [PblDocsAppSharedModule],
})
export class ExampleCommonModule {}
