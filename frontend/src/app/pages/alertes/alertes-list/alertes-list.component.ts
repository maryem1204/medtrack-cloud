import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlerteService, Alerte } from '../../../services/alerte/alerte.service';

@Component({
  selector: 'app-alertes-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alertes-list.component.html',
})
export class AlertesListComponent implements OnInit {
  alertes: Alerte[] = [];
  loading = true;
  generating = false;

  constructor(private alerteService: AlerteService) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.alerteService.getAll().subscribe({
      next: (data) => { this.alertes = data.filter(a => a.statut === 'ACTIVE'); this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  genererAlertes() {
    this.generating = true;
    this.alerteService.generer().subscribe({
      next: () => { this.generating = false; this.charger(); },
      error: (err) => { console.error(err); this.generating = false; },
    });
  }

  marquerTraitee(a: Alerte) {
    if (!a.id) return;
    this.alerteService.update(a.id, { statut: 'TRAITEE' }).subscribe({
      next: () => this.charger(),
      error: (err) => console.error(err),
    });
  }

  typeLabel(type: string): string {
    return type === 'MAINTENANCE_RETARD' ? '⚠ Maintenance en retard' : '⏰ Maintenance urgente';
  }
  typeClass(type: string): string {
    return type === 'MAINTENANCE_RETARD'
      ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';
  }
}