import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Vente {
  id?: number;
  dateVente: string;
  montant: number;
  appareil?: { id: number; nom?: string; numeroSerie?: string } | null;
  client?: { id: number; nom?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class VenteService {
  private apiUrl = `${API_BASE_URL}/ventes`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<Vente[]> { return this.http.get<Vente[]>(this.apiUrl); }
  create(v: Vente): Observable<Vente> { return this.http.post<Vente>(this.apiUrl, v); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}