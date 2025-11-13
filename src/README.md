# Estructura del Proyecto SCM Huevos Kikes

Este directorio contiene el código fuente de la aplicación.

## Estructura

```
src/
├── lib/              # Utilidades y configuraciones
│   ├── firebase.ts   # Configuración de Firebase
│   └── utils.ts      # Utilidades de shadcn/ui (cn helper)
├── components/       # Componentes React
│   └── ui/          # Componentes de shadcn/ui
└── hooks/           # Custom React Hooks
```

## Convenciones

- Usar siempre TypeScript en modo strict
- Seguir las reglas de ESLint configuradas (basadas en Airbnb)
- Usar Prettier para formateo automático
- Importar tipos con `import type` cuando sea posible
- Mantener el orden de importaciones según configuración de ESLint
