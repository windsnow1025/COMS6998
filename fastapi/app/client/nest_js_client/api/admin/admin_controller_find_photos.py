from http import HTTPStatus
from typing import Any

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.admin_photo_page_res_dto import AdminPhotoPageResDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    *,
    limit: float,
    offset: float,
    q: str | Unset = UNSET,
) -> dict[str, Any]:
    params: dict[str, Any] = {}

    params["limit"] = limit

    params["offset"] = offset

    params["q"] = q

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/admin/photos",
        "params": params,
    }

    return _kwargs


def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> AdminPhotoPageResDto | None:
    if response.status_code == 200:
        response_200 = AdminPhotoPageResDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AdminPhotoPageResDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: float,
    offset: float,
    q: str | Unset = UNSET,
) -> Response[AdminPhotoPageResDto]:
    """
    Args:
        limit (float):
        offset (float):
        q (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AdminPhotoPageResDto]
    """

    kwargs = _get_kwargs(
        limit=limit,
        offset=offset,
        q=q,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient | Client,
    limit: float,
    offset: float,
    q: str | Unset = UNSET,
) -> AdminPhotoPageResDto | None:
    """
    Args:
        limit (float):
        offset (float):
        q (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AdminPhotoPageResDto
    """

    return sync_detailed(
        client=client,
        limit=limit,
        offset=offset,
        q=q,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: float,
    offset: float,
    q: str | Unset = UNSET,
) -> Response[AdminPhotoPageResDto]:
    """
    Args:
        limit (float):
        offset (float):
        q (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AdminPhotoPageResDto]
    """

    kwargs = _get_kwargs(
        limit=limit,
        offset=offset,
        q=q,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    limit: float,
    offset: float,
    q: str | Unset = UNSET,
) -> AdminPhotoPageResDto | None:
    """
    Args:
        limit (float):
        offset (float):
        q (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AdminPhotoPageResDto
    """

    return (
        await asyncio_detailed(
            client=client,
            limit=limit,
            offset=offset,
            q=q,
        )
    ).parsed
