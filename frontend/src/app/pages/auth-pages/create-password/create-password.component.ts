import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-create-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-password.component.html',
})
export class CreatePasswordComponent implements OnInit {
  token = '';
  email = '';
  loading = true;
  erreurToken = '';

  motDePasse = '';
  confirmation = '';
  showPassword = false;
  erreur = '';
  succes = false;
  envoiEnCours = false;

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) { this.erreurToken = 'Lien invalide.'; this.loading = false; return; }
    this.authService.verifyToken(this.token).subscribe({
      next: (res) => { this.email = res.email; this.loading = false; },
      error: () => { this.erreurToken = 'Ce lien est invalide ou a expiré.'; this.loading = false; },
    });
  }

  get force(): { niveau: number; label: string; couleur: string } {
    const p = this.motDePasse;
    if (!p) return { niveau: 0, label: '', couleur: 'bg-gray-200' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { niveau: 1, label: 'Faible', couleur: 'bg-red-500' };
    if (score <= 3) return { niveau: 2, label: 'Moyen', couleur: 'bg-amber-500' };
    return { niveau: 3, label: 'Fort', couleur: 'bg-green-500' };
  }

  get motDePassesCorrespondent(): boolean {
    return this.motDePasse.length > 0 && this.motDePasse === this.confirmation;
  }
  get formuleValide(): boolean {
    return this.motDePasse.length >= 8 && this.motDePassesCorrespondent && this.force.niveau >= 2;
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  valider() {
    if (!this.formuleValide) return;
    this.envoiEnCours = true;
    this.erreur = '';
    this.authService.setPassword(this.token, this.motDePasse).subscribe({
      next: () => { this.succes = true; this.envoiEnCours = false; setTimeout(() => this.router.navigate(['/signin']), 2500); },
      error: () => { this.erreur = 'Une erreur est survenue.'; this.envoiEnCours = false; },
    });
  }
}