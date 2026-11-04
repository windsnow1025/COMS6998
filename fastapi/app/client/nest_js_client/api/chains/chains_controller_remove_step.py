from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.chain_res_dto import ChainResDto
from ...types import Response


def _get_kwargs(
    id: str,
    step_id: str,
) -> dict[str, Any]:
    _kwargs: dict[str, Any] = {
        "method": "delete",
        "url": "/chains/{id}/steps/{step_id}".format(
            id=quote(str(id), safe=""),
            step_id=quote(str(step_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ChainResDto | None:
    if response.status_code == 200:
        response_200 = ChainResDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ChainResDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: str,
    step_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ChainResDto]:
    """
    Args:
        id (str):
        step_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChainResDto]
    """

    kwargs = _get_kwargs(
        id=id,
        step_id=step_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    id: str,
    step_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> ChainResDto | None:
    """
    Args:
        id (str):
        step_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChainResDto
    """

    return sync_detailed(
        id=id,
        step_id=step_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    id: str,
    step_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ChainResDto]:
    """
    Args:
        id (str):
        step_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChainResDto]
    """

    kwargs = _get_kwargs(
        id=id,
        step_id=step_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    id: str,
    step_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> ChainResDto | None:
    """
    Args:
        id (str):
        step_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChainResDto
    """

    return (
        await asyncio_detailed(
            id=id,
            step_id=step_id,
            client=client,
        )
    ).parsed
