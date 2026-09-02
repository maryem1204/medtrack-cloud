import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Client {
  id?: number;
  nom: string;
  type: string; // HOPITAL, CLINIQUE, PHARMACIE
  adresse: string;
  telephone: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = `${API_BASE_URL}/clients`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> { return this.http.get<Client[]>(this.apiUrl); }
  create(c: Client): Observable<Client> { return this.http.post<Client>(this.apiUrl, c); }
  update(id: number, c: Client): Observable<Client> { return this.http.put<Client>(`${this.apiUrl}/${id}`, c); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}