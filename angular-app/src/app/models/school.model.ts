import { Feature, Point } from 'geojson';

export interface SchoolProperties {
  OBJECTID: number;
  NAME: string;
  TYPE: string;
  X: number;
  Y: number;
  SRC: number;
  SRC2016?: number;
  SRC2017?: number;
  students: number;
  planningBlocks: string[];
  walkablePlanningBlocks?: number;
  walkablePercent?: number;
}

export interface School extends Feature<Point, SchoolProperties> {}

export interface SchoolFeatureCollection {
  type: 'FeatureCollection';
  features: School[];
}
