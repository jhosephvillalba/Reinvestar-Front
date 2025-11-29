# Sistema de Autenticación - Guía Rápida

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Linting
npm run lint

# Build para producción
npm run build
```

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── authService.js          # Servicio centralizado de autenticación
├── Api/
│   ├── instance.js             # Axios con interceptors
│   └── auth.js                 # Endpoints de autenticación
├── components/
│   ├── PrivateRoute/           # Guard para rutas privadas
│   ├── PublicRoute/            # Guard para rutas públicas
│   └── RoleProtectedRoute/     # Guard para rutas con roles
├── view/
│   └── Login/                  # Componente de login
└── App.jsx                     # Configuración de rutas
```

## 🔑 Características Principales

1. **Auth Guards Robustos**
   - `PublicRoute`: Protege login/registro de usuarios autenticados
   - `PrivateRoute`: Protege rutas que requieren autenticación
   - `RoleProtectedRoute`: Protege por roles específicos

2. **Refresh Token Automático**
   - Interceptor de axios maneja 401 automáticamente
   - Mutex previene race conditions en múltiples pestañas
   - Redirección automática si refresh falla

3. **Prevención de Navegación Hacia Atrás**
   - Usa `replace: true` en navegación post-login
   - Evita que usuarios autenticados vuelvan al login

4. **Validación de Sesión**
   - Valida con backend al montar rutas protegidas
   - Soporta recarga de página manteniendo sesión

## 📖 Uso Básico

### Login

```javascript
import { performLogin } from './services/authService';

const { user } = await performLogin({ email, password });
// El token se guarda automáticamente
// La redirección se maneja en el componente Login
```

### Logout

```javascript
import { performLogout } from './services/authService';

await performLogout(false); // false = no llamar API de logout
```

### Verificar Sesión

```javascript
import { validateSession } from './services/authService';

const { isValid, user } = await validateSession();
```

## 🔐 Configuración del Backend

El backend debe implementar los siguientes endpoints:

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/users/me` - Obtener usuario actual
- `POST /api/v1/auth/logout` - Logout (opcional)

Ver `docs/AUTH_SYSTEM.md` para detalles completos del contrato API.

## 🧪 Testing

Ver `docs/AUTH_SYSTEM.md` sección "Tests" para criterios de aceptación.

## 📚 Documentación Completa

Para documentación detallada, ver:
- **`docs/AUTH_SYSTEM.md`** - Documentación completa del sistema
  - Arquitectura
  - Decisiones de diseño
  - Flujos de autenticación
  - Seguridad
  - Troubleshooting

## ⚠️ Variables de Entorno

Crear `.env`:
```env
VITE_API_URL=http://localhost:8000
```

## 🔒 Seguridad

- Access tokens de corta duración (15-30 min)
- Refresh tokens para renovación automática
- Limpieza de tokens en logout
- Validación con backend en cada carga

**Nota:** En producción, usar HTTPS siempre.

---

Para más detalles, ver la [documentación completa](./docs/AUTH_SYSTEM.md).

