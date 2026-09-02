import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notif } from '../../../../services/notification/notification.service';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component'; 


@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: Notif[] = [];
  nonLues = 0;

  constructor(private notifService: NotificationService) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) this.notifService.connect(user.id);

    this.notifService.notifications$.subscribe(n => this.notifications = n);
    this.notifService.nonLues$.subscribe(n => this.nonLues = n);
  }

  ngOnDestroy() { this.notifService.disconnect(); }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.nonLues > 0) this.notifService.marquerLues();
  }

  closeDropdown() { this.isOpen = false; }

  getIcon(type: string): string {
    switch(type) {
      case 'COMMANDE': return '📦';
      case 'UTILISATEUR': return '👤';
      default: return '🔔';
    }
  }

  tempsEcoule(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff/60)} min`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}j`;
  }
}