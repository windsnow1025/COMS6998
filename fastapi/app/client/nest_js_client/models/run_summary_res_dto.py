from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

from ..models.run_summary_res_dto_output_type import RunSummaryResDtoOutputType
from ..models.run_summary_res_dto_status import RunSummaryResDtoStatus

if TYPE_CHECKING:
    from ..models.run_photo_res_dto import RunPhotoResDto
    from ..models.run_user_res_dto import RunUserResDto


T = TypeVar("T", bound="RunSummaryResDto")


@_attrs_define
class RunSummaryResDto:
    """
    Attributes:
        status (RunSummaryResDtoStatus):
        user (RunUserResDto):
        output_type (RunSummaryResDtoOutputType):
        captions (list[str] | None):
        text (None | str):
        error (None | str):
        finished_at (datetime.datetime | None):
        id (str):
        photo (RunPhotoResDto):
        step_count (float):
        created_at (datetime.datetime):
    """

    status: RunSummaryResDtoStatus
    user: RunUserResDto
    output_type: RunSummaryResDtoOutputType
    captions: list[str] | None
    text: None | str
    error: None | str
    finished_at: datetime.datetime | None
    id: str
    photo: RunPhotoResDto
    step_count: float
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status = self.status.value

        user = self.user.to_dict()

        output_type = self.output_type.value

        captions: list[str] | None
        if isinstance(self.captions, list):
            captions = self.captions

        else:
            captions = self.captions

        text: None | str
        text = self.text

        error: None | str
        error = self.error

        finished_at: None | str
        if isinstance(self.finished_at, datetime.datetime):
            finished_at = self.finished_at.isoformat()
        else:
            finished_at = self.finished_at

        id = self.id

        photo = self.photo.to_dict()

        step_count = self.step_count

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "status": status,
                "user": user,
                "outputType": output_type,
                "captions": captions,
                "text": text,
                "error": error,
                "finishedAt": finished_at,
                "id": id,
                "photo": photo,
                "stepCount": step_count,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.run_photo_res_dto import RunPhotoResDto
        from ..models.run_user_res_dto import RunUserResDto

        d = dict(src_dict)
        status = RunSummaryResDtoStatus(d.pop("status"))

        user = RunUserResDto.from_dict(d.pop("user"))

        output_type = RunSummaryResDtoOutputType(d.pop("outputType"))

        def _parse_captions(data: object) -> list[str] | None:
            if data is None:
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                captions_type_0 = cast(list[str], data)

                return captions_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None, data)

        captions = _parse_captions(d.pop("captions"))

        def _parse_text(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        text = _parse_text(d.pop("text"))

        def _parse_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        error = _parse_error(d.pop("error"))

        def _parse_finished_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                finished_at_type_0 = isoparse(data)

                return finished_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        finished_at = _parse_finished_at(d.pop("finishedAt"))

        id = d.pop("id")

        photo = RunPhotoResDto.from_dict(d.pop("photo"))

        step_count = d.pop("stepCount")

        created_at = isoparse(d.pop("createdAt"))

        run_summary_res_dto = cls(
            status=status,
            user=user,
            output_type=output_type,
            captions=captions,
            text=text,
            error=error,
            finished_at=finished_at,
            id=id,
            photo=photo,
            step_count=step_count,
            created_at=created_at,
        )

        run_summary_res_dto.additional_properties = d
        return run_summary_res_dto

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
