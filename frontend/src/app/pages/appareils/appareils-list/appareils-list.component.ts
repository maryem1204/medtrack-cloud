import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppareilService, Appareil } from '../../../services/appareil/appareil.service';
import * as QRCode from 'qrcode';
import { HistoriqueService, HistoriqueAppareil } from '../../../services/historique/historique.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-appareils-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './appareils-list.component.html',
})
export class AppareilsListComponent implements OnInit {
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

  constructor(
    private appareilService: AppareilService,
    private historiqueService: HistoriqueService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('USER:', this.authService.getUser());
  console.log('ROLE EXACT:', JSON.stringify(this.authService.getUser()?.role));
    this.charger();
  }

  charger() {
    this.loading = true;
    this.appareilService.getAll().subscribe({
      next: (data) => { this.appareils = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
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
        next: () => { this.fermerModal(); this.charger(); },
        error: (err) => console.error(err),
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
        },
        error: (err) => console.error(err),
      });
    }
  }

  appareilsFiltres(): Appareil[] {
    return this.appareils.filter(a => {
      const matchSearch = !this.searchTerm ||
        a.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.numeroSerie.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatut = !this.filtreStatut || a.statut === this.filtreStatut;
      return matchSearch && matchStatut;
    });
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

  modifier(appareil: Appareil) {
    this.nouvelAppareil = { ...appareil };
    this.modeEdition = true;
    this.formErreur = '';
    this.showModal = true;
  }

  supprimer(appareil: Appareil) {
    if (!appareil.id) return;
    const confirme = confirm(`Supprimer l'appareil "${appareil.nom}" (${appareil.numeroSerie}) ?`);
    if (!confirme) return;
    this.appareilService.delete(appareil.id).subscribe({
      next: () => this.charger(),
      error: (err) => console.error(err),
    });
  }

  /*async voirQrCode(a: Appareil) {
    this.appareilQr = a;
    const url = `${window.location.origin}/scan/${a.id}`;
    this.qrDataUrl = await QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: '#0a4a53', light: '#ffffff' } });
    this.showQrModal = true;
  }*/
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
      error: (err) => console.error(err),
    });
  }
  fermerTracabilite() { this.showHistoriqueTracabilite = false; }
}