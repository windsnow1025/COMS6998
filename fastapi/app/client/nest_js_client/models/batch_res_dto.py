from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.photo_res_dto import PhotoResDto


T = TypeVar("T", bound="BatchResDto")


@_attrs_define
class BatchResDto:
    """
    Attributes:
        date (str):
        closed (bool):
        photos (list[PhotoResDto]):
    """

    date: str
    closed: bool
    photos: list[PhotoResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        date = self.date

        closed = self.closed

        photos = []
        for photos_item_data in self.photos:
            photos_item = photos_item_data.to_dict()
            photos.append(photos_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "date": date,
                "closed": closed,
                "photos": photos,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.photo_res_dto import PhotoResDto

        d = dict(src_dict)
        date = d.pop("date")

        closed = d.pop("closed")

        photos = []
        _photos = d.pop("photos")
        for photos_item_data in _photos:
            photos_item = PhotoResDto.from_dict(photos_item_data)

            photos.append(photos_item)

        batch_res_dto = cls(
            date=date,
            closed=closed,
            photos=photos,
        )

        batch_res_dto.additional_properties = d
        return batch_res_dto

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
