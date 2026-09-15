/**
 * Auto-generated OpenAPI TypeScript definitions for Akiwacu API
 * Source: openapi.json (PR #53 feat/demandepret-rest-endpoints)
 * 32 paths, 55 HTTP operations
 */

export interface paths {
    "/api/utilisateurs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer"];
        put: operations["modifier"];
        delete: operations["desactiver"];
    };
    "/api/transactions-caisse/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_1"];
        put: operations["modifier_1"];
        delete: operations["supprimer"];
    };
    "/api/tontines/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["trouverParId"];
        put: operations["modifier_2"];
        delete: operations["supprimer_1"];
    };
    "/api/remboursements/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_2"];
        put: operations["modifier_3"];
        delete: operations["supprimer_2"];
    };
    "/api/membres/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_3"];
        put: operations["modifier_4"];
    };
    "/api/cycles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_4"];
        put: operations["modifier_5"];
    };
    "/api/cotisations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_5"];
        put: operations["modifier_6"];
    };
    "/api/adhesions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recuperer_6"];
        put: operations["modifier_7"];
    };
    "/api/utilisateurs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister"];
        post: operations["creer"];
    };
    "/api/transactions-caisse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_1"];
        post: operations["enregistrer"];
    };
    "/api/tontines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_2"];
        post: operations["creer_1"];
    };
    "/api/remboursements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_3"];
        post: operations["enregistrer_1"];
    };
    "/api/prets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_4"];
        post: operations["debloquer"];
    };
    "/api/membres": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_5"];
        post: operations["creer_2"];
    };
    "/api/demandes-pret": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_6"];
        post: operations["demanderPret"];
    };
    "/api/demandes-pret/{demandePretId}/votes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_7"];
        post: operations["voter"];
    };
    "/api/cycles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_8"];
        post: operations["creer_3"];
    };
    "/api/cotisations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_9"];
        post: operations["creer_4"];
    };
    "/api/cotisations/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        post: operations["creerLot"];
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        post: operations["login"];
    };
    "/api/adhesions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["lister_10"];
        post: operations["creer_5"];
    };
    "/api/cycles/{id}/statut": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        patch: operations["changerStatut"];
    };
    "/api/transactions-caisse/solde": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["solde"];
    };
    "/api/transactions-caisse/cycle/{cycleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listerParCycle"];
    };
    "/api/remboursements/pret/{pretId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listerParPret"];
    };
    "/api/recus/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["telecharger"];
    };
    "/api/prets/{pretId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["trouver"];
    };
    "/api/prets/{pretId}/echeancier": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["echeancier"];
    };
    "/api/demandes-pret/{demandePretId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["trouver_1"];
    };
    "/api/demandes-pret/{demandePretId}/votes/{voteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["trouver_2"];
    };
    "/api/demandes-pret/{demandePretId}/votes/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["decision"];
    };
    "/api/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["agregats"];
    };
}

export interface components {
    schemas: {
        UtilisateurModificationRequest: {
            nom: string;
            prenom: string;
            telephone?: string;
            roles: ("ADMIN" | "GESTIONNAIRE" | "TRESORIER" | "COMMISSAIRE" | "MEMBRE")[];
            actif?: boolean;
        };
        UtilisateurResponse: {
            id?: number;
            email?: string;
            nom?: string;
            prenom?: string;
            telephone?: string;
            actif?: boolean;
            roles?: ("ADMIN" | "GESTIONNAIRE" | "TRESORIER" | "COMMISSAIRE" | "MEMBRE")[];
        };
        TransactionCaisseRequest: {
            cycleId?: number;
            sens: "ENTREE" | "SORTIE";
            montant: number;
            motif: string;
            dateTransaction: string;
            referenceOperation?: string;
        };
        TransactionCaisseResponse: {
            id?: number;
            tontineId?: number;
            cycleId?: number;
            sens?: "ENTREE" | "SORTIE";
            montant?: number;
            motif?: string;
            dateTransaction?: string;
            valideParId?: number;
            referenceOperation?: string;
        };
        TontineRequest: {
            nom: string;
            description?: string;
            dateCreation: string;
            statut: "ACTIVE" | "SUSPENDUE" | "CLOTUREE";
        };
        TontineResponse: {
            id?: number;
            nom?: string;
            description?: string;
            dateCreation?: string;
            statut?: "ACTIVE" | "SUSPENDUE" | "CLOTUREE";
        };
        RemboursementRequest: {
            pretId: number;
            montant: number;
            dateRemboursement: string;
        };
        RemboursementResponse: {
            id?: number;
            pretId?: number;
            montant?: number;
            dateRemboursement?: string;
            valideParId?: number;
            verrouille?: boolean;
        };
        MembreModificationRequest: {
            numeroMembre?: string;
            nom: string;
            prenom: string;
            telephone: string;
            statut: "ACTIF" | "SUSPENDU" | "SORTI";
        };
        MembreResponse: {
            id?: number;
            numeroMembre?: string;
            nom?: string;
            prenom?: string;
            telephone?: string;
            dateAdhesion?: string;
            statut?: "ACTIF" | "SUSPENDU" | "SORTI";
            utilisateurId?: number;
        };
        CycleRequest: {
            libelle: string;
            dateDebut: string;
            dateFin: string;
            montantCotisation: number;
            periodicite: "HEBDOMADAIRE" | "MENSUELLE";
        };
        CycleResponse: {
            id?: number;
            libelle?: string;
            dateDebut?: string;
            dateFin?: string;
            montantCotisation?: number;
            periodicite?: "HEBDOMADAIRE" | "MENSUELLE";
            statut?: "OUVERT" | "GELE" | "CLOTURE";
            dateCloture?: string;
        };
        CotisationModificationRequest: {
            montant: number;
            dateCotisation: string;
            modePaiement: "ESPECES" | "MOBILE_MONEY" | "VIREMENT";
        };
        CotisationResponse: {
            id?: number;
            membreId?: number;
            cycleId?: number;
            montant?: number;
            dateCotisation?: string;
            modePaiement?: "ESPECES" | "MOBILE_MONEY" | "VIREMENT";
            valideParId?: number;
            verrouille?: boolean;
            recuId?: number;
        };
        AdhesionModificationRequest: {
            dateAdhesion: string;
            statut: "ACTIVE" | "CLOTUREE";
        };
        AdhesionResponse: {
            id?: number;
            membreId?: number;
            cycleId?: number;
            dateAdhesion?: string;
            statut?: "ACTIVE" | "CLOTUREE";
        };
        UtilisateurRequest: {
            email: string;
            motDePasse: string;
            nom: string;
            prenom: string;
            telephone?: string;
            roles: ("ADMIN" | "GESTIONNAIRE" | "TRESORIER" | "COMMISSAIRE" | "MEMBRE")[];
        };
        AdministrateurCreation: {
            email: string;
            motDePasse: string;
            nom: string;
            prenom: string;
            telephone?: string;
        };
        TontineCreationRequest: {
            nom: string;
            description?: string;
            administrateur: components["schemas"]["AdministrateurCreation"];
        };
        PretDisbursementRequest: {
            demandePretId: number;
            dateEcheance: string;
        };
        PretResponse: {
            id?: number;
            demandePretId?: number;
            membreId?: number;
            cycleId?: number;
            montantAccorde?: number;
            dureeMois?: number;
            dateDeblocage?: string;
            dateEcheance?: string;
            statut?: "ACTIF" | "SOLDE" | "EN_RETARD";
            recuId?: number;
        };
        MembreRequest: {
            numeroMembre?: string;
            nom: string;
            prenom: string;
            telephone: string;
            dateAdhesion: string;
            utilisateurId?: number;
        };
        DemandePretRequest: {
            membreId: number;
            montantDemande: number;
            dureeMois: number;
            dateEcheance: string;
            motif: string;
        };
        DemandePretResponse: {
            id?: number;
            membreId?: number;
            cycleId?: number;
            montantDemande?: number;
            dureeMois?: number;
            motif?: string;
            dateDemande?: string;
            statut?: "SOUMISE" | "APPROUVEE" | "REJETEE" | "DEBLOQUEE";
        };
        VoteRequest: {
            sens: "POUR" | "CONTRE";
            commentaire?: string;
        };
        VoteResponse: {
            id?: number;
            demandePretId?: number;
            commissaireId?: number;
            sens?: "POUR" | "CONTRE";
            commentaire?: string;
            dateVote?: string;
        };
        CotisationRequest: {
            membreId: number;
            cycleId: number;
            montant: number;
            dateCotisation: string;
            modePaiement: "ESPECES" | "MOBILE_MONEY" | "VIREMENT";
        };
        CotisationBatchRequest: {
            cotisations: components["schemas"]["CotisationRequest"][];
        };
        LoginRequest: {
            email: string;
            motDePasse: string;
        };
        LoginResponse: {
            jeton?: string;
            expireA?: string;
            utilisateurId?: number;
            nom?: string;
            prenom?: string;
            tontineId?: number;
            roles?: ("ADMIN" | "GESTIONNAIRE" | "TRESORIER" | "COMMISSAIRE" | "MEMBRE")[];
        };
        AdhesionRequest: {
            membreId: number;
            cycleId: number;
            dateAdhesion: string;
        };
        CycleStatutRequest: {
            statut: "OUVERT" | "GELE" | "CLOTURE";
        };
        PretScheduleResponse: {
            pretId?: number;
            dureeMois?: number;
            montantDu?: number;
            soldeRestant?: number;
            dateDeblocage?: string;
            dateEcheance?: string;
        };
        VoteDecisionResponse: {
            demandePretId?: number;
            votesPour?: number;
            votesContre?: number;
            quorumRequis?: number;
            quorumAtteint?: boolean;
            statut?: "SOUMISE" | "APPROUVEE" | "REJETEE" | "DEBLOQUEE";
        };
        DashboardResponse: {
            membresActifs?: number;
            cotisationsTotal?: number;
            pretsEnCours?: number;
            remboursementsTotal?: number;
            soldeCaisse?: number;
        };
    };
}

export interface operations {
    recuperer: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["UtilisateurResponse"] } } };
    };
    modifier: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["UtilisateurModificationRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["UtilisateurResponse"] } } };
    };
    desactiver: {
        parameters: { path: { id: number } };
        responses: { 204: never };
    };
    recuperer_1: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["TransactionCaisseResponse"] } } };
    };
    modifier_1: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["TransactionCaisseRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["TransactionCaisseResponse"] } } };
    };
    supprimer: {
        parameters: { path: { id: number } };
        responses: { 204: never };
    };
    trouverParId: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["TontineResponse"] } } };
    };
    modifier_2: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["TontineRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["TontineResponse"] } } };
    };
    supprimer_1: {
        parameters: { path: { id: number } };
        responses: { 204: never };
    };
    recuperer_2: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["RemboursementResponse"] } } };
    };
    modifier_3: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["RemboursementRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["RemboursementResponse"] } } };
    };
    supprimer_2: {
        parameters: { path: { id: number } };
        responses: { 204: never };
    };
    recuperer_3: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["MembreResponse"] } } };
    };
    modifier_4: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["MembreModificationRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["MembreResponse"] } } };
    };
    recuperer_4: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["CycleResponse"] } } };
    };
    modifier_5: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["CycleRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["CycleResponse"] } } };
    };
    recuperer_5: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["CotisationResponse"] } } };
    };
    modifier_6: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["CotisationModificationRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["CotisationResponse"] } } };
    };
    recuperer_6: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["AdhesionResponse"] } } };
    };
    modifier_7: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["AdhesionModificationRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["AdhesionResponse"] } } };
    };
    lister: {
        responses: { 200: { content: { "*/*": components["schemas"]["UtilisateurResponse"][] } } };
    };
    creer: {
        requestBody: { content: { "application/json": components["schemas"]["UtilisateurRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["UtilisateurResponse"] } } };
    };
    lister_1: {
        responses: { 200: { content: { "*/*": components["schemas"]["TransactionCaisseResponse"][] } } };
    };
    enregistrer: {
        requestBody: { content: { "application/json": components["schemas"]["TransactionCaisseRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["TransactionCaisseResponse"] } } };
    };
    lister_2: {
        responses: { 200: { content: { "*/*": components["schemas"]["TontineResponse"][] } } };
    };
    creer_1: {
        requestBody: { content: { "application/json": components["schemas"]["TontineCreationRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["TontineResponse"] } } };
    };
    lister_3: {
        responses: { 200: { content: { "*/*": components["schemas"]["RemboursementResponse"][] } } };
    };
    enregistrer_1: {
        requestBody: { content: { "application/json": components["schemas"]["RemboursementRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["RemboursementResponse"] } } };
    };
    lister_4: {
        responses: { 200: { content: { "*/*": components["schemas"]["PretResponse"][] } } };
    };
    debloquer: {
        requestBody: { content: { "application/json": components["schemas"]["PretDisbursementRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["PretResponse"] } } };
    };
    lister_5: {
        responses: { 200: { content: { "*/*": components["schemas"]["MembreResponse"][] } } };
    };
    creer_2: {
        requestBody: { content: { "application/json": components["schemas"]["MembreRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["MembreResponse"] } } };
    };
    lister_6: {
        parameters?: { query?: { statut?: "SOUMISE" | "APPROUVEE" | "REJETEE" | "DEBLOQUEE" } };
        responses: { 200: { content: { "*/*": components["schemas"]["DemandePretResponse"][] } } };
    };
    demanderPret: {
        requestBody: { content: { "application/json": components["schemas"]["DemandePretRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["DemandePretResponse"] } } };
    };
    lister_7: {
        parameters: { path: { demandePretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["VoteResponse"][] } } };
    };
    voter: {
        parameters: { path: { demandePretId: number } };
        requestBody: { content: { "application/json": components["schemas"]["VoteRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["VoteResponse"] } } };
    };
    lister_8: {
        responses: { 200: { content: { "*/*": components["schemas"]["CycleResponse"][] } } };
    };
    creer_3: {
        requestBody: { content: { "application/json": components["schemas"]["CycleRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["CycleResponse"] } } };
    };
    lister_9: {
        responses: { 200: { content: { "*/*": components["schemas"]["CotisationResponse"][] } } };
    };
    creer_4: {
        requestBody: { content: { "application/json": components["schemas"]["CotisationRequest"] } };
        responses: { 201: { content: { "*/*": components["schemas"]["CotisationResponse"] } } };
    };
    creerLot: {
        requestBody: { content: { "application/json": components["schemas"]["CotisationBatchRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["CotisationResponse"][] } } };
    };
    login: {
        requestBody: { content: { "application/json": components["schemas"]["LoginRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["LoginResponse"] } } };
    };
    lister_10: {
        responses: { 200: { content: { "*/*": components["schemas"]["AdhesionResponse"][] } } };
    };
    creer_5: {
        requestBody: { content: { "application/json": components["schemas"]["AdhesionRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["AdhesionResponse"] } } };
    };
    changerStatut: {
        parameters: { path: { id: number } };
        requestBody: { content: { "application/json": components["schemas"]["CycleStatutRequest"] } };
        responses: { 200: { content: { "*/*": components["schemas"]["CycleResponse"] } } };
    };
    solde: {
        responses: { 200: { content: { "*/*": number } } };
    };
    listerParCycle: {
        parameters: { path: { cycleId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["TransactionCaisseResponse"][] } } };
    };
    listerParPret: {
        parameters: { path: { pretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["RemboursementResponse"][] } } };
    };
    telecharger: {
        parameters: { path: { id: number } };
        responses: { 200: { content: { "application/pdf": string } } };
    };
    trouver: {
        parameters: { path: { pretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["PretResponse"] } } };
    };
    echeancier: {
        parameters: { path: { pretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["PretScheduleResponse"] } } };
    };
    trouver_1: {
        parameters: { path: { demandePretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["DemandePretResponse"] } } };
    };
    trouver_2: {
        parameters: { path: { demandePretId: number; voteId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["VoteResponse"] } } };
    };
    decision: {
        parameters: { path: { demandePretId: number } };
        responses: { 200: { content: { "*/*": components["schemas"]["VoteDecisionResponse"] } } };
    };
    agregats: {
        responses: { 200: { content: { "*/*": components["schemas"]["DashboardResponse"] } } };
    };
}
