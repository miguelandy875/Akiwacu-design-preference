import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Coins,
  FileSpreadsheet,
  Users,
  Calendar,
  Wallet,
  Landmark,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  BookOpenCheck,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../api/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: Role[];
  badge?: string;
}

export const AppLayout: React.FC = () => {
  const { user, logout, switchPersona, hasRole } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrGestionnaire = hasRole(['ADMIN', 'GESTIONNAIRE']);
  const isTresorierOnly = hasRole(['TRESORIER']) && !isAdminOrGestionnaire;
  const isCommissaireOnly = hasRole(['COMMISSAIRE']) && !isAdminOrGestionnaire;
  const isMembreOnly = !isAdminOrGestionnaire && !isTresorierOnly && !isCommissaireOnly;

  // Strict RBAC: completely hide non-concerned features and tailor nav items per role
  const authorizedNavItems: NavItem[] = React.useMemo(() => {
    if (isMembreOnly) {
      return [
        { name: 'Mon Espace Adhérent', path: '/', icon: LayoutDashboard },
        { name: 'Mon Carnet de Cotisations', path: '/cotisations', icon: Coins, badge: 'Personnel' },
        { name: 'Mes Prêts & Échéancier', path: '/prets', icon: FileSpreadsheet },
        { name: 'Mes Reçus Officiels (R8)', path: '/recus', icon: BookOpenCheck },
      ];
    }

    if (isCommissaireOnly) {
      return [
        { name: 'Console d’Audit', path: '/', icon: LayoutDashboard },
        { name: 'Scrutin & Votes Prêts (R4)', path: '/prets', icon: FileSpreadsheet, badge: 'Quorum' },
        { name: 'Audit des Cotisations', path: '/cotisations', icon: Coins },
        { name: 'Reçus Scellés & Audit R8', path: '/recus', icon: BookOpenCheck },
      ];
    }

    if (isTresorierOnly) {
      return [
        { name: 'Cockpit Trésorerie', path: '/', icon: LayoutDashboard },
        { name: 'Saisie Cotisations (Compteur)', path: '/cotisations', icon: Coins, badge: 'Phare' },
        { name: 'Prêts & Déblocages Caisse', path: '/prets', icon: FileSpreadsheet },
        { name: 'Grand Livre de Caisse', path: '/caisse', icon: Wallet },
        { name: 'Journal des Remboursements', path: '/remboursements', icon: FileCheck2 },
        { name: 'Reçus Officiels (R8)', path: '/recus', icon: BookOpenCheck },
      ];
    }

    // Admin / Gestionnaire: full governance suite
    const adminNav: NavItem[] = [
      { name: 'Supervision & Gouvernance', path: '/', icon: LayoutDashboard },
      { name: 'Cotisations (Compteur)', path: '/cotisations', icon: Coins, badge: 'Phare' },
      { name: 'Demandes & Prêts', path: '/prets', icon: FileSpreadsheet },
      { name: 'Membres', path: '/membres', icon: Users, roles: ['ADMIN', 'GESTIONNAIRE'] },
      { name: 'Adhésions', path: '/adhesions', icon: UserCheck, roles: ['ADMIN', 'GESTIONNAIRE'] },
      { name: 'Cycles', path: '/cycles', icon: Calendar, roles: ['ADMIN', 'GESTIONNAIRE'] },
      { name: 'Caisse & Solde', path: '/caisse', icon: Wallet, roles: ['ADMIN', 'GESTIONNAIRE', 'TRESORIER'] },
      { name: 'Remboursements', path: '/remboursements', icon: FileCheck2, roles: ['ADMIN', 'GESTIONNAIRE', 'TRESORIER'] },
      { name: 'Tontines', path: '/tontines', icon: Landmark, roles: ['ADMIN'] },
      { name: 'Utilisateurs & Rôles', path: '/utilisateurs', icon: ShieldCheck, roles: ['ADMIN', 'GESTIONNAIRE'] },
      { name: 'Reçus & Audit R8', path: '/recus', icon: BookOpenCheck },
    ];
    return adminNav.filter((item) => !item.roles || hasRole(item.roles));
  }, [isAdminOrGestionnaire, isTresorierOnly, isCommissaireOnly, isMembreOnly, hasRole]);

  const currentRoleString = user?.roles?.join(', ') || 'MEMBRE';

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf8] text-[#1c1917]">
      {/* 1. Bandeau supérieur sombre - Direction C « Le Compteur » */}
      <header className="bg-[#272523] text-[#f7f6f4] border-b border-[#3b3835] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Tontine context */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 focus:outline-hidden touch-target flex items-center justify-center"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <NavLink to="/" className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-lg bg-[#e68a00] flex items-center justify-center text-stone-900 font-heading font-bold text-lg shadow-inner">
                  A
                </div>
                <div>
                  <span className="font-heading font-bold text-lg tracking-tight text-white block leading-none">
                    AKIWACU
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block mt-0.5">
                    Tontine Dushirehamwe
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Middle: Active Cycle Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-stone-900/60 px-3 py-1.5 rounded-full border border-stone-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-stone-300 font-medium">Cycle Annuel 2026</span>
              <span className="text-stone-500">|</span>
              <span className="text-[#e68a00] font-heading font-semibold">50 000 BIF / mois</span>
            </div>

            {/* Right: Persona switcher & User profile */}
            <div className="flex items-center space-x-3 relative">
              {/* Persona fast test dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                  className="flex items-center space-x-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-600/60 text-xs font-medium transition-colors"
                  title="Changer de rôle / profil de test"
                >
                  <span className="w-2 h-2 rounded-full bg-[#e68a00]"></span>
                  <span className="hidden sm:inline font-heading font-medium">
                    {user?.prenom || 'Utilisateur'} ({user?.roles?.[0] || 'Rôle'})
                  </span>
                  <span className="sm:hidden font-heading">{user?.roles?.[0]}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${personaMenuOpen ? 'rotate-90' : ''}`} />
                </button>

                {personaMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-stone-800 shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Simuler un rôle :</p>
                      <p className="text-xs text-stone-400 mt-0.5">Teste les permissions de l’API en 1 clic</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { switchPersona('andy@akiwacu.bi'); setPersonaMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 font-heading">Andy Miguel</p>
                        <p className="text-stone-500 text-[11px]">ADMIN, GESTIONNAIRE</p>
                      </div>
                      {user?.roles?.includes('ADMIN') && <span className="text-xs text-[#e68a00] font-bold">Actif</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchPersona('klein@akiwacu.bi'); setPersonaMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 font-heading">Klein Ndayizeye</p>
                        <p className="text-stone-500 text-[11px]">TRESORIER (R5, Caisse, Saisie)</p>
                      </div>
                      {user?.roles?.includes('TRESORIER') && !user?.roles?.includes('ADMIN') && <span className="text-xs text-[#e68a00] font-bold">Actif</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchPersona('gloria@akiwacu.bi'); setPersonaMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 font-heading">Gloria Muhimpundu</p>
                        <p className="text-stone-500 text-[11px]">COMMISSAIRE (Vote R4, Prêts)</p>
                      </div>
                      {user?.roles?.includes('COMMISSAIRE') && user?.email === 'gloria@akiwacu.bi' && <span className="text-xs text-[#e68a00] font-bold">Actif</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchPersona('benitha@akiwacu.bi'); setPersonaMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 font-heading">Benitha Gahimbare</p>
                        <p className="text-stone-500 text-[11px]">COMMISSAIRE (Vote R4, Cycles)</p>
                      </div>
                      {user?.roles?.includes('COMMISSAIRE') && user?.email === 'benitha@akiwacu.bi' && <span className="text-xs text-[#e68a00] font-bold">Actif</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => { switchPersona('juste@akiwacu.bi'); setPersonaMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 flex items-center justify-between border-t border-stone-100"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 font-heading">Juste Daxa</p>
                        <p className="text-stone-500 text-[11px]">MEMBRE (Consultation, Reçus)</p>
                      </div>
                      {user?.roles?.includes('MEMBRE') && user?.roles?.length === 1 && <span className="text-xs text-[#e68a00] font-bold">Actif</span>}
                    </button>

                    <div className="p-2 border-t border-stone-100 bg-stone-50 rounded-b-xl">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main structure: Desktop Sidebar + Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs sticky top-24">
            <div className="px-3 py-2 text-xs font-semibold text-stone-400 font-mono tracking-wider uppercase">
              Navigation métier
            </div>

            <nav className="space-y-1 mt-1">
              {authorizedNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#e68a00] text-white shadow-xs font-semibold'
                        : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-stone-100 px-3">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>Tenant R1 :</span>
                <span className="font-mono font-medium text-stone-700">tontineId = 1</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Rôle courant :</span>
                <span className="font-medium text-[#e68a00] font-heading">{currentRoleString}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Primary Screen Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (PWA friendly, touch targets >= 48px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30 flex items-center justify-around px-2 py-1 shadow-lg">
        {authorizedNavItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center touch-target flex-1 py-1 text-xs font-medium relative ${
                isActive ? 'text-[#e68a00] font-semibold' : 'text-stone-600'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[75px] text-center leading-tight">
              {item.name.includes('(') ? item.name.split('(')[0].trim() : item.name.split(' ').slice(0, 2).join(' ')}
            </span>
            {item.badge && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#e68a00]"></span>}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center touch-target flex-1 py-1 text-xs font-medium text-stone-600"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* 4. Mobile Drawer for All Sub-routes */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 bg-[#272523] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base">AKIWACU</h3>
                <p className="text-xs text-stone-400">Navigation ({authorizedNavItems.length} rubriques)</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-stone-400 hover:text-white touch-target flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs">
              <p className="text-stone-500">Connecté en tant que :</p>
              <p className="font-semibold text-stone-900 font-heading text-sm mt-0.5">
                {user?.prenom} {user?.nom}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]">
                {currentRoleString}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {authorizedNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium touch-target ${
                      isActive
                        ? 'bg-[#e68a00] text-white font-semibold'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 touch-target bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
