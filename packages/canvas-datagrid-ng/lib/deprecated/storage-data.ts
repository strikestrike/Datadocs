//@ts-nocheck
import type { GridPrivateProperties } from '../types';

export class GridStorageData {
  storedSettings: any;
  constructor(private readonly grid: GridPrivateProperties) {}

  setStorageData = () => {
    const self = this.grid;
    //@ts-ignore
    if (!self.attributes.saveAppearance || !self.attributes.name) {
      return;
    }
    var visibility = {};
    self.getSchema().forEach(function (column) {
      visibility[column.dataKey] = !column.hidden;
    });
    localStorage.setItem(
      self.storageName + '-' + self.attributes.name,
      JSON.stringify({
        // TODO: Sizes should not be accessed like this.
        /* sizes: {
          rows: self.sizes.rows,
          columns: self.sizes.columns,
        }, */
        orders: {
          rows: self.orders.rows,
          columns: self.orders.columns,
        },
        orderBy: self.orderBy,
        orderDirection: self.orderDirection,
        visibility: visibility,
      }),
    );
  };

  tryLoadStoredSettings = () => {
    const self = this.grid;
    var s;
    this.reloadStoredValues();
    if (
      this.storedSettings &&
      typeof this.storedSettings.orders === 'object' &&
      this.storedSettings.orders !== null
    ) {
      if (
        this.storedSettings.orders.rows.length >= (self.viewData || []).length
      ) {
        self.orders.rows = this.storedSettings.orders.rows;
      }
      s = self.getSchema();
      if (this.storedSettings.orders.columns.length === s.length) {
        self.orders.columns = this.storedSettings.orders.columns;
      }
      self.orderBy =
        this.storedSettings.orderBy === undefined
          ? s[0].name
          : this.storedSettings.orderBy;
      self.orderDirection =
        this.storedSettings.orderDirection === undefined
          ? 'asc'
          : this.storedSettings.orderDirection;
      if (
        this.storedSettings.orderBy !== undefined &&
        self.getHeaderByName(self.orderBy) &&
        self.orderDirection
      ) {
        self.order(self.orderBy, self.orderDirection);
      }
    }
  };

  reloadStoredValues = () => {
    const self = this.grid;
    //@ts-ignore
    if (self.attributes.name && self.attributes.saveAppearance) {
      try {
        this.storedSettings = localStorage.getItem(
          self.storageName + '-' + self.attributes.name,
        );
      } catch (e) {
        console.warn('Error loading stored values. ' + e.message);
        this.storedSettings = undefined;
      }
      if (this.storedSettings) {
        try {
          this.storedSettings = JSON.parse(this.storedSettings);
        } catch (e) {
          console.warn('could not read settings from localStore', e);
          this.storedSettings = undefined;
        }
      }
      if (this.storedSettings) {
        if (
          typeof this.storedSettings.sizes === 'object' &&
          this.storedSettings.sizes !== null
        ) {
          // TODO: Sizes should not be accessed like this.
          /* self.sizes.rows = this.storedSettings.sizes.rows;
          self.sizes.columns = this.storedSettings.sizes.columns;
          ['trees', 'columns', 'rows'].forEach(function (i) {
            if (!self.sizes[i]) {
              self.sizes[i] = {};
            }
          }); */
        }
        if (typeof this.storedSettings.visibility === 'object') {
          self.getSchema().forEach(function (column) {
            if (
              this.storedSettings.visibility &&
              this.storedSettings.visibility[column.dataKey] !== undefined
            ) {
              column.hidden = !this.storedSettings.visibility[column.dataKey];
            }
          });
        }
      }
    }
  };
}
