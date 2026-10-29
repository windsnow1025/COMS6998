from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminModelResDto")


@_attrs_define
class AdminModelResDto:
    """
    Attributes:
        id (str):
        provider_id (str):
        api_type (str):
        name (str):
        enabled (bool):
        steps (list[str]):
    """

    id: str
    provider_id: str
    api_type: str
    name: str
    enabled: bool
    steps: list[str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        provider_id = self.provider_id

        api_type = self.api_type

        name = self.name

        enabled = self.enabled

        steps = self.steps

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "providerId": provider_id,
                "apiType": api_type,
                "name": name,
                "enabled": enabled,
                "steps": steps,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        provider_id = d.pop("providerId")

        api_type = d.pop("apiType")

        name = d.pop("name")

        enabled = d.pop("enabled")

        steps = cast(list[str], d.pop("steps"))

        admin_model_res_dto = cls(
            id=id,
            provider_id=provider_id,
            api_type=api_type,
            name=name,
            enabled=enabled,
            steps=steps,
        )

        admin_model_res_dto.additional_properties = d
        return admin_model_res_dto

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
