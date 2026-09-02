import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../chatbot/chatbot/chatbot.component';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-floating-chat',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  templateUrl: './floating-chat.component.html',
})
export class FloatingChatComponent {
  ouvert = false;

  constructor(private authService: AuthService) {}

  get visible(): boolean {
    return this.authService.isLoggedIn();
  }

  toggle() {
    this.ouvert = !this.ouvert;
  }
}