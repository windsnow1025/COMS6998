from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.photo_caption_res_dto import PhotoCaptionResDto
    from ..models.photo_uploader_res_dto import PhotoUploaderResDto
    from ..models.photo_viewer_res_dto import PhotoViewerResDto


T = TypeVar("T", bound="PhotoResDto")


@_attrs_define
class PhotoResDto:
    """
    Attributes:
        place (None | str):
        uploader (PhotoUploaderResDto):
        batch_date (None | str):
        id (str):
        url (str):
        description (str):
        created_at (datetime.datetime):
        captions (list[PhotoCaptionResDto]):
        revealed (bool):
        viewer (PhotoViewerResDto):
        queue_position (float | Unset):
        voters (float | Unset):
        none_picks (float | Unset):
    """

    place: None | str
    uploader: PhotoUploaderResDto
    batch_date: None | str
    id: str
    url: str
    description: str
    created_at: datetime.datetime
    captions: list[PhotoCaptionResDto]
    revealed: bool
    viewer: PhotoViewerResDto
    queue_position: float | Unset = UNSET
    voters: float | Unset = UNSET
    none_picks: float | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        place: None | str
        place = self.place

        uploader = self.uploader.to_dict()

        batch_date: None | str
        batch_date = self.batch_date

        id = self.id

        url = self.url

        description = self.description

        created_at = self.created_at.isoformat()

        captions = []
        for captions_item_data in self.captions:
            captions_item = captions_item_data.to_dict()
            captions.append(captions_item)

        revealed = self.revealed

        viewer = self.viewer.to_dict()

        queue_position = self.queue_position

        voters = self.voters

        none_picks = self.none_picks

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "place": place,
                "uploader": uploader,
                "batchDate": batch_date,
                "id": id,
                "url": url,
                "description": description,
                "createdAt": created_at,
                "captions": captions,
                "revealed": revealed,
                "viewer": viewer,
            }
        )
        if queue_position is not UNSET:
            field_dict["queuePosition"] = queue_position
        if voters is not UNSET:
            field_dict["voters"] = voters
        if none_picks is not UNSET:
            field_dict["nonePicks"] = none_picks

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.photo_caption_res_dto import PhotoCaptionResDto
        from ..models.photo_uploader_res_dto import PhotoUploaderResDto
        from ..models.photo_viewer_res_dto import PhotoViewerResDto

        d = dict(src_dict)

        def _parse_place(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        place = _parse_place(d.pop("place"))

        uploader = PhotoUploaderResDto.from_dict(d.pop("uploader"))

        def _parse_batch_date(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        batch_date = _parse_batch_date(d.pop("batchDate"))

        id = d.pop("id")

        url = d.pop("url")

        description = d.pop("description")

        created_at = isoparse(d.pop("createdAt"))

        captions = []
        _captions = d.pop("captions")
        for captions_item_data in _captions:
            captions_item = PhotoCaptionResDto.from_dict(captions_item_data)

            captions.append(captions_item)

        revealed = d.pop("revealed")

        viewer = PhotoViewerResDto.from_dict(d.pop("viewer"))

        queue_position = d.pop("queuePosition", UNSET)

        voters = d.pop("voters", UNSET)

        none_picks = d.pop("nonePicks", UNSET)

        photo_res_dto = cls(
            place=place,
            uploader=uploader,
            batch_date=batch_date,
            id=id,
            url=url,
            description=description,
            created_at=created_at,
            captions=captions,
            revealed=revealed,
            viewer=viewer,
            queue_position=queue_position,
            voters=voters,
            none_picks=none_picks,
        )

        photo_res_dto.additional_properties = d
        return photo_res_dto

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
