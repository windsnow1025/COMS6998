from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.flavor_res_dto import FlavorResDto


T = TypeVar("T", bound="FlavorStatResDto")


@_attrs_define
class FlavorStatResDto:
    """
    Attributes:
        flavor (FlavorResDto):
        picks (float):
        seen (float):
    """

    flavor: FlavorResDto
    picks: float
    seen: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        flavor = self.flavor.to_dict()

        picks = self.picks

        seen = self.seen

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "flavor": flavor,
                "picks": picks,
                "seen": seen,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_res_dto import FlavorResDto

        d = dict(src_dict)
        flavor = FlavorResDto.from_dict(d.pop("flavor"))

        picks = d.pop("picks")

        seen = d.pop("seen")

        flavor_stat_res_dto = cls(
            flavor=flavor,
            picks=picks,
            seen=seen,
        )

        flavor_stat_res_dto.additional_properties = d
        return flavor_stat_res_dto

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
