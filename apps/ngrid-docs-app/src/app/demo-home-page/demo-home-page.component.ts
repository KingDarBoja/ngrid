import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkWithHref, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

// Material Imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { Dir } from '@angular/cdk/bidi';

// Note: If you moved away from flex-layout, replace with [style.flex] or Tailwind/CSS.

// Custom Lib/Local Imports
import {
  MarkdownPagesMenuService,
  LocationService,
  ViewLayoutObserver,
  SearchService,
  SearchResults,
  PblDocsAppSharedModule,
} from '@pebula/apps/docs-app-lib';
import type { PageAssetNavEntry } from '@pebula-internal/webpack-markdown-pages';

// Local Standalone Components/Directives
import { RouterLinkActiveNotify } from './router-link-active-notify';

@Component({
  selector: 'pbl-demo-home-page',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterLinkActiveNotify,
    PblDocsAppSharedModule,
  ],
  templateUrl: './demo-home-page.component.html',
  styleUrls: ['./demo-home-page.component.scss'],
})
export class DemoHomePageComponent implements OnInit {
  readonly viewLayout = inject(ViewLayoutObserver);
  readonly mdMenu = inject(MarkdownPagesMenuService);
  private searchService = inject(SearchService);
  private locationService = inject(LocationService);
  private readonly dir = inject(Dir);

  showSearchResults: boolean;
  searchResults: Observable<SearchResults>;

  selectedDemoLink: any;

  topMenuItems: ReturnType<MarkdownPagesMenuService['ofType']>;
  demoLinks: Promise<Array<{ cmd: any[]; text: string }>>;

  isRtl: boolean;

  private _demoLinks: Array<{ cmd: any[]; text: string }>;

  constructor() {
    this.searchService
      .loadIndex(this.searchService.hasWorker ? 2000 : 0)
      .subscribe(() => console.log('Search index loaded'));
  }

  rtlToggleChanged() {
    this.isRtl = !this.isRtl;
    this.dir.dir = this.isRtl ? 'rtl' : 'ltr';
  }

  handleMobileTopMenuSubMenu(
    select: MatSelect,
    menu: MatMenu,
    event: MouseEvent,
  ) {
    event.stopPropagation();
    event.preventDefault();
    menu.closed.pipe(take(1)).subscribe(() => select.close());
    return false;
  }

  ngOnInit() {
    this.topMenuItems = this.mdMenu.ofType('topMenuSection');
    this.demoLinks = this.mdMenu.ofType('singlePage').then((entries) => {
      const demoLinks = entries
        .filter((e) => e.subType === 'demoPage')
        .map((e) => ({
          cmd: e.path.split('/'),
          text: e.title,
        }));
      return (this._demoLinks = demoLinks);
    });
  }

  demoLinkStatusChanged(event: {
    isActive: boolean;
    findRouterLink: (
      commands: any[] | string,
    ) => RouterLinkWithHref | RouterLink | undefined;
  }) {
    this.selectedDemoLink = null;
    if (event.isActive) {
      if (!this._demoLinks) {
        this.demoLinks.then(() => this.demoLinkStatusChanged(event));
        return;
      }
      this.selectedDemoLink = this._demoLinks.find(
        (dl) => !!event.findRouterLink(dl.cmd),
      );
    }
  }

  mobileTopMenuRouteActivated(
    select: MatSelect,
    items: PageAssetNavEntry[],
    event: {
      isActive: boolean;
      findRouterLink: (
        commands: any[] | string,
      ) => RouterLinkWithHref | RouterLink | undefined;
    },
  ) {
    if (event.isActive) {
      select.value = items.find(
        (dl) => !!event.findRouterLink(dl.path.split('/')),
      );
    } else if (this.selectedDemoLink) {
      select.value = 'Demo';
    } else {
      select.value = undefined;
    }
  }

  doSearch(query: string) {
    this.searchResults = this.searchService.queryIndex(query);
    this.showSearchResults = !!query;
  }

  hideSearchResults() {
    this.showSearchResults = false;
    const oldSearch = this.locationService.search();
    if (oldSearch.search !== undefined) {
      this.locationService.setSearch('', { ...oldSearch, search: undefined });
    }
  }
}
