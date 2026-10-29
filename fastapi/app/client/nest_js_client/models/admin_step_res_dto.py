from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminStepResDto")


@_attrs_define
class AdminStepResDto:
    """
    Attributes:
        step (str):
        provider (str):
        api_type (str):
        model_id (str):
        model (str):
        temperature (float):
        system_prompt (str):
        user_prompt (str):
    """

    step: str
    provider: str
    api_type: str
    model_id: str
    model: str
    temperature: float
    system_prompt: str
    user_prompt: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step = self.step

        provider = self.provider

        api_type = self.api_type

        model_id = self.model_id

        model = self.model

        temperature = self.temperature

        system_prompt = self.system_prompt

        user_prompt = self.user_prompt

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "step": step,
                "provider": provider,
                "apiType": api_type,
                "modelId": model_id,
                "model": model,
                "temperature": temperature,
                "systemPrompt": system_prompt,
                "userPrompt": user_prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        step = d.pop("step")

        provider = d.pop("provider")

        api_type = d.pop("apiType")

        model_id = d.pop("modelId")

        model = d.pop("model")

        temperature = d.pop("temperature")

        system_prompt = d.pop("systemPrompt")

        user_prompt = d.pop("userPrompt")

        admin_step_res_dto = cls(
            step=step,
            provider=provider,
            api_type=api_type,
            model_id=model_id,
            model=model,
            temperature=temperature,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        admin_step_res_dto.additional_properties = d
        return admin_step_res_dto

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
