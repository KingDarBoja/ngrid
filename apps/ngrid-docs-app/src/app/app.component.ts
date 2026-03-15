import { Component } from '@angular/core';
import {
  LazyModulePreloader,
  LazyModuleStoreService,
} from '@pebula/apps/docs-app-lib';
import { DemoHomePageComponent } from './demo-home-page/demo-home-page.component';
// import { Angulartics2GoogleAnalytics } from 'angulartics2';

@Component({
  selector: 'pbl-ngrid-demo-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [DemoHomePageComponent],
})
export class AppComponent {
  // constructor(angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics) {
  //   angulartics2GoogleAnalytics.startTracking();
  // }

  constructor(
    store: LazyModuleStoreService,
    lazyPreloader: LazyModulePreloader,
  ) {
    lazyPreloader.onCompile.subscribe((event) => store.moduleRegistered(event));
  }
}
