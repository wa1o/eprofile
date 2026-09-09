-- 1. TIPOS ENUM
CREATE TYPE app_role AS ENUM ('estudiante', 'admin_plataforma');
CREATE TYPE perfil_estado AS ENUM ('borrador', 'publicado');
CREATE TYPE habilidad_categoria AS ENUM ('tecnica', 'blanda', 'otra');
CREATE TYPE cv_categoria AS ENUM ('formacion', 'experiencia', 'proyecto_academico');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABLAS BASE
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol app_role NOT NULL DEFAULT 'estudiante',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  plantilla_cv_id VARCHAR(50) DEFAULT 'clasica',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL UNIQUE REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(150),
  carrera VARCHAR(150),
  resena TEXT,
  foto_url TEXT,
  estado perfil_estado NOT NULL DEFAULT 'borrador',
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  categoria cv_categoria NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  institucion_empresa VARCHAR(150),
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado perfil_estado NOT NULL DEFAULT 'borrador'
);

CREATE TABLE public.habilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  nombre VARCHAR(80) NOT NULL,
  categoria habilidad_categoria NOT NULL DEFAULT 'tecnica',
  estado perfil_estado NOT NULL DEFAULT 'borrador'
);

CREATE TABLE public.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  tecnologias_rol TEXT[],
  enlace_demo TEXT,
  enlace_repositorio TEXT,
  es_academico BOOLEAN DEFAULT FALSE,
  estado perfil_estado NOT NULL DEFAULT 'borrador'
);

CREATE TABLE public.reconocimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  emisor VARCHAR(150),
  fecha DATE,
  descripcion TEXT,
  estado perfil_estado NOT NULL DEFAULT 'borrador'
);

CREATE TABLE public.enlaces_contacto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  red_tipo VARCHAR(50) NOT NULL,
  valor TEXT NOT NULL,
  estado perfil_estado NOT NULL DEFAULT 'borrador'
);

-- 3. TRIGGER AUTOMATICO AL CREAR USUARIO EN AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_slug TEXT;
  v_rol app_role;
  v_estudiante_id UUID;
BEGIN
  v_rol := COALESCE((NEW.raw_user_meta_data->>'rol')::app_role, 'estudiante');

  INSERT INTO public.usuarios (id, rol, activo)
  VALUES (NEW.id, v_rol, TRUE);

  IF v_rol = 'estudiante' THEN
    v_slug := NEW.raw_user_meta_data->>'slug';

    IF v_slug IS NOT NULL THEN
      INSERT INTO public.estudiantes (usuario_id, slug)
      VALUES (NEW.id, v_slug)
      RETURNING id INTO v_estudiante_id;

      INSERT INTO public.perfiles (estudiante_id, estado)
      VALUES (v_estudiante_id, 'borrador');
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user fallo para % : % (SQLSTATE %)', NEW.id, SQLERRM, SQLSTATE;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FUNCIONES AUXILIARES PARA RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin_plataforma' AND activo = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.estudiantes WHERE usuario_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student_active(p_estudiante_id UUID)
RETURNS BOOLEAN AS $$
  SELECT u.activo
  FROM public.usuarios u
  JOIN public.estudiantes e ON e.usuario_id = u.id
  WHERE e.id = p_estudiante_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconocimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enlaces_contacto ENABLE ROW LEVEL SECURITY;

-- 6. POLITICAS
CREATE POLICY "Admins gestionan usuarios" ON public.usuarios FOR ALL USING (public.is_admin());
CREATE POLICY "Lectura propia de usuario" ON public.usuarios FOR SELECT USING (id = auth.uid());

CREATE POLICY "Lectura publica de estudiante activo" ON public.estudiantes
  FOR SELECT USING (public.is_student_active(id) OR public.is_admin() OR usuario_id = auth.uid());
CREATE POLICY "Admins gestionan estudiantes" ON public.estudiantes FOR ALL USING (public.is_admin());
CREATE POLICY "Estudiante actualiza su plantilla" ON public.estudiantes
  FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Lectura de Perfiles" ON public.perfiles FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Perfiles" ON public.perfiles FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);

CREATE POLICY "Lectura de Curriculums" ON public.curriculums FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Curriculums" ON public.curriculums FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);

CREATE POLICY "Lectura de Habilidades" ON public.habilidades FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Habilidades" ON public.habilidades FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);

CREATE POLICY "Lectura de Proyectos" ON public.proyectos FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Proyectos" ON public.proyectos FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);

CREATE POLICY "Lectura de Reconocimientos" ON public.reconocimientos FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Reconocimientos" ON public.reconocimientos FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);

CREATE POLICY "Lectura de Contacto" ON public.enlaces_contacto FOR SELECT USING (
  (estado = 'publicado' AND public.is_student_active(estudiante_id))
  OR estudiante_id = public.get_my_student_id()
  OR public.is_admin()
);
CREATE POLICY "Escritura de Contacto" ON public.enlaces_contacto FOR ALL USING (
  estudiante_id = public.get_my_student_id() OR public.is_admin()
);
