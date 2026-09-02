import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';

export interface Maintenance {
  id?: number;
  datePrevue: string;
  dateRealisee?: string | null;
  type: string;
  statut: string;
  appareil?: { id: number; nom?: string; numeroSerie?: string } | null;
  technicien?: { id: number; nom?: string; prenom?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private apiUrl = `${API_BASE_URL}/maintenances`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Maintenance[]> { return this.http.get<Maintenance[]>(this.apiUrl); }
  create(m: Maintenance): Observable<Maintenance> { return this.http.post<Maintenance>(this.apiUrl, m); }
  update(id: number, m: Maintenance): Observable<Maintenance> { return this.http.put<Maintenance>(`${this.apiUrl}/${id}`, m); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}