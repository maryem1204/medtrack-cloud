import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface HistoriqueAppareil {
  id?: number;
  evenement: string;
  date: string;
  auteur: string;
  appareil?: { id: number } | null;
}

@Injectable({ providedIn: 'root' })
export class HistoriqueService {
  private apiUrl = `${API_BASE_URL}/historique`;
  constructor(private http: HttpClient) {}
  getByAppareil(appareilId: number): Observable<HistoriqueAppareil[]> {
    return this.http.get<HistoriqueAppareil[]>(`${this.apiUrl}/appareil/${appareilId}`);
  }
  create(h: HistoriqueAppareil): Observable<HistoriqueAppareil> {
    return this.http.post<HistoriqueAppareil>(this.apiUrl, h);
  }
}