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

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

  private _filtreStatut = '';
  get filtreStatut() { return this._filtreStatut; }
  set filtreStatut(v: string) { this._filtreStatut = v; this.page = 1; }

  page = 1;
  pageSize = 6;
  get totalPages(): number { return Math.max(1, Math.ceil(this.commandesFiltrees().length / this.pageSize)); }
  get commandesPage(): Commande[] {
    const start = (this.page - 1) * this.pageSize;
    return this.commandesFiltrees().slice(start, start + this.pageSize);
  }
  allerPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }
  pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

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

  constructor(
    private commandeService: CommandeService,
    private fournisseurService: FournisseurService,
    private appareilService: AppareilService
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.fournisseurService.getAll().subscribe({
      next: (fs) => {
        this.fournisseurs = fs;
        this.appareilService.getAll().subscribe({
          next: (apps) => {
            this.appareils = apps;
            this.commandeService.getAll().subscribe({
              next: (cmds) => { this.commandes = cmds; this.loading = false; },
              error: (err) => { console.error(err); this.loading = false; },
            });
          },
          error: (err) => { console.error(err); this.loading = false; },
        });
      },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  commandesFiltrees(): Commande[] {
    return this.commandes.filter(c => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term || c.reference.toLowerCase().includes(term) || (c.fournisseur?.nom || '').toLowerCase().includes(term);
      const matchStatut = !this.filtreStatut || c.statut === this.filtreStatut;
      return matchSearch && matchStatut;
    });
  }

  prochainNumeroReference(): string {
    return `CMD-${String(this.commandes.length + 1).padStart(4, '0')}`;
  }

  ouvrirModal() {
    this.nouvelleCommande = { reference: this.prochainNumeroReference(), dateCommande: '', statut: 'EN_ATTENTE', fournisseurId: null };
    this.lignesForm = [{ appareilId: null, quantite: 1, prixUnitaire: 0 }];
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() { this.showModal = false; }

  ajouterLigne() { this.lignesForm.push({ appareilId: null, quantite: 1, prixUnitaire: 0 }); }
  supprimerLigne(i: number) { this.lignesForm.splice(i, 1); }

  totalCommande(): number {
    return this.lignesForm.reduce((sum, l) => sum + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
  }

  enregistrer() {
    if (!this.nouvelleCommande.fournisseurId) { this.formErreur = 'Sélectionne un fournisseur.'; return; }
    if (!this.nouvelleCommande.dateCommande) { this.formErreur = 'La date de commande est obligatoire.'; return; }
    const lignesValides = this.lignesForm.filter(l => l.appareilId && l.quantite > 0);
    if (lignesValides.length === 0) { this.formErreur = 'Ajoute au moins une ligne avec un appareil et une quantité.'; return; }
    this.formErreur = '';

    const lignes: LigneCommande[] = lignesValides.map(l => ({
      appareil: { id: l.appareilId! },
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
    }));

    const payload: Commande = {
      reference: this.nouvelleCommande.reference,
      dateCommande: this.nouvelleCommande.dateCommande,
      statut: this.nouvelleCommande.statut,
      fournisseur: { id: this.nouvelleCommande.fournisseurId },
      lignes,
    };

    this.commandeService.create(payload).subscribe({
      next: () => { this.fermerModal(); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  valider(c: Commande) {
    if (!c.id) return;
    this.commandeService.update(c.id, { statut: 'VALIDEE' }).subscribe({
      next: () => this.charger(), error: (err) => console.error(err),
    });
  }

  recevoir(c: Commande) {
    if (!c.id) return;
    this.commandeService.recevoir(c.id).subscribe({
      next: () => this.charger(), error: (err) => console.error(err),
    });
  }

  voirDetail(c: Commande) { this.commandeDetail = c; this.showDetail = true; }
  fermerDetail() { this.showDetail = false; this.commandeDetail = null; }

  totalLignes(c: Commande): number {
    return (c.lignes || []).reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  }

  demanderSuppression(c: Commande) { this.commandeASupprimer = c; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.commandeASupprimer = null; }
  confirmerSuppression() {
    if (!this.commandeASupprimer?.id) return;
    this.commandeService.delete(this.commandeASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.commandeASupprimer = null; this.charger(); },
      error: (err) => console.error(err),
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', RECUE: 'Reçue', ANNULEE: 'Annulée' };
    return labels[statut] || statut;
  }
  statutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_ATTENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      VALIDEE: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      RECUE: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      ANNULEE: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
    return classes[statut] || '';
  }
  countByStatut(statut: string): number { return this.commandes.filter(c => c.statut === statut).length; }

    annuler(c: Commande) {
    if (!c.id) return;
    this.commandeService.update(c.id, { statut: 'ANNULEE' }).subscribe({
      next: () => this.charger(), error: (err) => console.error(err),
    });
  }
}