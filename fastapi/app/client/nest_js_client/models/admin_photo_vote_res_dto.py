from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.admin_vote_user_res_dto import AdminVoteUserResDto


T = TypeVar("T", bound="AdminPhotoVoteResDto")


@_attrs_define
class AdminPhotoVoteResDto:
    """
    Attributes:
        id (str):
        user (AdminVoteUserResDto):
        caption_id (str):
        value (float):
        created_at (datetime.datetime):
    """

    id: str
    user: AdminVoteUserResDto
    caption_id: str
    value: float
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        user = self.user.to_dict()

        caption_id = self.caption_id

        value = self.value

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "user": user,
                "captionId": caption_id,
                "value": value,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_vote_user_res_dto import AdminVoteUserResDto

        d = dict(src_dict)
        id = d.pop("id")

        user = AdminVoteUserResDto.from_dict(d.pop("user"))

        caption_id = d.pop("captionId")

        value = d.pop("value")

        created_at = isoparse(d.pop("createdAt"))

        admin_photo_vote_res_dto = cls(
            id=id,
            user=user,
            caption_id=caption_id,
            value=value,
            created_at=created_at,
        )

        admin_photo_vote_res_dto.additional_properties = d
        return admin_photo_vote_res_dto

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
