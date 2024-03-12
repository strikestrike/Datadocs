import type { CreateGridFn, GridStaticProperties } from './grid';

declare global {
  interface Window {
    canvasDatagrid: CreateGridFn & GridStaticProperties;
    EXCLUDE_GLOBAL?: boolean;
  }
}

export * from './base-structs';
export * from './base';
export * from './behaviour-enum';
export * from './cell-meta';
export * from './cell';
export * from './column-types';
export * from './column-schema';
export * from './column-header';
export * from './data-format';
export * from './drawing';
export * from './events';
export * from './scroll';
export * from '../selections/types';
export * from '../highlights/types';
export * from '../named-ranges/spec';
export * from '../data/data-source/spec';
export * from '../cell-helper/types';
export * from './style';
export type { GridInitArgs } from './grid-init-args';
export type {
  GridInstance,
  GridPublicAPI,
  GridPrivateProperties,
  GridPublicProperties,
  GridStaticProperties,
} from './grid';
