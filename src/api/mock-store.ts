import { components } from './openapi-types';
import { ApiError } from './types';

type Utilisateur = components['schemas']['UtilisateurResponse'] & { motDePasse: string };
type Tontine = components['schemas']['TontineResponse'];
type Membre = components['schemas']['MembreResponse'];
type Cycle = components['schemas']['CycleResponse'];
type Adhesion = components['schemas']['AdhesionResponse'];
type Cotisation = components['schemas']['CotisationResponse'];
type DemandePret = components['schemas']['DemandePretResponse'];
type Vote = components['schemas']['VoteResponse'];
type Pret = components['schemas']['PretResponse'];
type Remboursement = components['schemas']['RemboursementResponse'];
type TransactionCaisse = components['schemas']['TransactionCaisseResponse'];

// Store in localStorage if present so test operations persist during prototype navigation
const STORAGE_KEY = 'akiwacu_prototype_db_v1';

class MockDatabase {
  tontines: Tontine[] = [];
  utilisateurs: Utilisateur[] = [];
  membres: Membre[] = [];
  cycles: Cycle[] = [];
  adhesions: Adhesion[] = [];
  cotisations: Cotisation[] = [];
  demandesPret: DemandePret[] = [];
  votes: Vote[] = [];
  prets: Pret[] = [];
  remboursements: Remboursement[] = [];
  transactionsCaisse: TransactionCaisse[] = [];

  constructor() {
    this.load();
    if (this.tontines.length === 0) {
      this.seed();
      this.save();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tontines: this.tontines,
        utilisateurs: this.utilisateurs,
        membres: this.membres,
        cycles: this.cycles,
        adhesions: this.adhesions,
        cotisations: this.cotisations,
        demandesPret: this.demandesPret,
        votes: this.votes,
        prets: this.prets,
        remboursements: this.remboursements,
        transactionsCaisse: this.transactionsCaisse,
      }));
    } catch {
      // ignore storage errors
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.tontines = data.tontines || [];
        this.utilisateurs = data.utilisateurs || [];
        this.membres = data.membres || [];
        this.cycles = data.cycles || [];
        this.adhesions = data.adhesions || [];
        this.cotisations = data.cotisations || [];
        this.demandesPret = data.demandesPret || [];
        this.votes = data.votes || [];
        this.prets = data.prets || [];
        this.remboursements = data.remboursements || [];
        this.transactionsCaisse = data.transactionsCaisse || [];
      }
    } catch {
      // ignore
    }
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.seed();
    this.save();
  }

  seed() {
    this.tontines = [
      {
        id: 1,
        nom: 'Tontine Dushirehamwe Gitega',
        description: 'Association communautaire d’épargne et de crédit - Quartier Nyamugari',
        dateCreation: '2026-01-10',
        statut: 'ACTIVE',
      },
      {
        id: 2,
        nom: 'Tontine Dukorerehamwe',
        description: 'Groupe d’entraide des commerçants de Gitega',
        dateCreation: '2026-02-15',
        statut: 'ACTIVE',
      },
    ];

    this.utilisateurs = [
      {
        id: 1,
        email: 'andy@akiwacu.bi',
        motDePasse: 'Password123!',
        nom: 'Habyarimana',
        prenom: 'Andy Miguel',
        telephone: '+257 79 10 20 30',
        actif: true,
        roles: ['ADMIN', 'GESTIONNAIRE'],
      },
      {
        id: 2,
        email: 'klein@akiwacu.bi',
        motDePasse: 'Password123!',
        nom: 'Ndayizeye',
        prenom: 'Klein',
        telephone: '+257 71 40 50 60',
        actif: true,
        roles: ['TRESORIER'],
      },
      {
        id: 3,
        email: 'gloria@akiwacu.bi',
        motDePasse: 'Password123!',
        nom: 'Muhimpundu',
        prenom: 'Gloria',
        telephone: '+257 76 70 80 90',
        actif: true,
        roles: ['COMMISSAIRE'],
      },
      {
        id: 4,
        email: 'benitha@akiwacu.bi',
        motDePasse: 'Password123!',
        nom: 'Gahimbare',
        prenom: 'Benitha',
        telephone: '+257 79 99 88 77',
        actif: true,
        roles: ['COMMISSAIRE'],
      },
      {
        id: 5,
        email: 'juste@akiwacu.bi',
        motDePasse: 'Password123!',
        nom: 'Ayikunde',
        prenom: 'Juste Daxa',
        telephone: '+257 72 33 44 55',
        actif: true,
        roles: ['MEMBRE'],
      },
    ];

    this.membres = [
      {
        id: 1,
        numeroMembre: 'MEM-2026-001',
        nom: 'Ayikunde',
        prenom: 'Juste Daxa',
        telephone: '+257 72 33 44 55',
        dateAdhesion: '2026-01-15',
        statut: 'ACTIF',
        utilisateurId: 5,
      },
      {
        id: 2,
        numeroMembre: 'MEM-2026-002',
        nom: 'Nizigiyimana',
        prenom: 'Diane',
        telephone: '+257 79 45 67 89',
        dateAdhesion: '2026-01-15',
        statut: 'ACTIF',
      },
      {
        id: 3,
        numeroMembre: 'MEM-2026-003',
        nom: 'Hakizimana',
        prenom: 'Patrick',
        telephone: '+257 71 12 34 56',
        dateAdhesion: '2026-01-20',
        statut: 'ACTIF',
      },
      {
        id: 4,
        numeroMembre: 'MEM-2026-004',
        nom: 'Ndayishimiye',
        prenom: 'Chantal',
        telephone: '+257 76 98 76 54',
        dateAdhesion: '2026-02-01',
        statut: 'ACTIF',
      },
      {
        id: 5,
        numeroMembre: 'MEM-2026-005',
        nom: 'Ndikumana',
        prenom: 'Eric',
        telephone: '+257 79 33 22 11',
        dateAdhesion: '2026-02-10',
        statut: 'ACTIF',
      },
      {
        id: 6,
        numeroMembre: 'MEM-2026-006',
        nom: 'Irakoze',
        prenom: 'Bella',
        telephone: '+257 71 88 99 00',
        dateAdhesion: '2026-02-15',
        statut: 'SUSPENDU',
      }
    ];

    this.cycles = [
      {
        id: 1,
        libelle: 'Cycle Annuel 2026 — Gitega',
        dateDebut: '2026-01-01',
        dateFin: '2026-12-31',
        montantCotisation: 50000,
        periodicite: 'MENSUELLE',
        statut: 'OUVERT',
      },
      {
        id: 2,
        libelle: 'Cycle Pilote 2025',
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31',
        montantCotisation: 30000,
        periodicite: 'MENSUELLE',
        statut: 'CLOTURE',
        dateCloture: '2025-12-31',
      },
    ];

    this.adhesions = [
      { id: 1, membreId: 1, cycleId: 1, dateAdhesion: '2026-01-15', statut: 'ACTIVE' },
      { id: 2, membreId: 2, cycleId: 1, dateAdhesion: '2026-01-15', statut: 'ACTIVE' },
      { id: 3, membreId: 3, cycleId: 1, dateAdhesion: '2026-01-20', statut: 'ACTIVE' },
      { id: 4, membreId: 4, cycleId: 1, dateAdhesion: '2026-02-01', statut: 'ACTIVE' },
      { id: 5, membreId: 5, cycleId: 1, dateAdhesion: '2026-02-10', statut: 'ACTIVE' },
    ];

    this.cotisations = [
      {
        id: 1,
        membreId: 1,
        cycleId: 1,
        montant: 50000,
        dateCotisation: '2026-08-05',
        modePaiement: 'ESPECES',
        valideParId: 2,
        verrouille: true,
        recuId: 101,
      },
      {
        id: 2,
        membreId: 2,
        cycleId: 1,
        montant: 50000,
        dateCotisation: '2026-08-05',
        modePaiement: 'MOBILE_MONEY',
        valideParId: 2,
        verrouille: true,
        recuId: 102,
      },
      {
        id: 3,
        membreId: 3,
        cycleId: 1,
        montant: 50000,
        dateCotisation: '2026-08-05',
        modePaiement: 'ESPECES',
        valideParId: 2,
        verrouille: true,
        recuId: 103,
      },
      {
        id: 4,
        membreId: 1,
        cycleId: 1,
        montant: 50000,
        dateCotisation: '2026-09-01',
        modePaiement: 'VIREMENT',
        valideParId: 2,
        verrouille: true,
        recuId: 104,
      },
      {
        id: 5,
        membreId: 4,
        cycleId: 1,
        montant: 50000,
        dateCotisation: '2026-09-02',
        modePaiement: 'ESPECES',
        valideParId: 2,
        verrouille: false, // non verrouillée pour tester modification
        recuId: undefined,
      },
    ];

    this.demandesPret = [
      {
        id: 1,
        membreId: 3,
        cycleId: 1,
        montantDemande: 150000,
        dureeMois: 3,
        motif: 'Achat de semences sélectionnées et intrants agricoles pour la saison culturale A',
        dateDemande: '2026-09-05',
        statut: 'SOUMISE',
      },
      {
        id: 2,
        membreId: 4,
        cycleId: 1,
        montantDemande: 100000,
        dureeMois: 2,
        motif: 'Réapprovisionnement de stock pour commerce de détail au marché central',
        dateDemande: '2026-09-01',
        statut: 'APPROUVEE',
      },
      {
        id: 3,
        membreId: 1,
        cycleId: 1,
        montantDemande: 120000,
        dureeMois: 3,
        motif: 'Paiement des frais de scolarité universitaire trimestre 1',
        dateDemande: '2026-08-10',
        statut: 'DEBLOQUEE',
      },
      {
        id: 4,
        membreId: 5,
        cycleId: 1,
        montantDemande: 400000,
        dureeMois: 6,
        motif: 'Agrandissement de l’atelier de menuiserie',
        dateDemande: '2026-08-20',
        statut: 'REJETEE',
      },
    ];

    this.votes = [
      {
        id: 1,
        demandePretId: 2,
        commissaireId: 3, // Gloria
        sens: 'POUR',
        commentaire: 'Dossier complet, membre assidue et épargne suffisante',
        dateVote: '2026-09-02T10:15:00Z',
      },
      {
        id: 2,
        demandePretId: 2,
        commissaireId: 4, // Benitha
        sens: 'POUR',
        commentaire: 'Approbation confirmée, projet viable',
        dateVote: '2026-09-02T14:30:00Z',
      },
      {
        id: 3,
        demandePretId: 4,
        commissaireId: 3,
        sens: 'CONTRE',
        commentaire: 'Capacité de remboursement insuffisante au vu de l’épargne',
        dateVote: '2026-08-21T09:00:00Z',
      },
    ];

    this.prets = [
      {
        id: 1,
        demandePretId: 3,
        membreId: 1,
        cycleId: 1,
        montantAccorde: 120000,
        dureeMois: 3,
        dateDeblocage: '2026-08-15',
        dateEcheance: '2026-11-15',
        statut: 'ACTIF',
        recuId: 201,
      },
    ];

    this.remboursements = [
      {
        id: 1,
        pretId: 1,
        montant: 40000,
        dateRemboursement: '2026-09-05',
        valideParId: 2,
        verrouille: true,
      },
    ];

    this.transactionsCaisse = [
      {
        id: 1,
        tontineId: 1,
        cycleId: 1,
        sens: 'ENTREE',
        montant: 200000,
        motif: 'Cotisations de lancement de cycle',
        dateTransaction: '2026-08-05',
        valideParId: 2,
        referenceOperation: 'COTISATION:INITIAL',
      },
      {
        id: 2,
        tontineId: 1,
        cycleId: 1,
        sens: 'SORTIE',
        montant: 120000,
        motif: 'Déblocage de prêt - Juste Daxa',
        dateTransaction: '2026-08-15',
        valideParId: 2,
        referenceOperation: 'PRET:1',
      },
      {
        id: 3,
        tontineId: 1,
        cycleId: 1,
        sens: 'ENTREE',
        montant: 40000,
        motif: 'Remboursement partiel de prêt #1',
        dateTransaction: '2026-09-05',
        valideParId: 2,
        referenceOperation: 'REMBOURSEMENT:1',
      },
      {
        id: 4,
        tontineId: 1,
        cycleId: 1,
        sens: 'ENTREE',
        montant: 50000,
        motif: 'Cotisation mensuelle membre #1',
        dateTransaction: '2026-09-01',
        valideParId: 2,
        referenceOperation: 'COTISATION:4',
      },
    ];
  }
}

export const mockDb = new MockDatabase();
