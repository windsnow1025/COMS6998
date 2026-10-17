from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminLlmStepResDto")


@_attrs_define
class AdminLlmStepResDto:
    """
    Attributes:
        step (str):
        calls (float):
        input_tokens (float):
        output_tokens (float):
        average_duration_ms (float):
    """

    step: str
    calls: float
    input_tokens: float
    output_tokens: float
    average_duration_ms: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step = self.step

        calls = self.calls

        input_tokens = self.input_tokens

        output_tokens = self.output_tokens

        average_duration_ms = self.average_duration_ms

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "step": step,
                "calls": calls,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "averageDurationMs": average_duration_ms,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        step = d.pop("step")

        calls = d.pop("calls")

        input_tokens = d.pop("inputTokens")

        output_tokens = d.pop("outputTokens")

        average_duration_ms = d.pop("averageDurationMs")

        admin_llm_step_res_dto = cls(
            step=step,
            calls=calls,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            average_duration_ms=average_duration_ms,
        )

        admin_llm_step_res_dto.additional_properties = d
        return admin_llm_step_res_dto

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
