from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="RunPhotoResDto")


@_attrs_define
class RunPhotoResDto:
    """
    Attributes:
        place (None | str):
        id (str):
        url (str):
        description (str):
    """

    place: None | str
    id: str
    url: str
    description: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        place: None | str
        place = self.place

        id = self.id

        url = self.url

        description = self.description

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "place": place,
                "id": id,
                "url": url,
                "description": description,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_place(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        place = _parse_place(d.pop("place"))

        id = d.pop("id")

        url = d.pop("url")

        description = d.pop("description")

        run_photo_res_dto = cls(
            place=place,
            id=id,
            url=url,
            description=description,
        )

        run_photo_res_dto.additional_properties = d
        return run_photo_res_dto

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
