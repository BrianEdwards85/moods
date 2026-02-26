import secrets

print(f'jwt_secret = "{secrets.token_urlsafe(48)}"')
