# Salud de mis perros 🐾

Aplicación web privada para llevar el registro de salud de tus perros: vacunas, historial médico, medicamentos y citas veterinarias.

**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase

---

## Configuración inicial paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (o inicia sesión)
2. Haz clic en **"New project"**
3. Elige un nombre (ej: `dogs-profile`), selecciona región y genera una contraseña segura para la base de datos
4. Espera a que el proyecto se inicialice (~2 minutos)

---

### 2. Ejecutar el schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (menú izquierdo)
2. Haz clic en **"New query"**
3. Copia y pega el contenido completo del archivo `supabase/schema.sql`
4. Haz clic en **"Run"**
5. Verifica que no haya errores en el panel inferior

Esto crea:
- Las 6 tablas (profiles, dogs, vaccinations, medical_history, medications, appointments)
- Las políticas de Row Level Security (RLS)
- El trigger para crear perfil automáticamente al registrar usuario
- El bucket de Storage para fotos de perros

---

### 3. Crear los usuarios manualmente

Los usuarios **no se pueden registrar** desde la app. Se crean desde el dashboard de Supabase.

#### Crear usuarios:

1. Ve a **Authentication** → **Users** en el menú izquierdo
2. Haz clic en **"Add user"** → **"Create new user"**
3. Ingresa email y contraseña para el usuario **EDITOR** (tú)
4. Repite para el usuario **VIEWER** (tu esposa)

#### Asignar rol EDITOR:

Por defecto todos los usuarios tienen rol `VIEWER`. Para dar permisos de EDITOR:

1. Ve a **SQL Editor**
2. Ejecuta el siguiente comando reemplazando el UUID del usuario:

```sql
-- Obtener el UUID del usuario editor:
select id, email from auth.users;

-- Asignar rol EDITOR:
update public.profiles
set role = 'EDITOR'
where id = 'UUID-DEL-USUARIO-EDITOR';
```

---

### 4. Configurar variables de entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. En Supabase, ve a **Project Settings** → **API** y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

3. Tu `.env` debe quedar así:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> El archivo `.env` **nunca** debe subirse a Git (ya está en `.gitignore`).

---

### 5. Instalar dependencias y ejecutar localmente

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

### 6. Deploy a Vercel

#### Opción A: Deploy desde GitHub (recomendado)

1. Sube el repositorio a GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
3. Haz clic en **"New Project"** → importa tu repositorio
4. En la sección **"Environment Variables"** agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon de Supabase
5. Haz clic en **"Deploy"**

Vercel detecta automáticamente que es un proyecto Vite y lo configura correctamente.

#### Opción B: Deploy con CLI de Vercel

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones y cuando pida variables de entorno, ingresa las mismas dos variables.

---

## Uso de la aplicación

### Roles

| Función | EDITOR | VIEWER |
|---------|--------|--------|
| Ver perfiles | ✅ | ✅ |
| Ver vacunas, historial, etc. | ✅ | ✅ |
| Agregar / editar registros | ✅ | ❌ |
| Eliminar registros | ✅ | ❌ |
| Subir fotos | ✅ | ❌ |

### Navegación

- **Inicio:** Cards de tus perros con alertas de citas, vacunas y medicamentos
- **Perfil del perro:** Toca cualquier card para ver el perfil completo con 5 tabs
- **Agenda:** Vista global de todas las citas de todos los perros, con filtros

### Exportar perfil como PDF

En la tab "Perfil" de cualquier perro, toca **"Exportar / Imprimir perfil"** para abrir el diálogo de impresión del navegador. Los elementos de navegación se ocultan automáticamente en la vista de impresión.

---

## Estructura del proyecto

```
src/
├── components/
│   ├── appointments/   # Lista y formulario de citas
│   ├── auth/           # Ruta protegida
│   ├── dogs/           # Card, form y foto del perro
│   ├── layout/         # Layout y bottom nav
│   ├── medical/        # Historial médico
│   ├── medications/    # Medicamentos
│   ├── ui/             # Componentes reutilizables (Button, Badge, Modal, Input)
│   └── vaccinations/   # Vacunas
├── constants/
│   └── colors.ts       # Paleta de colores por perro
├── contexts/
│   └── AuthContext.tsx # Autenticación y rol
├── lib/
│   └── supabase.ts     # Cliente de Supabase
├── pages/
│   ├── AgendaPage.tsx
│   ├── DogProfilePage.tsx
│   ├── HomePage.tsx
│   └── LoginPage.tsx
├── types/
│   └── index.ts        # TypeScript interfaces
└── utils/
    └── dateUtils.ts    # Cálculo de edad, estado de vacunas, etc.
supabase/
└── schema.sql          # Schema completo de base de datos
```

---

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon de Supabase |

---

## Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```
