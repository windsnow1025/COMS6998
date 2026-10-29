from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="AdminProviderUpdateReqDto")


@_attrs_define
class AdminProviderUpdateReqDto:
    """
    Attributes:
        name (str | Unset):
        api_type (str | Unset):
        enabled (bool | Unset):
    """

    name: str | Unset = UNSET
    api_type: str | Unset = UNSET
    enabled: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        api_type = self.api_type

        enabled = self.enabled

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if name is not UNSET:
            field_dict["name"] = name
        if api_type is not UNSET:
            field_dict["apiType"] = api_type
        if enabled is not UNSET:
            field_dict["enabled"] = enabled

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        name = d.pop("name", UNSET)

        api_type = d.pop("apiType", UNSET)

        enabled = d.pop("enabled", UNSET)

        admin_provider_update_req_dto = cls(
            name=name,
            api_type=api_type,
            enabled=enabled,
        )

        admin_provider_update_req_dto.additional_properties = d
        return admin_provider_update_req_dto

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
