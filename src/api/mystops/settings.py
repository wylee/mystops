from django.core.management import utils

from local_settings import inject_settings, EnvSetting, LocalSetting, SecretSetting

ALLOWED_HOSTS = LocalSetting(default=list)

SECRET_KEY = EnvSetting(
    name="MYSTOPS_SECRET_KEY",
    doc="Key used for sessions, etc",
)

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "USER": LocalSetting(default="{{ PACKAGE }}"),
        "PASSWORD": EnvSetting("MYSTOPS_DATABASE_PASSWORD"),
        "HOST": LocalSetting(default="localhost"),
        "NAME": LocalSetting(default="{{ PACKAGE }}"),
    }
}

MAPBOX = {
    "access_token": EnvSetting("MAPBOX_ACCESS_TOKEN"),
}

TRIMET = {
    "api_key": EnvSetting("TRIMET_API_KEY"),
}

inject_settings()
