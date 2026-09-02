import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandeService, Commande, LigneCommande } from '../../../services/commande/commande.service';
import { FournisseurService, Fournisseur } from '../../../services/fournisseur/fournisseur.service';
import { AppareilService, Appareil } from '../../../services/appareil/appareil.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

interface LigneForm { appareilId: number | null; quantite: number; prixUnitaire: number; }

@Component({
  selector: 'app-commandes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './commandes-list.component.html',
})
export class CommandesListComponent implements OnInit {
  commandes: Commande[] = [];
  fournisseurs: Fournisseur[] = [];
  appareils: Appareil[] = [];
  loading = true;

  // ── Filtres ──────────────────────────────────────────────────────────────
  showFiltres = false;

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

  private _filtreStatut = '';
  get filtreStatut() { return this._filtreStatut; }
  set filtreStatut(v: string) { this._filtreStatut = v; this.page = 1; }

  private _filtreFournisseur = '';
  get filtreFournisseur() { return this._filtreFournisseur; }
  set filtreFournisseur(v: string) { this._filtreFournisseur = v; this.page = 1; }

  // ── Vue et tri ────────────────────────────────────────────────────────────
  vueMode: 'cartes' | 'tableau' = 'cartes';
  triColonne: 'reference' | 'fournisseur' | 'dateCommande' | 'statut' | 'total' = 'dateCommande';
  triSens: 'asc' | 'desc' = 'desc';

  changerTri(col: typeof this.triColonne) {
    if (this.triColonne === col) this.triSens = this.triSens === 'asc' ? 'desc' : 'asc';
    else { this.triColonne = col; this.triSens = 'asc'; }
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  page = 1;
  pageSize = 6;
  get totalPages() { return Math.max(1, Math.ceil(this.commandesFiltrees().length / this.pageSize)); }
  get commandesPage(): Commande[] {
    const start = (this.page - 1) * this.pageSize;
    return this.commandesFiltrees().slice(start, start + this.pageSize);
  }
  allerPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }
  pagesArray(): number[] { return Array.from({ length: Math.min(this.totalPages, 7) }, (_, i) => i + 1); }

  // ── Modals ────────────────────────────────────────────────────────────────
  showModal = false;
  formErreur = '';
  nouvelleCommande: { reference: string; dateCommande: string; statut: string; fournisseurId: number | null } = {
    reference: '', dateCommande: '', statut: 'EN_ATTENTE', fournisseurId: null
  };
  lignesForm: LigneForm[] = [];

  showConfirmSuppression = false;
  commandeASupprimer: Commande | null = null;

  showDetail = false;
  commandeDetail: Commande | null = null;

  showSuggestions = true;

  constructor(
    private commandeService: CommandeService,
    private fournisseurService: FournisseurService,
    private appareilService: AppareilService
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.fournisseurService.getAll().subscribe(fs => {
      this.fournisseurs = fs;
      this.appareilService.getAll().subscribe(apps => {
        this.appareils = apps;
        this.commandeService.getAll().subscribe(cmds => {
          this.commandes = cmds;
          this.loading = false;
        });
      });
    });
  }

  // ── Filtrage + tri ────────────────────────────────────────────────────────
  commandesFiltrees(): Commande[] {
    let src = this.commandes.filter(c => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        c.reference.toLowerCase().includes(term) ||
        (c.fournisseur?.nom || '').toLowerCase().includes(term);
      const matchStatut = !this.filtreStatut || c.statut === this.filtreStatut;
      const matchFourn = !this.filtreFournisseur ||
        String(c.fournisseur?.id) === this.filtreFournisseur;
      return matchSearch && matchStatut && matchFourn;
    });

    src = [...src].sort((a, b) => {
      let cmp = 0;
      if (this.triColonne === 'reference') cmp = a.reference.localeCompare(b.reference);
      else if (this.triColonne === 'fournisseur') cmp = (a.fournisseur?.nom || '').localeCompare(b.fournisseur?.nom || '');
      else if (this.triColonne === 'dateCommande') cmp = (a.dateCommande || '').localeCompare(b.dateCommande || '');
      else if (this.triColonne === 'statut') cmp = a.statut.localeCompare(b.statut);
      else if (this.triColonne === 'total') cmp = this.totalLignes(a) - this.totalLignes(b);
      return this.triSens === 'asc' ? cmp : -cmp;
    });

    return src;
  }

  // ── Suggestions intelligentes ─────────────────────────────────────────────
  suggestions(): { type: string; message: string; action?: string; couleur: string }[] {
    const list: { type: string; message: string; action?: string; couleur: string }[] = [];

    const enAttente = this.commandes.filter(c => c.statut === 'EN_ATTENTE');
    if (enAttente.length >= 3) {
      list.push({
        type: 'alerte',
        message: `${enAttente.length} commandes en attente de validation.`,
        couleur: 'amber'
      });
    }

    const annulees = this.commandes.filter(c => c.statut === 'ANNULEE');
    const fournisseursAnnules = new Map<string, number>();
    annulees.forEach(c => {
      const nom = c.fournisseur?.nom || 'Inconnu';
      fournisseursAnnules.set(nom, (fournisseursAnnules.get(nom) || 0) + 1);
    });
    fournisseursAnnules.forEach((count, nom) => {
      if (count >= 2) {
        list.push({
          type: 'risque',
          message: `${nom} a ${count} commandes annulées — fiabilité à surveiller.`,
          couleur: 'red'
        });
      }
    });

    const fournisseursSansCommande = this.fournisseurs.filter(f =>
      !this.commandes.some(c => c.fournisseur?.id === f.id)
    );
    if (fournisseursSansCommande.length > 0) {
      list.push({
        type: 'info',
        message: `${fournisseursSansCommande.length} fournisseur(s) sans commande : ${fournisseursSansCommande.slice(0, 2).map(f => f.nom).join(', ')}.`,
        couleur: 'blue'
      });
    }

    const totalAnnulees = annulees.length;
    const taux = this.commandes.length > 0 ? (totalAnnulees / this.commandes.length) * 100 : 0;
    if (taux > 20) {
      list.push({
        type: 'performance',
        message: `Taux d'annulation élevé : ${taux.toFixed(0)}% des commandes annulées.`,
        couleur: 'red'
      });
    }

    return list;
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exporterCSV() {
    const headers = ['Référence', 'Fournisseur', 'Date', 'Statut', 'Total (DT)'];
    const rows = this.commandesFiltrees().map(c => [
      c.reference,
      c.fournisseur?.nom || '',
      c.dateCommande,
      this.statutLabel(c.statut),
      this.totalLignes(c).toFixed(2)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Timeline statut ───────────────────────────────────────────────────────
  etapesStatut = ['EN_ATTENTE', 'VALIDEE', 'RECUE'];

  indexStatut(statut: string): number {
    if (statut === 'ANNULEE') return -1;
    return this.etapesStatut.indexOf(statut);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  prochainNumeroReference(): string {
    return `CMD-${String(this.commandes.length + 1).padStart(4, '0')}`;
  }

  ouvrirModal() {
    this.nouvelleCommande = {
      reference: this.prochainNumeroReference(),
      dateCommande: new Date().toISOString().slice(0, 10),
      statut: 'EN_ATTENTE',
      fournisseurId: null
    };
    this.lignesForm = [{ appareilId: null, quantite: 1, prixUnitaire: 0 }];
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() { this.showModal = false; }
  ajouterLigne() { this.lignesForm.push({ appareilId: null, quantite: 1, prixUnitaire: 0 }); }
  supprimerLigne(i: number) { this.lignesForm.splice(i, 1); }

  totalCommande(): number {
    return this.lignesForm.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
  }

  enregistrer() {
    if (!this.nouvelleCommande.fournisseurId) { this.formErreur = 'Sélectionne un fournisseur.'; return; }
    if (!this.nouvelleCommande.dateCommande) { this.formErreur = 'La date est obligatoire.'; return; }
    const lignesValides = this.lignesForm.filter(l => l.appareilId && l.quantite > 0);
    if (lignesValides.length === 0) { this.formErreur = 'Ajoute au moins une ligne valide.'; return; }
    this.formErreur = '';

    const lignes: LigneCommande[] = lignesValides.map(l => ({
      appareil: { id: l.appareilId! },
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
    }));

    this.commandeService.create({
      reference: this.nouvelleCommande.reference,
      dateCommande: this.nouvelleCommande.dateCommande,
      statut: this.nouvelleCommande.statut,
      fournisseur: { id: this.nouvelleCommande.fournisseurId },
      lignes,
    }).subscribe({ next: () => { this.fermerModal(); this.charger(); } });
  }

  valider(c: Commande) {
    if (!c.id) return;
    this.commandeService.update(c.id, { statut: 'VALIDEE' }).subscribe({ next: () => this.charger() });
  }

  recevoir(c: Commande) {
    if (!c.id) return;
    this.commandeService.recevoir(c.id).subscribe({ next: () => this.charger() });
  }

  annuler(c: Commande) {
    if (!c.id) return;
    this.commandeService.update(c.id, { statut: 'ANNULEE' }).subscribe({ next: () => this.charger() });
  }

  voirDetail(c: Commande) { this.commandeDetail = c; this.showDetail = true; }
  fermerDetail() { this.showDetail = false; this.commandeDetail = null; }

  totalLignes(c: Commande): number {
    return (c.lignes || []).reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  }

  demanderSuppression(c: Commande) { this.commandeASupprimer = c; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.commandeASupprimer = null; }
  confirmerSuppression() {
    if (!this.commandeASupprimer?.id) return;
    this.commandeService.delete(this.commandeASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.commandeASupprimer = null; this.charger(); }
    });
  }

  reinitialiserFiltres() {
    this._searchTerm = '';
    this._filtreStatut = '';
    this._filtreFournisseur = '';
    this.showFiltres = false;
    this.page = 1;
  }

  get filtresActifs(): boolean {
    return !!(this._searchTerm || this._filtreStatut || this._filtreFournisseur);
  }

  statutLabel(s: string): string {
    return { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', RECUE: 'Reçue', ANNULEE: 'Annulée' }[s] || s;
  }

  statutBadgeClass(s: string): string {
    return {
      EN_ATTENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      VALIDEE: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      RECUE: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      ANNULEE: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    }[s] || '';
  }

  countByStatut(s: string): number { return this.commandes.filter(c => c.statut === s).length; }

  triIcon(col: string): string {
    if (this.triColonne !== col) return '';
    return this.triSens === 'asc' ? '↑' : '↓';
  }
  totalGlobal(): number {
  return this.commandes.reduce((s, c) => s + this.totalLignes(c), 0);
}

protected readonly Math = Math;
}