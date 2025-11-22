import base64
from typing import Optional

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from supabase import Client, create_client

DEFAULT_CONTENT_TYPE = "image/jpeg"

_supabase_client: Optional[Client] = None

def _get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise ImproperlyConfigured(
            "Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY."
        )

    _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase_client


def _decode_base64(image_base64: str) -> bytes:
    if not image_base64:
        raise ValueError("Imagem em base64 é obrigatória.")

    if "," in image_base64:
        _, image_base64 = image_base64.split(",", 1)

    try:
        return base64.b64decode(image_base64)
    except (base64.binascii.Error, ValueError) as exc:
        raise ValueError("Imagem inválida em base64.") from exc


def upload_area_verde_image(image_base64: str, object_name: str, content_type: Optional[str] = None) -> str:
    """Upload a preprocessed Área Verde image to Supabase."""

    if not object_name:
        raise ValueError("imagem_nome é obrigatório.")

    bucket = getattr(settings, "SUPABASE_AREAS_BUCKET", "")
    if not bucket:
        raise ImproperlyConfigured("SUPABASE_AREAS_BUCKET não configurado.")

    binary_content = _decode_base64(image_base64)
    client = _get_supabase_client()
    storage = client.storage.from_(bucket)
    file_options = {
        "content-type": content_type or DEFAULT_CONTENT_TYPE
    }

    try:
        storage.upload(object_name, binary_content, file_options)
    except Exception as exc:  # Supabase client raises generic Exception for storage errors
        raise RuntimeError("Falha ao enviar imagem para o armazenamento.") from exc

    return object_name
