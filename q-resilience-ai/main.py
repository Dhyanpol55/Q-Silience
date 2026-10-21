import json

async def app(scope, receive, send):
    """
    Lightweight ASGI entrypoint for Vercel Python runtime in q-resilience-ai service.
    """
    if scope['type'] == 'lifespan':
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                await send({'type': 'lifespan.shutdown.complete'})
                return
    if scope['type'] == 'http':
        body = json.dumps({
            "status": "healthy",
            "service": "q-resilience-ai",
            "runtime": "python-asgi"
        }).encode("utf-8")
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [
                [b'content-type', b'application/json'],
                [b'content-length', str(len(body)).encode("ascii")],
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': body,
        })

handler = app
