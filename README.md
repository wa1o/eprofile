# EProfile

## Poner en marcha
1. Crea un proyecto en supabase.com
2. Ejecuta supabase/schema.sql en el SQL Editor de Supabase
3. Copia .env.local.example a .env.local y llena las 4 variables (Project Settings > API)
4. npm install
5. npm run dev
6. Crea tu primer admin: registra un usuario en Supabase Auth (Dashboard > Authentication > Add user)
   y luego en el SQL Editor: insert into public.usuarios (id, rol) values ('EL-UUID-DEL-USER', 'admin_plataforma');
7. Entra a /auth/login con ese usuario y ve a /admin
