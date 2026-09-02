import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VenteService, Vente } from '../../../../services/vente/vente.service';
import { AppareilService, Appareil } from '../../../../services/appareil/appareil.service';
import { ClientService, Client } from '../../../../services/client/client.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-ventes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './ventes-list.component.html',
})
export class VentesListComponent implements OnInit {
  ventes: Vente[] = [];
  appareilsDisponibles: Appareil[] = [];
  clients: Client[] = [];
  loading = true;

  // Recherche / filtres / tri
  recherche = '';
  filtreClientId: number | null = null;
  dateDebut = '';
  dateFin = '';
  triChamp: 'date' | 'montant' | 'client' = 'date';
  triSens: 'asc' | 'desc' = 'desc';

  // Pagination
  pageActuelle = 1;
  taillePage = 6;

  showModal = false;
  formErreur = '';
  nouvelleVente: { appareilId: number | null; clientId: number | null; dateVente: string; montant: number } = {
    appareilId: null, clientId: null, dateVente: '', montant: 0
  };

  showConfirmSuppression = false;
  venteASupprimer: Vente | null = null;

  constructor(
    private venteService: VenteService,
    private appareilService: AppareilService,
    private clientService: ClientService
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.appareilService.getAll().subscribe({
      next: (apps) => {
        this.appareilsDisponibles = apps.filter(a => a.statut === 'EN_STOCK');
        this.clientService.getAll().subscribe({
          next: (cls) => {
            this.clients = cls;
            this.venteService.getAll().subscribe({
              next: (v) => { this.ventes = v; this.loading = false; },
              error: (err) => { console.error(err); this.loading = false; },
            });
          },
          error: (err) => { console.error(err); this.loading = false; },
        });
      },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  // ── Recherche / filtres / tri ──────────────────────────────────────────

  get ventesFiltrees(): Vente[] {
    let res = [...this.ventes];

    if (this.recherche.trim()) {
      const q = this.recherche.trim().toLowerCase();
      res = res.filter(v =>
        v.appareil?.nom?.toLowerCase().includes(q) ||
        v.appareil?.numeroSerie?.toLowerCase().includes(q) ||
        v.client?.nom?.toLowerCase().includes(q)
      );
    }
    if (this.filtreClientId) {
      res = res.filter(v => v.client?.id === this.filtreClientId);
    }
    if (this.dateDebut) res = res.filter(v => v.dateVente >= this.dateDebut);
    if (this.dateFin) res = res.filter(v => v.dateVente <= this.dateFin);

    res.sort((a, b) => {
      let cmp = 0;
      if (this.triChamp === 'date') cmp = (a.dateVente || '').localeCompare(b.dateVente || '');
      else if (this.triChamp === 'montant') cmp = (a.montant || 0) - (b.montant || 0);
      else if (this.triChamp === 'client') cmp = (a.client?.nom || '').localeCompare(b.client?.nom || '');
      return this.triSens === 'asc' ? cmp : -cmp;
    });

    return res;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.ventesFiltrees.length / this.taillePage));
  }

  get ventesPage(): Vente[] {
    const start = (this.pageActuelle - 1) * this.taillePage;
    return this.ventesFiltrees.slice(start, start + this.taillePage);
  }

  get pagesAffichees(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changerTri(champ: 'date' | 'montant' | 'client') {
    if (this.triChamp === champ) this.triSens = this.triSens === 'asc' ? 'desc' : 'asc';
    else { this.triChamp = champ; this.triSens = 'desc'; }
    this.pageActuelle = 1;
  }

  onFiltreChange() { this.pageActuelle = 1; }

  reinitialiserFiltres() {
    this.recherche = '';
    this.filtreClientId = null;
    this.dateDebut = '';
    this.dateFin = '';
    this.pageActuelle = 1;
  }

  allerPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageActuelle = p;
  }

  // ── Statistiques ─────────────────────────────────────────────────────

  chiffreAffaireTotal(): number {
    return this.ventes.reduce((sum, v) => sum + (v.montant || 0), 0);
  }

  venteMoyenne(): number {
    return this.ventes.length ? this.chiffreAffaireTotal() / this.ventes.length : 0;
  }

  meilleurClient(): { nom: string; total: number } | null {
    if (this.ventes.length === 0) return null;
    const totals = new Map<string, number>();
    this.ventes.forEach(v => {
      const nom = v.client?.nom || 'N/A';
      totals.set(nom, (totals.get(nom) || 0) + (v.montant || 0));
    });
    let meilleur = { nom: '', total: -1 };
    totals.forEach((total, nom) => { if (total > meilleur.total) meilleur = { nom, total }; });
    return meilleur;
  }

  // ── Export CSV ───────────────────────────────────────────────────────

exporterCsv() {
  const lignes = [
    ['Appareil', 'N° série', 'Client', 'Date', 'Montant (DT)'],
    ...this.ventesFiltrees.map(v => [
      v.appareil?.nom || '', v.appareil?.numeroSerie || '', v.client?.nom || '', v.dateVente, String(v.montant)
    ])
  ];
  const corps = lignes.map(l => l.map(c => `"${c}"`).join(';')).join('\n');
  const csv = 'sep=;\n' + corps;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

  // ── Modal création ───────────────────────────────────────────────────

  ouvrirModal() {
    this.nouvelleVente = { appareilId: null, clientId: null, dateVente: this.dateAujourdhui(), montant: 0 };
    this.formErreur = '';
    this.showModal = true;
  }

  private dateAujourdhui(): string {
    return new Date().toISOString().slice(0, 10);
  }

  fermerModal() { this.showModal = false; }

  enregistrer() {
    if (!this.nouvelleVente.appareilId) { this.formErreur = 'Sélectionne un appareil.'; return; }
    if (!this.nouvelleVente.clientId) { this.formErreur = 'Sélectionne un client.'; return; }
    if (!this.nouvelleVente.dateVente) { this.formErreur = 'La date est obligatoire.'; return; }
    if (!this.nouvelleVente.montant || this.nouvelleVente.montant <= 0) { this.formErreur = 'Le montant doit être supérieur à 0.'; return; }
    this.formErreur = '';

    const payload: Vente = {
      appareil: { id: this.nouvelleVente.appareilId },
      client: { id: this.nouvelleVente.clientId },
      dateVente: this.nouvelleVente.dateVente,
      montant: this.nouvelleVente.montant,
    };

    this.venteService.create(payload).subscribe({
      next: () => { this.fermerModal(); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  demanderSuppression(v: Vente) { this.venteASupprimer = v; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.venteASupprimer = null; }
  confirmerSuppression() {
    if (!this.venteASupprimer?.id) return;
    this.venteService.delete(this.venteASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.venteASupprimer = null; this.charger(); },
      error: (err) => console.error(err),
    });
  }
}