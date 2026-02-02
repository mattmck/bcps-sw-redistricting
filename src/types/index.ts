export interface School {
  NAME: string
  TYPE: string
  OBJECTID: number
  X: number
  Y: number
  SRC: number
  SRC2016?: number
  SRC2017?: number
  students: number
  planningBlocks: string[]
  walkablePlanningBlocks?: number
  walkablePercent?: number
}

export interface PlanningBlock {
  PBID: string
  OBJECTID: number
  K5LiveAtt: string
}

export interface GeoJSONFeature {
  type: string
  properties: any
  geometry: {
    type: string
    coordinates: any
  }
}

export interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}

export interface RedistrictingOption {
  [schoolName: string]: string[]
}
