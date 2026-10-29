from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminPipelineStepResDto")


@_attrs_define
class AdminPipelineStepResDto:
    """
    Attributes:
        step (str):
        model_id (str):
        model (str):
        provider (str):
        temperature (float):
    """

    step: str
    model_id: str
    model: str
    provider: str
    temperature: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step = self.step

        model_id = self.model_id

        model = self.model

        provider = self.provider

        temperature = self.temperature

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "step": step,
                "modelId": model_id,
                "model": model,
                "provider": provider,
                "temperature": temperature,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        step = d.pop("step")

        model_id = d.pop("modelId")

        model = d.pop("model")

        provider = d.pop("provider")

        temperature = d.pop("temperature")

        admin_pipeline_step_res_dto = cls(
            step=step,
            model_id=model_id,
            model=model,
            provider=provider,
            temperature=temperature,
        )

        admin_pipeline_step_res_dto.additional_properties = d
        return admin_pipeline_step_res_dto

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
