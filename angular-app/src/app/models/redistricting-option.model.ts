export interface RedistrictingOption {
  [schoolName: string]: string[]; // School name maps to array of planning block IDs
}

export interface RedistrictingOptionData {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: {
      PBID: string;
      [key: string]: any; // For various option fields like Opt1, Opt2, OptA, etc.
    };
    geometry: any;
  }[];
}

export interface RedistrictingMeeting {
  date: string;
  displayName: string;
  options: RedistrictingOptionConfig[];
}

export interface RedistrictingOptionConfig {
  name: string;
  displayName: string;
  field: string;
  dataFile: string;
  data?: RedistrictingOption;
}
