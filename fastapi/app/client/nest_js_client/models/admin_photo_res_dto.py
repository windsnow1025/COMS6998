from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.admin_photo_uploader_res_dto import AdminPhotoUploaderResDto


T = TypeVar("T", bound="AdminPhotoResDto")


@_attrs_define
class AdminPhotoResDto:
    """
    Attributes:
        place (None | str):
        uploader (AdminPhotoUploaderResDto):
        latest_batch_date (None | str):
        id (str):
        url (str):
        description (str):
        created_at (datetime.datetime):
        captions (float):
        voters (float):
        picks (float):
    """

    place: None | str
    uploader: AdminPhotoUploaderResDto
    latest_batch_date: None | str
    id: str
    url: str
    description: str
    created_at: datetime.datetime
    captions: float
    voters: float
    picks: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        place: None | str
        place = self.place

        uploader = self.uploader.to_dict()

        latest_batch_date: None | str
        latest_batch_date = self.latest_batch_date

        id = self.id

        url = self.url

        description = self.description

        created_at = self.created_at.isoformat()

        captions = self.captions

        voters = self.voters

        picks = self.picks

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "place": place,
                "uploader": uploader,
                "latestBatchDate": latest_batch_date,
                "id": id,
                "url": url,
                "description": description,
                "createdAt": created_at,
                "captions": captions,
                "voters": voters,
                "picks": picks,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_photo_uploader_res_dto import AdminPhotoUploaderResDto

        d = dict(src_dict)

        def _parse_place(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        place = _parse_place(d.pop("place"))

        uploader = AdminPhotoUploaderResDto.from_dict(d.pop("uploader"))

        def _parse_latest_batch_date(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        latest_batch_date = _parse_latest_batch_date(d.pop("latestBatchDate"))

        id = d.pop("id")

        url = d.pop("url")

        description = d.pop("description")

        created_at = isoparse(d.pop("createdAt"))

        captions = d.pop("captions")

        voters = d.pop("voters")

        picks = d.pop("picks")

        admin_photo_res_dto = cls(
            place=place,
            uploader=uploader,
            latest_batch_date=latest_batch_date,
            id=id,
            url=url,
            description=description,
            created_at=created_at,
            captions=captions,
            voters=voters,
            picks=picks,
        )

        admin_photo_res_dto.additional_properties = d
        return admin_photo_res_dto

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
