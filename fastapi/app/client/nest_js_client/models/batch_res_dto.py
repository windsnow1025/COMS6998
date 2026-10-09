from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.photo_res_dto import PhotoResDto


T = TypeVar("T", bound="BatchResDto")


@_attrs_define
class BatchResDto:
    """
    Attributes:
        previous_date (None | str):
        next_date (None | str):
        date (str):
        closed (bool):
        photos (list[PhotoResDto]):
        judged_before (list[PhotoResDto]):
    """

    previous_date: None | str
    next_date: None | str
    date: str
    closed: bool
    photos: list[PhotoResDto]
    judged_before: list[PhotoResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        previous_date: None | str
        previous_date = self.previous_date

        next_date: None | str
        next_date = self.next_date

        date = self.date

        closed = self.closed

        photos = []
        for photos_item_data in self.photos:
            photos_item = photos_item_data.to_dict()
            photos.append(photos_item)

        judged_before = []
        for judged_before_item_data in self.judged_before:
            judged_before_item = judged_before_item_data.to_dict()
            judged_before.append(judged_before_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "previousDate": previous_date,
                "nextDate": next_date,
                "date": date,
                "closed": closed,
                "photos": photos,
                "judgedBefore": judged_before,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.photo_res_dto import PhotoResDto

        d = dict(src_dict)

        def _parse_previous_date(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        previous_date = _parse_previous_date(d.pop("previousDate"))

        def _parse_next_date(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        next_date = _parse_next_date(d.pop("nextDate"))

        date = d.pop("date")

        closed = d.pop("closed")

        photos = []
        _photos = d.pop("photos")
        for photos_item_data in _photos:
            photos_item = PhotoResDto.from_dict(photos_item_data)

            photos.append(photos_item)

        judged_before = []
        _judged_before = d.pop("judgedBefore")
        for judged_before_item_data in _judged_before:
            judged_before_item = PhotoResDto.from_dict(judged_before_item_data)

            judged_before.append(judged_before_item)

        batch_res_dto = cls(
            previous_date=previous_date,
            next_date=next_date,
            date=date,
            closed=closed,
            photos=photos,
            judged_before=judged_before,
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
