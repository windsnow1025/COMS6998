from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminExampleReqDto")


@_attrs_define
class AdminExampleReqDto:
    """
    Attributes:
        flavor_slug (str):
        description (str):
        caption (str):
    """

    flavor_slug: str
    description: str
    caption: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        flavor_slug = self.flavor_slug

        description = self.description

        caption = self.caption

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "flavorSlug": flavor_slug,
                "description": description,
                "caption": caption,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        flavor_slug = d.pop("flavorSlug")

        description = d.pop("description")

        caption = d.pop("caption")

        admin_example_req_dto = cls(
            flavor_slug=flavor_slug,
            description=description,
            caption=caption,
        )

        admin_example_req_dto.additional_properties = d
        return admin_example_req_dto

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
