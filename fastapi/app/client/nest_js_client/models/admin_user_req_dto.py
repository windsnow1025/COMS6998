from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AdminUserReqDto")


@_attrs_define
class AdminUserReqDto:
    """
    Attributes:
        username (str):
        first_name (str):
        last_name (str):
        admin (bool):
    """

    username: str
    first_name: str
    last_name: str
    admin: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        username = self.username

        first_name = self.first_name

        last_name = self.last_name

        admin = self.admin

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "username": username,
                "firstName": first_name,
                "lastName": last_name,
                "admin": admin,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        username = d.pop("username")

        first_name = d.pop("firstName")

        last_name = d.pop("lastName")

        admin = d.pop("admin")

        admin_user_req_dto = cls(
            username=username,
            first_name=first_name,
            last_name=last_name,
            admin=admin,
        )

        admin_user_req_dto.additional_properties = d
        return admin_user_req_dto

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
