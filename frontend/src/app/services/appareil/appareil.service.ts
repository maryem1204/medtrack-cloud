import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Appareil {
  id?: number;
  numeroSerie: string;
  nom: string;
  categorie: string;
  dateImport: string;
  statut: string;
  qrCode?: string;
}

@Injectable({ providedIn: 'root' })
export class AppareilService {
  private apiUrl = `${API_BASE_URL}/appareils`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Appareil[]> {
    return this.http.get<Appareil[]>(this.apiUrl);
  }
  create(appareil: Appareil): Observable<Appareil> {
    return this.http.post<Appareil>(this.apiUrl, appareil);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  update(id: number, appareil: Appareil): Observable<Appareil> {
    return this.http.put<Appareil>(`${this.apiUrl}/${id}`, appareil);
  }
}