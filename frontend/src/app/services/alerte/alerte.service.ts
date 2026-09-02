import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Alerte {
  id?: number;
  type: string;
  dateDeclenchement: string;
  statut: string; // ACTIVE, TRAITEE
  appareil?: { id: number; nom?: string; numeroSerie?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AlerteService {
  private apiUrl = `${API_BASE_URL}/alertes`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Alerte[]> { return this.http.get<Alerte[]>(this.apiUrl); }
  generer(): Observable<Alerte[]> { return this.http.post<Alerte[]>(`${this.apiUrl}/generer`, {}); }
  update(id: number, a: Partial<Alerte>): Observable<Alerte> { return this.http.put<Alerte>(`${this.apiUrl}/${id}`, a); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}