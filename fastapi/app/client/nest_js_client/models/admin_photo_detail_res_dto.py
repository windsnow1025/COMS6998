from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.admin_caption_res_dto import AdminCaptionResDto
    from ..models.admin_photo_uploader_res_dto import AdminPhotoUploaderResDto
    from ..models.admin_photo_vote_res_dto import AdminPhotoVoteResDto


T = TypeVar("T", bound="AdminPhotoDetailResDto")


@_attrs_define
class AdminPhotoDetailResDto:
    """
    Attributes:
        place (None | str):
        uploader (AdminPhotoUploaderResDto):
        id (str):
        url (str):
        description (str):
        created_at (datetime.datetime):
        batch_dates (list[str]):
        captions (list[AdminCaptionResDto]):
        votes (list[AdminPhotoVoteResDto]):
    """

    place: None | str
    uploader: AdminPhotoUploaderResDto
    id: str
    url: str
    description: str
    created_at: datetime.datetime
    batch_dates: list[str]
    captions: list[AdminCaptionResDto]
    votes: list[AdminPhotoVoteResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        place: None | str
        place = self.place

        uploader = self.uploader.to_dict()

        id = self.id

        url = self.url

        description = self.description

        created_at = self.created_at.isoformat()

        batch_dates = self.batch_dates

        captions = []
        for captions_item_data in self.captions:
            captions_item = captions_item_data.to_dict()
            captions.append(captions_item)

        votes = []
        for votes_item_data in self.votes:
            votes_item = votes_item_data.to_dict()
            votes.append(votes_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "place": place,
                "uploader": uploader,
                "id": id,
                "url": url,
                "description": description,
                "createdAt": created_at,
                "batchDates": batch_dates,
                "captions": captions,
                "votes": votes,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_caption_res_dto import AdminCaptionResDto
        from ..models.admin_photo_uploader_res_dto import AdminPhotoUploaderResDto
        from ..models.admin_photo_vote_res_dto import AdminPhotoVoteResDto

        d = dict(src_dict)

        def _parse_place(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        place = _parse_place(d.pop("place"))

        uploader = AdminPhotoUploaderResDto.from_dict(d.pop("uploader"))

        id = d.pop("id")

        url = d.pop("url")

        description = d.pop("description")

        created_at = isoparse(d.pop("createdAt"))

        batch_dates = cast(list[str], d.pop("batchDates"))

        captions = []
        _captions = d.pop("captions")
        for captions_item_data in _captions:
            captions_item = AdminCaptionResDto.from_dict(captions_item_data)

            captions.append(captions_item)

        votes = []
        _votes = d.pop("votes")
        for votes_item_data in _votes:
            votes_item = AdminPhotoVoteResDto.from_dict(votes_item_data)

            votes.append(votes_item)

        admin_photo_detail_res_dto = cls(
            place=place,
            uploader=uploader,
            id=id,
            url=url,
            description=description,
            created_at=created_at,
            batch_dates=batch_dates,
            captions=captions,
            votes=votes,
        )

        admin_photo_detail_res_dto.additional_properties = d
        return admin_photo_detail_res_dto

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
