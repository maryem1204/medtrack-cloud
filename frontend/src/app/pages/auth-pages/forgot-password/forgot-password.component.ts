import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

declare const grecaptcha: any;
declare const window: any;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  email = '';
  erreur = '';
  succes = false;
  envoiEnCours = false;
  captchaValide = false;
  recaptchaToken = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    window['onRecaptchaSuccess'] = (token: string) => {
      this.recaptchaToken = token;
      this.captchaValide = true;
      this.erreur = '';
    };
    window['onRecaptchaExpired'] = () => {
      this.recaptchaToken = '';
      this.captchaValide = false;
    };
  }

  ngAfterViewInit() {
    // Attend que le script Google soit chargé puis rend le widget
    const interval = setInterval(() => {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        clearInterval(interval);
        try {
          grecaptcha.render('recaptcha-container', {
            sitekey: '6LcrnZ8tAAAAAEtL9jbWGF2ksk5ZSg7QX-aYymAT',
            callback: window['onRecaptchaSuccess'],
            'expired-callback': window['onRecaptchaExpired']
          });
        } catch (e) {
          // Widget déjà rendu, ignorer
        }
      }
    }, 200);
  }

  envoyer() {
    this.erreur = '';
    if (!this.email.trim()) {
      this.erreur = 'Entre ton adresse email.';
      return;
    }
    if (!this.captchaValide || !this.recaptchaToken) {
      this.erreur = 'Veuillez cocher la case "Je ne suis pas un robot".';
      return;
    }
    this.envoiEnCours = true;
    this.authService.forgotPassword(this.email, this.recaptchaToken).subscribe({
      next: () => { this.succes = true; this.envoiEnCours = false; },
      error: (err) => {
        this.erreur = err.error?.message || 'Une erreur est survenue.';
        this.envoiEnCours = false;
        grecaptcha.reset();
        this.captchaValide = false;
        this.recaptchaToken = '';
      }
    });
  }
}