import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('chatScrollContainer') chatContainer!: ElementRef;

  chatMessages: ChatMessage[] = [
    { role: 'assistant', content: 'Bonjour, je suis votre assistant MedTrack. Posez-moi une question.' }
  ];
  chatInput = '';
  chatLoading = false;
  private shouldScroll = false;

  suggestions = ['Où en sont mes commandes ?', 'Quels appareils ai-je achetés ?'];

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  private scrollToBottom() {
    try { this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight; } catch {}
  }

  envoyerMessage(texte: string) {
    if (!texte.trim() || this.chatLoading) return;
    this.chatMessages.push({ role: 'user', content: texte });
    this.chatInput = '';
    this.chatLoading = true;
    this.shouldScroll = true;

    const historique = this.chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    this.http.post<any>("/api/chat", { messages: historique }).subscribe({
      next: (res) => {
        this.chatMessages.push({ role: 'assistant', content: res.content?.[0]?.text || 'Je ne peux pas répondre pour le moment.' });
        this.chatLoading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.chatMessages.push({ role: 'assistant', content: 'Une erreur est survenue. Veuillez réessayer.' });
        this.chatLoading = false;
        this.shouldScroll = true;
      }
    });
  }
}