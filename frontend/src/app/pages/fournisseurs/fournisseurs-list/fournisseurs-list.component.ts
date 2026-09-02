import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurService, Fournisseur } from '../../../services/fournisseur/fournisseur.service';
import { CommandeService, Commande } from '../../../services/commande/commande.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

interface Pays { nom: string; drapeau: string; }
type Statut = 'tous' | 'actif' | 'inactif';
type ScoreFiltre = 'tous' | 'excellent' | 'bon' | 'surveiller' | 'nouveau';
type Vue = 'cartes' | 'tableau';
type Champ = 'nom' | 'pays' | 'score' | 'commandes' | 'inactivite';
type Direction = 'asc' | 'desc';
type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-fournisseurs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './fournisseurs-list.component.html',
})
export class FournisseursListComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  commandes: Commande[] = [];
  loading = true;

  // --- Vue (cartes / tableau) ---
  vue: Vue = (localStorage.getItem('fournisseurs.vue') as Vue) || 'cartes';
  changerVue(v: Vue) {
    this.vue = v;
    localStorage.setItem('fournisseurs.vue', v);
  }

  // --- Recherche (avec debounce) ---
  private _searchTerm = '';
  private searchTimeout: any;
  searchInput = '';
  get searchTerm() { return this._searchTerm; }
  onSearchInput(v: string) {
    this.searchInput = v;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this._searchTerm = v;
      this.page = 1;
    }, 300);
  }
  effacerRecherche() {
    this.searchInput = '';
    this._searchTerm = '';
    this.page = 1;
  }

  // --- Filtres avancés ---
  showFiltres = false;
  paysSelectionnes: string[] = [];
  statutFiltre: Statut = 'tous';
  scoreFiltreValeur: ScoreFiltre = 'tous';
  readonly statutOptions: { v: Statut; l: string }[] = [
    { v: 'tous', l: 'Tous' },
    { v: 'actif', l: 'Actif' },
    { v: 'inactif', l: 'Inactif' },
  ];
  choisirStatut(v: Statut) { this.statutFiltre = v; this.page = 1; }

  toggleFiltrePays(pays: string) {
    const i = this.paysSelectionnes.indexOf(pays);
    if (i === -1) this.paysSelectionnes.push(pays);
    else this.paysSelectionnes.splice(i, 1);
    this.page = 1;
  }
  paysUtilises(): string[] {
    return Array.from(new Set(this.fournisseurs.map(f => f.pays))).sort();
  }
  get nombreFiltresActifs(): number {
    let n = this.paysSelectionnes.length;
    if (this.statutFiltre !== 'tous') n++;
    if (this.scoreFiltreValeur !== 'tous') n++;
    return n;
  }
  reinitialiserFiltres() {
    this.paysSelectionnes = [];
    this.statutFiltre = 'tous';
    this.scoreFiltreValeur = 'tous';
    this.searchInput = '';
    this._searchTerm = '';
    this.page = 1;
  }

  // --- Tri ---
  sortField: Champ = 'nom';
  sortDir: Direction = 'asc';
  trier(champ: Champ) {
    if (this.sortField === champ) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = champ;
      this.sortDir = 'asc';
    }
  }
  iconeTri(champ: Champ): string {
    if (this.sortField !== champ) return '';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  // --- Pagination ---
  page = 1;
  pageSize = 6;
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.fournisseursFiltres().length / this.pageSize));
  }
  get fournisseursPage(): Fournisseur[] {
    const start = (this.page - 1) * this.pageSize;
    return this.fournisseursFiltres().slice(start, start + this.pageSize);
  }
  allerPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }
  pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  paysListe: Pays[] = [
    { nom: 'France', drapeau: '🇫🇷' }, { nom: 'Allemagne', drapeau: '🇩🇪' },
    { nom: 'Chine', drapeau: '🇨🇳' }, { nom: 'États-Unis', drapeau: '🇺🇸' },
    { nom: 'Italie', drapeau: '🇮🇹' }, { nom: 'Suisse', drapeau: '🇨🇭' },
    { nom: 'Tunisie', drapeau: '🇹🇳' }, { nom: 'Turquie', drapeau: '🇹🇷' },
    { nom: 'Japon', drapeau: '🇯🇵' }, { nom: 'Inde', drapeau: '🇮🇳' },
    { nom: 'Royaume-Uni', drapeau: '🇬🇧' }, { nom: 'Espagne', drapeau: '🇪🇸' },
    { nom: 'Belgique', drapeau: '🇧🇪' }, { nom: 'Pays-Bas', drapeau: '🇳🇱' },
  ];
  paysRecherche = '';
  paysDropdownOuvert = false;

  get paysFiltres(): Pays[] {
    const t = this.paysRecherche.toLowerCase().trim();
    if (!t) return this.paysListe;
    return this.paysListe.filter(p => p.nom.toLowerCase().includes(t));
  }

  choisirPays(p: Pays) {
    this.nouveauFournisseur.pays = p.nom;
    this.paysRecherche = p.nom;
    this.paysDropdownOuvert = false;
  }

  typeContact: 'EMAIL' | 'TELEPHONE' = 'EMAIL';
  private readonly regexEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  private readonly regexTelephone = /^(\+\d{1,3}[\s.-]?)?\d{2}([\s.-]?\d{2}){3,4}$/;

  get contactValide(): boolean {
    if (!this.nouveauFournisseur.contact) return true;
    return this.typeContact === 'EMAIL'
      ? this.regexEmail.test(this.nouveauFournisseur.contact.trim())
      : this.regexTelephone.test(this.nouveauFournisseur.contact.trim());
  }

  showModal = false;
  modeEdition = false;
  formErreur = '';
  nouveauFournisseur: Fournisseur = { nom: '', pays: '', contact: '' };

  showConfirmSuppression = false;
  fournisseurASupprimer: Fournisseur | null = null;

  // --- Fiche détaillée (panneau latéral) ---
  showDetail = false;
  fournisseurDetail: Fournisseur | null = null;
  ouvrirDetail(f: Fournisseur) { this.fournisseurDetail = f; this.showDetail = true; }
  fermerDetail() { this.showDetail = false; this.fournisseurDetail = null; }

  // --- Toasts ---
  toast: { message: string; type: ToastType } | null = null;
  private toastTimeout: any;
  private afficherToast(message: string, type: ToastType = 'success') {
    clearTimeout(this.toastTimeout);
    this.toast = { message, type };
    this.toastTimeout = setTimeout(() => (this.toast = null), 3500);
  }

  constructor(
    private fournisseurService: FournisseurService,
    private commandeService: CommandeService
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.fournisseurService.getAll().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.commandeService.getAll().subscribe({
          next: (cmds) => { this.commandes = cmds; this.loading = false; },
          error: () => { this.loading = false; this.afficherToast('Impossible de charger les commandes.', 'error'); },
        });
      },
      error: (err) => { console.error(err); this.loading = false; this.afficherToast('Impossible de charger les fournisseurs.', 'error'); },
    });
  }

  // --- Filtrage + tri combinés ---
  fournisseursFiltres(): Fournisseur[] {
    const term = this.searchTerm.toLowerCase();

    let liste = this.fournisseurs.filter(f => {
      const matchTerme = !term ||
        f.nom.toLowerCase().includes(term) ||
        f.pays.toLowerCase().includes(term) ||
        f.contact.toLowerCase().includes(term);

      const matchPays = this.paysSelectionnes.length === 0 || this.paysSelectionnes.includes(f.pays);

      const inactif = this.estInactif(f);
      const matchStatut = this.statutFiltre === 'tous' ||
        (this.statutFiltre === 'actif' && !inactif) ||
        (this.statutFiltre === 'inactif' && inactif);

      const matchScore = this.scoreFiltreValeur === 'tous' || this.scoreCle(f) === this.scoreFiltreValeur;

      return matchTerme && matchPays && matchStatut && matchScore;
    });

    liste = liste.sort((a, b) => {
      let cmp = 0;
      switch (this.sortField) {
        case 'nom': cmp = a.nom.localeCompare(b.nom); break;
        case 'pays': cmp = a.pays.localeCompare(b.pays); break;
        case 'score': cmp = this.scoreValeur(a) - this.scoreValeur(b); break;
        case 'commandes': cmp = this.commandesDe(a.id).length - this.commandesDe(b.id).length; break;
        case 'inactivite': cmp = (this.moisInactivite(a) ?? -1) - (this.moisInactivite(b) ?? -1); break;
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    return liste;
  }

  ouvrirModal() {
    this.nouveauFournisseur = { nom: '', pays: '', contact: '' };
    this.paysRecherche = '';
    this.typeContact = 'EMAIL';
    this.modeEdition = false;
    this.formErreur = '';
    this.showModal = true;
  }

  modifier(f: Fournisseur) {
    this.nouveauFournisseur = { ...f };
    this.paysRecherche = f.pays;
    this.typeContact = this.regexEmail.test(f.contact || '') ? 'EMAIL' : 'TELEPHONE';
    this.modeEdition = true;
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() { this.showModal = false; this.paysDropdownOuvert = false; }

  enregistrer() {
    if (!this.nouveauFournisseur.nom.trim()) {
      this.formErreur = 'Le nom est obligatoire.'; return;
    }
    if (!this.nouveauFournisseur.pays.trim()) {
      this.formErreur = 'Sélectionne un pays dans la liste.'; return;
    }
    if (this.nouveauFournisseur.contact?.trim() && !this.contactValide) {
      this.formErreur = this.typeContact === 'EMAIL'
        ? "Format d'email invalide (ex: nom@domaine.com)."
        : 'Format de téléphone invalide (ex: +216 29 388 421).';
      return;
    }
    this.formErreur = '';
    const creation = !(this.modeEdition && this.nouveauFournisseur.id);

    const action = this.modeEdition && this.nouveauFournisseur.id
      ? this.fournisseurService.update(this.nouveauFournisseur.id, this.nouveauFournisseur)
      : this.fournisseurService.create(this.nouveauFournisseur);

    action.subscribe({
      next: () => {
        this.fermerModal();
        this.charger();
        this.afficherToast(creation ? 'Fournisseur ajouté avec succès.' : 'Fournisseur modifié avec succès.');
      },
      error: (err) => { console.error(err); this.afficherToast('Une erreur est survenue lors de l\'enregistrement.', 'error'); },
    });
  }

  demanderSuppression(f: Fournisseur) { this.fournisseurASupprimer = f; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.fournisseurASupprimer = null; }
  confirmerSuppression() {
    if (!this.fournisseurASupprimer?.id) return;
    const nom = this.fournisseurASupprimer.nom;
    this.fournisseurService.delete(this.fournisseurASupprimer.id).subscribe({
      next: () => {
        this.showConfirmSuppression = false;
        this.fournisseurASupprimer = null;
        this.charger();
        this.afficherToast(`"${nom}" a été supprimé.`);
      },
      error: (err) => { console.error(err); this.afficherToast('Suppression impossible.', 'error'); },
    });
  }

  drapeauPays(pays: string): string {
    return this.paysListe.find(p => p.nom === pays)?.drapeau || '🌍';
  }
  initiales(nom: string): string {
    return nom?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  }
  couleurAvatar(nom: string): string {
    const palette = ['#0d8f9e', '#0b7482', '#22aebc', '#0a5d68', '#4bc8d4', '#0a4a53'];
    let hash = 0;
    for (let i = 0; i < (nom?.length || 0); i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }
  estEmail(contact: string): boolean { return this.regexEmail.test(contact || ''); }

  // --- Score de fiabilité ---
  commandesDe(fournisseurId?: number): Commande[] {
    if (!fournisseurId) return [];
    return this.commandes.filter(c => c.fournisseur?.id === fournisseurId);
  }

  scoreFournisseur(f: Fournisseur): { label: string; classe: string } {
    const cmds = this.commandesDe(f.id);
    if (cmds.length === 0) return { label: 'Nouveau', classe: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300' };

    const annulees = cmds.filter(c => c.statut === 'ANNULEE').length;
    const taux = annulees / cmds.length;

    if (taux > 0.3) return { label: '⚠ À surveiller', classe: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400' };
    if (cmds.length >= 3 && taux === 0) return { label: '★ Excellent', classe: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400' };
    return { label: 'Bon', classe: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' };
  }

  // Clé courte du score, utilisée pour le filtre et le tri
  scoreCle(f: Fournisseur): ScoreFiltre {
    const cmds = this.commandesDe(f.id);
    if (cmds.length === 0) return 'nouveau';
    const annulees = cmds.filter(c => c.statut === 'ANNULEE').length;
    const taux = annulees / cmds.length;
    if (taux > 0.3) return 'surveiller';
    if (cmds.length >= 3 && taux === 0) return 'excellent';
    return 'bon';
  }
  scoreValeur(f: Fournisseur): number {
    const ordre: Record<ScoreFiltre, number> = { surveiller: 0, nouveau: 1, bon: 2, excellent: 3, tous: -1 };
    return ordre[this.scoreCle(f)];
  }

  // --- Alerte inactivité ---
  moisInactivite(f: Fournisseur): number | null {
    const cmds = this.commandesDe(f.id);
    if (cmds.length === 0) return null;
    const derniere = cmds.map(c => new Date(c.dateCommande)).sort((a, b) => b.getTime() - a.getTime())[0];
    const diffMs = Date.now() - derniere.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  }

  estInactif(f: Fournisseur): boolean {
    const mois = this.moisInactivite(f);
    return mois !== null && mois >= 3;
  }

  // --- Répartition par pays (barre segmentée + légende, scalable à N pays) ---
  private readonly palettePays = [
    '#0d8f9e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#65a30d',
    '#0891b2', '#9333ea', '#dc2626', '#ca8a04', '#0f766e', '#4338ca',
  ];

  repartitionParPays(): { pays: string; count: number }[] {
    const compte: Record<string, number> = {};
    this.fournisseurs.forEach(f => { compte[f.pays] = (compte[f.pays] || 0) + 1; });
    return Object.entries(compte)
      .map(([pays, count]) => ({ pays, count }))
      .sort((a, b) => b.count - a.count);
  }

  maxCount(): number {
    return Math.max(1, ...this.repartitionParPays().map(p => p.count));
  }

  // Répartition enrichie avec pourcentage et couleur, prête pour l'affichage
  repartitionEnrichie(): { pays: string; count: number; pct: number; couleur: string }[] {
    const total = this.fournisseurs.length || 1;
    return this.repartitionParPays().map((p, i) => ({
      ...p,
      pct: Math.round((p.count / total) * 1000) / 10,
      couleur: this.palettePays[i % this.palettePays.length],
    }));
  }

  showTousLesPays = false;
  private readonly limitePaysAffiches = 8;

  paysAffichesDansLegende() {
    const liste = this.repartitionEnrichie();
    return this.showTousLesPays ? liste : liste.slice(0, this.limitePaysAffiches);
  }

  get nombrePaysMasques(): number {
    return Math.max(0, this.repartitionEnrichie().length - this.limitePaysAffiches);
  }

  get paysLeader(): { pays: string; count: number; pct: number } | null {
    const liste = this.repartitionEnrichie();
    return liste.length ? liste[0] : null;
  }

  // --- Indicateurs clés (KPI) ---
  get kpiActifs(): number {
    return this.fournisseurs.filter(f => !this.estInactif(f)).length;
  }
  get kpiASurveiller(): number {
    return this.fournisseurs.filter(f => this.scoreCle(f) === 'surveiller').length;
  }
  get kpiExcellents(): number {
    return this.fournisseurs.filter(f => this.scoreCle(f) === 'excellent').length;
  }
  get kpiPaysDistincts(): number {
    return new Set(this.fournisseurs.map(f => f.pays)).size;
  }

  // --- Export CSV ---
  exporterCsv() {
    const liste = this.fournisseursFiltres();
    if (liste.length === 0) { this.afficherToast('Aucune donnée à exporter.', 'info'); return; }

    const entetes = ['Nom', 'Pays', 'Contact', 'Statut', 'Score', 'Commandes', 'Dernière activité (mois)'];
    const lignes = liste.map(f => [
      f.nom,
      f.pays,
      f.contact,
      this.estInactif(f) ? 'Inactif' : 'Actif',
      this.scoreFournisseur(f).label.replace(/[★⚠]/g, '').trim(),
      String(this.commandesDe(f.id).length),
      this.moisInactivite(f) !== null ? String(this.moisInactivite(f)) : 'N/A',
    ]);

    const csv = [entetes, ...lignes]
      .map(ligne => ligne.map(champ => `"${String(champ).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fournisseurs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.afficherToast(`${liste.length} fournisseur(s) exporté(s).`);
  }
}