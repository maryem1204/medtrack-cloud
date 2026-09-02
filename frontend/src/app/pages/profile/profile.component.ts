import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur/utilisateur.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  utilisateur: Utilisateur | null = null;
  loading = true;
  message = '';
  erreur = '';

  constructor(
    private utilisateurService: UtilisateurService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (!user) return;
    this.utilisateurService.getById(user.id).subscribe({
      next: (u) => { this.utilisateur = u; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  enregistrer() {
    if (!this.utilisateur?.id) return;
    this.message = '';
    this.erreur = '';
    this.utilisateurService.update(this.utilisateur.id, this.utilisateur).subscribe({
      next: () => this.message = 'Profil mis à jour avec succès.',
      error: () => this.erreur = 'Erreur lors de la mise à jour.',
    });
  }
}