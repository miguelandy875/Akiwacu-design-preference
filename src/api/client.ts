import { components } from './openapi-types';
import { ApiError, DecodedToken, Role } from './types';
import { mockDb } from './mock-store';

export type Schemas = components['schemas'];

const JWT_KEY = 'akiwacu_jwt';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(JWT_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(JWT_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(JWT_KEY);
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.email && payload.sub) {
      payload.email = payload.sub;
    }
    return payload as DecodedToken;
  } catch {
    return null;
  }
};

export const createMockJwt = (user: {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  roles: Role[];
  tontineId?: number;
}): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.email,
    email: user.email,
    utilisateurId: user.id,
    nom: user.nom,
    prenom: user.prenom,
    roles: user.roles,
    tontineId: user.tontineId || 1,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  }));
  return `${header}.${payload}.mock_sig`;
};

// Check if user has permission
export const hasRequiredRole = (userRoles: Role[] | undefined, requiredRoles: Role[]): boolean => {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('ADMIN')) return true; // ADMIN has super rights
  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Centered API Client adapter for all 55 endpoints.
 * Handles Bearer token, JSON headers, 401 expiry, and business rules R1-R8.
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    mockHandler: () => T | Promise<T>
  ): Promise<T> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Try real fetch first
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        removeStoredToken();
        window.dispatchEvent(new CustomEvent('akiwacu-unauthorized'));
        throw new ApiError(401, 'Session expirée. Veuillez vous reconnecter.');
      }

      if (response.status === 403) {
        throw new ApiError(403, 'Vous n’avez pas les droits pour cette action.');
      }

      if (response.status === 404) {
        throw new ApiError(404, 'Ressource introuvable.');
      }

      if (!response.ok) {
        let errMessage = `Erreur ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.message || errData.error || errMessage;
        } catch {
          // ignore
        }
        throw new ApiError(response.status, errMessage);
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return (await response.blob()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      // If it's an intentional ApiError from a real response, rethrow
      if (err instanceof ApiError) {
        throw err;
      }
      // Otherwise (Network Error / No backend reachable on localhost:8080 during preview),
      // execute high-fidelity mock handler to ensure 100% testable prototype experience!
      await new Promise((resolve) => setTimeout(resolve, 150)); // simulate realistic latency
      return await mockHandler();
    }
  }

  // Current session helper
  getCurrentUser() {
    const token = getStoredToken();
    if (!token) return null;
    return decodeToken(token);
  }

  /* ==========================================================================
     1. AUTHENTIFICATION (1 endpoint)
     ========================================================================== */
  async login(body: Schemas['LoginRequest']): Promise<Schemas['LoginResponse']> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const user = mockDb.utilisateurs.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
      if (!user || user.motDePasse !== body.motDePasse) {
        throw new ApiError(401, 'Email ou mot de passe incorrect.');
      }
      if (!user.actif) {
        throw new ApiError(403, 'Ce compte utilisateur a été désactivé.');
      }
      const token = createMockJwt({
        id: user.id!,
        email: user.email!,
        nom: user.nom!,
        prenom: user.prenom!,
        roles: user.roles as Role[],
        tontineId: 1,
      });
      setStoredToken(token);
      return {
        jeton: token,
        expireA: new Date(Date.now() + 86400 * 7 * 1000).toISOString(),
        utilisateurId: user.id,
        nom: user.nom,
        prenom: user.prenom,
        tontineId: 1,
        roles: user.roles,
      };
    });
  }

  /* ==========================================================================
     2. DASHBOARD (1 endpoint)
     ========================================================================== */
  async getDashboard(): Promise<Schemas['DashboardResponse']> {
    return this.request('/api/dashboard', { method: 'GET' }, () => {
      const membresActifs = mockDb.membres.filter((m) => m.statut === 'ACTIF').length;
      const cotisationsTotal = mockDb.cotisations.reduce((acc, c) => acc + (c.montant || 0), 0);
      const pretsEnCours = mockDb.prets.filter((p) => p.statut === 'ACTIF').reduce((acc, p) => acc + (p.montantAccorde || 0), 0);
      const remboursementsTotal = mockDb.remboursements.reduce((acc, r) => acc + (r.montant || 0), 0);
      
      const soldeCaisse = mockDb.transactionsCaisse.reduce((acc, t) => {
        return t.sens === 'ENTREE' ? acc + (t.montant || 0) : acc - (t.montant || 0);
      }, 0);

      return {
        membresActifs,
        cotisationsTotal,
        pretsEnCours,
        remboursementsTotal,
        soldeCaisse,
      };
    });
  }

  /* ==========================================================================
     3. TONTINES (5 endpoints)
     ========================================================================== */
  async getTontines(): Promise<Schemas['TontineResponse'][]> {
    return this.request('/api/tontines', { method: 'GET' }, () => [...mockDb.tontines]);
  }

  async createTontine(body: Schemas['TontineCreationRequest']): Promise<Schemas['TontineResponse']> {
    return this.request('/api/tontines', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (mockDb.tontines.some((t) => t.nom?.toLowerCase() === body.nom.toLowerCase())) {
        throw new ApiError(409, 'Nom de tontine déjà utilisé.');
      }
      if (mockDb.utilisateurs.some((u) => u.email.toLowerCase() === body.administrateur.email.toLowerCase())) {
        throw new ApiError(409, 'Cet email administrateur est déjà utilisé.');
      }
      const newTontine: Schemas['TontineResponse'] = {
        id: Date.now(),
        nom: body.nom,
        description: body.description,
        dateCreation: new Date().toISOString().split('T')[0],
        statut: 'ACTIVE',
      };
      mockDb.tontines.push(newTontine);

      // Create initial Admin
      mockDb.utilisateurs.push({
        id: Date.now() + 1,
        email: body.administrateur.email,
        motDePasse: body.administrateur.motDePasse,
        nom: body.administrateur.nom,
        prenom: body.administrateur.prenom,
        telephone: body.administrateur.telephone,
        actif: true,
        roles: ['ADMIN', 'GESTIONNAIRE'],
      });
      mockDb.save();
      return newTontine;
    });
  }

  async getTontine(id: number): Promise<Schemas['TontineResponse']> {
    return this.request(`/api/tontines/${id}`, { method: 'GET' }, () => {
      const t = mockDb.tontines.find((item) => item.id === id);
      if (!t) throw new ApiError(404, 'Tontine introuvable.');
      return t;
    });
  }

  async updateTontine(id: number, body: Schemas['TontineRequest']): Promise<Schemas['TontineResponse']> {
    return this.request(`/api/tontines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.tontines.findIndex((t) => t.id === id);
      if (idx === -1) throw new ApiError(404, 'Tontine introuvable.');
      if (mockDb.tontines.some((t) => t.id !== id && t.nom?.toLowerCase() === body.nom.toLowerCase())) {
        throw new ApiError(409, 'Nom de tontine déjà utilisé.');
      }
      mockDb.tontines[idx] = { ...mockDb.tontines[idx], ...body };
      mockDb.save();
      return mockDb.tontines[idx];
    });
  }

  async deleteTontine(id: number): Promise<void> {
    return this.request(`/api/tontines/${id}`, { method: 'DELETE' }, () => {
      const idx = mockDb.tontines.findIndex((t) => t.id === id);
      if (idx === -1) throw new ApiError(404, 'Tontine introuvable.');
      mockDb.tontines.splice(idx, 1);
      mockDb.save();
    });
  }

  /* ==========================================================================
     4. UTILISATEURS (5 endpoints)
     ========================================================================== */
  async getUtilisateurs(): Promise<Schemas['UtilisateurResponse'][]> {
    return this.request('/api/utilisateurs', { method: 'GET' }, () => {
      return mockDb.utilisateurs.map(({ motDePasse: _p, ...rest }) => rest);
    });
  }

  async createUtilisateur(body: Schemas['UtilisateurRequest']): Promise<Schemas['UtilisateurResponse']> {
    return this.request('/api/utilisateurs', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (mockDb.utilisateurs.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
        throw new ApiError(409, 'Email déjà utilisé.');
      }
      const newUser = {
        id: Date.now(),
        email: body.email,
        motDePasse: body.motDePasse,
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        actif: true,
        roles: body.roles,
      };
      mockDb.utilisateurs.push(newUser);
      mockDb.save();
      const { motDePasse: _p, ...resp } = newUser;
      return resp;
    });
  }

  async getUtilisateur(id: number): Promise<Schemas['UtilisateurResponse']> {
    return this.request(`/api/utilisateurs/${id}`, { method: 'GET' }, () => {
      const u = mockDb.utilisateurs.find((item) => item.id === id);
      if (!u) throw new ApiError(404, 'Utilisateur introuvable ou hors de la tontine courante (R1).');
      const { motDePasse: _p, ...resp } = u;
      return resp;
    });
  }

  async updateUtilisateur(id: number, body: Schemas['UtilisateurModificationRequest']): Promise<Schemas['UtilisateurResponse']> {
    return this.request(`/api/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.utilisateurs.findIndex((u) => u.id === id);
      if (idx === -1) throw new ApiError(404, 'Utilisateur introuvable ou hors de la tontine courante (R1).');
      mockDb.utilisateurs[idx] = {
        ...mockDb.utilisateurs[idx],
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        roles: body.roles,
        actif: body.actif ?? mockDb.utilisateurs[idx].actif,
      };
      mockDb.save();
      const { motDePasse: _p, ...resp } = mockDb.utilisateurs[idx];
      return resp;
    });
  }

  async deleteUtilisateur(id: number): Promise<void> {
    return this.request(`/api/utilisateurs/${id}`, { method: 'DELETE' }, () => {
      const u = mockDb.utilisateurs.find((item) => item.id === id);
      if (!u) throw new ApiError(404, 'Utilisateur introuvable ou hors de la tontine courante (R1).');
      // R5: Désactivation logique (actif=false), jamais de suppression physique
      u.actif = false;
      mockDb.save();
    });
  }

  /* ==========================================================================
     5. MEMBRES (4 endpoints)
     ========================================================================== */
  async getMembres(): Promise<Schemas['MembreResponse'][]> {
    return this.request('/api/membres', { method: 'GET' }, () => [...mockDb.membres]);
  }

  async createMembre(body: Schemas['MembreRequest']): Promise<Schemas['MembreResponse']> {
    return this.request('/api/membres', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (body.numeroMembre && mockDb.membres.some((m) => m.numeroMembre === body.numeroMembre)) {
        throw new ApiError(409, 'Numéro de membre déjà utilisé dans cette tontine.');
      }
      if (body.utilisateurId && !mockDb.utilisateurs.some((u) => u.id === body.utilisateurId)) {
        throw new ApiError(404, 'Utilisateur à lier introuvable.');
      }
      const num = body.numeroMembre || `MEM-2026-${String(mockDb.membres.length + 1).padStart(3, '0')}`;
      const newMembre: Schemas['MembreResponse'] = {
        id: Date.now(),
        numeroMembre: num,
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        dateAdhesion: body.dateAdhesion,
        statut: 'ACTIF',
        utilisateurId: body.utilisateurId,
      };
      mockDb.membres.push(newMembre);
      mockDb.save();
      return newMembre;
    });
  }

  async getMembre(id: number): Promise<Schemas['MembreResponse']> {
    return this.request(`/api/membres/${id}`, { method: 'GET' }, () => {
      const m = mockDb.membres.find((item) => item.id === id);
      if (!m) throw new ApiError(404, 'Membre introuvable ou hors de la tontine courante (R1).');
      return m;
    });
  }

  async updateMembre(id: number, body: Schemas['MembreModificationRequest']): Promise<Schemas['MembreResponse']> {
    return this.request(`/api/membres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.membres.findIndex((m) => m.id === id);
      if (idx === -1) throw new ApiError(404, 'Membre introuvable ou hors de la tontine courante (R1).');
      if (body.numeroMembre && mockDb.membres.some((m) => m.id !== id && m.numeroMembre === body.numeroMembre)) {
        throw new ApiError(409, 'Numéro de membre déjà utilisé dans cette tontine.');
      }
      mockDb.membres[idx] = {
        ...mockDb.membres[idx],
        ...body,
      };
      mockDb.save();
      return mockDb.membres[idx];
    });
  }

  /* ==========================================================================
     6. ADHESIONS (4 endpoints)
     ========================================================================== */
  async getAdhesions(): Promise<Schemas['AdhesionResponse'][]> {
    return this.request('/api/adhesions', { method: 'GET' }, () => [...mockDb.adhesions]);
  }

  async createAdhesion(body: Schemas['AdhesionRequest']): Promise<Schemas['AdhesionResponse']> {
    return this.request('/api/adhesions', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (mockDb.adhesions.some((a) => a.membreId === body.membreId && a.cycleId === body.cycleId && a.statut === 'ACTIVE')) {
        throw new ApiError(409, 'Ce membre a déjà une adhésion active dans ce cycle.');
      }
      const newAdhesion: Schemas['AdhesionResponse'] = {
        id: Date.now(),
        membreId: body.membreId,
        cycleId: body.cycleId,
        dateAdhesion: body.dateAdhesion,
        statut: 'ACTIVE',
      };
      mockDb.adhesions.push(newAdhesion);
      mockDb.save();
      return newAdhesion;
    });
  }

  async getAdhesion(id: number): Promise<Schemas['AdhesionResponse']> {
    return this.request(`/api/adhesions/${id}`, { method: 'GET' }, () => {
      const a = mockDb.adhesions.find((item) => item.id === id);
      if (!a) throw new ApiError(404, 'Adhésion introuvable.');
      return a;
    });
  }

  async updateAdhesion(id: number, body: Schemas['AdhesionModificationRequest']): Promise<Schemas['AdhesionResponse']> {
    return this.request(`/api/adhesions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.adhesions.findIndex((a) => a.id === id);
      if (idx === -1) throw new ApiError(404, 'Adhésion introuvable.');
      mockDb.adhesions[idx] = {
        ...mockDb.adhesions[idx],
        dateAdhesion: body.dateAdhesion,
        statut: body.statut,
      };
      mockDb.save();
      return mockDb.adhesions[idx];
    });
  }

  /* ==========================================================================
     7. CYCLES (5 endpoints)
     ========================================================================== */
  async getCycles(): Promise<Schemas['CycleResponse'][]> {
    return this.request('/api/cycles', { method: 'GET' }, () => [...mockDb.cycles]);
  }

  async createCycle(body: Schemas['CycleRequest']): Promise<Schemas['CycleResponse']> {
    return this.request('/api/cycles', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (mockDb.cycles.some((c) => c.statut === 'OUVERT')) {
        throw new ApiError(409, 'Un cycle ouvert existe déjà dans cette tontine (R2).');
      }
      if (new Date(body.dateFin) <= new Date(body.dateDebut)) {
        throw new ApiError(400, 'La date de fin doit être strictement postérieure à la date de début.');
      }
      const newCycle: Schemas['CycleResponse'] = {
        id: Date.now(),
        libelle: body.libelle,
        dateDebut: body.dateDebut,
        dateFin: body.dateFin,
        montantCotisation: body.montantCotisation,
        periodicite: body.periodicite,
        statut: 'OUVERT',
      };
      mockDb.cycles.push(newCycle);
      mockDb.save();
      return newCycle;
    });
  }

  async getCycle(id: number): Promise<Schemas['CycleResponse']> {
    return this.request(`/api/cycles/${id}`, { method: 'GET' }, () => {
      const c = mockDb.cycles.find((item) => item.id === id);
      if (!c) throw new ApiError(404, 'Cycle introuvable.');
      return c;
    });
  }

  async updateCycle(id: number, body: Schemas['CycleRequest']): Promise<Schemas['CycleResponse']> {
    return this.request(`/api/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.cycles.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError(404, 'Cycle introuvable.');
      mockDb.cycles[idx] = {
        ...mockDb.cycles[idx],
        libelle: body.libelle,
        dateDebut: body.dateDebut,
        dateFin: body.dateFin,
        montantCotisation: body.montantCotisation,
        periodicite: body.periodicite,
      };
      mockDb.save();
      return mockDb.cycles[idx];
    });
  }

  async patchCycleStatut(id: number, body: Schemas['CycleStatutRequest']): Promise<Schemas['CycleResponse']> {
    return this.request(`/api/cycles/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.cycles.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError(404, 'Cycle introuvable.');
      const current = mockDb.cycles[idx];
      
      if (body.statut === 'OUVERT' && mockDb.cycles.some((c) => c.id !== id && c.statut === 'OUVERT')) {
        throw new ApiError(409, 'Un autre cycle est déjà ouvert dans cette tontine.');
      }

      current.statut = body.statut;
      if (body.statut === 'CLOTURE') {
        current.dateCloture = new Date().toISOString().split('T')[0];
      }
      mockDb.save();
      return current;
    });
  }

  /* ==========================================================================
     8. COTISATIONS & REÇUS (6 endpoints)
     ========================================================================== */
  async getCotisations(): Promise<Schemas['CotisationResponse'][]> {
    return this.request('/api/cotisations', { method: 'GET' }, () => [...mockDb.cotisations]);
  }

  async createCotisation(body: Schemas['CotisationRequest']): Promise<Schemas['CotisationResponse']> {
    return this.request('/api/cotisations', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      // R2: Cycle actif requis
      const cycle = mockDb.cycles.find((c) => c.id === body.cycleId);
      if (!cycle || cycle.statut !== 'OUVERT') {
        throw new ApiError(409, 'Opération rejetée : le cycle n’est pas actif (R2).');
      }

      const recuId = Date.now();
      const newCotisation: Schemas['CotisationResponse'] = {
        id: Date.now(),
        membreId: body.membreId,
        cycleId: body.cycleId,
        montant: body.montant,
        dateCotisation: body.dateCotisation,
        modePaiement: body.modePaiement,
        valideParId: 2, // Trésorier validateur (R5)
        verrouille: true, // R8: Verrouillé dès génération du reçu
        recuId,
      };
      mockDb.cotisations.push(newCotisation);

      // Enregistrer transaction caisse associée
      mockDb.transactionsCaisse.push({
        id: Date.now() + 1,
        tontineId: 1,
        cycleId: body.cycleId,
        sens: 'ENTREE',
        montant: body.montant,
        motif: `Cotisation membre #${body.membreId}`,
        dateTransaction: body.dateCotisation,
        valideParId: 2,
        referenceOperation: `COTISATION:${newCotisation.id}`,
      });

      mockDb.save();
      return newCotisation;
    });
  }

  async createCotisationBatch(body: Schemas['CotisationBatchRequest']): Promise<Schemas['CotisationResponse'][]> {
    return this.request('/api/cotisations/batch', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const created: Schemas['CotisationResponse'][] = [];
      for (const cot of body.cotisations) {
        const cycle = mockDb.cycles.find((c) => c.id === cot.cycleId);
        if (!cycle || cycle.statut !== 'OUVERT') {
          throw new ApiError(409, 'Opération par lot rejetée : le cycle n’est pas actif (R2).');
        }
        const item: Schemas['CotisationResponse'] = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          membreId: cot.membreId,
          cycleId: cot.cycleId,
          montant: cot.montant,
          dateCotisation: cot.dateCotisation,
          modePaiement: cot.modePaiement,
          valideParId: 2,
          verrouille: true,
          recuId: Date.now() + Math.floor(Math.random() * 1000),
        };
        mockDb.cotisations.push(item);
        mockDb.transactionsCaisse.push({
          id: Date.now() + Math.floor(Math.random() * 1000) + 2,
          tontineId: 1,
          cycleId: cot.cycleId,
          sens: 'ENTREE',
          montant: cot.montant,
          motif: `Cotisation batch membre #${cot.membreId}`,
          dateTransaction: cot.dateCotisation,
          valideParId: 2,
          referenceOperation: `COTISATION:${item.id}`,
        });
        created.push(item);
      }
      mockDb.save();
      return created;
    });
  }

  async getCotisation(id: number): Promise<Schemas['CotisationResponse']> {
    return this.request(`/api/cotisations/${id}`, { method: 'GET' }, () => {
      const c = mockDb.cotisations.find((item) => item.id === id);
      if (!c) throw new ApiError(404, 'Cotisation introuvable.');
      return c;
    });
  }

  async updateCotisation(id: number, body: Schemas['CotisationModificationRequest']): Promise<Schemas['CotisationResponse']> {
    return this.request(`/api/cotisations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.cotisations.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError(404, 'Cotisation introuvable.');
      // R8: Verrouillée si reçu émis
      if (mockDb.cotisations[idx].verrouille) {
        throw new ApiError(409, 'Opération verrouillée par un reçu émis : modification impossible (R8).');
      }
      mockDb.cotisations[idx] = {
        ...mockDb.cotisations[idx],
        montant: body.montant,
        dateCotisation: body.dateCotisation,
        modePaiement: body.modePaiement,
      };
      mockDb.save();
      return mockDb.cotisations[idx];
    });
  }

  async getRecuPdf(id: number): Promise<Blob> {
    return this.request(`/api/recus/${id}/pdf`, { method: 'GET' }, () => {
      // Return simulated PDF content as text/plain blob for viewing
      const pdfText = `
%PDF-1.4
% AKIWACU - REÇU OFFICIEL DE TONTINE
% Numéro : REC-2026-${String(id).padStart(6, '0')}
% Date : ${new Date().toLocaleDateString('fr-FR')}
% Validateur : Trésorier Général
% Règle R8 appliquée : Opération verrouillée
==================================================
`;
      return new Blob([pdfText], { type: 'application/pdf' });
    });
  }

  /* ==========================================================================
     9. DEMANDES DE PRÊT, VOTES & DÉCISION (7 endpoints)
     ========================================================================== */
  async getDemandesPret(statut?: 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'DEBLOQUEE'): Promise<Schemas['DemandePretResponse'][]> {
    const query = statut ? `?statut=${statut}` : '';
    return this.request(`/api/demandes-pret${query}`, { method: 'GET' }, () => {
      if (statut) {
        return mockDb.demandesPret.filter((d) => d.statut === statut);
      }
      return [...mockDb.demandesPret];
    });
  }

  async createDemandePret(body: Schemas['DemandePretRequest']): Promise<Schemas['DemandePretResponse']> {
    return this.request('/api/demandes-pret', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const activeCycle = mockDb.cycles.find((c) => c.statut === 'OUVERT');
      if (!activeCycle) {
        throw new ApiError(409, 'Aucun cycle ouvert disponible pour accueillir un prêt (R2).');
      }

      // R6: Montant demandé <= 3 * épargne du membre sur le cycle actif
      const epargne = mockDb.cotisations
        .filter((c) => c.membreId === body.membreId && c.cycleId === activeCycle.id)
        .reduce((sum, c) => sum + (c.montant || 0), 0);

      const maxAutorise = epargne * 3;
      if (epargne > 0 && body.montantDemande > maxAutorise) {
        throw new ApiError(409, `Règle R6 violée : Le montant demandé dépasse 3 fois l’épargne (${maxAutorise} BIF max).`);
      }

      // R7: dateEcheance <= cycle.dateFin
      if (new Date(body.dateEcheance) > new Date(activeCycle.dateFin)) {
        throw new ApiError(409, 'Règle R7 violée : L’échéance du prêt ne peut pas dépasser la date de fin du cycle.');
      }

      const newDemande: Schemas['DemandePretResponse'] = {
        id: Date.now(),
        membreId: body.membreId,
        cycleId: activeCycle.id,
        montantDemande: body.montantDemande,
        dureeMois: body.dureeMois,
        motif: body.motif,
        dateDemande: new Date().toISOString().split('T')[0],
        statut: 'SOUMISE',
      };
      mockDb.demandesPret.push(newDemande);
      mockDb.save();
      return newDemande;
    });
  }

  async getDemandePret(id: number): Promise<Schemas['DemandePretResponse']> {
    return this.request(`/api/demandes-pret/${id}`, { method: 'GET' }, () => {
      const d = mockDb.demandesPret.find((item) => item.id === id);
      if (!d) throw new ApiError(404, 'Demande de prêt introuvable ou hors tontine.');
      return d;
    });
  }

  async getVotes(demandePretId: number): Promise<Schemas['VoteResponse'][]> {
    return this.request(`/api/demandes-pret/${demandePretId}/votes`, { method: 'GET' }, () => {
      return mockDb.votes.filter((v) => v.demandePretId === demandePretId);
    });
  }

  async createVote(demandePretId: number, body: Schemas['VoteRequest']): Promise<Schemas['VoteResponse']> {
    return this.request(`/api/demandes-pret/${demandePretId}/votes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const demande = mockDb.demandesPret.find((d) => d.id === demandePretId);
      if (!demande) throw new ApiError(404, 'Demande introuvable.');
      if (demande.statut !== 'SOUMISE') {
        throw new ApiError(409, 'Vote interdit après décision finale sur cette demande.');
      }

      const currentUser = this.getCurrentUser();
      const commissaireId = currentUser?.utilisateurId || 3; // default Gloria / logged in user

      // R4: Un commissaire ne vote qu'une fois
      if (mockDb.votes.some((v) => v.demandePretId === demandePretId && v.commissaireId === commissaireId)) {
        throw new ApiError(409, 'Règle R4 : Vous avez déjà voté sur cette demande de prêt.');
      }

      const newVote: Schemas['VoteResponse'] = {
        id: Date.now(),
        demandePretId,
        commissaireId,
        sens: body.sens,
        commentaire: body.commentaire,
        dateVote: new Date().toISOString(),
      };
      mockDb.votes.push(newVote);

      // Calcul du quorum R4 (2 commissaires distincts POUR)
      const votesPour = mockDb.votes.filter((v) => v.demandePretId === demandePretId && v.sens === 'POUR').length;
      const votesContre = mockDb.votes.filter((v) => v.demandePretId === demandePretId && v.sens === 'CONTRE').length;

      if (votesPour >= 2) {
        demande.statut = 'APPROUVEE';
      } else if (votesContre >= 2) {
        demande.statut = 'REJETEE';
      }

      mockDb.save();
      return newVote;
    });
  }

  async getVote(demandePretId: number, voteId: number): Promise<Schemas['VoteResponse']> {
    return this.request(`/api/demandes-pret/${demandePretId}/votes/${voteId}`, { method: 'GET' }, () => {
      const v = mockDb.votes.find((item) => item.demandePretId === demandePretId && item.id === voteId);
      if (!v) throw new ApiError(404, 'Vote introuvable ou associé à une autre demande.');
      return v;
    });
  }

  async getDecision(demandePretId: number): Promise<Schemas['VoteDecisionResponse']> {
    return this.request(`/api/demandes-pret/${demandePretId}/votes/decision`, { method: 'GET' }, () => {
      const demande = mockDb.demandesPret.find((d) => d.id === demandePretId);
      if (!demande) throw new ApiError(404, 'Demande introuvable.');

      const votesPour = mockDb.votes.filter((v) => v.demandePretId === demandePretId && v.sens === 'POUR').length;
      const votesContre = mockDb.votes.filter((v) => v.demandePretId === demandePretId && v.sens === 'CONTRE').length;

      return {
        demandePretId,
        votesPour,
        votesContre,
        quorumRequis: 2,
        quorumAtteint: votesPour >= 2,
        statut: demande.statut,
      };
    });
  }

  /* ==========================================================================
     10. PRÊTS ET ÉCHÉANCIERS (4 endpoints)
     ========================================================================== */
  async getPrets(): Promise<Schemas['PretResponse'][]> {
    return this.request('/api/prets', { method: 'GET' }, () => [...mockDb.prets]);
  }

  async debloquerPret(body: Schemas['PretDisbursementRequest']): Promise<Schemas['PretResponse']> {
    return this.request('/api/prets', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const demande = mockDb.demandesPret.find((d) => d.id === body.demandePretId);
      if (!demande) throw new ApiError(404, 'Demande introuvable.');
      if (demande.statut !== 'APPROUVEE') {
        throw new ApiError(409, 'Seule une demande au statut APPROUVEE peut être débloquée.');
      }

      // R3: Vérification du cycle au déblocage
      const cycle = mockDb.cycles.find((c) => c.id === demande.cycleId);
      if (!cycle || cycle.statut !== 'OUVERT') {
        throw new ApiError(409, 'Règle R3 : Impossible de débloquer le prêt, le cycle est gelé ou clôturé.');
      }

      // R7: dateEcheance <= cycle.dateFin
      if (new Date(body.dateEcheance) > new Date(cycle.dateFin)) {
        throw new ApiError(409, 'Règle R7 : La date d’échéance dépasse la fin du cycle.');
      }

      demande.statut = 'DEBLOQUEE';
      const recuId = Date.now();
      const newPret: Schemas['PretResponse'] = {
        id: Date.now(),
        demandePretId: demande.id,
        membreId: demande.membreId,
        cycleId: demande.cycleId,
        montantAccorde: demande.montantDemande,
        dureeMois: demande.dureeMois,
        dateDeblocage: new Date().toISOString().split('T')[0],
        dateEcheance: body.dateEcheance,
        statut: 'ACTIF',
        recuId,
      };
      mockDb.prets.push(newPret);

      // Enregistrer sortie de caisse
      mockDb.transactionsCaisse.push({
        id: Date.now() + 1,
        tontineId: 1,
        cycleId: demande.cycleId,
        sens: 'SORTIE',
        montant: demande.montantDemande,
        motif: `Déblocage prêt #${newPret.id} pour membre #${demande.membreId}`,
        dateTransaction: newPret.dateDeblocage,
        valideParId: 2,
        referenceOperation: `PRET:${newPret.id}`,
      });

      mockDb.save();
      return newPret;
    });
  }

  async getPret(pretId: number): Promise<Schemas['PretResponse']> {
    return this.request(`/api/prets/${pretId}`, { method: 'GET' }, () => {
      const p = mockDb.prets.find((item) => item.id === pretId);
      if (!p) throw new ApiError(404, 'Prêt introuvable ou hors tontine.');
      return p;
    });
  }

  async getPretEcheancier(pretId: number): Promise<Schemas['PretScheduleResponse']> {
    return this.request(`/api/prets/${pretId}/echeancier`, { method: 'GET' }, () => {
      const pret = mockDb.prets.find((p) => p.id === pretId);
      if (!pret) throw new ApiError(404, 'Prêt introuvable.');

      // Montant dû = montant accordé (D-25: taux par défaut 0%)
      const montantDu = pret.montantAccorde || 0;
      const totalRembourse = mockDb.remboursements
        .filter((r) => r.pretId === pretId)
        .reduce((sum, r) => sum + (r.montant || 0), 0);
      const soldeRestant = Math.max(0, montantDu - totalRembourse);

      return {
        pretId,
        dureeMois: pret.dureeMois,
        montantDu,
        soldeRestant,
        dateDeblocage: pret.dateDeblocage,
        dateEcheance: pret.dateEcheance,
      };
    });
  }

  /* ==========================================================================
     11. REMBOURSEMENTS (5 endpoints)
     ========================================================================== */
  async getRemboursements(): Promise<Schemas['RemboursementResponse'][]> {
    return this.request('/api/remboursements', { method: 'GET' }, () => [...mockDb.remboursements]);
  }

  async createRemboursement(body: Schemas['RemboursementRequest']): Promise<Schemas['RemboursementResponse']> {
    return this.request('/api/remboursements', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      const pret = mockDb.prets.find((p) => p.id === body.pretId);
      if (!pret) throw new ApiError(404, 'Prêt introuvable.');

      const cycle = mockDb.cycles.find((c) => c.id === pret.cycleId);
      if (!cycle || cycle.statut !== 'OUVERT') {
        throw new ApiError(409, 'Cycle inactif (R2) : remboursement refusé.');
      }

      const totalRembourse = mockDb.remboursements
        .filter((r) => r.pretId === body.pretId)
        .reduce((sum, r) => sum + (r.montant || 0), 0);
      const soldeRestant = (pret.montantAccorde || 0) - totalRembourse;

      if (body.montant > soldeRestant) {
        throw new ApiError(409, `Le montant de remboursement (${body.montant} BIF) dépasse le solde restant dû (${soldeRestant} BIF).`);
      }

      const newRemboursement: Schemas['RemboursementResponse'] = {
        id: Date.now(),
        pretId: body.pretId,
        montant: body.montant,
        dateRemboursement: body.dateRemboursement,
        valideParId: 2, // R5
        verrouille: true, // R8
      };
      mockDb.remboursements.push(newRemboursement);

      // Si prêt soldé, mise à jour du statut
      if (body.montant >= soldeRestant) {
        pret.statut = 'SOLDE';
      }

      // Enregistrer entrée de caisse
      mockDb.transactionsCaisse.push({
        id: Date.now() + 1,
        tontineId: 1,
        cycleId: pret.cycleId,
        sens: 'ENTREE',
        montant: body.montant,
        motif: `Remboursement prêt #${pret.id}`,
        dateTransaction: body.dateRemboursement,
        valideParId: 2,
        referenceOperation: `REMBOURSEMENT:${newRemboursement.id}`,
      });

      mockDb.save();
      return newRemboursement;
    });
  }

  async getRemboursement(id: number): Promise<Schemas['RemboursementResponse']> {
    return this.request(`/api/remboursements/${id}`, { method: 'GET' }, () => {
      const r = mockDb.remboursements.find((item) => item.id === id);
      if (!r) throw new ApiError(404, 'Remboursement introuvable.');
      return r;
    });
  }

  async updateRemboursement(id: number, body: Schemas['RemboursementRequest']): Promise<Schemas['RemboursementResponse']> {
    return this.request(`/api/remboursements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.remboursements.findIndex((r) => r.id === id);
      if (idx === -1) throw new ApiError(404, 'Remboursement introuvable.');
      // R8: Verrouillé par un reçu
      if (mockDb.remboursements[idx].verrouille) {
        throw new ApiError(409, 'Remboursement verrouillé par un reçu : modification impossible (R8).');
      }
      mockDb.remboursements[idx] = {
        ...mockDb.remboursements[idx],
        montant: body.montant,
        dateRemboursement: body.dateRemboursement,
      };
      mockDb.save();
      return mockDb.remboursements[idx];
    });
  }

  async deleteRemboursement(id: number): Promise<void> {
    return this.request(`/api/remboursements/${id}`, { method: 'DELETE' }, () => {
      const idx = mockDb.remboursements.findIndex((r) => r.id === id);
      if (idx === -1) throw new ApiError(404, 'Remboursement introuvable.');
      // R8
      if (mockDb.remboursements[idx].verrouille) {
        throw new ApiError(409, 'Remboursement verrouillé par un reçu : suppression interdite (R8).');
      }
      mockDb.remboursements.splice(idx, 1);
      mockDb.save();
    });
  }

  async getRemboursementsParPret(pretId: number): Promise<Schemas['RemboursementResponse'][]> {
    return this.request(`/api/remboursements/pret/${pretId}`, { method: 'GET' }, () => {
      return mockDb.remboursements.filter((r) => r.pretId === pretId);
    });
  }

  /* ==========================================================================
     12. TRANSACTIONS CAISSE ET SOLDE (6 endpoints)
     ========================================================================== */
  async getTransactionsCaisse(): Promise<Schemas['TransactionCaisseResponse'][]> {
    return this.request('/api/transactions-caisse', { method: 'GET' }, () => [...mockDb.transactionsCaisse]);
  }

  async createTransactionCaisse(body: Schemas['TransactionCaisseRequest']): Promise<Schemas['TransactionCaisseResponse']> {
    return this.request('/api/transactions-caisse', {
      method: 'POST',
      body: JSON.stringify(body),
    }, () => {
      if (body.cycleId) {
        const cycle = mockDb.cycles.find((c) => c.id === body.cycleId);
        if (!cycle || cycle.statut !== 'OUVERT') {
          throw new ApiError(409, 'Cycle inactif (R2) : transaction de caisse rejetée.');
        }
      }
      const newTx: Schemas['TransactionCaisseResponse'] = {
        id: Date.now(),
        tontineId: 1,
        cycleId: body.cycleId,
        sens: body.sens,
        montant: body.montant,
        motif: body.motif,
        dateTransaction: body.dateTransaction,
        valideParId: 2, // R5
        referenceOperation: body.referenceOperation,
      };
      mockDb.transactionsCaisse.push(newTx);
      mockDb.save();
      return newTx;
    });
  }

  async getTransactionCaisse(id: number): Promise<Schemas['TransactionCaisseResponse']> {
    return this.request(`/api/transactions-caisse/${id}`, { method: 'GET' }, () => {
      const tx = mockDb.transactionsCaisse.find((item) => item.id === id);
      if (!tx) throw new ApiError(404, 'Transaction introuvable.');
      return tx;
    });
  }

  async updateTransactionCaisse(id: number, body: Schemas['TransactionCaisseRequest']): Promise<Schemas['TransactionCaisseResponse']> {
    return this.request(`/api/transactions-caisse/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, () => {
      const idx = mockDb.transactionsCaisse.findIndex((tx) => tx.id === id);
      if (idx === -1) throw new ApiError(404, 'Transaction introuvable.');
      mockDb.transactionsCaisse[idx] = {
        ...mockDb.transactionsCaisse[idx],
        ...body,
      };
      mockDb.save();
      return mockDb.transactionsCaisse[idx];
    });
  }

  async deleteTransactionCaisse(id: number): Promise<void> {
    return this.request(`/api/transactions-caisse/${id}`, { method: 'DELETE' }, () => {
      const idx = mockDb.transactionsCaisse.findIndex((tx) => tx.id === id);
      if (idx === -1) throw new ApiError(404, 'Transaction introuvable.');
      mockDb.transactionsCaisse.splice(idx, 1);
      mockDb.save();
    });
  }

  async getSoldeCaisse(): Promise<number> {
    return this.request('/api/transactions-caisse/solde', { method: 'GET' }, () => {
      return mockDb.transactionsCaisse.reduce((acc, t) => {
        return t.sens === 'ENTREE' ? acc + (t.montant || 0) : acc - (t.montant || 0);
      }, 0);
    });
  }

  async getTransactionsParCycle(cycleId: number): Promise<Schemas['TransactionCaisseResponse'][]> {
    return this.request(`/api/transactions-caisse/cycle/${cycleId}`, { method: 'GET' }, () => {
      return mockDb.transactionsCaisse.filter((t) => t.cycleId === cycleId);
    });
  }
}

export const apiClient = new ApiClient();
