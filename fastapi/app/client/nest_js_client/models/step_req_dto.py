from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.step_req_dto_input import StepReqDtoInput
from ..models.step_req_dto_output import StepReqDtoOutput

T = TypeVar("T", bound="StepReqDto")


@_attrs_define
class StepReqDto:
    """
    Attributes:
        name (str):
        input_ (StepReqDtoInput):
        output (StepReqDtoOutput):
        system_prompt (str):
        user_prompt (str):
        model_id (UUID):
    """

    name: str
    input_: StepReqDtoInput
    output: StepReqDtoOutput
    system_prompt: str
    user_prompt: str
    model_id: UUID
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        input_ = self.input_.value

        output = self.output.value

        system_prompt = self.system_prompt

        user_prompt = self.user_prompt

        model_id = str(self.model_id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "name": name,
                "input": input_,
                "output": output,
                "systemPrompt": system_prompt,
                "userPrompt": user_prompt,
                "modelId": model_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        name = d.pop("name")

        input_ = StepReqDtoInput(d.pop("input"))

        output = StepReqDtoOutput(d.pop("output"))

        system_prompt = d.pop("systemPrompt")

        user_prompt = d.pop("userPrompt")

        model_id = UUID(d.pop("modelId"))

        step_req_dto = cls(
            name=name,
            input_=input_,
            output=output,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_id=model_id,
        )

        step_req_dto.additional_properties = d
        return step_req_dto

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
