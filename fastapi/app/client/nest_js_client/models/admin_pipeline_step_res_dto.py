from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.admin_pipeline_step_res_dto_step import AdminPipelineStepResDtoStep

T = TypeVar("T", bound="AdminPipelineStepResDto")


@_attrs_define
class AdminPipelineStepResDto:
    """
    Attributes:
        step (AdminPipelineStepResDtoStep):
        model_id (str):
        model (str):
        api_type (str):
        system_prompt (str):
        user_prompt (str):
    """

    step: AdminPipelineStepResDtoStep
    model_id: str
    model: str
    api_type: str
    system_prompt: str
    user_prompt: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step = self.step.value

        model_id = self.model_id

        model = self.model

        api_type = self.api_type

        system_prompt = self.system_prompt

        user_prompt = self.user_prompt

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "step": step,
                "modelId": model_id,
                "model": model,
                "apiType": api_type,
                "systemPrompt": system_prompt,
                "userPrompt": user_prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        step = AdminPipelineStepResDtoStep(d.pop("step"))

        model_id = d.pop("modelId")

        model = d.pop("model")

        api_type = d.pop("apiType")

        system_prompt = d.pop("systemPrompt")

        user_prompt = d.pop("userPrompt")

        admin_pipeline_step_res_dto = cls(
            step=step,
            model_id=model_id,
            model=model,
            api_type=api_type,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
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
