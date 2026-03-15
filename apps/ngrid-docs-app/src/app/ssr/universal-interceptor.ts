import {
  HttpHandlerFn,
  HttpRequest,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject, REQUEST } from '@angular/core';

export const universalInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // Inject the Web API Request object from @angular/core
  const serverRequest = inject(REQUEST, { optional: true });

  // Only apply logic if we are on the server (serverRequest exists)
  // and the URL is relative
  if (serverRequest && !req.url.startsWith('http')) {
    const urlObj = new URL(serverRequest.url);
    const protocol = urlObj.protocol; // e.g., 'https:'
    const host = urlObj.host; // e.g., 'example.com'

    let newUrl = `${protocol}//${host}`;

    if (!req.url.startsWith('/')) {
      newUrl += '/';
    }

    newUrl += req.url;

    const serverReq = req.clone({ url: newUrl });
    return next(serverReq);
  }

  return next(req);
};
