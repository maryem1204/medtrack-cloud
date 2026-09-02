import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppareilService, Appareil } from '../../../services/appareil/appareil.service';
import * as QRCode from 'qrcode';
import { HistoriqueService, HistoriqueAppareil } from '../../../services/historique/historique.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthService } from '../../../services/auth/auth.service';

type VueMode = 'grille' | 'tableau';
type TriChamp = 'nom' | 'numeroSerie' | 'dateImport' | 'statut';
type ToastType = 'success' | 'error' | 'info';

const STATUTS = ['EN_STOCK', 'VENDU', 'EN_MAINTENANCE', 'HORS_SERVICE'];

@Component({
  selector: 'app-appareils-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './appareils-list.component.html',
})
export class AppareilsListComponent implements OnInit {
  appareils: Appareil[] = [];
  loading = true;

  // --- Vue (grille / tableau) ---
  vue: VueMode = (localStorage.getItem('appareils.vue') as VueMode) || 'grille';
  changerVue(v: VueMode) { this.vue = v; localStorage.setItem('appareils.vue', v); }

  // --- Recherche avec debounce ---
  private _searchTerm = '';
  private searchTimeout: any;
  searchInput = '';
  get searchTerm() { return this._searchTerm; }
  onSearchInput(v: string) {
    this.searchInput = v;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this._searchTerm = v; this.page = 1; }, 300);
  }
  effacerRecherche() { this.searchInput = ''; this._searchTerm = ''; this.page = 1; }

  // --- Filtres avancés ---
  showFiltres = false;
  statutsSelectionnes: string[] = [];
  categoriesSelectionnees: string[] = [];

  toggleFiltreStatut(statut: string) {
    const i = this.statutsSelectionnes.indexOf(statut);
    if (i === -1) this.statutsSelectionnes.push(statut); else this.statutsSelectionnes.splice(i, 1);
    this.page = 1;
  }
  toggleFiltreCategorie(cat: string) {
    const i = this.categoriesSelectionnees.indexOf(cat);
    if (i === -1) this.categoriesSelectionnees.push(cat); else this.categoriesSelectionnees.splice(i, 1);
    this.page = 1;
  }
  categoriesDisponibles(): string[] {
    return Array.from(new Set(this.appareils.map(a => a.categorie))).sort();
  }
  get nombreFiltresActifs(): number {
    return this.statutsSelectionnes.length + this.categoriesSelectionnees.length;
  }
  reinitialiserFiltres() {
    this.statutsSelectionnes = [];
    this.categoriesSelectionnees = [];
    this.searchInput = '';
    this._searchTerm = '';
    this.page = 1;
  }

  // --- Tri ---
  triChamp: TriChamp = 'nom';
  triOrdre: 'asc' | 'desc' = 'asc';
  trierPar(champ: TriChamp) {
    if (this.triChamp === champ) this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
    else { this.triChamp = champ; this.triOrdre = 'asc'; }
  }
  iconeTri(champ: TriChamp): string {
    if (this.triChamp !== champ) return '';
    return this.triOrdre === 'asc' ? '↑' : '↓';
  }

  page = 1;
  pageSize = 6;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.appareilsFiltres().length / this.pageSize));
  }
  get appareilsPage(): Appareil[] {
    const start = (this.page - 1) * this.pageSize;
    return this.appareilsFiltres().slice(start, start + this.pageSize);
  }
  allerPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }
  pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  showModal = false;
  modeEdition = false;
  nouvelAppareil: Appareil = { numeroSerie: '', nom: '', categorie: 'MEDICAL', dateImport: '', statut: 'EN_STOCK' };
  formErreur = '';

  // QR Code
  showQrModal = false;
  qrDataUrl = '';
  appareilQr: Appareil | null = null;

  // Traçabilité
  showHistoriqueTracabilite = false;
  historiqueAppareil: HistoriqueAppareil[] = [];
  appareilHistoriqueTrace: Appareil | null = null;

  // --- Suppression (modal de confirmation au lieu de confirm() natif) ---
  showConfirmSuppression = false;
  appareilASupprimer: Appareil | null = null;

  // --- Toasts ---
  toast: { message: string; type: ToastType } | null = null;
  private toastTimeout: any;
  private afficherToast(message: string, type: ToastType = 'success') {
    clearTimeout(this.toastTimeout);
    this.toast = { message, type };
    this.toastTimeout = setTimeout(() => (this.toast = null), 3500);
  }

  constructor(
    private appareilService: AppareilService,
    private historiqueService: HistoriqueService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.loading = true;
    this.appareilService.getAll().subscribe({
      next: (data) => { this.appareils = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; this.afficherToast('Impossible de charger les appareils.', 'error'); },
    });
  }

  ouvrirModal() {
    const prochainNumero = this.appareils.length + 1;
    this.nouvelAppareil = {
      numeroSerie: `MED-${String(prochainNumero).padStart(3, '0')}`,
      nom: '', categorie: 'MEDICAL', dateImport: '', statut: 'EN_STOCK'
    };
    this.modeEdition = false;
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() {
    this.showModal = false;
  }

  enregistrer() {
    if (!this.nouvelAppareil.nom.trim()) {
      this.formErreur = 'Le nom est obligatoire.';
      return;
    }
    if (!this.nouvelAppareil.dateImport) {
      this.formErreur = "La date d'import est obligatoire.";
      return;
    }
    this.formErreur = '';

    if (this.modeEdition && this.nouvelAppareil.id) {
      this.appareilService.update(this.nouvelAppareil.id, this.nouvelAppareil).subscribe({
        next: () => { this.fermerModal(); this.charger(); this.afficherToast('Appareil modifié avec succès.'); },
        error: (err) => { console.error(err); this.afficherToast("Erreur lors de la modification.", 'error'); },
      });
    } else {
      this.appareilService.create(this.nouvelAppareil).subscribe({
        next: () => {
          this.historiqueService.create({
            evenement: 'IMPORT',
            date: new Date().toISOString(),
            auteur: 'Système',
          }).subscribe();
          this.fermerModal();
          this.charger();
          this.afficherToast('Appareil ajouté avec succès.');
        },
        error: (err) => { console.error(err); this.afficherToast("Erreur lors de l'ajout.", 'error'); },
      });
    }
  }

  // --- Filtrage + tri combinés ---
  appareilsFiltres(): Appareil[] {
    const term = this.searchTerm.toLowerCase();

    let liste = this.appareils.filter(a => {
      const matchSearch = !term ||
        a.nom.toLowerCase().includes(term) ||
        a.numeroSerie.toLowerCase().includes(term);
      const matchStatut = this.statutsSelectionnes.length === 0 || this.statutsSelectionnes.includes(a.statut);
      const matchCategorie = this.categoriesSelectionnees.length === 0 || this.categoriesSelectionnees.includes(a.categorie);
      return matchSearch && matchStatut && matchCategorie;
    });

    liste = [...liste].sort((a, b) => {
      const va = (a[this.triChamp] || '').toString().toLowerCase();
      const vb = (b[this.triChamp] || '').toString().toLowerCase();
      const cmp = va.localeCompare(vb);
      return this.triOrdre === 'asc' ? cmp : -cmp;
    });

    return liste;
  }

  countByStatut(statut: string): number {
    return this.appareils.filter(a => a.statut === statut).length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_STOCK: 'En stock', VENDU: 'Vendu',
      EN_MAINTENANCE: 'En maintenance', HORS_SERVICE: 'Hors service'
    };
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

  statutBorderClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_STOCK: 'border-l-green-400',
      VENDU: 'border-l-brand-400',
      EN_MAINTENANCE: 'border-l-amber-400',
      HORS_SERVICE: 'border-l-red-400',
    };
    return classes[statut] || 'border-l-gray-200';
  }

  statutCouleur(statut: string): string {
    const couleurs: Record<string, string> = {
      EN_STOCK: '#16a34a', VENDU: '#0d8f9e', EN_MAINTENANCE: '#d97706', HORS_SERVICE: '#dc2626',
    };
    return couleurs[statut] || '#9ca3af';
  }

  modifier(appareil: Appareil) {
    this.nouvelAppareil = { ...appareil };
    this.modeEdition = true;
    this.formErreur = '';
    this.showModal = true;
  }

  demanderSuppression(appareil: Appareil) { this.appareilASupprimer = appareil; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.appareilASupprimer = null; }
  confirmerSuppression() {
    if (!this.appareilASupprimer?.id) return;
    const nom = this.appareilASupprimer.nom;
    this.appareilService.delete(this.appareilASupprimer.id).subscribe({
      next: () => {
        this.showConfirmSuppression = false;
        this.appareilASupprimer = null;
        this.charger();
        this.afficherToast(`"${nom}" a été supprimé.`);
      },
      error: (err) => { console.error(err); this.afficherToast('Suppression impossible.', 'error'); },
    });
  }

  async voirQrCode(a: Appareil) {
    this.appareilQr = a;
    const url = `http://192.168.1.7:4200/scan/${a.id}`;
    this.qrDataUrl = await QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: '#0a4a53', light: '#ffffff' } });
    this.showQrModal = true;
  }
  fermerQrModal() { this.showQrModal = false; }

  telechargerQr() {
    if (!this.qrDataUrl || !this.appareilQr) return;
    const a = document.createElement('a');
    a.href = this.qrDataUrl;
    a.download = `QR-${this.appareilQr.numeroSerie}.png`;
    a.click();
  }

  voirTracabilite(a: Appareil) {
    if (!a.id) return;
    this.appareilHistoriqueTrace = a;
    this.historiqueService.getByAppareil(a.id).subscribe({
      next: (data) => {
        this.historiqueAppareil = data.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
        this.showHistoriqueTracabilite = true;
      },
      error: (err) => { console.error(err); this.afficherToast("Impossible de charger l'historique.", 'error'); },
    });
  }
  fermerTracabilite() { this.showHistoriqueTracabilite = false; }

  // --- Indicateurs clés (KPI) ---
  get kpiEnStock(): number { return this.countByStatut('EN_STOCK'); }
  get kpiVendu(): number { return this.countByStatut('VENDU'); }
  get kpiMaintenance(): number { return this.countByStatut('EN_MAINTENANCE'); }
  get kpiHorsService(): number { return this.countByStatut('HORS_SERVICE'); }

  // --- Répartition par statut (barre segmentée) ---
  repartitionParStatut(): { statut: string; label: string; count: number; pct: number; couleur: string }[] {
    const total = this.appareils.length || 1;
    return STATUTS.map(s => ({
      statut: s,
      label: this.statutLabel(s),
      count: this.countByStatut(s),
      pct: Math.round((this.countByStatut(s) / total) * 1000) / 10,
      couleur: this.statutCouleur(s),
    })).filter(r => r.count > 0);
  }

  // --- Insights intelligents ---
  get tauxDisponibilite(): number {
    if (this.appareils.length === 0) return 0;
    return Math.round((this.kpiEnStock / this.appareils.length) * 100);
  }

  get tauxMaintenance(): number {
    if (this.appareils.length === 0) return 0;
    return Math.round((this.kpiMaintenance / this.appareils.length) * 100);
  }

  get importsCeMois(): number {
    const maintenant = new Date();
    return this.appareils.filter(a => {
      if (!a.dateImport) return false;
      const d = new Date(a.dateImport);
      return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear();
    }).length;
  }

  get categorieDominante(): { nom: string; count: number; pourcentage: number } | null {
    if (this.appareils.length === 0) return null;
    const compte: Record<string, number> = {};
    this.appareils.forEach(a => { compte[a.categorie] = (compte[a.categorie] || 0) + 1; });
    const entries = Object.entries(compte).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    return { nom: entries[0][0], count: entries[0][1], pourcentage: Math.round((entries[0][1] / this.appareils.length) * 100) };
  }

  // --- Export CSV ---
  exporterCsv() {
    const liste = this.appareilsFiltres();
    if (liste.length === 0) { this.afficherToast('Aucune donnée à exporter.', 'info'); return; }

    const entetes = ['N° série', 'Nom', 'Catégorie', "Date d'import", 'Statut'];
    const lignes = liste.map(a => [
      a.numeroSerie, a.nom, a.categorie, a.dateImport, this.statutLabel(a.statut),
    ]);
    const csv = [entetes, ...lignes]
      .map(l => l.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appareils_medtrack_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.afficherToast(`${liste.length} appareil(s) exporté(s).`);
  }
}