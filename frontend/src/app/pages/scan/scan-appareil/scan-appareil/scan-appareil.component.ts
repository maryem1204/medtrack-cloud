import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../config/api.config';
import { Appareil } from '../../../../services/appareil/appareil.service';
import { HistoriqueAppareil } from '../../../../services/historique/historique.service';
import { Maintenance } from '../../../../services/maintenance/maintenance.service';

interface ScanResponse {
  appareil: Appareil;
  historique: HistoriqueAppareil[];
  maintenances: Maintenance[];
}

@Component({
  selector: 'app-scan-appareil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scan-appareil.component.html',
})
export class ScanAppareilComponent implements OnInit {
  appareil: Appareil | null = null;
  historique: HistoriqueAppareil[] = [];
  maintenances: Maintenance[] = [];
  loading = true;
  erreur = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.erreur = true; this.loading = false; return; }

    this.http.get<ScanResponse>(`${API_BASE_URL}/public/scan/${id}`).subscribe({
      next: (res) => {
        this.appareil = res.appareil;
        this.historique = (res.historique || []).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
        this.maintenances = (res.maintenances || []).sort((x, y) => new Date(y.datePrevue).getTime() - new Date(x.datePrevue).getTime());
        this.loading = false;
      },
      error: () => { this.erreur = true; this.loading = false; },
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = { EN_STOCK: 'En stock', VENDU: 'Vendu', EN_MAINTENANCE: 'En maintenance', HORS_SERVICE: 'Hors service' };
    return labels[statut] || statut;
  }
  statutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_STOCK: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      VENDU: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      EN_MAINTENANCE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      HORS_SERVICE: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
    return classes[statut] || '';
  }
  maintenanceStatutLabel(statut: string): string {
    const labels: Record<string, string> = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
    return labels[statut] || statut;
  }
}