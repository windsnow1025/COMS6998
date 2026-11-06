from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.step_res_dto_input import StepResDtoInput
from ..models.step_res_dto_output import StepResDtoOutput

T = TypeVar("T", bound="StepResDto")


@_attrs_define
class StepResDto:
    """
    Attributes:
        input_ (StepResDtoInput):
        output (StepResDtoOutput):
        id (str):
        position (float):
        name (str):
        system_prompt (str):
        user_prompt (str):
        model_id (str):
        model (str):
        api_type (str):
    """

    input_: StepResDtoInput
    output: StepResDtoOutput
    id: str
    position: float
    name: str
    system_prompt: str
    user_prompt: str
    model_id: str
    model: str
    api_type: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        input_ = self.input_.value

        output = self.output.value

        id = self.id

        position = self.position

        name = self.name

        system_prompt = self.system_prompt

        user_prompt = self.user_prompt

        model_id = self.model_id

        model = self.model

        api_type = self.api_type

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "input": input_,
                "output": output,
                "id": id,
                "position": position,
                "name": name,
                "systemPrompt": system_prompt,
                "userPrompt": user_prompt,
                "modelId": model_id,
                "model": model,
                "apiType": api_type,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        input_ = StepResDtoInput(d.pop("input"))

        output = StepResDtoOutput(d.pop("output"))

        id = d.pop("id")

        position = d.pop("position")

        name = d.pop("name")

        system_prompt = d.pop("systemPrompt")

        user_prompt = d.pop("userPrompt")

        model_id = d.pop("modelId")

        model = d.pop("model")

        api_type = d.pop("apiType")

        step_res_dto = cls(
            input_=input_,
            output=output,
            id=id,
            position=position,
            name=name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_id=model_id,
            model=model,
            api_type=api_type,
        )

        step_res_dto.additional_properties = d
        return step_res_dto

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
