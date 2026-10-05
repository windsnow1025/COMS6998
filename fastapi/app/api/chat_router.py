from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from llm_bridge import Message, get_model_prices, ModelPrice, find_model_prices
from pydantic import BaseModel

import app.service.auth as auth
from app.service.chat.chat_service import handle_chat_interaction

chat_router = APIRouter()
security = HTTPBearer()


class ChatRequest(BaseModel):
    messages: list[Message]
    api_type: str
    model: str
    temperature: float
    stream: bool
    thought: bool
    web_search: bool
    code_execution: bool
    structured_output_schema: dict[str, Any] | None = None


@chat_router.post("/chat")
async def generate(
        chat_request: ChatRequest,
        credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token: str = credentials.credentials
    user_id: str = auth.get_user_id_from_token(token)

    if find_model_prices(chat_request.api_type, chat_request.model) is None:
        raise HTTPException(status_code=400, detail="Invalid API Type and Model combination")

    return await handle_chat_interaction(
        user_id=user_id,
        messages=chat_request.messages,
        model=chat_request.model,
        api_type=chat_request.api_type,
        temperature=chat_request.temperature,
        stream=chat_request.stream,
        thought=chat_request.thought,
        web_search=chat_request.web_search,
        code_execution=chat_request.code_execution,
        structured_output_schema=chat_request.structured_output_schema,
    )


@chat_router.get("/model")
async def get_models() -> list[ModelPrice]:
    return get_model_prices()
