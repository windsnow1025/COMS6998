from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.admin_step_res_dto import AdminStepResDto


T = TypeVar("T", bound="AdminChainResDto")


@_attrs_define
class AdminChainResDto:
    """
    Attributes:
        slug (str):
        name (str):
        tagline (str):
        position (float):
        in_mix (bool):
        prompt (str):
        captions (float):
        steps (list[AdminStepResDto]):
    """

    slug: str
    name: str
    tagline: str
    position: float
    in_mix: bool
    prompt: str
    captions: float
    steps: list[AdminStepResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        slug = self.slug

        name = self.name

        tagline = self.tagline

        position = self.position

        in_mix = self.in_mix

        prompt = self.prompt

        captions = self.captions

        steps = []
        for steps_item_data in self.steps:
            steps_item = steps_item_data.to_dict()
            steps.append(steps_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "slug": slug,
                "name": name,
                "tagline": tagline,
                "position": position,
                "inMix": in_mix,
                "prompt": prompt,
                "captions": captions,
                "steps": steps,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_step_res_dto import AdminStepResDto

        d = dict(src_dict)
        slug = d.pop("slug")

        name = d.pop("name")

        tagline = d.pop("tagline")

        position = d.pop("position")

        in_mix = d.pop("inMix")

        prompt = d.pop("prompt")

        captions = d.pop("captions")

        steps = []
        _steps = d.pop("steps")
        for steps_item_data in _steps:
            steps_item = AdminStepResDto.from_dict(steps_item_data)

            steps.append(steps_item)

        admin_chain_res_dto = cls(
            slug=slug,
            name=name,
            tagline=tagline,
            position=position,
            in_mix=in_mix,
            prompt=prompt,
            captions=captions,
            steps=steps,
        )

        admin_chain_res_dto.additional_properties = d
        return admin_chain_res_dto

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
