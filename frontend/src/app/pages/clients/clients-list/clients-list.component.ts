import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../../services/client/client.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  clients: Client[] = [];
  loading = true;

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

  private _filtreType = '';
  get filtreType() { return this._filtreType; }
  set filtreType(v: string) { this._filtreType = v; this.page = 1; }

  page = 1;
  pageSize = 6;
  get totalPages(): number { return Math.max(1, Math.ceil(this.clientsFiltres().length / this.pageSize)); }
  get clientsPage(): Client[] {
    const start = (this.page - 1) * this.pageSize;
    return this.clientsFiltres().slice(start, start + this.pageSize);
  }
  allerPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }
  pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  showModal = false;
  modeEdition = false;
  formErreur = '';
  nouveauClient: Client = { nom: '', type: 'HOPITAL', adresse: '', telephone: '' };

  showConfirmSuppression = false;
  clientASupprimer: Client | null = null;

  private readonly regexTelephone = /^(\+\d{1,3}[\s.-]?)?\d{2}([\s.-]?\d{2}){3,4}$/;
  get telephoneValide(): boolean {
    if (!this.nouveauClient.telephone) return true;
    return this.regexTelephone.test(this.nouveauClient.telephone.trim());
  }

  constructor(private clientService: ClientService) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.clientService.getAll().subscribe({
      next: (data) => { this.clients = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  clientsFiltres(): Client[] {
    return this.clients.filter(c => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term || c.nom.toLowerCase().includes(term) || c.adresse.toLowerCase().includes(term);
      const matchType = !this.filtreType || c.type === this.filtreType;
      return matchSearch && matchType;
    });
  }

  countByType(type: string): number {
    return this.clients.filter(c => c.type === type).length;
  }

  ouvrirModal() {
    this.nouveauClient = { nom: '', type: 'HOPITAL', adresse: '', telephone: '' };
    this.modeEdition = false;
    this.formErreur = '';
    this.showModal = true;
  }

  modifier(c: Client) {
    this.nouveauClient = { ...c };
    this.modeEdition = true;
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() { this.showModal = false; }

  enregistrer() {
    if (!this.nouveauClient.nom.trim()) { this.formErreur = 'Le nom est obligatoire.'; return; }
    if (!this.nouveauClient.adresse.trim()) { this.formErreur = "L'adresse est obligatoire."; return; }
    if (this.nouveauClient.telephone?.trim() && !this.telephoneValide) {
      this.formErreur = 'Format de téléphone invalide (ex: +216 29 388 421).'; return;
    }
    this.formErreur = '';

    const action = this.modeEdition && this.nouveauClient.id
      ? this.clientService.update(this.nouveauClient.id, this.nouveauClient)
      : this.clientService.create(this.nouveauClient);

    action.subscribe({
      next: () => { this.fermerModal(); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  demanderSuppression(c: Client) { this.clientASupprimer = c; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.clientASupprimer = null; }
  confirmerSuppression() {
    if (!this.clientASupprimer?.id) return;
    this.clientService.delete(this.clientASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.clientASupprimer = null; this.charger(); },
      error: (err) => console.error(err),
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = { HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', PHARMACIE: 'Pharmacie' };
    return labels[type] || type;
  }
  typeIcone(type: string): string {
    const icones: Record<string, string> = { HOPITAL: '🏥', CLINIQUE: '⚕️', PHARMACIE: '💊' };
    return icones[type] || '🏢';
  }
  typeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      HOPITAL: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      CLINIQUE: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      PHARMACIE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    };
    return classes[type] || '';
  }
}