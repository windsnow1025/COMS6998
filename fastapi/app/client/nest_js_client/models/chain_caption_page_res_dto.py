from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.chain_caption_res_dto import ChainCaptionResDto


T = TypeVar("T", bound="ChainCaptionPageResDto")


@_attrs_define
class ChainCaptionPageResDto:
    """
    Attributes:
        total (float):
        captions (list[ChainCaptionResDto]):
    """

    total: float
    captions: list[ChainCaptionResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        total = self.total

        captions = []
        for captions_item_data in self.captions:
            captions_item = captions_item_data.to_dict()
            captions.append(captions_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "total": total,
                "captions": captions,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.chain_caption_res_dto import ChainCaptionResDto

        d = dict(src_dict)
        total = d.pop("total")

        captions = []
        _captions = d.pop("captions")
        for captions_item_data in _captions:
            captions_item = ChainCaptionResDto.from_dict(captions_item_data)

            captions.append(captions_item)

        chain_caption_page_res_dto = cls(
            total=total,
            captions=captions,
        )

        chain_caption_page_res_dto.additional_properties = d
        return chain_caption_page_res_dto

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
