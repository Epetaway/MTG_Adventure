export const routes = {
  landing: '/',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verify: '/auth/verify'
  },
  legal: {
    terms: '/legal/terms',
    privacy: '/legal/privacy'
  },
  app: {
    root: '/app',
    characters: '/app/characters',
    characterNew: '/app/characters/new',
    characterDetail: (id: string) => `/app/characters/${id}`,
    characterCard: (id: string) => `/app/characters/${id}/card`,
    characterLevelUp: (id: string) => `/app/characters/${id}/level-up`,
    characterXpNew: (id: string) => `/app/characters/${id}/xp/new`,
    decks: '/app/decks',
    deckNew: '/app/decks/new',
    deckDetail: (id: string) => `/app/decks/${id}`,
    deckEdit: (id: string) => `/app/decks/${id}/edit`,
    deckValidate: (id: string) => `/app/decks/${id}/validate`,
    table: '/app/table',
    tableSetup: '/app/table/setup',
    tableSession: (id: string) => `/app/table/session/${id}`,
    tableSummary: (id: string) => `/app/table/session/${id}/summary`,
    quests: '/app/quests',
    questDetail: (id: string) => `/app/quests/${id}`,
    profile: '/app/profile',
    profileFriends: '/app/profile/friends',
    profilePlaygroups: '/app/profile/playgroups',
    profileSettings: '/app/profile/settings',
    admin: '/app/admin',
    adminLore: '/app/admin/lore',
    adminTalents: '/app/admin/talent-packages',
    adminReports: '/app/admin/reports',
    adminAudit: '/app/admin/audit'
  },
  modals: {
    roll: '/roll',
    uploadArt: '/upload-art',
    whyBlocked: '/why-blocked'
  }
};
