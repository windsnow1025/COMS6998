from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="StepOrderReqDto")


@_attrs_define
class StepOrderReqDto:
    """
    Attributes:
        step_ids (list[UUID]):
    """

    step_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step_ids = []
        for step_ids_item_data in self.step_ids:
            step_ids_item = str(step_ids_item_data)
            step_ids.append(step_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "stepIds": step_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        step_ids = []
        _step_ids = d.pop("stepIds")
        for step_ids_item_data in _step_ids:
            step_ids_item = UUID(step_ids_item_data)

            step_ids.append(step_ids_item)

        step_order_req_dto = cls(
            step_ids=step_ids,
        )

        step_order_req_dto.additional_properties = d
        return step_order_req_dto

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
