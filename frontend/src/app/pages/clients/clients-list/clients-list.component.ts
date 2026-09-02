import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../../services/client/client.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

type TriChamp = 'nom' | 'type' | 'adresse';
type VueMode = 'grille' | 'tableau';
type FiltreTelephone = 'tous' | 'avec' | 'sans';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  clients: Client[] = [];
  loading = true;

  // --- Vue (grille / tableau) — source unique, utilisée partout ---
  vue: VueMode = 'grille';
  changerVue(v: VueMode) { this.vue = v; }

  private _searchTerm = '';
  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.page = 1; }

  // --- Filtres avancés (panneau dépliable) ---
  showFiltres = false;
  readonly typesDisponibles = ['HOPITAL', 'CLINIQUE', 'PHARMACIE'];
  filtresTypes: string[] = [];
  filtreTelephone: FiltreTelephone = 'tous';
  readonly optionsTelephone: { v: FiltreTelephone; l: string }[] = [
    { v: 'tous', l: 'Tous' },
    { v: 'avec', l: 'Avec téléphone' },
    { v: 'sans', l: 'Sans téléphone' },
  ];

  toggleFiltreType(type: string) {
    const i = this.filtresTypes.indexOf(type);
    if (i === -1) this.filtresTypes.push(type);
    else this.filtresTypes.splice(i, 1);
    this.page = 1;
  }
  choisirFiltreTelephone(v: FiltreTelephone) { this.filtreTelephone = v; this.page = 1; }

  get nombreFiltresActifs(): number {
    let n = this.filtresTypes.length;
    if (this.filtreTelephone !== 'tous') n++;
    return n;
  }
  reinitialiserFiltres() {
    this.filtresTypes = [];
    this.filtreTelephone = 'tous';
    this._searchTerm = '';
    this.page = 1;
  }

  triChamp: TriChamp = 'nom';
  triOrdre: 'asc' | 'desc' = 'asc';

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

  trierPar(champ: TriChamp) {
    if (this.triChamp === champ) {
      this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
    } else {
      this.triChamp = champ;
      this.triOrdre = 'asc';
    }
  }

  clientsFiltres(): Client[] {
    const term = this.searchTerm.toLowerCase();
    let result = this.clients.filter(c => {
      const matchSearch = !term ||
        c.nom.toLowerCase().includes(term) ||
        c.adresse.toLowerCase().includes(term) ||
        (c.telephone || '').includes(term);

      const matchType = this.filtresTypes.length === 0 || this.filtresTypes.includes(c.type);

      const aTelephone = !!c.telephone?.trim();
      const matchTelephone = this.filtreTelephone === 'tous' ||
        (this.filtreTelephone === 'avec' && aTelephone) ||
        (this.filtreTelephone === 'sans' && !aTelephone);

      return matchSearch && matchType && matchTelephone;
    });

    result = [...result].sort((a, b) => {
      const va = (a[this.triChamp] || '').toString().toLowerCase();
      const vb = (b[this.triChamp] || '').toString().toLowerCase();
      const cmp = va.localeCompare(vb);
      return this.triOrdre === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  countByType(type: string): number {
    return this.clients.filter(c => c.type === type).length;
  }

  repartitionParType(): { type: string; label: string; count: number; couleur: string }[] {
    const types = ['HOPITAL', 'CLINIQUE', 'PHARMACIE'];
    return types.map(t => ({
      type: t,
      label: this.typeLabel(t),
      count: this.countByType(t),
      couleur: t === 'HOPITAL' ? '#0d8f9e' : t === 'CLINIQUE' ? '#16a34a' : '#d97706',
    })).filter(r => r.count > 0);
  }
  maxTypeCount(): number {
    return Math.max(1, ...this.repartitionParType().map(r => r.count));
  }

  // --- Insights intelligents ---
  tauxCompletudeTelephone(): number {
    if (this.clients.length === 0) return 0;
    const avecTel = this.clients.filter(c => c.telephone && c.telephone.trim()).length;
    return Math.round((avecTel / this.clients.length) * 100);
  }

  typeDominant(): { label: string; pourcentage: number } | null {
    if (this.clients.length === 0) return null;
    const repartition = this.repartitionParType();
    if (repartition.length === 0) return null;
    const top = repartition.reduce((a, b) => (a.count > b.count ? a : b));
    return { label: top.label, pourcentage: Math.round((top.count / this.clients.length) * 100) };
  }

  clientsSansTelephone(): number {
    return this.clients.filter(c => !c.telephone || !c.telephone.trim()).length;
  }

  exporterCsv() {
    const lignes = [['Nom', 'Type', 'Adresse', 'Téléphone']];
    this.clientsFiltres().forEach(c => {
      lignes.push([c.nom, this.typeLabel(c.type), c.adresse, c.telephone || '']);
    });
    const csv = lignes.map(l => l.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_medtrack_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
  initiales(nom: string): string {
    return nom?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  }
  couleurAvatar(nom: string): string {
    const palette = ['#0d8f9e', '#0b7482', '#22aebc', '#0a5d68', '#4bc8d4', '#0a4a53'];
    let hash = 0;
    for (let i = 0; i < (nom?.length || 0); i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }
}