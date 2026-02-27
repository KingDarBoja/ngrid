import { Observable, Subject, of as observableOf, } from 'rxjs';
import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  ElementRef,
  IterableDiffers,
  OnDestroy,
  Optional,
  ViewEncapsulation,
  Injector,
  SkipSelf,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { _DisposeViewRepeaterStrategy, _ViewRepeater, _VIEW_REPEATER_STRATEGY } from '@angular/cdk/collections';
import { ViewportRuler } from '@angular/cdk/scrolling';
import {
  CdkTable,
  DataRowOutlet,
  CdkHeaderRowDef,
  CdkFooterRowDef,
  RowContext,
  CDK_TABLE,
  RenderRow,
  STICKY_POSITIONING_LISTENER,
  StickyPositioningListener,
} from '@angular/cdk/table';
import { Direction, Directionality } from '@angular/cdk/bidi';

import { unrx } from '@pebula/ngrid/core';
import { PBL_NGRID_COMPONENT, _PblNgridComponent } from '../../tokens';
import { EXT_API_TOKEN, PblNgridInternalExtensionApi } from '../../ext/grid-ext-api';

import { PblNgridCachedRowViewRepeaterStrategy } from './ngrid-cached-row-view-repeater-strategy';
import { PblNgridColumnDef } from '../column/directives';
import { PblColumn } from '../column/model';

/**
 * Wrapper for the CdkTable that extends it's functionality to support various table features.
 * This wrapper also applies Material Design table styles (i.e. `MatTable` styles).
 *
 * Most of the extensions are done using mixins, this is mostly for clarity and separation of the features added.
 * This approach will allow easy removal when a feature is no longer required/implemented natively.
 */
@Component({
  selector: 'pbl-cdk-table',
  exportAs: 'pblCdkTable',
  template: `
    <ng-content select="caption"></ng-content>
    <ng-content select="colgroup, col"></ng-content>
    <ng-container headerRowOutlet></ng-container>
    <ng-container rowOutlet></ng-container>
    <ng-container noDataRowOutlet></ng-container>
    <ng-container footerRowOutlet></ng-container>
  `,
  host: { // tslint:disable-line: no-host-metadata-property
    'class': 'pbl-cdk-table',
  },
  providers: [
    {provide: CDK_TABLE, useExisting: PblCdkTableComponent},
    {provide: _VIEW_REPEATER_STRATEGY, useClass: PblNgridCachedRowViewRepeaterStrategy},
    // Prevent nested tables from seeing this table's StickyPositioningListener.
    {provide: STICKY_POSITIONING_LISTENER, useValue: null},
  ],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PblCdkTableComponent<T> extends CdkTable<T> implements OnDestroy {

  get _element(): HTMLElement { return this._elementRef.nativeElement; }

  get beforeRenderRows(): Observable<void> {
    if (!this.beforeRenderRows$) {
      this.beforeRenderRows$ = new Subject<void>();
    }
    return this.beforeRenderRows$.asObservable();
  }

  get onRenderRows(): Observable<DataRowOutlet> {
    if (!this.onRenderRows$) {
      this.onRenderRows$ = new Subject<DataRowOutlet>();
    }
    return this.onRenderRows$.asObservable();
  }

  get minWidth(): number | null { return this._minWidth; }
  set minWidth(value: number | null) {
    this._minWidth = value || null;
    this._element.style.minWidth = value ? value + 'px' : null;
  }

  get stickyActive(): boolean { return this._stickyActive; }

  readonly cdRef: ChangeDetectorRef;

  private _stickyActive: boolean = false;
  private _minWidth: number | null = null;
  private beforeRenderRows$: Subject<void>;
  private onRenderRows$: Subject<DataRowOutlet>;
  private _isStickyPending: boolean;
  private pblStickyColumnStylesNeedReset = false;
  private _currentDirection: Direction = 'ltr';

  constructor(_differs: IterableDiffers,
              _changeDetectorRef: ChangeDetectorRef,
              _elementRef: ElementRef<HTMLElement>,
              @Attribute('role') role: string,
              @Optional() _dir: Directionality,
              protected injector: Injector,
              @Inject(PBL_NGRID_COMPONENT) protected grid: _PblNgridComponent<T>,
              @Inject(EXT_API_TOKEN) protected extApi: PblNgridInternalExtensionApi<T>,
              @Inject(DOCUMENT) _document: any,
              protected platform: Platform,
              @Inject(_VIEW_REPEATER_STRATEGY) _viewRepeater: _ViewRepeater<T, RenderRow<T>, RowContext<T>>,
              _viewportRuler: ViewportRuler,
              @Optional() @SkipSelf() @Inject(STICKY_POSITIONING_LISTENER) _stickyPositioningListener?: StickyPositioningListener) {
    super(_differs, _changeDetectorRef, _elementRef, role, _dir, _document, platform, _viewRepeater, _viewportRuler, _stickyPositioningListener);

    this.cdRef = _changeDetectorRef;
    extApi.setCdkTable(this);
    this.trackBy = this.grid.trackBy;
  }

  ngOnInit(): void {
    // Initialize the current direction
    this._currentDirection = this._dir?.value || 'ltr';

    // Track direction changes and reset sticky column styles
    (this._dir?.change ?? observableOf<Direction>())
      .pipe(unrx(this))
      .subscribe(value => {
        this._currentDirection = value;
        this.pblStickyColumnStylesNeedReset = true;
        this.updateStickyColumnStyles();
      });

    // It's imperative we register to dir changes before super.ngOnInit because it register there as well
    // and it will come first and make sticky state pending, cancelling any style updates.
    super.ngOnInit();
  }

  updateStickyColumnStyles() {
    if (this._isStickyPending) {
      return;
    }

    this._isStickyPending = true;
    Promise.resolve()
      .then( () => {
        this._isStickyPending = false;
        this._updateStickyColumnStyles();
      });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    unrx.kill(this);
    if (this.onRenderRows$) {
      this.onRenderRows$.complete();
    }
  }

  //#region CSS-CLASS-CONTROL
  addClass(cssClassName: string): void {
    this._element.classList.add(cssClassName);
  }

  removeClass(cssClassName: string): void {
    this._element.classList.remove(cssClassName);
  }
  //#endregion CSS-CLASS-CONTROL

  //#region CLEAR-ROW-DEFS

  // TODO: remove if https://github.com/angular/material2/pull/13000 is pushed
  private _cachedRowDefs = { header: new Set<CdkHeaderRowDef>(), footer: new Set<CdkFooterRowDef>() }; //tslint:disable-line

  // TODO: remove if https://github.com/angular/material2/pull/13000 is pushed
  addHeaderRowDef(headerRowDef: CdkHeaderRowDef): void {
    super.addHeaderRowDef(headerRowDef);
    this._cachedRowDefs.header.add(headerRowDef);
  }

  // TODO: remove if https://github.com/angular/material2/pull/13000 is pushed
  clearHeaderRowDefs(): void {
    const { header } = this._cachedRowDefs;
    for (const rowDef of Array.from(header.values())) {
      this.removeHeaderRowDef(rowDef);
    }
    header.clear();
  }

  // TODO: remove if https://github.com/angular/material2/pull/13000 is pushed
  addFooterRowDef(footerRowDef: CdkFooterRowDef): void {
    super.addFooterRowDef(footerRowDef);
    this._cachedRowDefs.footer.add(footerRowDef);
  }

  // TODO: remove if https://github.com/angular/material2/pull/13000 is pushed
  clearFooterRowDefs(): void {
    const { footer } = this._cachedRowDefs;
    for (const rowDef of Array.from(footer.values())) {
      this.removeFooterRowDef(rowDef);
    }
    footer.clear();
  }
  //#endregion CLEAR-ROW-DEFS

  /**
   * An alias for `_cacheRowDefs()`
   */
  updateRowDefCache(): void {
    (this as any)._cacheRowDefs();
  }

  renderRows(): void {
    if (this.beforeRenderRows$) {
      this.beforeRenderRows$.next();
    }
    super.renderRows();
    if (this.onRenderRows$) {
      this.onRenderRows$.next(this._rowOutlet);
    }
  }

  pblForceRenderDataRows(): void {
    try{
      (this as any)._forceRenderDataRows();
    } catch (ex) {
      this.multiTemplateDataRows = this.multiTemplateDataRows;
    }
  }

  private _updateStickyColumnStyles() {
    // We let the parent do the work on rows, it will see 0 columns so then we act.
    super.updateStickyColumnStyles();

    let stickyActive = false;
    const stickyStartStates: boolean[] = [];
    const stickyEndStates: boolean[] = [];
    const columnWidths: number[] = [];

    // Collect sticky states and column widths
    for (const c of this.extApi.columnApi.visibleColumns) {
      const sticky = c.columnDef?.sticky;
      const stickyEnd = c.columnDef?.stickyEnd;

      stickyStartStates.push(!!sticky);
      stickyEndStates.push(!!stickyEnd);

      // Get column width - default to auto if not available
      const width = c.width;
      columnWidths.push(width ? (typeof width === 'number' ? width : parseInt(width as string, 10)) : undefined);

      if (!stickyActive && (sticky || stickyEnd)) {
        stickyActive = true;
      }
    }

    if (stickyActive != this._stickyActive) {
      if (this._stickyActive = stickyActive) {
        this.grid.addClass("pbl-ngrid-sticky-active");
      } else {
        this.grid.removeClass("pbl-ngrid-sticky-active");
      }
    }

    const headerRow = this.extApi.rowsApi.findColumnRow('header');
    const footerRow = this.extApi.rowsApi.findColumnRow('footer');
    const rows = this.extApi.rowsApi.dataRows().map(r => r.elementRef.nativeElement);
    if (headerRow) {
      rows.unshift(headerRow.elementRef.nativeElement);
    }
    if (footerRow) {
      rows.push(footerRow.elementRef.nativeElement);
    }

    if (!this.pblStickyColumnStylesNeedReset) {
      const stickyCheckReducer = (acc, d: PblNgridColumnDef<PblColumn>) => {
        return acc || (d?.hasStickyChanged() ?? false);
      };

      this.pblStickyColumnStylesNeedReset = this.extApi.columnApi.columns
        .map(c => c.columnDef)
        .reduce(stickyCheckReducer, false);
    }

    // Clear sticky positioning if needed
    if (this.pblStickyColumnStylesNeedReset) {
      this._clearStickyPositioning(rows);
      this.pblStickyColumnStylesNeedReset = false;
    }

    // Apply sticky positioning using our custom implementation
    this._updateStickyColumns(rows, stickyStartStates, stickyEndStates, columnWidths);

    // Reset the dirty state of the sticky input change since it has been used.
    this.extApi.columnApi.columns.forEach(c => c.columnDef?.resetStickyChanged());
  }

  /**
   * Clears all sticky positioning styles from the given rows and their cells.
   */
  private _clearStickyPositioning(rows: HTMLElement[]): void {
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="columnheader"], th, td')) as HTMLElement[];
      for (const cell of cells) {
        cell.classList.remove('pbl-table-sticky');
        cell.style.position = '';
        cell.style.top = '';
        cell.style.left = '';
        cell.style.right = '';
        cell.style.zIndex = '';
      }
    }
  }

  /**
   * Applies sticky positioning to columns in the given rows.
   * This is a custom implementation to replace the removed StickyStyler from Angular CDK 20.
   */
  private _updateStickyColumns(
    rows: HTMLElement[],
    stickyStartStates: boolean[],
    stickyEndStates: boolean[],
    columnWidths: number[]
  ): void {
    if (rows.length === 0 || stickyStartStates.length === 0) {
      return;
    }

    const isRtl = this._currentDirection === 'rtl';

    // Process each row
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="columnheader"], th, td')) as HTMLElement[];

      // Calculate cumulative offsets for sticky start columns
      let stickyStartOffset = 0;
      for (let i = 0; i < cells.length && i < stickyStartStates.length; i++) {
        if (stickyStartStates[i]) {
          this._setStickyStyle(cells[i], stickyStartOffset, 'start', isRtl);

          const cell = cells[i];
          cell?.classList.add('pbl-table-sticky');

          // Get the actual rendered width including borders but excluding padding
          const cellRect = cell.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(cell);
          const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
          const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
          const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
          const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;

          // Content width = total width - padding - border
          const contentWidth = cellRect.width - paddingLeft - paddingRight - borderLeft - borderRight;
          const totalCellWidth = cellRect.width;

          // Add current cell's total width to offset for next sticky column
          if (totalCellWidth) {
            stickyStartOffset += totalCellWidth;
          }
        } else {
          // Stop at first non-sticky column from the start
          break;
        }
      }

      // Calculate cumulative offsets for sticky end columns (from right to left)
      let stickyEndOffset = 0;
      for (let i = cells.length - 1; i >= 0; i--) {
        if (i < stickyEndStates.length && stickyEndStates[i]) {
          this._setStickyStyle(cells[i], stickyEndOffset, 'end', isRtl);

          const cell = cells[i];
          cell?.classList.add('pbl-table-sticky');

          // Get the actual rendered width
          const cellRect = cell.getBoundingClientRect();
          const totalCellWidth = cellRect.width;

          // Add current cell's total width to offset for next sticky column
          if (totalCellWidth) {
            stickyEndOffset += totalCellWidth;
          }
        } else {
          // Stop at first non-sticky column from the end
          break;
        }
      }
    }
  }

  /**
   * Applies sticky positioning style to a single cell.
   */
  private _setStickyStyle(
    element: HTMLElement,
    offset: number,
    position: 'start' | 'end',
    isRtl: boolean
  ): void {
    element.style.position = 'sticky';
    element.style.top = '0';

    let zIndex = '10';
    let cssProperty: string;

    if (position === 'start') {
      cssProperty = isRtl ? 'right' : 'left';
      zIndex = '1';
    } else {
      cssProperty = isRtl ? 'left' : 'right';
    }

    element.style.setProperty(cssProperty, offset + 'px');
    element.style.zIndex = zIndex;
  }
}
