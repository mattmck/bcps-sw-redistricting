import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { DataService } from '../../services/data.service';
import { MapUtilsService } from '../../services/map-utils.service';
import { SchoolProperties } from '../../models/school.model';
import { PlanningBlockProperties } from '../../models/planning-block.model';
import { RedistrictingOption } from '../../models/redistricting-option.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() schoolsUpdated = new EventEmitter<SchoolProperties[]>();
  @Output() schoolSelected = new EventEmitter<SchoolProperties>();
  @Output() planningBlockSelected = new EventEmitter<PlanningBlockProperties>();

  private map!: L.Map;
  private planningBlockLayers: { [pbid: string]: L.Layer } = {};
  private schoolColors: { [schoolName: string]: string } = {};
  private schools: SchoolProperties[] = [];
  private planningBlocks: PlanningBlockProperties[] = [];
  private rawPlanningBlocks: any[] = [];
  private destroy$ = new Subject<void>();

  private readonly colors = [
    '#4D4D4D', '#5DA5DA', '#363330ff', '#60BD68', '#F17CB0',
    '#B2912F', '#B276B2', '#DECF3F', '#F15854'
  ];
  private currentColorIndex = 0;

  private readonly mapCenter: L.LatLngExpression = [39.271697, -76.730514];
  private readonly tileUrl = 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWF0dG1jayIsImEiOiJjaWZpaDlyejlibDB2c3htNzFnZG5pMGV2In0.v9hKZ_mdZB8WNJHE9FJGjg';

  constructor(
    private dataService: DataService,
    private mapUtils: MapUtilsService
  ) {}

  ngOnInit(): void {
    this.initializeMap();
    this.loadData();
    this.mapUtils.configureLeafletIcons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    this.map = L.map('map', {
      center: this.mapCenter,
      zoom: 12,
      maxZoom: 22
    });

    L.tileLayer(this.tileUrl, {
      maxZoom: 22,
      attribution: '© MapBox'
    }).addTo(this.map);
  }

  private loadData(): void {
    this.dataService.loadPlanningBlocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.planningBlocks = data.features.map(f => f.properties);
        this.rawPlanningBlocks = data.features;

        L.geoJSON(data, {
          style: { fillOpacity: 0.5 },
          onEachFeature: (feature, layer) => this.onPlanningBlockFeature(feature, layer)
        }).addTo(this.map);

        this.loadSchools();
      });
  }

  private loadSchools(): void {
    this.dataService.loadSchools()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.schools = data.features.map(f => f.properties);

        L.geoJSON(data, {
          pointToLayer: (feature, latlng) => this.createSchoolMarker(feature, latlng),
          onEachFeature: (feature, layer) => this.onSchoolFeature(feature, layer)
        }).addTo(this.map);

        this.schoolsUpdated.emit(this.schools);
      });
  }

  private createSchoolMarker(feature: any, latlng: L.LatLngExpression): L.CircleMarker {
    const color = this.getNextColor();
    this.schoolColors[feature.properties.NAME] = color;

    return L.circleMarker(latlng, {
      radius: 10,
      fillColor: color,
      color: color,
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    });
  }

  private getNextColor(): string {
    const color = this.colors[this.currentColorIndex];
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    return color;
  }

  private onSchoolFeature(feature: any, layer: L.Layer): void {
    layer.bindTooltip(feature.properties.NAME);
    layer.on('click', () => {
      this.schoolSelected.emit(feature.properties);
    });
  }

  private onPlanningBlockFeature(feature: any, layer: L.Layer): void {
    const pbid = feature.properties.PBID;
    this.planningBlockLayers[pbid] = layer;
    layer.bindTooltip('Planning Block: ' + pbid);
    layer.on('click', () => {
      this.planningBlockSelected.emit(feature.properties);
    });
  }

  loadOption(option: RedistrictingOption): void {
    this.schools.forEach(school => {
      const schoolBlocks = option[school.NAME];
      if (schoolBlocks) {
        school.planningBlocks = schoolBlocks;
        schoolBlocks.forEach(pbid => {
          const layer = this.planningBlockLayers[pbid];
          if (layer && layer instanceof L.Path) {
            layer.setStyle({ fillColor: this.schoolColors[school.NAME] });
          }
        });
      }
    });

    this.calculateStudentCounts();
    this.schoolsUpdated.emit(this.schools);
  }

  private calculateStudentCounts(): void {
    this.schools.forEach(school => {
      school.students = school.planningBlocks.reduce((sum, pbid) => {
        const block = this.planningBlocks.find(pb => pb.PBID === pbid);
        return sum + (block ? parseInt(block.K5LiveAtt.toString()) : 0);
      }, 0);

      school.students += this.getSchoolAdjustment(school.NAME);
      school.walkablePlanningBlocks = this.calculateWalkableBlocks(school);
      school.walkablePercent = school.planningBlocks.length > 0 
        ? school.walkablePlanningBlocks / school.planningBlocks.length 
        : 0;
    });
  }

  private getSchoolAdjustment(schoolName: string): number {
    const adjustments: { [key: string]: number } = {
      'Arbutus ES': 28, 'Catonsville ES': 51, 'Edmondson Heights ES': 75,
      'Halethorpe ES': 67, 'Hillcrest ES': 14, 'Johnnycake ES': 80,
      'Lansdowne ES': 39, 'Relay ES': 46, 'Westchester ES': 22,
      'Westowne ES': 69, 'Woodbridge ES': 50
    };
    return adjustments[schoolName] || 0;
  }

  private calculateWalkableBlocks(school: SchoolProperties): number {
    return school.planningBlocks.filter(pbid => {
      const block = this.rawPlanningBlocks.find(pb => pb.properties.PBID === pbid);
      if (!block) return false;
      return this.checkBlockWalkable(block, school.Y, school.X);
    }).length;
  }

  private checkBlockWalkable(block: any, schoolLat: number, schoolLon: number): boolean {
    const coords = block.geometry.coordinates;
    for (const ring of coords) {
      for (const coord of ring) {
        const distance = this.mapUtils.calculateDistance(coord[1], coord[0], schoolLat, schoolLon, 'M');
        if (distance >= 1) return false;
      }
    }
    return true;
  }

  loadRedistrictingOption(fileName: string, field: string): void {
    this.dataService.loadRedistrictingOption(fileName, field)
      .pipe(takeUntil(this.destroy$))
      .subscribe(option => this.loadOption(option));
  }

  getSchoolColors(): { [schoolName: string]: string } {
    return this.schoolColors;
  }

  getSchools(): SchoolProperties[] {
    return this.schools;
  }
}
