from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET:str
    FRONTEND_URL: str
    BREVO_API_KEY: str
    EMAIL: str

    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_USER: str
    EMAIL_PASSWORD: str

    class Config:
        env_file = ".env"

settings = Settings()
