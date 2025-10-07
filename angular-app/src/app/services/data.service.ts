import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SchoolFeatureCollection, SchoolProperties } from '../models/school.model';
import { PlanningBlockFeatureCollection } from '../models/planning-block.model';
import { RedistrictingOption, RedistrictingOptionData, RedistrictingMeeting } from '../models/redistricting-option.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly ASSETS_PATH = '/assets';

  constructor(private http: HttpClient) {}

  /**
   * Load school locations GeoJSON data
   */
  loadSchools(): Observable<SchoolFeatureCollection> {
    return this.http.get<SchoolFeatureCollection>(`${this.ASSETS_PATH}/schoolLocations.geo.json`)
      .pipe(
        map(data => {
          // Filter for elementary schools in the southwest area
          data.features = data.features.filter(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            return props.TYPE === 'ES' &&
                   coords[1] < 39.313 &&
                   coords[0] < -76.6565 &&
                   props.NAME !== 'NewCatonsville ES';
          });

          // Initialize properties and normalize names
          data.features.forEach(feature => {
            const props = feature.properties;
            props.students = 0;
            props.planningBlocks = [];

            if (props.NAME === 'Edmonson Heights ES') {
              props.NAME = 'Edmondson Heights ES';
            }
            if (props.NAME === 'Old Catonsville ES') {
              props.NAME = 'Catonsville ES';
            }

            // Set capacity overrides
            this.setSchoolCapacity(props);
          });

          return data;
        })
      );
  }

  /**
   * Load planning blocks GeoJSON data
   */
  loadPlanningBlocks(): Observable<PlanningBlockFeatureCollection> {
    return this.http.get<PlanningBlockFeatureCollection>(`${this.ASSETS_PATH}/planningBlocks.geo.json`);
  }

  /**
   * Load a redistricting option from a specific date file
   */
  loadRedistrictingOption(fileName: string, fieldName: string): Observable<RedistrictingOption> {
    return this.http.get<RedistrictingOptionData>(`${this.ASSETS_PATH}/${fileName}.geo.json`)
      .pipe(
        map(data => {
          const option: RedistrictingOption = {};
          data.features.forEach(feature => {
            const schoolName = feature.properties[fieldName];
            if (schoolName) {
              if (!option[schoolName]) {
                option[schoolName] = [];
              }
              option[schoolName].push(feature.properties.PBID);
            }
          });
          return option;
        })
      );
  }

  /**
   * Load walking boundary for a school
   */
  loadWalkingBoundary(schoolName: string): Observable<any> {
    const fileName = schoolName.replace(' ', '_');
    return this.http.get(`${this.ASSETS_PATH}/${fileName}.walking.geo.json`);
  }

  /**
   * Get configuration for all redistricting meetings and options
   */
  getRedistrictingMeetings(): RedistrictingMeeting[] {
    return [
      {
        date: '2015-09-30',
        displayName: '9/30/2015 Meeting',
        options: [
          { name: 'option1', displayName: 'Option 1', field: 'Opt1', dataFile: '150930' },
          { name: 'option2', displayName: 'Option 2', field: 'Opt2', dataFile: '150930' },
          { name: 'option3', displayName: 'Option 3', field: 'Opt3', dataFile: '150930' }
        ]
      },
      {
        date: '2015-10-14',
        displayName: '10/14/2015 Meeting',
        options: [
          { name: 'optionA', displayName: 'Option A', field: 'OptA', dataFile: '151014' },
          { name: 'optionB', displayName: 'Option B', field: 'OptB', dataFile: '151014' },
          { name: 'optionC', displayName: 'Option C', field: 'OptC', dataFile: '151014' },
          { name: 'optionD', displayName: 'Option D', field: 'OptD', dataFile: '151014' },
          { name: 'optionE', displayName: 'Option E', field: 'OptE', dataFile: '151014' }
        ]
      },
      {
        date: '2015-10-28',
        displayName: '10/28/2015 Meeting',
        options: [
          { name: 'optionA1021', displayName: 'Option A', field: 'OptA', dataFile: '151021' },
          { name: 'optionB1021', displayName: 'Option B', field: 'OptB', dataFile: '151021' },
          { name: 'optionC1021', displayName: 'Option C', field: 'OptC', dataFile: '151021' },
          { name: 'optionD1021', displayName: 'Option D', field: 'OptD', dataFile: '151021' },
          { name: 'optionE1021', displayName: 'Option E', field: 'OptE', dataFile: '151021' },
          { name: 'optionF1021', displayName: 'Option F', field: 'OptF', dataFile: '151021' },
          { name: 'optionG1021', displayName: 'Option G', field: 'OptG', dataFile: '151021' }
        ]
      },
      {
        date: '2015-11-11',
        displayName: '11/11/2015 Meeting',
        options: [
          { name: 'optionA1111', displayName: 'Option A', field: 'OptA', dataFile: '151111' },
          { name: 'optionB1111', displayName: 'Option B', field: 'OptB', dataFile: '151111' },
          { name: 'optionC1111', displayName: 'Option C', field: 'OptC', dataFile: '151111' },
          { name: 'optionD1111', displayName: 'Option D', field: 'OptD', dataFile: '151111' },
          { name: 'optionE1111', displayName: 'Option E', field: 'OptE', dataFile: '151111' },
          { name: 'optionF1111', displayName: 'Option F', field: 'OptF', dataFile: '151111' },
          { name: 'optionG1111', displayName: 'Option G', field: 'OptG', dataFile: '151111' },
          { name: 'optionH1111', displayName: 'Option H', field: 'OptH', dataFile: '151111' },
          { name: 'optionI1111', displayName: 'Option I', field: 'OptI', dataFile: '151111' },
          { name: 'optionJ1111', displayName: 'Option J', field: 'OptJ', dataFile: '151111' },
          { name: 'optionK1111', displayName: 'Option K', field: 'OptK', dataFile: '151111' },
          { name: 'optionL1111', displayName: 'Option L', field: 'OptL', dataFile: '151111' }
        ]
      },
      {
        date: '2015-11-18',
        displayName: '11/18/2015 Meeting',
        options: [
          { name: 'current', displayName: 'Current', field: 'ES1516', dataFile: '151118' },
          { name: 'option11118', displayName: 'Option 1', field: 'NovOpt1', dataFile: '151118' },
          { name: 'option21118', displayName: 'Option 2', field: 'NovOpt2', dataFile: '151118' },
          { name: 'option31118', displayName: 'Option 3', field: 'NovOpt3', dataFile: '151118' },
          { name: 'option41118', displayName: 'Option 4', field: 'NovOpt4', dataFile: '151118' }
        ]
      }
    ];
  }

  /**
   * Set school capacity based on special cases
   */
  private setSchoolCapacity(props: SchoolProperties): void {
    switch (props.NAME) {
      case 'Catonsville ES':
        props.SRC2016 = 715;
        break;
      case 'Relay ES':
        props.SRC2017 = 689;
        break;
      case 'Westchester ES':
        props.SRC2016 = 699;
        break;
      case 'Westowne ES':
        props.SRC2016 = 650;
        break;
    }
  }
}
