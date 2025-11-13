# 📁 Estructura de Assets - SCM Huevos Kikes

## 📍 Ubicación de Logos

Los logos deben colocarse en: **`public/assets/logos/`**

### Archivos Recomendados

| Archivo | Tipo | Descripción | Uso |
|---------|------|-------------|-----|
| `logo-icon.svg` | SVG | Icono cuadrado | Favicon, navbar |
| `logo-horizontal.svg` | SVG | Logo + nombre (horizontal) | Header, cards |
| `logo-vertical.svg` | SVG | Logo + nombre (vertical) | Sidebar, footers |
| `logo-icon.png` | PNG | Versión raster del icono | Fallback si navegador no soporta SVG |
| `logo-horizontal.png` | PNG | Versión raster horizontal | Fallback |
| `logo-vertical.png` | PNG | Versión raster vertical | Fallback |

---

## 📂 Estructura de Directorios Creada

```
public/
├── assets/
│   ├── logos/              ← Coloca aquí tus logos
│   │   ├── logo-icon.svg
│   │   ├── logo-icon.png
│   │   ├── logo-horizontal.svg
│   │   ├── logo-horizontal.png
│   │   ├── logo-vertical.svg
│   │   └── logo-vertical.png
│   ├── brand/              ← Favicon y branding
│   │   ├── favicon.ico
│   │   └── apple-touch-icon.png
│   └── images/             ← Otras imágenes
└── ...otros archivos
```

---

## 🖼️ Cómo Usar los Logos en Componentes

### En Next.js Image Component (Recomendado)

```tsx
import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/assets/logos/logo-horizontal.svg"
      alt="SCM Huevos Kikes"
      width={200}
      height={60}
      priority
    />
  );
}
```

### Con HTML img simple

```tsx
export default function Logo() {
  return (
    <img
      src="/assets/logos/logo-horizontal.svg"
      alt="SCM Huevos Kikes"
      width={200}
      height={60}
    />
  );
}
```

### Con Tailwind CSS (background image)

```tsx
export default function LogoBg() {
  return (
    <div
      className="w-12 h-12 bg-cover"
      style={{
        backgroundImage: "url('/assets/logos/logo-icon.svg')"
      }}
    />
  );
}
```

---

## 📌 Rutas de Acceso

| Ubicación en el Proyecto | Ruta en URL | 
|--------------------------|------------|
| `public/assets/logos/logo-icon.svg` | `/assets/logos/logo-icon.svg` |
| `public/assets/logos/logo-horizontal.svg` | `/assets/logos/logo-horizontal.svg` |
| `public/assets/logos/logo-vertical.svg` | `/assets/logos/logo-vertical.svg` |
| `public/assets/brand/favicon.ico` | `/assets/brand/favicon.ico` |

---

## 🎨 Formatos Recomendados

### Para Logos (Preferencia)
- **SVG**: Escalable, pequeño en tamaño, perfecto para logos
- **PNG**: 24-bit con transparencia (para fallback)

### Especificaciones

| Formato | Dimensiones | Transparencia | Compresión |
|---------|-------------|---------------|-----------| 
| SVG | Responsive | ✅ Sí | Mínima |
| PNG | 1200x400 (horizontal) | ✅ Sí | Máxima |
| PNG | 400x600 (vertical) | ✅ Sí | Máxima |
| ICO | 32x32 (favicon) | ✅ Sí | Máxima |

---

## ✅ Pasos para Agregar tus Logos

1. **Descarga o crea tus logos** en formato SVG o PNG
2. **Renombra los archivos** según la nomenclatura recomendada
3. **Coloca los archivos** en: `public/assets/logos/`
4. **Usa las rutas** mostradas arriba en tus componentes
5. **Recarga el navegador** para ver los cambios

---

## 📝 Ejemplo Completo: Sidebar con Logo

```tsx
import Image from 'next/image';

export function Sidebar() {
  return (
    <aside className="w-64 bg-secondary text-text-dark flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-accent/20 px-4">
        <Image
          src="/assets/logos/logo-icon.svg"
          alt="Huevos Kikes"
          width={40}
          height={40}
        />
        <span className="ml-2 font-bold text-lg">Huevos Kikes</span>
      </div>
      {/* Resto del sidebar */}
    </aside>
  );
}
```

---

## 📝 Ejemplo Completo: Header con Logo Horizontal

```tsx
import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-secondary border-b border-accent/20 px-6 py-4">
      <Image
        src="/assets/logos/logo-horizontal.svg"
        alt="SCM Huevos Kikes"
        width={200}
        height={50}
        priority
      />
    </header>
  );
}
```

---

## 🔧 Favicon

Para cambiar el favicon de la aplicación:

1. Reemplaza `/public/assets/brand/favicon.ico` con tu favicon
2. Actualiza la referencia en `app/layout.tsx`:

```tsx
<link rel="icon" href="/assets/brand/favicon.ico" />
```

O usa el formato moderno:

```tsx
export const metadata: Metadata = {
  icons: {
    icon: '/assets/brand/favicon.ico',
    apple: '/assets/brand/apple-touch-icon.png',
  },
};
```

---

## ✨ Optimización de Imágenes

### Comprimir SVG Online
- https://svgo.app/

### Comprimir PNG Online
- https://tinypng.com/
- https://compressor.io/

Mantén los logos lo más livianos posible para mejor rendimiento.
