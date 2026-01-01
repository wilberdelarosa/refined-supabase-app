@echo off
echo ================================================
echo   Despliegue de Sincronizacion Supabase-Shopify
echo ================================================
echo.

REM Paso 1: Login a Supabase
echo [1/5] Iniciando sesion en Supabase...
call npx supabase login
if %errorlevel% neq 0 (
    echo Error en login. Asegurate de tener una cuenta en Supabase.
    pause
    exit /b 1
)

REM Paso 2: Link al proyecto
echo.
echo [2/5] Conectando al proyecto Supabase...
call npx supabase link --project-ref xuhvlomytegdbifziilf
if %errorlevel% neq 0 (
    echo Error al conectar al proyecto.
    pause
    exit /b 1
)

REM Paso 3: Aplicar migracion
echo.
echo [3/5] Aplicando migracion de base de datos...
call npx supabase db push
if %errorlevel% neq 0 (
    echo Error al aplicar migracion.
    pause
    exit /b 1
)

REM Paso 4: Configurar secrets
echo.
echo [4/5] Configurando variables secretas...
call npx supabase secrets set SHOPIFY_STORE_DOMAIN=lovable-project-fc7u9.myshopify.com
echo.
echo IMPORTANTE: No guardes el token Admin en este .bat ni en .env.
echo Configura el token como secret en Supabase Dashboard o via CLI asi:
echo   npx supabase secrets set SHOPIFY_ACCESS_TOKEN=TU_TOKEN_AQUI
call npx supabase secrets set SHOPIFY_API_VERSION=2025-01

REM Paso 5: Desplegar Edge Function
echo.
echo [5/5] Desplegando Edge Function...
call npx supabase functions deploy sync-user-to-shopify
if %errorlevel% neq 0 (
    echo Error al desplegar funcion.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   DESPLIEGUE COMPLETADO EXITOSAMENTE!
echo ================================================
echo.
echo Proximos pasos:
echo 1. Configura el webhook en Supabase Dashboard
echo 2. Prueba registrando un nuevo usuario
echo 3. Verifica en Shopify que el cliente fue creado
echo.
echo Consulta shopify_sync_setup.md para mas detalles.
echo.
pause
