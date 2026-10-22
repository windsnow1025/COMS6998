from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="KeptCaptionsReqDto")


@_attrs_define
class KeptCaptionsReqDto:
    """
    Attributes:
        caption_ids (list[UUID]):
    """

    caption_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        caption_ids = []
        for caption_ids_item_data in self.caption_ids:
            caption_ids_item = str(caption_ids_item_data)
            caption_ids.append(caption_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "captionIds": caption_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        caption_ids = []
        _caption_ids = d.pop("captionIds")
        for caption_ids_item_data in _caption_ids:
            caption_ids_item = UUID(caption_ids_item_data)

            caption_ids.append(caption_ids_item)

        kept_captions_req_dto = cls(
            caption_ids=caption_ids,
        )

        kept_captions_req_dto.additional_properties = d
        return kept_captions_req_dto

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
