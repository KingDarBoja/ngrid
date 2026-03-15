import {
  mergeApplicationConfig,
  ApplicationConfig,
  ApplicationRef,
  APP_BOOTSTRAP_LISTENER,
  REQUEST,
  inject,
} from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { TransferState } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { filter, first } from 'rxjs/operators';
import { appConfig, REQ_KEY, RequestState } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: APP_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: () => {
        const appRef = inject(ApplicationRef);
        const transferState = inject(TransferState);
        const request = inject(REQUEST); // Web API Request object

        return () =>
          appRef.isStable
            .pipe(
              filter((stable) => stable),
              first(),
            )
            .subscribe(() => {
              // Transferring server-side request data to the client
              if (request) {
                // Use Web API properties (.url) instead of Express (.originalUrl)
                const url = new URL(request.url);

                transferState.set<RequestState>(REQ_KEY, {
                  hostname: url.hostname,
                  originalUrl: url.pathname + url.search,
                  referer: request.headers.get('referer') ?? '',
                });
              }
            });
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
