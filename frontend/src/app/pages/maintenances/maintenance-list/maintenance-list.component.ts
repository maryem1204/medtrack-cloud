import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService, Maintenance } from '../../../services/maintenance/maintenance.service';
import { AppareilService, Appareil } from '../../../services/appareil/appareil.service';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur/utilisateur.service';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance-list.component.html',
})
export class MaintenanceListComponent implements OnInit {
  maintenances: Maintenance[] = [];
  appareils: Appareil[] = [];
  techniciens: Utilisateur[] = [];
  loading = true;

  // ── Filtres ──────────────────────────────────────────────────────────────
  showFiltres = false;

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

  private _filtreStatut = '';
  get filtreStatut() { return this._filtreStatut; }
  set filtreStatut(v: string) { this._filtreStatut = v; this.page = 1; }

  get filtresActifs(): boolean {
    return !!(this._searchTerm || this._filtreStatut);
  }

  reinitialiserFiltres() {
    this._searchTerm = '';
    this._filtreStatut = '';
    this.showFiltres = false;
    this.page = 1;
  }

  page = 1;
  pageSize = 6;
  get totalPages(): number { return Math.max(1, Math.ceil(this.maintenancesFiltrees().length / this.pageSize)); }
  get maintenancesPage(): Maintenance[] {
    const start = (this.page - 1) * this.pageSize;
    return this.maintenancesFiltrees().slice(start, start + this.pageSize);
  }
  allerPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }
  pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  showModal = false;
  formErreur = '';
  nouvelleMaintenance: { datePrevue: string; type: string; statut: string; appareilId: number | null; technicienId: number | null } = {
    datePrevue: '', type: 'CALIBRATION', statut: 'PLANIFIEE', appareilId: null, technicienId: null
  };

  showConfirmSuppression = false;
  maintenanceASupprimer: Maintenance | null = null;

  showHistorique = false;
  appareilHistorique: { id: number; nom?: string; numeroSerie?: string } | null = null;

  constructor(
    private maintenanceService: MaintenanceService,
    private appareilService: AppareilService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.appareilService.getAll().subscribe({
      next: (apps) => {
        this.appareils = apps;
        this.utilisateurService.getAll().subscribe({
          next: (users) => {
            this.techniciens = users.filter(u => u.role === 'TECHNICIEN');
            this.maintenanceService.getAll().subscribe({
              next: (data) => { this.maintenances = data; this.loading = false; },
              error: (err) => { console.error(err); this.loading = false; },
            });
          },
          error: (err) => { console.error(err); this.loading = false; },
        });
      },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  maintenancesFiltrees(): Maintenance[] {
    const term = this.searchTerm.toLowerCase();
    return this.maintenances.filter(m => {
      const matchSearch = !term ||
        (m.appareil?.nom || '').toLowerCase().includes(term) ||
        (m.appareil?.numeroSerie || '').toLowerCase().includes(term) ||
        (m.technicien ? `${m.technicien.nom} ${m.technicien.prenom}` : '').toLowerCase().includes(term) ||
        this.typeLabel(m.type).toLowerCase().includes(term);
      const matchStatut = !this.filtreStatut || m.statut === this.filtreStatut;
      return matchSearch && matchStatut;
    });
  }

  countByStatut(statut: string): number {
    return this.maintenances.filter(m => m.statut === statut).length;
  }

  joursRestants(m: Maintenance): number {
    const diff = new Date(m.datePrevue).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  estUrgente(m: Maintenance): boolean {
    return m.statut === 'PLANIFIEE' && this.joursRestants(m) <= 7;
  }

  estEnRetard(m: Maintenance): boolean {
    return m.statut === 'PLANIFIEE' && this.joursRestants(m) < 0;
  }

  ouvrirModal() {
    this.nouvelleMaintenance = { datePrevue: this.dateAujourdhui(), type: 'CALIBRATION', statut: 'PLANIFIEE', appareilId: null, technicienId: null };
    this.formErreur = '';
    this.showModal = true;
  }
    private dateAujourdhui(): string {
    return new Date().toISOString().slice(0, 10);
  }

  fermerModal() { this.showModal = false; }

  enregistrer() {
    if (!this.nouvelleMaintenance.appareilId) { this.formErreur = 'Sélectionne un appareil.'; return; }
    if (!this.nouvelleMaintenance.datePrevue) { this.formErreur = 'La date prévue est obligatoire.'; return; }
    this.formErreur = '';

    const payload: Maintenance = {
      datePrevue: this.nouvelleMaintenance.datePrevue,
      type: this.nouvelleMaintenance.type,
      statut: this.nouvelleMaintenance.statut,
      appareil: { id: this.nouvelleMaintenance.appareilId },
      technicien: this.nouvelleMaintenance.technicienId ? { id: this.nouvelleMaintenance.technicienId } : null,
    };

    this.maintenanceService.create(payload).subscribe({
      next: () => { this.fermerModal(); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  marquerTerminee(m: Maintenance) {
    if (!m.id) return;
    const payload: Maintenance = { ...m, statut: 'TERMINEE', dateRealisee: new Date().toISOString().slice(0, 10) };
    this.maintenanceService.update(m.id, payload).subscribe({
      next: () => this.charger(),
      error: (err) => console.error(err),
    });
  }

  voirHistorique(appareil?: { id: number; nom?: string; numeroSerie?: string } | null) {
    if (!appareil) return;
    this.appareilHistorique = appareil;
    this.showHistorique = true;
  }
  fermerHistorique() { this.showHistorique = false; this.appareilHistorique = null; }

  historiqueAppareil(appareilId?: number): Maintenance[] {
    if (!appareilId) return [];
    return this.maintenances
      .filter(m => m.appareil?.id === appareilId && m.statut === 'TERMINEE')
      .sort((a, b) => new Date(b.dateRealisee || 0).getTime() - new Date(a.dateRealisee || 0).getTime());
  }

  demanderSuppression(m: Maintenance) { this.maintenanceASupprimer = m; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.maintenanceASupprimer = null; }
  confirmerSuppression() {
    if (!this.maintenanceASupprimer?.id) return;
    this.maintenanceService.delete(this.maintenanceASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.maintenanceASupprimer = null; this.charger(); },
      error: (err) => console.error(err),
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = { CALIBRATION: 'Calibration', REPARATION: 'Réparation', CONTROLE_PERIODIQUE: 'Contrôle périodique' };
    return labels[type] || type;
  }
  statutLabel(statut: string): string {
    const labels: Record<string, string> = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
    return labels[statut] || statut;
  }
  statutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      PLANIFIEE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      EN_COURS: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      TERMINEE: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      ANNULEE: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
    return classes[statut] || '';
  }
  showHistoriqueGlobal = false;

  ouvrirHistoriqueGlobal() { this.showHistoriqueGlobal = true; }
  fermerHistoriqueGlobal() { this.showHistoriqueGlobal = false; }

  toutesInterventionsTerminees(): Maintenance[] {
    return this.maintenances
      .filter(m => m.statut === 'TERMINEE')
      .sort((a, b) => new Date(b.dateRealisee || 0).getTime() - new Date(a.dateRealisee || 0).getTime());
  }
  vueMode: 'cartes' | 'tableau' = 'cartes';
triColonne: 'appareil' | 'type' | 'datePrevue' | 'statut' = 'datePrevue';
triSens: 'asc' | 'desc' = 'asc';

changerTri(colonne: 'appareil' | 'type' | 'datePrevue' | 'statut') {
  if (this.triColonne === colonne) this.triSens = this.triSens === 'asc' ? 'desc' : 'asc';
  else { this.triColonne = colonne; this.triSens = 'asc'; }
}

get maintenancesTrieesPage(): Maintenance[] {
  const src = [...this.maintenancesPage];
  src.sort((a, b) => {
    let cmp = 0;
    if (this.triColonne === 'appareil') cmp = (a.appareil?.nom || '').localeCompare(b.appareil?.nom || '');
    else if (this.triColonne === 'type') cmp = this.typeLabel(a.type).localeCompare(this.typeLabel(b.type));
    else if (this.triColonne === 'datePrevue') cmp = (a.datePrevue || '').localeCompare(b.datePrevue || '');
    else if (this.triColonne === 'statut') cmp = a.statut.localeCompare(b.statut);
    return this.triSens === 'asc' ? cmp : -cmp;
  });
  return src;
}
}