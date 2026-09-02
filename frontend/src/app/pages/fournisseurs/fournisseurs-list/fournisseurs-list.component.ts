import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurService, Fournisseur } from '../../../services/fournisseur/fournisseur.service';
import { CommandeService, Commande } from '../../../services/commande/commande.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

interface Pays { nom: string; drapeau: string; }

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

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

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
          error: () => { this.loading = false; },
        });
      },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  fournisseursFiltres(): Fournisseur[] {
    return this.fournisseurs.filter(f => {
      const term = this.searchTerm.toLowerCase();
      return !term ||
        f.nom.toLowerCase().includes(term) ||
        f.pays.toLowerCase().includes(term) ||
        f.contact.toLowerCase().includes(term);
    });
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

    const action = this.modeEdition && this.nouveauFournisseur.id
      ? this.fournisseurService.update(this.nouveauFournisseur.id, this.nouveauFournisseur)
      : this.fournisseurService.create(this.nouveauFournisseur);

    action.subscribe({
      next: () => { this.fermerModal(); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  demanderSuppression(f: Fournisseur) { this.fournisseurASupprimer = f; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.fournisseurASupprimer = null; }
  confirmerSuppression() {
    if (!this.fournisseurASupprimer?.id) return;
    this.fournisseurService.delete(this.fournisseurASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.fournisseurASupprimer = null; this.charger(); },
      error: (err) => console.error(err),
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

  // --- Répartition par pays (graphique en barres) ---
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
}