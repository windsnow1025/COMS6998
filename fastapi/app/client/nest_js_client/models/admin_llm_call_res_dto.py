from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="AdminLlmCallResDto")


@_attrs_define
class AdminLlmCallResDto:
    """
    Attributes:
        user_id (float | None):
        flavor (FlavorResDto):
        temperature (float | None):
        id (str):
        image_id (str):
        step (str):
        model (str):
        system_prompt (str):
        user_prompt (str):
        response (str):
        input_tokens (float):
        output_tokens (float):
        duration_ms (float):
        created_at (datetime.datetime):
    """

    user_id: float | None
    flavor: FlavorResDto
    temperature: float | None
    id: str
    image_id: str
    step: str
    model: str
    system_prompt: str
    user_prompt: str
    response: str
    input_tokens: float
    output_tokens: float
    duration_ms: float
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        user_id: float | None
        user_id = self.user_id

        flavor = self.flavor.to_dict()

        temperature: float | None
        temperature = self.temperature

        id = self.id

        image_id = self.image_id

        step = self.step

        model = self.model

        system_prompt = self.system_prompt

        user_prompt = self.user_prompt

        response = self.response

        input_tokens = self.input_tokens

        output_tokens = self.output_tokens

        duration_ms = self.duration_ms

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "userId": user_id,
                "flavor": flavor,
                "temperature": temperature,
                "id": id,
                "imageId": image_id,
                "step": step,
                "model": model,
                "systemPrompt": system_prompt,
                "userPrompt": user_prompt,
                "response": response,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "durationMs": duration_ms,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)

        def _parse_user_id(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        user_id = _parse_user_id(d.pop("userId"))

        flavor = FlavorResDto.from_dict(d.pop("flavor"))

        def _parse_temperature(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        temperature = _parse_temperature(d.pop("temperature"))

        id = d.pop("id")

        image_id = d.pop("imageId")

        step = d.pop("step")

        model = d.pop("model")

        system_prompt = d.pop("systemPrompt")

        user_prompt = d.pop("userPrompt")

        response = d.pop("response")

        input_tokens = d.pop("inputTokens")

        output_tokens = d.pop("outputTokens")

        duration_ms = d.pop("durationMs")

        created_at = isoparse(d.pop("createdAt"))

        admin_llm_call_res_dto = cls(
            user_id=user_id,
            flavor=flavor,
            temperature=temperature,
            id=id,
            image_id=image_id,
            step=step,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response=response,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=duration_ms,
            created_at=created_at,
        )

        admin_llm_call_res_dto.additional_properties = d
        return admin_llm_call_res_dto

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
