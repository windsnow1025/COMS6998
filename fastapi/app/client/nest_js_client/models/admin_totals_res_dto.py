from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminTotalsResDto")


@_attrs_define
class AdminTotalsResDto:
    """
    Attributes:
        users (float):
        photos (float):
        photos_without_captions (float):
        captions (float):
        picks (float):
        downs (float):
        batches (float):
        llm_calls (float):
    """

    users: float
    photos: float
    photos_without_captions: float
    captions: float
    picks: float
    downs: float
    batches: float
    llm_calls: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        users = self.users

        photos = self.photos

        photos_without_captions = self.photos_without_captions

        captions = self.captions

        picks = self.picks

        downs = self.downs

        batches = self.batches

        llm_calls = self.llm_calls

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "users": users,
                "photos": photos,
                "photosWithoutCaptions": photos_without_captions,
                "captions": captions,
                "picks": picks,
                "downs": downs,
                "batches": batches,
                "llmCalls": llm_calls,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        users = d.pop("users")

        photos = d.pop("photos")

        photos_without_captions = d.pop("photosWithoutCaptions")

        captions = d.pop("captions")

        picks = d.pop("picks")

        downs = d.pop("downs")

        batches = d.pop("batches")

        llm_calls = d.pop("llmCalls")

        admin_totals_res_dto = cls(
            users=users,
            photos=photos,
            photos_without_captions=photos_without_captions,
            captions=captions,
            picks=picks,
            downs=downs,
            batches=batches,
            llm_calls=llm_calls,
        )

        admin_totals_res_dto.additional_properties = d
        return admin_totals_res_dto

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
