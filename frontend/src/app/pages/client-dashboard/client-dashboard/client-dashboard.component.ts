import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../../shared/chatbot/chatbot/chatbot.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  templateUrl: './client-dashboard.component.html',
})
export class ClientDashboardComponent implements OnInit {
  nomUtilisateur = '';

  ngOnInit() {
    const stocke = localStorage.getItem('utilisateur');
    if (stocke) {
      try { this.nomUtilisateur = JSON.parse(stocke).prenom || ''; } catch {}
    }
  }

  salutation(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
}