from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="AdminTermReqDto")


@_attrs_define
class AdminTermReqDto:
    """
    Attributes:
        term (str):
        meaning (str):
        example (str | Unset):
    """

    term: str
    meaning: str
    example: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        term = self.term

        meaning = self.meaning

        example = self.example

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "term": term,
                "meaning": meaning,
            }
        )
        if example is not UNSET:
            field_dict["example"] = example

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        term = d.pop("term")

        meaning = d.pop("meaning")

        example = d.pop("example", UNSET)

        admin_term_req_dto = cls(
            term=term,
            meaning=meaning,
            example=example,
        )

        admin_term_req_dto.additional_properties = d
        return admin_term_req_dto

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
