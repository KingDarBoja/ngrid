import {
  ApplicationConfig,
  importProvidersFrom,
  makeStateKey,
} from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withPreloading,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideClientHydration,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';

// Material & CDK Imports
import { BidiModule } from '@angular/cdk/bidi';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Shared Lib Imports
import {
  PblDocsAppSharedModule,
  MarkdownPageContainerComponent,
  EXAMPLE_COMPONENTS,
  EXAMPLE_COMPONENTS_TOKEN,
  CONTENT_CHUNKS_COMPONENTS,
  LocationService,
  LazyModulePreloader,
} from '@pebula/apps/docs-app-lib';

import {
  AppContentChunksModule,
  APP_CONTENT_CHUNKS,
} from '@pebula/apps/docs-app-lib/app-content-chunks.module';

import { LazyCodePartsModule } from './lazy-code-parts.module';
import { universalInterceptor } from './ssr/universal-interceptor';

export interface RequestState {
  hostname: string;
  originalUrl: string;
  referer: string | undefined;
}

export const REQ_KEY = makeStateKey<RequestState>('req');

export function EXAMPLE_COMPONENTS_FACTORY() {
  return EXAMPLE_COMPONENTS;
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Core Logic
    provideAnimations(),
    provideHttpClient(withInterceptors([universalInterceptor])),
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: true,
      }),
    ),

    // Router Configuration
    provideRouter(
      [
        {
          path: '',
          children: [
            {
              path: '**',
              component: MarkdownPageContainerComponent,
            },
          ],
        },
      ],
      withEnabledBlockingInitialNavigation(),
      withPreloading(LazyModulePreloader),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),

    // Compatibility for Legacy/Third-Party Modules
    importProvidersFrom(
      BidiModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatListModule,
      MatTooltipModule,
      MatFormFieldModule,
      MatSelectModule,
      MatSlideToggleModule,
      PblDocsAppSharedModule,
      AppContentChunksModule,
      LazyCodePartsModule.forRoot(),
    ),

    // Custom Injection Tokens & Services
    { provide: CONTENT_CHUNKS_COMPONENTS, useValue: APP_CONTENT_CHUNKS },
    {
      provide: EXAMPLE_COMPONENTS_TOKEN,
      useFactory: EXAMPLE_COMPONENTS_FACTORY,
    },
    LocationService,
    // Note: LazyModuleStoreService and LazyModulePreloader logic
    // should be handled in the AppComponent constructor or an APP_INITIALIZER
  ],
};
