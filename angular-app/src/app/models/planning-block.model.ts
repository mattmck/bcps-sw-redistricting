import { Feature, Polygon, MultiPolygon } from 'geojson';

export interface PlanningBlockProperties {
  OBJECTID: number;
  PBID: string;
  K5LiveAtt: number;
}

export interface PlanningBlock extends Feature<Polygon | MultiPolygon, PlanningBlockProperties> {}

export interface PlanningBlockFeatureCollection {
  type: 'FeatureCollection';
  features: PlanningBlock[];
}
