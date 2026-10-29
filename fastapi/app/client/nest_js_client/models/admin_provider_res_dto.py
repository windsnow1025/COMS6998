from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminProviderResDto")


@_attrs_define
class AdminProviderResDto:
    """
    Attributes:
        id (str):
        name (str):
        api_type (str):
        enabled (bool):
        models (float):
    """

    id: str
    name: str
    api_type: str
    enabled: bool
    models: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        name = self.name

        api_type = self.api_type

        enabled = self.enabled

        models = self.models

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "name": name,
                "apiType": api_type,
                "enabled": enabled,
                "models": models,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        name = d.pop("name")

        api_type = d.pop("apiType")

        enabled = d.pop("enabled")

        models = d.pop("models")

        admin_provider_res_dto = cls(
            id=id,
            name=name,
            api_type=api_type,
            enabled=enabled,
            models=models,
        )

        admin_provider_res_dto.additional_properties = d
        return admin_provider_res_dto

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
