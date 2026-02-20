from dynaconf import Dynaconf

settings = Dynaconf(
    envvar_prefix="MOODS",
    settings_files=["settings.toml", ".secrets.toml"],
    environments=True,
    env_switcher="MOODS_ENV",
    default_env="default",
)
