from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.admin_pipeline_step_res_dto import AdminPipelineStepResDto
from ...models.admin_step_req_dto import AdminStepReqDto
from ...types import Response


def _get_kwargs(
    step: str,
    *,
    body: AdminStepReqDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/admin/steps/{step}".format(
            step=quote(str(step), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AdminPipelineStepResDto | None:
    if response.status_code == 200:
        response_200 = AdminPipelineStepResDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AdminPipelineStepResDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    step: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdminStepReqDto,
) -> Response[AdminPipelineStepResDto]:
    """
    Args:
        step (str):
        body (AdminStepReqDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AdminPipelineStepResDto]
    """

    kwargs = _get_kwargs(
        step=step,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    step: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdminStepReqDto,
) -> AdminPipelineStepResDto | None:
    """
    Args:
        step (str):
        body (AdminStepReqDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AdminPipelineStepResDto
    """

    return sync_detailed(
        step=step,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    step: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdminStepReqDto,
) -> Response[AdminPipelineStepResDto]:
    """
    Args:
        step (str):
        body (AdminStepReqDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AdminPipelineStepResDto]
    """

    kwargs = _get_kwargs(
        step=step,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    step: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdminStepReqDto,
) -> AdminPipelineStepResDto | None:
    """
    Args:
        step (str):
        body (AdminStepReqDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AdminPipelineStepResDto
    """

    return (
        await asyncio_detailed(
            step=step,
            client=client,
            body=body,
        )
    ).parsed
