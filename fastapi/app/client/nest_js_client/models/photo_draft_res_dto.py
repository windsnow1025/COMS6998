from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="PhotoDraftResDto")


@_attrs_define
class PhotoDraftResDto:
    """
    Attributes:
        id (str):
        content (str):
        flavor (FlavorResDto):
        kept (bool):
    """

    id: str
    content: str
    flavor: FlavorResDto
    kept: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        content = self.content

        flavor = self.flavor.to_dict()

        kept = self.kept

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "content": content,
                "flavor": flavor,
                "kept": kept,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)
        id = d.pop("id")

        content = d.pop("content")

        flavor = FlavorResDto.from_dict(d.pop("flavor"))

        kept = d.pop("kept")

        photo_draft_res_dto = cls(
            id=id,
            content=content,
            flavor=flavor,
            kept=kept,
        )

        photo_draft_res_dto.additional_properties = d
        return photo_draft_res_dto

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
