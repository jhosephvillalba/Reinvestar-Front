# Sistema de Autenticación y Autorización - React SPA

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Decisiones de Diseño](#decisiones-de-diseño)
4. [Flujo de Autenticación](#flujo-de-autenticación)
5. [Componentes](#componentes)
6. [API Contract](#api-contract)
7. [Seguridad](#seguridad)
8. [Uso](#uso)
9. [Tests](#tests)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

Este sistema implementa un **Auth Guard robusto** para una SPA React con React Router v7, que incluye:

- ✅ Rutas privadas y públicas protegidas
- ✅ Refresh token automático con mutex (previene race conditions)
- ✅ Prevención de navegación hacia atrás al login
- ✅ Validación de sesión con backend
- ✅ Soporte para roles y permisos
- ✅ Manejo seguro de expiración de tokens

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     React Router (v7)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │      PublicRoute (Login)          │
        │  - Verifica si está autenticado   │
        │  - Redirige si ya tiene sesión    │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │      PrivateRoute (Protected)     │
        │  - Valida sesión con backend      │
        │  - Maneja refresh token           │
        │  - Verifica roles                 │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │    RoleProtectedRoute (Admin)     │
        │  - Valida roles específicos       │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │      authService                  │
        │  - Login/Logout                   │
        │  - Refresh Token (mutex)          │
        │  - Validación de sesión           │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │    Axios Interceptor              │
        │  - Auto-refresh en 401            │
        │  - Inyección de tokens            │
        └───────────────────────────────────┘
```

---

## 🔐 Decisiones de Diseño

### Storage: localStorage vs Cookies

| Aspecto | localStorage | HttpOnly Cookies |
|---------|--------------|------------------|
| **Selección** | ✅ **localStorage** | ❌ No implementado |
| **Razón** | Implementación más simple, tokens cortos + refresh | Requiere configuración CSRF/SameSite |
| **Ventajas** | Acceso directo desde JS, fácil de implementar | Más seguro contra XSS |
| **Desventajas** | Vulnerable a XSS si hay scripts maliciosos | Requiere CSRF tokens o SameSite |
| **Mitigación** | Short-lived access tokens (15-30 min) + refresh tokens | N/A |

**Decisión final:** Usamos `localStorage` con las siguientes mitigaciones:
- Access tokens de corta duración (15-30 minutos)
- Refresh tokens para renovación automática
- Interceptor de axios que maneja refresh automáticamente
- Limpieza de tokens en logout

### Refresh Token: Mutex Pattern

**Problema:** Múltiples pestañas pueden intentar refrescar el token simultáneamente.

**Solución:** Implementamos un **mutex** que:
- Solo permite una petición de refresh a la vez
- Suscribe otras peticiones a esperar el resultado
- Evita race conditions y múltiples llamadas al backend

```javascript
// En authService.js
let isRefreshing = false;
let refreshPromise = null;
let refreshSubscribers = [];
```

### Navegación: replace: true

**Problema:** Usuario puede volver al login con el botón "atrás".

**Solución:** Usamos `navigate(path, { replace: true })` en:
- Login exitoso
- Redirección desde PublicRoute
- Logout

Esto **reemplaza** la entrada en el historial en lugar de agregar una nueva.

---

## 🔄 Flujo de Autenticación

### Diagrama de Flujo

```
┌──────────┐
│  Usuario │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│   POST /login   │
│ {email, password}│
└────┬────────────┘
     │
     ├─ Success ──► ┌─────────────────┐
     │              │ Guardar tokens  │
     │              │ - access_token  │
     │              │ - refresh_token │
     │              └────┬────────────┘
     │                   │
     │                   ▼
     │              ┌─────────────────┐
     │              │  GET /auth/me   │
     │              │  Obtener user   │
     │              └────┬────────────┘
     │                   │
     │                   ▼
     │              ┌─────────────────┐
     │              │ navigate('/dashboard', │
     │              │   { replace: true })   │
     │              └─────────────────┘
     │
     └─ Error ──► Mostrar mensaje de error

┌─────────────────────────────────────┐
│  Usuario accede a ruta protegida    │
└────────────┬────────────────────────┘
             │
             ▼
┌────────────────────────┐
│  PrivateRoute monta    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ validateSession()      │
│ - Verifica tokens      │
│ - Llama GET /auth/me   │
└────────┬───────────────┘
         │
         ├─ Válido ──► Renderizar ruta
         │
         └─ Inválido ──► Redirect a /login

┌─────────────────────────────────────┐
│  API request recibe 401             │
└────────────┬────────────────────────┘
             │
             ▼
┌────────────────────────┐
│  Axios Interceptor     │
│  Detecta 401           │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  refreshToken()        │
│  - Mutex check         │
│  - POST /auth/refresh  │
└────────┬───────────────┘
         │
         ├─ Success ──► Retry request original
         │
         └─ Error ──► ┌────────────────────┐
                      │ performLogout()    │
                      │ Redirect /login    │
                      │ ?reason=expired    │
                      └────────────────────┘
```

---

## 📦 Componentes

### 1. PublicRoute

**Ubicación:** `src/components/PublicRoute/index.jsx`

**Propósito:** Protege rutas públicas (login, registro) evitando que usuarios autenticados accedan.

**Comportamiento:**
- Si el usuario está autenticado → redirige a su ruta por defecto (con `replace: true`)
- Si no está autenticado → muestra la ruta pública

**Uso:**
```jsx
<Route element={<PublicRoute />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Route>
```

### 2. PrivateRoute

**Ubicación:** `src/components/PrivateRoute/index.jsx`

**Propósito:** Protege rutas que requieren autenticación.

**Props:**
- `allowedRoles` (opcional): Array de roles permitidos
- `redirectTo` (opcional): Ruta de redirección si el rol no está permitido

**Comportamiento:**
- Valida sesión con backend al montar
- Si no está autenticado → redirige a `/login?redirect=...`
- Si tiene restricción de roles y no cumple → redirige según su rol

**Uso:**
```jsx
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// Con restricción de roles
<Route element={<PrivateRoute allowedRoles={['Admin', 'Coordinador']} />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>
```

### 3. RoleProtectedRoute

**Ubicación:** `src/components/RoleProtectedRoute/index.jsx`

**Propósito:** Wrapper para proteger componentes específicos por rol.

**Props:**
- `allowedRoles`: Array de roles permitidos
- `children`: Componente a renderizar

**Uso:**
```jsx
<Route 
  path="/system" 
  element={
    <RoleProtectedRoute allowedRoles={['Admin']}>
      <System />
    </RoleProtectedRoute>
  } 
/>
```

---

## 🔌 API Contract

### Endpoints Requeridos

#### 1. POST `/api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "roles": ["Admin"]
  }
}
```

**Response (401):**
```json
{
  "detail": "Invalid credentials"
}
```

#### 2. POST `/api/v1/auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**
```json
{
  "detail": "Refresh token expired"
}
```

#### 3. GET `/api/v1/users/me` (o `/api/v1/auth/me`)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "roles": ["Admin"]
}
```

**Response (401):**
```json
{
  "detail": "Unauthorized"
}
```

#### 4. POST `/api/v1/auth/logout` (opcional)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Ejemplos con cURL

#### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Authorization: Bearer <refresh_token>"
```

#### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

---

## 🛡️ Seguridad

### Checklist de Seguridad

- ✅ **XSS Mitigation**
  - Tokens en localStorage (mitigado con tokens cortos)
  - Validación de entrada en formularios
  - Escape de contenido renderizado

- ✅ **CSRF Protection**
  - Si usáramos cookies, necesitaríamos tokens CSRF o SameSite
  - Con localStorage, no aplica directamente

- ✅ **Token Lifetime**
  - Access tokens: 15-30 minutos (corta duración)
  - Refresh tokens: 7-30 días (largo plazo)

- ✅ **Logout Global**
  - Limpieza de tokens en localStorage
  - Opción de invalidar tokens en backend (si hay endpoint)

- ✅ **HTTPS Only**
  - **Recomendación:** Usar HTTPS en producción
  - Tokens nunca deben enviarse por HTTP

- ✅ **Race Conditions**
  - Mutex para refresh token previene múltiples llamadas simultáneas

### Recomendaciones Adicionales

1. **Content Security Policy (CSP):**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-inline';">
   ```

2. **Token Rotation:**
   - Rotar refresh tokens en cada uso (mejor práctica)

3. **Rate Limiting:**
   - Implementar en backend para prevenir brute force

4. **Auditoría:**
   - Logging de intentos de login fallidos
   - Monitoreo de refresh tokens inusuales

---

## 💻 Uso

### Configuración Inicial

1. **Variables de entorno** (`.env`):
```env
VITE_API_URL=http://localhost:8000
```

2. **Instalación:**
```bash
npm install
npm run dev
```

### Ejemplo de Implementación

Ver `src/App.jsx` para la estructura completa de rutas.

### Uso del Servicio de Autenticación

```javascript
import { performLogin, performLogout, validateSession } from './services/authService';

// Login
const { user, accessToken } = await performLogin({ email, password });

// Logout
await performLogout(false); // false = no llamar API

// Validar sesión
const { isValid, user } = await validateSession();
```

---

## 🧪 Tests

### Criterios de Aceptación (Automatizables)

1. **Usuario no autenticado accede a `/dashboard`**
   - ✅ Redirige a `/login?redirect=/dashboard`

2. **Usuario autenticado accede a `/login`**
   - ✅ Redirige a `/dashboard` (o `/requests` si es Procesador)

3. **Después del login, botón atrás no muestra login**
   - ✅ Usa `replace: true` en navigate

4. **Refresh token falla → redirect a login con razón**
   - ✅ Interceptor detecta 401 → intenta refresh → si falla, redirect a `/login?reason=session_expired`

5. **Rutas con roles muestran Forbidden si rol no permitido**
   - ✅ `RoleProtectedRoute` verifica roles y redirige

6. **End-to-end: login → access private route → token expire → auto refresh → sigue en ruta**
   - ✅ Interceptor maneja refresh automático

### Tests Unitarios (Ejemplo)

```javascript
// Ejemplo con Jest + React Testing Library
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

test('redirects to login when not authenticated', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <PrivateRoute />
    </MemoryRouter>
  );
  
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
```

---

## 🔧 Troubleshooting

### Problema: El usuario puede volver al login con el botón "atrás"

**Solución:** Verificar que se usa `replace: true` en todos los `navigate()` después del login.

### Problema: Múltiples refresh tokens simultáneos

**Solución:** El mutex en `authService.js` debería prevenir esto. Verificar que `isRefreshing` funciona correctamente.

### Problema: Tokens no se limpian al hacer logout

**Solución:** Verificar que `performLogout()` llama a `clearTokens()`.

### Problema: Redirección infinita

**Solución:** 
1. Verificar que `validateSession()` maneja errores correctamente
2. Asegurar que el backend responde correctamente a `/auth/me`

---

## 📚 Referencias

- [React Router v7 Documentation](https://reactrouter.com/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 📝 Notas Adicionales

- **Legacy Support:** El código mantiene compatibilidad con tokens almacenados como `token` (además de `access_token`)
- **Performance:** `validateSession()` solo se llama cuando es necesario (en PrivateRoute al montar)
- **UX:** Estados de carga mejorados para evitar flashes de contenido

---

**Última actualización:** 2024

