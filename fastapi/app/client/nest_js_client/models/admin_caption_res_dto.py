from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="AdminCaptionResDto")


@_attrs_define
class AdminCaptionResDto:
    """
    Attributes:
        flavor (FlavorResDto):
        llm_call_id (None | str):
        id (str):
        content (str):
        kept (bool):
        picks (float):
        downs (float):
        created_at (datetime.datetime):
    """

    flavor: FlavorResDto
    llm_call_id: None | str
    id: str
    content: str
    kept: bool
    picks: float
    downs: float
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        flavor = self.flavor.to_dict()

        llm_call_id: None | str
        llm_call_id = self.llm_call_id

        id = self.id

        content = self.content

        kept = self.kept

        picks = self.picks

        downs = self.downs

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "flavor": flavor,
                "llmCallId": llm_call_id,
                "id": id,
                "content": content,
                "kept": kept,
                "picks": picks,
                "downs": downs,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)
        flavor = FlavorResDto.from_dict(d.pop("flavor"))

        def _parse_llm_call_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        llm_call_id = _parse_llm_call_id(d.pop("llmCallId"))

        id = d.pop("id")

        content = d.pop("content")

        kept = d.pop("kept")

        picks = d.pop("picks")

        downs = d.pop("downs")

        created_at = isoparse(d.pop("createdAt"))

        admin_caption_res_dto = cls(
            flavor=flavor,
            llm_call_id=llm_call_id,
            id=id,
            content=content,
            kept=kept,
            picks=picks,
            downs=downs,
            created_at=created_at,
        )

        admin_caption_res_dto.additional_properties = d
        return admin_caption_res_dto

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
