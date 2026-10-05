from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="BatchSummaryResDto")


@_attrs_define
class BatchSummaryResDto:
    """
    Attributes:
        cover_url (None | str):
        date (str):
        photo_count (float):
    """

    cover_url: None | str
    date: str
    photo_count: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        cover_url: None | str
        cover_url = self.cover_url

        date = self.date

        photo_count = self.photo_count

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "coverUrl": cover_url,
                "date": date,
                "photoCount": photo_count,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_cover_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        cover_url = _parse_cover_url(d.pop("coverUrl"))

        date = d.pop("date")

        photo_count = d.pop("photoCount")

        batch_summary_res_dto = cls(
            cover_url=cover_url,
            date=date,
            photo_count=photo_count,
        )

        batch_summary_res_dto.additional_properties = d
        return batch_summary_res_dto

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
