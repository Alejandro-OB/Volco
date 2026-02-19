from fastapi import UploadFile
from datetime import datetime
from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def upload_to_supabase(file_obj: UploadFile, folder="logos") -> str | None:
    """
    Sube un archivo (FastAPI UploadFile) a Supabase Storage y devuelve la URL pública.
    """
    filename = f"{folder}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_obj.filename}"

    try:
        # Leer archivo de forma asíncrona
        file_bytes = await file_obj.read()

        # Subir archivo a Supabase
        res = supabase.storage.from_(settings.SUPABASE_BUCKET).upload(filename, file_bytes)

        # Verifica respuesta por error (puede variar de SDK)
        if hasattr(res, "error") and res.error:
            print("Error al subir:", res.error)
            return None

        print("Subida completada")

        # Obtener URL pública
        public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(filename)
        print("URL pública generada:", public_url)
        return public_url
    except Exception as e:
        print("Error de Supabase:", e)
        return None
