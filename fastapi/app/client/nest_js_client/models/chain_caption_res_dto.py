from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.run_photo_res_dto import RunPhotoResDto


T = TypeVar("T", bound="ChainCaptionResDto")


@_attrs_define
class ChainCaptionResDto:
    """
    Attributes:
        id (str):
        content (str):
        kept (bool):
        picks (float):
        photo (RunPhotoResDto):
        created_at (datetime.datetime):
    """

    id: str
    content: str
    kept: bool
    picks: float
    photo: RunPhotoResDto
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        content = self.content

        kept = self.kept

        picks = self.picks

        photo = self.photo.to_dict()

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "content": content,
                "kept": kept,
                "picks": picks,
                "photo": photo,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.run_photo_res_dto import RunPhotoResDto

        d = dict(src_dict)
        id = d.pop("id")

        content = d.pop("content")

        kept = d.pop("kept")

        picks = d.pop("picks")

        photo = RunPhotoResDto.from_dict(d.pop("photo"))

        created_at = isoparse(d.pop("createdAt"))

        chain_caption_res_dto = cls(
            id=id,
            content=content,
            kept=kept,
            picks=picks,
            photo=photo,
            created_at=created_at,
        )

        chain_caption_res_dto.additional_properties = d
        return chain_caption_res_dto

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
