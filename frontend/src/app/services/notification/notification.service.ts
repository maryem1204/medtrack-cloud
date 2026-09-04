import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';

declare const SockJS: any; // ← ici, DEHORS de la classe

export interface Notif {
  id: number;
  message: string;
  type: string;
  lue: boolean;
  dateCreation: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
private apiUrl = '/api/notifications';
  private stompClient!: Client;

  notifications$ = new BehaviorSubject<Notif[]>([]);
  nonLues$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  connect(userId: number) {
    this.charger();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        this.stompClient.subscribe(`/topic/notifications/${userId}`, (msg) => {
          const notif: Notif = JSON.parse(msg.body);
          const current = this.notifications$.value;
          this.notifications$.next([notif, ...current]);
          this.nonLues$.next(this.nonLues$.value + 1);
        });
      }
    });
    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) this.stompClient.deactivate();
  }

  charger() {
    this.http.get<Notif[]>(this.apiUrl).subscribe(notifs => {
      this.notifications$.next(notifs);
      this.nonLues$.next(notifs.filter(n => !n.lue).length);
    });
  }

  marquerLues() {
    this.http.post(`${this.apiUrl}/lire`, {}).subscribe(() => {
      this.nonLues$.next(0);
      const updated = this.notifications$.value.map(n => ({ ...n, lue: true }));
      this.notifications$.next(updated);
    });
  }
}