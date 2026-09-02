export type Role = 'ADMIN' | 'COMMERCIAL' | 'TECHNICIEN' | 'CLIENT';
export type Module = 'appareils' | 'fournisseurs' | 'commandes' | 'clients' | 'ventes' | 'maintenance' | 'alertes';
export type Action = 'create' | 'update' | 'delete';

// Modifie juste ce tableau pour ajuster les permissions, sans toucher aux composants.
export const ROLE_PERMISSIONS: Record<Role, Partial<Record<Module, Action[]>>> = {
  ADMIN: {
    appareils: ['create', 'update', 'delete'],
    fournisseurs: ['create', 'update', 'delete'],
    commandes: ['create', 'update', 'delete'],
    clients: ['create', 'update', 'delete'],
    ventes: ['create', 'update', 'delete'],
    maintenance: ['create', 'update', 'delete'],
    alertes: ['create', 'update', 'delete'],
  },
  COMMERCIAL: {
    appareils: ['update'],
    fournisseurs: ['create', 'update'],
    commandes: ['create', 'update'],
    clients: ['create', 'update'],
    ventes: ['create', 'update'],
  },
  TECHNICIEN: {
    appareils: ['update'],
    maintenance: ['create', 'update'],
    alertes: ['create', 'update'],
  },
  CLIENT: {
    // Lecture seule partout : aucune entrée = aucun bouton CRUD visible
  },
};