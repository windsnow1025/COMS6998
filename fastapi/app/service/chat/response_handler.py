import json
import logging
from asyncio import Queue, create_task
from collections.abc import AsyncGenerator

from fastapi.responses import StreamingResponse
from llm_bridge import ChatResponse, serialize

from app.service.chat import response_transform
from app.service.chat.generation_manager import generation_manager
from app.service.chat.generation_session import GenerationSession, GenerationState

ChunkGenerator = AsyncGenerator[ChatResponse, None]


async def _stream_response(session: GenerationSession) -> StreamingResponse:
    queue = await session.subscribe()

    async def sse_generator(session: GenerationSession, queue: Queue) -> AsyncGenerator[str, None]:
        try:
            while True:
                chunk = await queue.get()
                if chunk is None:
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    break
                yield f"data: {json.dumps(serialize(chunk))}\n\n"
                if chunk.error:
                    break
        finally:
            await session.unsubscribe(queue)

    return StreamingResponse(sse_generator(session, queue), media_type='text/event-stream')


async def non_stream_handler(
        chat_response: ChatResponse,
) -> ChatResponse:
    logging.info(f"content: {response_transform.to_log(chat_response)}")

    return chat_response


async def stream_handler(
        generator: ChunkGenerator,
) -> StreamingResponse:
    session = await generation_manager.start(None, None)

    async def run():
        try:
            async for chunk in generator:
                if session.state is not GenerationState.Running:
                    break
                await session.publish(chunk)
        except Exception as e:
            logging.exception(f"Error in generation: {e}")
            await session.publish(ChatResponse(error=str(e)))
        finally:
            if session.state is GenerationState.Running:
                await session.close(GenerationState.Completed)

            result = response_transform.aggregate(session.buffer)

            if not result.error: # On stream mode error, ChatResponse.error is set
                logging.info(f"content: {response_transform.to_log(result)}")

            await session.notify_end()
            generation_manager.finish(session)
            session.mark_finalized()

    create_task(run())
    return await _stream_response(session)
