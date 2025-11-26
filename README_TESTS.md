# Guide des Tests

## Lancer les tests
```bash
# Tous les tests
npm test

# Avec UI interactive
npm run test:ui

# Avec coverage
npm run test:coverage

# En mode CI
npm run test:ci
```

## Structure des tests
```
src/
├── hooks/
│   └── __tests__/
│       ├── useFavorites.test.ts
│       ├── useMessages.test.ts
│       └── useListings.test.ts
├── components/
│   └── __tests__/
│       ├── ProductCard.test.tsx
│       └── Navbar.test.tsx
└── test/
    ├── setup.ts
    └── __tests__/
        └── integration/
            └── auth-flow.test.tsx
```

## Bonnes pratiques
- **Un test = Un comportement**
- **AAA Pattern**: Arrange → Act → Assert
- **Noms descriptifs**: should do X when Y
- **Mock minimal**: Ne mock que ce qui est nécessaire
- **Tests isolés**: Chaque test doit être indépendant

## Coverage cible
- Hooks critiques: 90%+
- Composants principaux: 80%+
- Utilitaires: 100%
- Global: 70%+
