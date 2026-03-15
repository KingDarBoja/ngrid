import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'dev-app-smoke-tests',
    pathMatch: 'full',
    loadComponent: () =>
      import('./smoke-tests/smoke-tests.component').then(
        (m) => m.SmokeTestsExample,
      ),
    data: { name: 'Smoke Tests' },
  },
  {
    path: 'ngrid-column-width',
    pathMatch: 'full',
    loadComponent: () =>
      import('./ngrid/column-width/column-width.component').then(
        (m) => m.ColumnWidthExample,
      ),
    data: { name: 'Column Width' },
  },
];
