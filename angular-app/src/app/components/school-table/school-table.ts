import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolProperties } from '../../models/school.model';

@Component({
  selector: 'app-school-table',
  imports: [CommonModule],
  templateUrl: './school-table.html',
  styleUrl: './school-table.scss'
})
export class SchoolTableComponent {
  @Input() schools: SchoolProperties[] = [];
  @Input() schoolColors: { [schoolName: string]: string } = {};
  @Input() selectedSchoolName: string = '';

  sortColumn: string = '';
  sortAsc: boolean = true;
  Math = Math; // Expose Math to template

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }

    this.schools.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (column) {
        case 'NAME':
          aVal = a.NAME;
          bVal = b.NAME;
          break;
        case 'SRC':
          aVal = a.SRC;
          bVal = b.SRC;
          break;
        case 'SRC2016':
          aVal = a.SRC2016 !== undefined ? a.SRC2016 : a.SRC;
          bVal = b.SRC2016 !== undefined ? b.SRC2016 : b.SRC;
          break;
        case 'SRC2017':
          aVal = a.SRC2017 !== undefined ? a.SRC2017 : (a.SRC2016 !== undefined ? a.SRC2016 : a.SRC);
          bVal = b.SRC2017 !== undefined ? b.SRC2017 : (b.SRC2016 !== undefined ? b.SRC2016 : b.SRC);
          break;
        case 'students':
          aVal = a.students;
          bVal = b.students;
          break;
        case 'walkablePercent':
          aVal = a.walkablePercent || 0;
          bVal = b.walkablePercent || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return this.sortAsc ? -1 : 1;
      if (aVal > bVal) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  getCapacity(school: SchoolProperties, year: '2015' | '2016' | '2017'): number {
    if (year === '2017') {
      return school.SRC2017 !== undefined ? school.SRC2017 : (school.SRC2016 !== undefined ? school.SRC2016 : school.SRC);
    } else if (year === '2016') {
      return school.SRC2016 !== undefined ? school.SRC2016 : school.SRC;
    }
    return school.SRC;
  }

  getUtilization(school: SchoolProperties, year: '2015' | '2016' | '2017'): number {
    const capacity = this.getCapacity(school, year);
    return Math.round((school.students / capacity) * 100);
  }

  isOverCapacity(school: SchoolProperties, year: '2015' | '2016' | '2017'): boolean {
    return this.getUtilization(school, year) > 100;
  }
}
