from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.run_res_dto import RunResDto
from ...types import Response


def _get_kwargs(
    id: str,
    run_id: str,
) -> dict[str, Any]:
    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/chains/{id}/runs/{run_id}".format(
            id=quote(str(id), safe=""),
            run_id=quote(str(run_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> RunResDto | None:
    if response.status_code == 200:
        response_200 = RunResDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[RunResDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: str,
    run_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[RunResDto]:
    """
    Args:
        id (str):
        run_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RunResDto]
    """

    kwargs = _get_kwargs(
        id=id,
        run_id=run_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    id: str,
    run_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> RunResDto | None:
    """
    Args:
        id (str):
        run_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RunResDto
    """

    return sync_detailed(
        id=id,
        run_id=run_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    id: str,
    run_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[RunResDto]:
    """
    Args:
        id (str):
        run_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RunResDto]
    """

    kwargs = _get_kwargs(
        id=id,
        run_id=run_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    id: str,
    run_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> RunResDto | None:
    """
    Args:
        id (str):
        run_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RunResDto
    """

    return (
        await asyncio_detailed(
            id=id,
            run_id=run_id,
            client=client,
        )
    ).parsed
