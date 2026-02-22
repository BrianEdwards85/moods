import httpx


async def send_code_email(to_email: str, code: str, settings) -> None:
    domain = settings.mailgun.domain
    api_key = settings.mailgun.api_key
    from_email = settings.mailgun.from_email

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=("api", api_key),
            data={
                "from": from_email,
                "to": [to_email],
                "subject": "Your Moods login code",
                "text": f"Your Moods login code is: {code}",
            },
        )
