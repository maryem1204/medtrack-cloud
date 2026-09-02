import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur/utilisateur.service';

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs-list.component.html',
})
export class UtilisateursListComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  loading = true;

  // Recherche / filtres / tri
  recherche = '';
  filtreRole: string | null = null;
  triChamp: 'nom' | 'email' | 'role' = 'nom';
  triSens: 'asc' | 'desc' = 'asc';
  showFiltres = false;

  // Vue (cartes / tableau)
  vueMode: 'cartes' | 'tableau' = 'cartes';

  // Pagination
  pageActuelle = 1;
  taillePage = 6;

  showModal = false;
  modeEdition = false;
  formErreur = '';
  messageSucces = '';
  nouvelUtilisateur: Utilisateur = { nom: '', prenom: '', email: '', motDePasse: '', role: 'COMMERCIAL', telephone: '', typeClient: '', adresse: '' };

  showConfirmSuppression = false;
  utilisateurASupprimer: Utilisateur | null = null;

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.utilisateurService.getAll().subscribe({
      next: (data) => { this.utilisateurs = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  countByRole(role: string): number {
    return this.utilisateurs.filter(u => u.role === role).length;
  }

  // ── Recherche / filtres / tri ──────────────────────────────────────────

  get utilisateursFiltres(): Utilisateur[] {
    let res = [...this.utilisateurs];

    if (this.recherche.trim()) {
      const q = this.recherche.trim().toLowerCase();
      res = res.filter(u =>
        u.nom?.toLowerCase().includes(q) ||
        u.prenom?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (this.filtreRole) res = res.filter(u => u.role === this.filtreRole);

    res.sort((a, b) => {
      let cmp = 0;
      if (this.triChamp === 'nom') cmp = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
      else if (this.triChamp === 'email') cmp = (a.email || '').localeCompare(b.email || '');
      else if (this.triChamp === 'role') cmp = (a.role || '').localeCompare(b.role || '');
      return this.triSens === 'asc' ? cmp : -cmp;
    });

    return res;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.utilisateursFiltres.length / this.taillePage));
  }

  get utilisateursPage(): Utilisateur[] {
    const start = (this.pageActuelle - 1) * this.taillePage;
    return this.utilisateursFiltres.slice(start, start + this.taillePage);
  }

  get pagesAffichees(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changerTri(champ: 'nom' | 'email' | 'role') {
    if (this.triChamp === champ) this.triSens = this.triSens === 'asc' ? 'desc' : 'asc';
    else { this.triChamp = champ; this.triSens = 'asc'; }
    this.pageActuelle = 1;
  }

  onFiltreChange() { this.pageActuelle = 1; }

  reinitialiserFiltres() {
    this.recherche = '';
    this.filtreRole = null;
    this.pageActuelle = 1;
  }

  allerPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageActuelle = p;
  }

  // ── Export CSV ───────────────────────────────────────────────────────

  exporterCsv() {
    const lignes = [
      ['Nom', 'Prénom', 'Email', 'Rôle', 'Téléphone'],
      ...this.utilisateursFiltres.map(u => [u.nom, u.prenom, u.email, this.roleLabel(u.role), u.telephone || ''])
    ];
    const corps = lignes.map(l => l.map(c => `"${c}"`).join(';')).join('\n');
    const csv = 'sep=;\n' + corps;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Modal ────────────────────────────────────────────────────────────

  ouvrirModal() {
    this.nouvelUtilisateur = { nom: '', prenom: '', email: '', motDePasse: '', role: 'COMMERCIAL', telephone: '', typeClient: '', adresse: '' };
    this.modeEdition = false;
    this.formErreur = '';
    this.showModal = true;
  }

  modifier(u: Utilisateur) {
    this.nouvelUtilisateur = { ...u, motDePasse: '' };
    this.modeEdition = true;
    this.formErreur = '';
    this.showModal = true;
  }

  fermerModal() { this.showModal = false; }

  enregistrer() {
    if (!this.nouvelUtilisateur.nom.trim() || !this.nouvelUtilisateur.prenom.trim()) {
      this.formErreur = 'Nom et prénom sont obligatoires.'; return;
    }
    if (!this.nouvelUtilisateur.email.trim()) {
      this.formErreur = 'Email obligatoire.'; return;
    }
    this.formErreur = '';

    if (this.modeEdition && this.nouvelUtilisateur.id) {
      const payload = { ...this.nouvelUtilisateur };
      if (!payload.motDePasse?.trim()) delete payload.motDePasse;
      this.utilisateurService.update(this.nouvelUtilisateur.id, payload).subscribe({
        next: () => { this.fermerModal(); this.afficherSucces('Utilisateur modifié avec succès.'); this.charger(); },
        error: (err) => {
          if (err.status === 409) this.formErreur = 'Cet email est déjà utilisé par un autre utilisateur.';
          else this.formErreur = 'Erreur lors de la modification. Veuillez réessayer.';
        }
      });
    } else {
      this.utilisateurService.create(this.nouvelUtilisateur).subscribe({
        next: () => { this.fermerModal(); this.afficherSucces('Utilisateur créé. Un email d\'invitation a été envoyé.'); this.charger(); },
        error: (err) => {
          if (err.status === 409) this.formErreur = '❌ Cet email est déjà utilisé par un autre utilisateur.';
          else if (err.status === 403) this.formErreur = '❌ Accès refusé. Votre session a peut-être expiré.';
          else this.formErreur = '❌ Erreur lors de la création : ' + (err.error?.message || 'Veuillez réessayer.');
        }
      });
    }
  }

  private afficherSucces(msg: string) {
    this.messageSucces = msg;
    setTimeout(() => this.messageSucces = '', 4000);
  }

  demanderSuppression(u: Utilisateur) { this.utilisateurASupprimer = u; this.showConfirmSuppression = true; }
  annulerSuppression() { this.showConfirmSuppression = false; this.utilisateurASupprimer = null; }
  confirmerSuppression() {
    if (!this.utilisateurASupprimer?.id) return;
    this.utilisateurService.delete(this.utilisateurASupprimer.id).subscribe({
      next: () => { this.showConfirmSuppression = false; this.utilisateurASupprimer = null; this.afficherSucces('Utilisateur supprimé.'); this.charger(); },
      error: (err) => console.error(err),
    });
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = { ADMIN: 'Admin', COMMERCIAL: 'Commercial', TECHNICIEN: 'Technicien', CLIENT: 'Client' };
    return labels[role] || role;
  }
  roleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      ADMIN: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      COMMERCIAL: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      TECHNICIEN: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      CLIENT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    };
    return classes[role] || '';
  }
  avatarGradientClass(role: string): string {
    const classes: Record<string, string> = {
      ADMIN: 'from-red-500 to-rose-500',
      COMMERCIAL: 'from-brand-500 to-teal-500',
      TECHNICIEN: 'from-green-500 to-emerald-500',
      CLIENT: 'from-amber-500 to-orange-500',
    };
    return classes[role] || 'from-gray-400 to-gray-500';
  }
  initiales(nom: string, prenom: string): string {
    return `${nom?.[0] || ''}${prenom?.[0] || ''}`.toUpperCase();
  }
}