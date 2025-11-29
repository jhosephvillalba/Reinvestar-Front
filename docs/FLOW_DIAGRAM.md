# Diagramas de Flujo - Sistema de Autenticación

## 🔐 Flujo de Login

```
┌──────────┐
│ Usuario  │
│  ingresa │
│ creden.  │
└────┬─────┘
     │
     ▼
┌──────────────────────┐
│   Componente Login   │
│  - Email/Password    │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ performLogin()       │
│  POST /auth/login    │
└────┬─────────────────┘
     │
     ├─── Success ────► ┌─────────────────────┐
     │                   │ Guardar tokens:     │
     │                   │ - access_token      │
     │                   │ - refresh_token     │
     │                   └────┬────────────────┘
     │                        │
     │                        ▼
     │                   ┌─────────────────────┐
     │                   │ GET /users/me       │
     │                   │ Obtener datos user  │
     │                   └────┬────────────────┘
     │                        │
     │                        ▼
     │                   ┌─────────────────────┐
     │                   │ Guardar user        │
     │                   │ en localStorage     │
     │                   └────┬────────────────┘
     │                        │
     │                        ▼
     │                   ┌─────────────────────┐
     │                   │ Determinar ruta:    │
     │                   │ - Procesador →      │
     │                   │   /requests         │
     │                   │ - Otros →           │
     │                   │   /dashboard        │
     │                   └────┬────────────────┘
     │                        │
     │                        ▼
     │                   ┌─────────────────────┐
     │                   │ navigate(path,      │
     │                   │  { replace: true }) │
     │                   └─────────────────────┘
     │
     └─── Error ────► ┌─────────────────────┐
                      │ Mostrar error       │
                      │ en UI               │
                      └─────────────────────┘
```

## 🛡️ Flujo de Validación de Ruta Privada

```
┌─────────────────────┐
│ Usuario navega a    │
│ ruta protegida      │
│ (ej: /dashboard)    │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ PrivateRoute monta  │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ hasActiveSession()? │
│ Verifica tokens     │
└────┬────────────────┘
     │
     ├─ No ────► ┌─────────────────────┐
     │            │ Redirect a /login   │
     │            │ con ?redirect=...   │
     │            └─────────────────────┘
     │
     └─ Yes ────► ┌─────────────────────┐
                  │ validateSession()   │
                  │ GET /users/me       │
                  └────┬────────────────┘
                       │
                       ├─ Valid ────► ┌─────────────────────┐
                       │              │ Verificar roles?    │
                       │              └────┬────────────────┘
                       │                   │
                       │                   ├─ No ────► Renderizar ruta
                       │                   │
                       │                   └─ Yes ────► ┌─────────────────────┐
                       │                                 │ Rol permitido?      │
                       │                                 └────┬────────────────┘
                       │                                      │
                       │                                      ├─ Yes ────► Renderizar ruta
                       │                                      │
                       │                                      └─ No ────► ┌─────────────────────┐
                       │                                                   │ Redirect según rol  │
                       │                                                   │ (default route)     │
                       │                                                   └─────────────────────┘
                       │
                       └─ Invalid ────► ┌─────────────────────┐
                                        │ Redirect a /login   │
                                        └─────────────────────┘
```

## 🔄 Flujo de Refresh Token Automático

```
┌─────────────────────┐
│ Request API         │
│ (con access_token)  │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Axios Interceptor   │
│ Envía request       │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Backend responde    │
│ ¿Status?            │
└────┬────────────────┘
     │
     ├─ 200/201 ────► ┌─────────────────────┐
     │                 │ Retornar response   │
     │                 │ al componente       │
     │                 └─────────────────────┘
     │
     └─ 401 ────► ┌─────────────────────┐
                  │ ¿Es endpoint        │
                  │ /auth/login o       │
                  │ /auth/refresh?      │
                  └────┬────────────────┘
                       │
                       ├─ Yes ────► ┌─────────────────────┐
                       │            │ Rechazar error      │
                       │            │ (evitar loop)       │
                       │            └─────────────────────┘
                       │
                       └─ No ────► ┌─────────────────────┐
                                  │ ¿Ya se reintentó?   │
                                  │ (_retry flag)        │
                                  └────┬────────────────┘
                                       │
                                       ├─ Yes ────► ┌─────────────────────┐
                                       │            │ Rechazar error      │
                                       │            └─────────────────────┘
                                       │
                                       └─ No ────► ┌─────────────────────┐
                                                  │ Marcar _retry = true │
                                                  └────┬─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────────┐
                                              │ refreshToken()      │
                                              │ (con mutex)         │
                                              └────┬────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ ¿Hay refresh en     │
                                          │ progreso?           │
                                          └────┬────────────────┘
                                               │
                                               ├─ Yes ────► ┌─────────────────────┐
                                               │            │ Suscribirse y esperar│
                                               │            │ resultado            │
                                               │            └────┬─────────────────┘
                                               │                 │
                                               │                 ▼
                                               │          ┌─────────────────────┐
                                               │          │ Obtener nuevo token │
                                               │          │ de suscripción      │
                                               │          └────┬────────────────┘
                                               │               │
                                               └─ No ────► ┌───┴─────────────────┐
                                                           │ Marcar isRefreshing │
                                                           │ = true              │
                                                           └────┬────────────────┘
                                                                │
                                                                ▼
                                                        ┌─────────────────────┐
                                                        │ POST /auth/refresh  │
                                                        └────┬────────────────┘
                                                             │
                                                             ├─ Success ────► ┌─────────────────────┐
                                                             │                │ Guardar nuevo       │
                                                             │                │ access_token        │
                                                             │                └────┬─────────────────┘
                                                             │                     │
                                                             │                     ▼
                                                             │                ┌─────────────────────┐
                                                             │                │ Notificar           │
                                                             │                │ suscriptores        │
                                                             │                └────┬────────────────┘
                                                             │                     │
                                                             │                     ▼
                                                             │                ┌─────────────────────┐
                                                             │                │ Actualizar header   │
                                                             │                │ de request original │
                                                             │                └────┬────────────────┘
                                                             │                     │
                                                             │                     ▼
                                                             │                ┌─────────────────────┐
                                                             │                │ Reintentar request  │
                                                             │                │ original            │
                                                             │                └─────────────────────┘
                                                             │
                                                             └─ Error ────► ┌─────────────────────┐
                                                                             │ performLogout()     │
                                                                             │ Limpiar tokens      │
                                                                             └────┬────────────────┘
                                                                                  │
                                                                                  ▼
                                                                         ┌─────────────────────┐
                                                                         │ Redirect a /login   │
                                                                         │ ?reason=expired     │
                                                                         └─────────────────────┘
```

## 🚪 Flujo de Logout

```
┌─────────────────────┐
│ Usuario hace click  │
│ en "Logout"         │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ handleLogout()      │
│ en Layout           │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ performLogout()     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ ¿Llamar API?        │
│ (callAPI param)     │
└────┬────────────────┘
     │
     ├─ Yes ────► ┌─────────────────────┐
     │            │ POST /auth/logout   │
     │            │ (opcional)          │
     │            └────┬────────────────┘
     │                 │
     │                 ▼
     │            ┌─────────────────────┐
     │            │ ¿Success?           │
     │            └────┬────────────────┘
     │                 │
     │                 └───► (continúa a limpiar)
     │
     └─ No ────► ┌─────────────────────┐
                 │ clearTokens()       │
                 │ - access_token      │
                 │ - refresh_token     │
                 │ - user              │
                 └────┬────────────────┘
                      │
                      ▼
              ┌─────────────────────┐
              │ navigate('/login',  │
              │  { replace: true }) │
              └─────────────────────┘
```

## 🎯 Flujo de Ruta Pública (Login cuando ya está autenticado)

```
┌─────────────────────┐
│ Usuario autenticado │
│ navega a /login     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ PublicRoute monta   │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ validateSession()   │
│ Verificar sesión    │
└────┬────────────────┘
     │
     ├─ Invalid ────► ┌─────────────────────┐
     │                │ Renderizar Login    │
     │                │ (permitir acceso)   │
     │                └─────────────────────┘
     │
     └─ Valid ────► ┌─────────────────────┐
                    │ Determinar ruta:    │
                    │ - Procesador →      │
                    │   /requests         │
                    │ - Otros →           │
                    │   /dashboard        │
                    └────┬────────────────┘
                         │
                         ▼
                    ┌─────────────────────┐
                    │ Navigate con        │
                    │ replace: true       │
                    │ (evitar back button)│
                    └─────────────────────┘
```

---

**Notas:**
- Todos los flujos incluyen manejo de errores
- Los tokens se limpian automáticamente en caso de error
- El mutex previene race conditions en refresh token

