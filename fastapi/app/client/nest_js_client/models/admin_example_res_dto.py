from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="AdminExampleResDto")


@_attrs_define
class AdminExampleResDto:
    """
    Attributes:
        id (str):
        flavor (FlavorResDto):
        description (str):
        caption (str):
        created_at (datetime.datetime):
    """

    id: str
    flavor: FlavorResDto
    description: str
    caption: str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        flavor = self.flavor.to_dict()

        description = self.description

        caption = self.caption

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "flavor": flavor,
                "description": description,
                "caption": caption,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)
        id = d.pop("id")

        flavor = FlavorResDto.from_dict(d.pop("flavor"))

        description = d.pop("description")

        caption = d.pop("caption")

        created_at = isoparse(d.pop("createdAt"))

        admin_example_res_dto = cls(
            id=id,
            flavor=flavor,
            description=description,
            caption=caption,
            created_at=created_at,
        )

        admin_example_res_dto.additional_properties = d
        return admin_example_res_dto

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
