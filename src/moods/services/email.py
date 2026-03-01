import httpx


class Email:
    def __init__(self, settings):
        self.domain = settings.mailgun.domain
        self.api_key = settings.mailgun.api_key
        self.from_email = settings.mailgun.from_email

    async def send_code_email(self, to_email: str, code: str) -> None:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.mailgun.net/v3/{self.domain}/messages",
                auth=("api", self.api_key),
                data={
                    "from": self.from_email,
                    "to": [to_email],
                    "subject": "Your Moods login code",
                    "text": f"Your Moods login code is: {code}",
                },
            )
