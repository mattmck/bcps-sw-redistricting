import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../components/map/map';
import { SchoolTableComponent } from '../../components/school-table/school-table';
import { DataService } from '../../services/data.service';
import { SchoolProperties } from '../../models/school.model';
import { PlanningBlockProperties } from '../../models/planning-block.model';
import { RedistrictingMeeting } from '../../models/redistricting-option.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MapComponent, SchoolTableComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  @ViewChild(SchoolTableComponent) tableComponent!: SchoolTableComponent;

  schools: SchoolProperties[] = [];
  schoolColors: { [schoolName: string]: string } = {};
  selectedSchool: SchoolProperties | null = null;
  selectedPlanningBlock: PlanningBlockProperties | null = null;
  selectedSchoolName = '';
  redistrictingMeetings: RedistrictingMeeting[] = [];
  snapshotInProgress = false;
  hideSnapshot = true;
  imageUrl = '';

  constructor(private dataService: DataService) {
    this.redistrictingMeetings = this.dataService.getRedistrictingMeetings();
  }

  onSchoolsUpdated(schools: SchoolProperties[]): void {
    this.schools = schools;
    if (this.mapComponent) {
      this.schoolColors = this.mapComponent.getSchoolColors();
    }
  }

  onSchoolSelected(school: SchoolProperties): void {
    this.selectedSchool = school;
    this.selectedSchoolName = school.NAME;
  }

  onPlanningBlockSelected(planningBlock: PlanningBlockProperties): void {
    this.selectedPlanningBlock = planningBlock;
    // Handle planning block assignment logic here
  }

  loadRedistrictingOption(fileName: string, field: string): void {
    if (this.mapComponent) {
      this.mapComponent.loadRedistrictingOption(fileName, field);
    }
  }

  loadCurrentDistricting(): void {
    this.loadRedistrictingOption('151118', 'ES1516');
  }

  takeSnapshot(): void {
    this.snapshotInProgress = true;
    // Map snapshot functionality will be implemented in the map component
    setTimeout(() => {
      this.snapshotInProgress = false;
      this.hideSnapshot = false;
      // this.mapComponent.getMap().then(function(map){
      //   leafletImage(map, function(err, canvas) {
      //     var img = document.createElement('img');
      //     var dimensions = map.getSize();
      //     img.width = dimensions.x;
      //     img.height = dimensions.y;
      //     img.src = canvas.toDataURL();
      //     $scope.imageUrl = img.src;
      //     document.getElementById('snapshot').innerHTML = '';
      //     document.getElementById('snapshot').appendChild(img);
      //     $scope.hideSnapshot = false;
      //     $scope.snapshotInProgress = false;
      //     $location.hash('snapshot');
      //     $anchorScroll();
      //   });
      // });
    }, 1000);
  }
}
