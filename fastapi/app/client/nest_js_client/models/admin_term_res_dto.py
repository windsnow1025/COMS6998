from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

T = TypeVar("T", bound="AdminTermResDto")


@_attrs_define
class AdminTermResDto:
    """
    Attributes:
        example (None | str):
        id (str):
        term (str):
        meaning (str):
        created_at (datetime.datetime):
    """

    example: None | str
    id: str
    term: str
    meaning: str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        example: None | str
        example = self.example

        id = self.id

        term = self.term

        meaning = self.meaning

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "example": example,
                "id": id,
                "term": term,
                "meaning": meaning,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_example(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        example = _parse_example(d.pop("example"))

        id = d.pop("id")

        term = d.pop("term")

        meaning = d.pop("meaning")

        created_at = isoparse(d.pop("createdAt"))

        admin_term_res_dto = cls(
            example=example,
            id=id,
            term=term,
            meaning=meaning,
            created_at=created_at,
        )

        admin_term_res_dto.additional_properties = d
        return admin_term_res_dto

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
