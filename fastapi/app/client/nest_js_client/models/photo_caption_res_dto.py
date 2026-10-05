from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="PhotoCaptionResDto")


@_attrs_define
class PhotoCaptionResDto:
    """
    Attributes:
        id (str):
        content (str):
        flavor (FlavorResDto | Unset):
        picks (float | Unset):
    """

    id: str
    content: str
    flavor: FlavorResDto | Unset = UNSET
    picks: float | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        content = self.content

        flavor: dict[str, Any] | Unset = UNSET
        if not isinstance(self.flavor, Unset):
            flavor = self.flavor.to_dict()

        picks = self.picks

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "content": content,
            }
        )
        if flavor is not UNSET:
            field_dict["flavor"] = flavor
        if picks is not UNSET:
            field_dict["picks"] = picks

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)
        id = d.pop("id")

        content = d.pop("content")

        _flavor = d.pop("flavor", UNSET)
        flavor: FlavorResDto | Unset
        if isinstance(_flavor, Unset):
            flavor = UNSET
        else:
            flavor = FlavorResDto.from_dict(_flavor)

        picks = d.pop("picks", UNSET)

        photo_caption_res_dto = cls(
            id=id,
            content=content,
            flavor=flavor,
            picks=picks,
        )

        photo_caption_res_dto.additional_properties = d
        return photo_caption_res_dto

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
