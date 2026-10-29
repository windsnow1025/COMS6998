from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

T = TypeVar("T", bound="AdminLlmCallSummaryResDto")


@_attrs_define
class AdminLlmCallSummaryResDto:
    """
    Attributes:
        user_id (float | None):
        username (None | str):
        id (str):
        image_id (str):
        image_url (str):
        step (str):
        model (str):
        input_tokens (float):
        output_tokens (float):
        duration_ms (float):
        created_at (datetime.datetime):
        response_excerpt (str):
    """

    user_id: float | None
    username: None | str
    id: str
    image_id: str
    image_url: str
    step: str
    model: str
    input_tokens: float
    output_tokens: float
    duration_ms: float
    created_at: datetime.datetime
    response_excerpt: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        user_id: float | None
        user_id = self.user_id

        username: None | str
        username = self.username

        id = self.id

        image_id = self.image_id

        image_url = self.image_url

        step = self.step

        model = self.model

        input_tokens = self.input_tokens

        output_tokens = self.output_tokens

        duration_ms = self.duration_ms

        created_at = self.created_at.isoformat()

        response_excerpt = self.response_excerpt

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "userId": user_id,
                "username": username,
                "id": id,
                "imageId": image_id,
                "imageUrl": image_url,
                "step": step,
                "model": model,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "durationMs": duration_ms,
                "createdAt": created_at,
                "responseExcerpt": response_excerpt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_user_id(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        user_id = _parse_user_id(d.pop("userId"))

        def _parse_username(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        username = _parse_username(d.pop("username"))

        id = d.pop("id")

        image_id = d.pop("imageId")

        image_url = d.pop("imageUrl")

        step = d.pop("step")

        model = d.pop("model")

        input_tokens = d.pop("inputTokens")

        output_tokens = d.pop("outputTokens")

        duration_ms = d.pop("durationMs")

        created_at = isoparse(d.pop("createdAt"))

        response_excerpt = d.pop("responseExcerpt")

        admin_llm_call_summary_res_dto = cls(
            user_id=user_id,
            username=username,
            id=id,
            image_id=image_id,
            image_url=image_url,
            step=step,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=duration_ms,
            created_at=created_at,
            response_excerpt=response_excerpt,
        )

        admin_llm_call_summary_res_dto.additional_properties = d
        return admin_llm_call_summary_res_dto

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
