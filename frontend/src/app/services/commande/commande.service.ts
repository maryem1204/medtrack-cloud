import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface LigneCommande {
  id?: number;
  appareil: { id: number; nom?: string };
  quantite: number;
  prixUnitaire: number;
}

export interface Commande {
  id?: number;
  reference: string;
  dateCommande: string;
  statut: string;
  fournisseur?: { id: number; nom?: string; pays?: string; contact?: string } | null;
  lignes?: LigneCommande[];
}

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private apiUrl = `${API_BASE_URL}/commandes`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Commande[]> { return this.http.get<Commande[]>(this.apiUrl); }
  create(c: Commande): Observable<Commande> { return this.http.post<Commande>(this.apiUrl, c); }
  update(id: number, c: Partial<Commande>): Observable<Commande> { return this.http.put<Commande>(`${this.apiUrl}/${id}`, c); }
  recevoir(id: number): Observable<Commande> { return this.http.put<Commande>(`${this.apiUrl}/${id}/recevoir`, {}); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}