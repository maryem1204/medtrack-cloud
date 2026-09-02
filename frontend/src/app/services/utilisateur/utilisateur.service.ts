import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Utilisateur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  role: string;
  telephone?: string;
  typeClient?: string;
  adresse?: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private apiUrl = `${API_BASE_URL}/utilisateurs`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Utilisateur[]> { return this.http.get<Utilisateur[]>(this.apiUrl); }
  create(u: Utilisateur): Observable<Utilisateur> { return this.http.post<Utilisateur>(this.apiUrl, u); }
  update(id: number, u: Utilisateur): Observable<Utilisateur> { return this.http.put<Utilisateur>(`${this.apiUrl}/${id}`, u); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
  getById(id: number): Observable<Utilisateur> { return this.http.get<Utilisateur>(`${this.apiUrl}/${id}`); }
}