from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="PhotoViewerResDto")


@_attrs_define
class PhotoViewerResDto:
    """
    Attributes:
        caption_id (None | str):
        is_owner (bool):
        has_voted (bool):
        matched (bool | Unset):
    """

    caption_id: None | str
    is_owner: bool
    has_voted: bool
    matched: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        caption_id: None | str
        caption_id = self.caption_id

        is_owner = self.is_owner

        has_voted = self.has_voted

        matched = self.matched

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "captionId": caption_id,
                "isOwner": is_owner,
                "hasVoted": has_voted,
            }
        )
        if matched is not UNSET:
            field_dict["matched"] = matched

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_caption_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        caption_id = _parse_caption_id(d.pop("captionId"))

        is_owner = d.pop("isOwner")

        has_voted = d.pop("hasVoted")

        matched = d.pop("matched", UNSET)

        photo_viewer_res_dto = cls(
            caption_id=caption_id,
            is_owner=is_owner,
            has_voted=has_voted,
            matched=matched,
        )

        photo_viewer_res_dto.additional_properties = d
        return photo_viewer_res_dto

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
