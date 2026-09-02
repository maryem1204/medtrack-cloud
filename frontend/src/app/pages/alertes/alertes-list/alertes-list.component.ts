import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, Alerte } from '../../../services/alerte/alerte.service';

@Component({
  selector: 'app-alertes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertes-list.component.html',
})
export class AlertesListComponent implements OnInit {
  alertes: Alerte[] = [];
  loading = true;
  generating = false;
  derniereVerification: Date | null = null;

  recherche = '';
  filtreGravite: 'TOUTES' | 'CRITIQUE' | 'ELEVEE' | 'MODEREE' = 'TOUTES';

  constructor(private alerteService: AlerteService) {}

  ngOnInit() {
    const stocke = localStorage.getItem('derniereVerifAlertes');
    if (stocke) this.derniereVerification = new Date(stocke);
    this.charger();
  }

  charger() {
    this.loading = true;
    this.alerteService.getAll().subscribe({
      next: (data) => { this.alertes = data.filter(a => a.statut === 'ACTIVE'); this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  genererAlertes() {
    this.generating = true;
    this.alerteService.generer().subscribe({
      next: () => {
        this.generating = false;
        this.derniereVerification = new Date();
        localStorage.setItem('derniereVerifAlertes', this.derniereVerification.toISOString());
        this.charger();
      },
      error: (err) => { console.error(err); this.generating = false; },
    });
  }

  marquerTraitee(a: Alerte) {
    if (!a.id) return;
    this.alerteService.update(a.id, { statut: 'TRAITEE' }).subscribe({
      next: () => this.charger(),
      error: (err) => console.error(err),
    });
  }

  traiterToutesModerees() {
    const moderees = this.alertesFiltrees.filter(a => this.gravite(a) === 'MODEREE');
    moderees.forEach(a => this.marquerTraitee(a));
  }

  // ── Calcul intelligent de la gravité ─────────────────────────────────

  joursEcoules(a: Alerte): number {
    if (!a.dateDeclenchement) return 0;
    const diff = Date.now() - new Date(a.dateDeclenchement).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  gravite(a: Alerte): 'CRITIQUE' | 'ELEVEE' | 'MODEREE' {
    const jours = this.joursEcoules(a);
    if (a.type === 'MAINTENANCE_RETARD' && jours >= 7) return 'CRITIQUE';
    if (a.type === 'MAINTENANCE_RETARD' || jours >= 3) return 'ELEVEE';
    return 'MODEREE';
  }

  // ── Compteurs pour le résumé ─────────────────────────────────────────

  compterParGravite(g: 'CRITIQUE' | 'ELEVEE' | 'MODEREE'): number {
    return this.alertes.filter(a => this.gravite(a) === g).length;
  }

  // ── Filtres / recherche / tri par urgence ────────────────────────────

  get alertesFiltrees(): Alerte[] {
    let res = [...this.alertes];
    if (this.recherche.trim()) {
      const q = this.recherche.trim().toLowerCase();
      res = res.filter(a =>
        a.appareil?.nom?.toLowerCase().includes(q) ||
        a.appareil?.numeroSerie?.toLowerCase().includes(q)
      );
    }
    if (this.filtreGravite !== 'TOUTES') {
      res = res.filter(a => this.gravite(a) === this.filtreGravite);
    }
    // Tri par urgence décroissante : critique en premier, puis par jours écoulés
    const ordreGravite = { CRITIQUE: 0, ELEVEE: 1, MODEREE: 2 };
    res.sort((a, b) => {
      const g = ordreGravite[this.gravite(a)] - ordreGravite[this.gravite(b)];
      if (g !== 0) return g;
      return this.joursEcoules(b) - this.joursEcoules(a);
    });
    return res;
  }

  // ── Libellés / styles ─────────────────────────────────────────────────

  typeLabel(type: string): string {
    return type === 'MAINTENANCE_RETARD' ? 'Maintenance en retard' : 'Maintenance à prévoir';
  }

  graviteConfig(g: 'CRITIQUE' | 'ELEVEE' | 'MODEREE') {
    const config = {
      CRITIQUE: { label: 'Critique', badge: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400', bordure: 'border-l-4 border-l-red-500', point: 'bg-red-500', pulse: true },
      ELEVEE: { label: 'Élevée', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', bordure: 'border-l-4 border-l-amber-500', point: 'bg-amber-500', pulse: false },
      MODEREE: { label: 'Modérée', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', bordure: 'border-l-4 border-l-blue-500', point: 'bg-blue-500', pulse: false },
    };
    return config[g];
  }

  messageUrgence(a: Alerte): string {
    const jours = this.joursEcoules(a);
    if (a.type === 'MAINTENANCE_RETARD') {
      return jours === 0 ? "Détecté aujourd'hui" : `En retard depuis ${jours} jour${jours > 1 ? 's' : ''}`;
    }
    return jours === 0 ? "Détecté aujourd'hui" : `Signalé il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  }
}