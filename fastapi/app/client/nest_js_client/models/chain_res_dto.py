from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

if TYPE_CHECKING:
    from ..models.step_res_dto import StepResDto


T = TypeVar("T", bound="ChainResDto")


@_attrs_define
class ChainResDto:
    """
    Attributes:
        id (str):
        slug (str):
        name (str):
        tagline (str):
        color (str):
        position (float):
        in_mix (bool):
        writes_captions (bool):
        captions (float):
        runs (float):
        steps (list[StepResDto]):
        created_at (datetime.datetime):
    """

    id: str
    slug: str
    name: str
    tagline: str
    color: str
    position: float
    in_mix: bool
    writes_captions: bool
    captions: float
    runs: float
    steps: list[StepResDto]
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        slug = self.slug

        name = self.name

        tagline = self.tagline

        color = self.color

        position = self.position

        in_mix = self.in_mix

        writes_captions = self.writes_captions

        captions = self.captions

        runs = self.runs

        steps = []
        for steps_item_data in self.steps:
            steps_item = steps_item_data.to_dict()
            steps.append(steps_item)

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "slug": slug,
                "name": name,
                "tagline": tagline,
                "color": color,
                "position": position,
                "inMix": in_mix,
                "writesCaptions": writes_captions,
                "captions": captions,
                "runs": runs,
                "steps": steps,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.step_res_dto import StepResDto

        d = dict(src_dict)
        id = d.pop("id")

        slug = d.pop("slug")

        name = d.pop("name")

        tagline = d.pop("tagline")

        color = d.pop("color")

        position = d.pop("position")

        in_mix = d.pop("inMix")

        writes_captions = d.pop("writesCaptions")

        captions = d.pop("captions")

        runs = d.pop("runs")

        steps = []
        _steps = d.pop("steps")
        for steps_item_data in _steps:
            steps_item = StepResDto.from_dict(steps_item_data)

            steps.append(steps_item)

        created_at = isoparse(d.pop("createdAt"))

        chain_res_dto = cls(
            id=id,
            slug=slug,
            name=name,
            tagline=tagline,
            color=color,
            position=position,
            in_mix=in_mix,
            writes_captions=writes_captions,
            captions=captions,
            runs=runs,
            steps=steps,
            created_at=created_at,
        )

        chain_res_dto.additional_properties = d
        return chain_res_dto

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
