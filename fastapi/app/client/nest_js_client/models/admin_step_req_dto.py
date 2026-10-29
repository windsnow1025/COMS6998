from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="AdminStepReqDto")


@_attrs_define
class AdminStepReqDto:
    """
    Attributes:
        model_id (UUID | Unset):
        temperature (float | Unset):
    """

    model_id: UUID | Unset = UNSET
    temperature: float | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        model_id: str | Unset = UNSET
        if not isinstance(self.model_id, Unset):
            model_id = str(self.model_id)

        temperature = self.temperature

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if model_id is not UNSET:
            field_dict["modelId"] = model_id
        if temperature is not UNSET:
            field_dict["temperature"] = temperature

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        _model_id = d.pop("modelId", UNSET)
        model_id: UUID | Unset
        if isinstance(_model_id, Unset):
            model_id = UNSET
        else:
            model_id = UUID(_model_id)

        temperature = d.pop("temperature", UNSET)

        admin_step_req_dto = cls(
            model_id=model_id,
            temperature=temperature,
        )

        admin_step_req_dto.additional_properties = d
        return admin_step_req_dto

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
